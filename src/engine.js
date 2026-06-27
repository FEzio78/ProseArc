// Translation engine — runs in the main process.
//
// Walks a project's `pending` segments one at a time, calls the local
// OpenAI-compatible server, and after each segment re-reads the project from
// disk and saves atomically. Each request has a timeout and auto-retries a few
// times so one stalled call can't freeze a long overnight run.
//
// Events are emitted as semantic { key, params } (not finished prose) so the
// renderer can render them in the user's chosen UI language.

const { buildMessages } = require('./prompt');

const REQUEST_TIMEOUT_MS = 120000; // give up on a single request after 2 min
const MAX_RETRIES = 2;             // ...then retry up to twice
const RETRY_BACKOFF_MS = 1500;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function createEngine({ store }) {
  let running = false;
  let aborted = false;
  let controller = null;   // AbortController for the in-flight request
  let emit = () => {};

  /** One translation request. Throws tagged errors for the retry/friendly layers. */
  async function translateOne(project, index, signal, globalGlossary) {
    const messages = buildMessages(project, index, globalGlossary);
    const body = {
      model: project.model && project.model.trim() ? project.model.trim() : 'local-model',
      messages,
      temperature: 0.3,
      stream: false,
    };

    const res = await fetch(project.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      let detail = '';
      try { detail = (await res.text()).slice(0, 300); } catch { /* ignore */ }
      const err = new Error(`HTTP ${res.status}`);
      err.httpStatus = res.status;
      err.detail = detail;
      throw err;
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      const err = new Error('empty');
      err.empty = true;
      throw err;
    }
    return content.trim();
  }

  function isRetryable(err) {
    if (err.timeout) return true;
    if (err.httpStatus) return err.httpStatus >= 500 || err.httpStatus === 429;
    return true; // network-level (server warming up, transient blip)
  }
  function reasonOf(err) {
    if (err.timeout) return 'timeout';
    if (err.httpStatus) return `HTTP ${err.httpStatus}`;
    return 'no-connection';
  }

  /** Run one segment with timeout + retries. Honors user stop via `aborted`. */
  async function translateWithRetry(project, index, globalGlossary) {
    let lastErr;
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      if (aborted) { const e = new Error('aborted'); e.name = 'AbortError'; throw e; }

      const ac = new AbortController();
      controller = ac;                 // so stop() aborts this attempt
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; ac.abort(); }, REQUEST_TIMEOUT_MS);

      try {
        const translation = await translateOne(project, index, ac.signal, globalGlossary);
        clearTimeout(timer);
        return translation;
      } catch (err) {
        clearTimeout(timer);
        if (aborted && !timedOut) throw err;            // genuine user stop
        if (timedOut) err = Object.assign(new Error('timeout'), { timeout: true });
        lastErr = err;
        if (attempt <= MAX_RETRIES && isRetryable(err)) {
          emit({ type: 'log', level: 'info', key: 'retry', params: { n: index + 1, attempt, reason: reasonOf(err) } });
          await delay(RETRY_BACKOFF_MS * attempt);
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  /** Map a raw error to a { key, params } the renderer can translate. */
  function friendlyError(err) {
    const code = err && err.cause && err.cause.code;
    if (err.timeout) return { key: 'timeout', params: { sec: Math.round(REQUEST_TIMEOUT_MS / 1000) } };
    if (code === 'ECONNREFUSED' || /fetch failed/i.test(err.message)) return { key: 'unreachable', params: {} };
    if (err.httpStatus === 404) return { key: 'http404', params: {} };
    if (err.httpStatus) return { key: 'http', params: { status: err.httpStatus, detail: err.detail || '' } };
    if (err.empty) return { key: 'empty', params: {} };
    return { key: 'generic', params: { msg: err.message } };
  }

  const counts = (project) => store.countStatuses(project.segments);

  async function start(projectId, sender) {
    if (running) return;
    running = true;
    aborted = false;
    emit = (payload) => { try { sender.send('engine:event', payload); } catch { /* gone */ } };

    let project;
    try { project = await store.getProject(projectId); }
    catch { emit({ type: 'error', key: 'projectOpen', params: {} }); running = false; return; }

    const total = project.segments.length;
    const globalGlossary = await store.getGlobalGlossary();
    emit({ type: 'started' });
    emit({ type: 'progress', counts: counts(project) });

    // Large games have tens of thousands of segments, so we work on one
    // in-memory copy and persist in batches rather than re-reading/writing the
    // whole file every segment.
    const SAVE_EVERY = 25;
    let sinceSave = 0;
    const persist = async () => {
      if (sinceSave === 0) return;
      // Merge our translations onto the on-disk project, but never overwrite a
      // segment the user changed in Review (only fill ones still pending there).
      const disk = await store.getProject(projectId);
      for (const s of project.segments) {
        if (s.status === 'pending') continue;
        const d = disk.segments[s.id];
        if (d && d.status === 'pending') { d.translation = s.translation; d.status = s.status; }
      }
      await store.saveProject(disk);
      sinceSave = 0;
    };

    while (!aborted) {
      const index = project.segments.findIndex((s) => s.status === 'pending');
      if (index === -1) { await persist(); emit({ type: 'done', reason: 'completed', counts: counts(project) }); break; }

      emit({ type: 'log', level: 'info', key: 'translating', params: { n: index + 1, total } });

      let translation;
      try {
        translation = await translateWithRetry(project, index, globalGlossary);
      } catch (err) {
        await persist();
        if (aborted || err.name === 'AbortError') { emit({ type: 'done', reason: 'stopped', counts: counts(project) }); break; }
        emit({ type: 'error', ...friendlyError(err) });
        break;
      }
      if (aborted) { await persist(); emit({ type: 'done', reason: 'stopped', counts: counts(project) }); break; }

      // Apply to this segment AND every identical still-pending one (dedup).
      const src = project.segments[index].original;
      for (const seg of project.segments) {
        if (seg.status === 'pending' && seg.original === src) {
          seg.translation = translation;
          seg.status = 'translated';
        }
      }
      emit({ type: 'segment', id: project.segments[index].id, index, translation, status: 'translated' });
      emit({ type: 'progress', counts: counts(project) });
      sinceSave += 1;
      if (sinceSave >= SAVE_EVERY) await persist();
    }

    running = false;
    controller = null;
  }

  async function retranslateSegment(projectId, segmentId, sender) {
    if (running) return;
    running = true;
    aborted = false;
    emit = (payload) => { try { sender.send('engine:event', payload); } catch { /* gone */ } };

    let project;
    try { project = await store.getProject(projectId); }
    catch { emit({ type: 'error', key: 'projectOpen', params: {} }); running = false; return; }

    const index = project.segments.findIndex((s) => s.id === segmentId);
    if (index === -1) { emit({ type: 'error', key: 'segNotFound', params: {} }); running = false; return; }

    const globalGlossary = await store.getGlobalGlossary();
    emit({ type: 'started', mode: 'single' });
    emit({ type: 'log', level: 'info', key: 'retranslating', params: { n: index + 1 } });

    let translation;
    try {
      translation = await translateWithRetry(project, index, globalGlossary);
    } catch (err) {
      if (aborted || err.name === 'AbortError') emit({ type: 'done', reason: 'stopped', counts: counts(project) });
      else emit({ type: 'error', ...friendlyError(err) });
      running = false; controller = null; return;
    }

    const fresh = await store.getProject(projectId);
    if (fresh.segments[index]) {
      fresh.segments[index].translation = translation;
      fresh.segments[index].status = 'translated';
      await store.saveProject(fresh);
      emit({ type: 'segment', id: segmentId, index, translation, status: 'translated' });
    }
    emit({ type: 'progress', counts: counts(fresh) });
    emit({ type: 'done', reason: 'completed', counts: counts(fresh) });
    running = false; controller = null;
  }

  function stop() {
    if (!running) return;
    aborted = true;
    if (controller) controller.abort();
  }

  /** Quick reachability check against the OpenAI-compatible /v1/models endpoint. */
  async function testConnection(apiUrl) {
    const url = (apiUrl || '').trim();
    if (!url) return { ok: false, code: 'noUrl', params: {} };
    const modelsUrl = url.replace(/\/chat\/completions\/?$/, '/models');
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    try {
      const res = await fetch(modelsUrl, { signal: ac.signal });
      clearTimeout(timer);
      if (!res.ok) return { ok: false, code: 'http', params: { status: res.status } };
      const json = await res.json().catch(() => null);
      const ids = json && Array.isArray(json.data) ? json.data.map((m) => m.id) : [];
      if (ids.length === 0) return { ok: true, code: 'noModel', params: {}, models: [] };
      const list = ids.slice(0, 3).join(', ') + (ids.length > 3 ? '…' : '');
      return { ok: true, code: 'connected', params: { count: ids.length, list }, models: ids };
    } catch (err) {
      clearTimeout(timer);
      const code = err && err.cause && err.cause.code;
      if (code === 'ECONNREFUSED' || /abort/i.test(err.name || '') || /fetch failed/i.test(err.message || '')) {
        return { ok: false, code: 'unreachable', params: {} };
      }
      return { ok: false, code: 'failed', params: { msg: err.message } };
    }
  }

  return { start, stop, retranslateSegment, testConnection, isRunning: () => running };
}

module.exports = { createEngine };
