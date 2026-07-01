// PDF import — reconstruct typed blocks from a PDF's positioned text.
//
// Unlike EPUB/DOCX, a PDF carries no semantic structure — only glyph runs
// with x/y positions and font info (read via pdfjs-dist; pure JS, fully
// offline). Structure is rebuilt heuristically: lines from shared baselines,
// paragraphs from indents / vertical gaps / short last lines, headings from
// oversized fonts, and repeated running headers, footers and page numbers
// are dropped. Inline emphasis is detected from font names (…-Italic,
// …-Bold) and emitted as Markdown, matching the other importers.

const { isSceneText } = require('./html-to-blocks');

// pdfjs-dist v4+ ships ESM only; load it once via dynamic import from CJS.
let pdfjsPromise = null;
function loadPdfjs() {
  if (!pdfjsPromise) pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjsPromise;
}

const ITALIC_RE = /italic|oblique/i;
const BOLD_RE = /bold|black|heavy|semibold|demibold/i;
// A line that is only a page number: digits or roman numerals.
const PAGE_NUM_RE = /^[0-9]{1,4}$|^[ivxlc]{1,7}$/i;

const roundTo = (n, step) => Math.round(n / step) * step;

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// The most common value (rounded to `step`), weighted by `weightOf`.
function mode(values, step, weightOf = () => 1) {
  const counts = new Map();
  values.forEach((v, i) => {
    const k = roundTo(v, step);
    counts.set(k, (counts.get(k) || 0) + weightOf(i));
  });
  let best = 0, bestCount = -1;
  for (const [k, c] of counts) if (c > bestCount) { best = k; bestCount = c; }
  return best;
}

// Group one page's text items into lines (shared baseline), each line being
// an ordered list of styled runs plus geometry used by the paragraph logic.
function extractLines(textContent, resolveFont) {
  const lines = [];
  for (const it of textContent.items) {
    if (!it.str || !it.str.trim()) continue;
    const size = Math.hypot(it.transform[2], it.transform[3]) || 1;
    const x = it.transform[4];
    const y = it.transform[5];
    const tol = Math.max(2, size * 0.4);
    let line = lines.find((l) => Math.abs(l.y - y) <= tol);
    if (!line) { line = { y, raw: [] }; lines.push(line); }
    line.raw.push({ str: it.str, x, w: it.width || 0, size, font: resolveFont(it.fontName) });
  }

  for (const line of lines) {
    line.raw.sort((a, b) => a.x - b.x);
    line.runs = [];
    let text = '';
    let prevEnd = null;
    for (const r of line.raw) {
      let str = r.str;
      // Re-insert the space the layout implied but the string may lack.
      if (prevEnd !== null && r.x - prevEnd > 0.15 * r.size &&
          !/\s$/.test(text) && !/^\s/.test(str)) {
        str = ' ' + str;
      }
      prevEnd = r.x + r.w;
      text += str;
      line.runs.push({
        text: str,
        italic: ITALIC_RE.test(r.font),
        bold: BOLD_RE.test(r.font),
      });
    }
    line.text = text.replace(/\s+/g, ' ').trim();
    line.x0 = line.raw[0].x;
    const last = line.raw[line.raw.length - 1];
    line.x1 = last.x + last.w;
    line.size = Math.max(...line.raw.map((r) => r.size));
    delete line.raw;
  }

  lines.sort((a, b) => b.y - a.y); // PDF y grows upward → top of page first
  return lines.filter((l) => l.text);
}

// Merge adjacent same-style runs, wrap emphasis in Markdown, collapse spaces.
function runsToMarkdown(runs) {
  const merged = [];
  for (const r of runs) {
    const prev = merged[merged.length - 1];
    if (prev && prev.italic === r.italic && prev.bold === r.bold) prev.text += r.text;
    else merged.push({ ...r });
  }
  let out = '';
  for (const r of merged) {
    const core = r.text.trim();
    if ((r.italic || r.bold) && core) {
      const mark = r.bold && r.italic ? '***' : r.bold ? '**' : '*';
      out += r.text.replace(core, mark + core + mark);
    } else {
      out += r.text;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Parse a PDF buffer into { title, blocks }.
 * @param {Buffer} buffer
 */
async function pdfToBlocks(buffer) {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
    verbosity: 0,
  });
  const doc = await loadingTask.promise;

  let title = '';
  try {
    const meta = await doc.getMetadata();
    title = (meta.info && meta.info.Title) || '';
  } catch { /* metadata is optional */ }

  // --- Pass 1: collect styled lines from every page -----------------------
  const pages = []; // per page: { lines, height }
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    // getOperatorList loads the fonts into commonObjs so real font names
    // (…-Italic, …-Bold) become resolvable; emphasis is best-effort.
    try { await page.getOperatorList(); } catch { /* keep going without it */ }
    const resolveFont = (id) => {
      try { return (page.commonObjs.get(id) || {}).name || ''; } catch { return ''; }
    };
    const textContent = await page.getTextContent();
    const height = page.view[3] - page.view[1];
    pages.push({ lines: extractLines(textContent, resolveFont), height });
    page.cleanup();
  }

  const allLines = pages.flatMap((pg) => pg.lines);
  if (allLines.reduce((n, l) => n + l.text.length, 0) < 40) {
    await loadingTask.destroy();
    throw new Error(
      'No selectable text found — this PDF is likely scanned images. ' +
      'OCR is not supported; try an EPUB, DOCX or text version instead.'
    );
  }

  // --- Pass 2: drop page numbers and repeated running headers/footers -----
  // Candidates live in the top/bottom 15% of the page. A header/footer is a
  // line whose normalized text + position recurs on at least half the pages.
  const sigPages = new Map();
  // Signature = normalized text + font size (so a title page whose text
  // matches the running header — very common — is not swept away with it).
  const sigOf = (l) =>
    l.text.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ') + '@' + roundTo(l.size, 1);
  pages.forEach((pg, idx) => {
    for (const l of pg.lines) {
      if (l.y < pg.height * 0.15 || l.y > pg.height * 0.85) {
        const key = sigOf(l);
        if (!sigPages.has(key)) sigPages.set(key, new Set());
        sigPages.get(key).add(idx);
      }
    }
  });
  // 35%, not 50%: books often alternate two headers (title/author) on
  // odd/even pages, so each individual signature covers only half the pages.
  const repeatMin = Math.max(3, Math.ceil(pages.length * 0.35));
  for (const pg of pages) {
    pg.lines = pg.lines.filter((l) => {
      const inBand = l.y < pg.height * 0.15 || l.y > pg.height * 0.85;
      if (!inBand) return true;
      if (PAGE_NUM_RE.test(l.text)) return false;
      return (sigPages.get(sigOf(l)) || new Set()).size < repeatMin;
    });
  }

  // --- Pass 3: document-wide metrics ---------------------------------------
  const kept = pages.flatMap((pg) => pg.lines);
  const bodySize = mode(kept.map((l) => l.size), 0.5, (i) => kept[i].text.length);
  const isBody = (l) => Math.abs(l.size - bodySize) <= 0.5;

  // Heading levels: distinct larger sizes, biggest → level 1 (capped at 3).
  const headingSizes = [...new Set(
    kept.filter((l) => l.size > bodySize * 1.15).map((l) => roundTo(l.size, 0.5))
  )].sort((a, b) => b - a);
  const headingLevel = (size) =>
    Math.min(3, headingSizes.indexOf(roundTo(size, 0.5)) + 1) || 3;

  // Typical spacing between consecutive body lines (for paragraph gaps).
  const gaps = [];
  for (const pg of pages) {
    for (let i = 1; i < pg.lines.length; i++) {
      if (isBody(pg.lines[i - 1]) && isBody(pg.lines[i])) {
        gaps.push(pg.lines[i - 1].y - pg.lines[i].y);
      }
    }
  }
  const lineGap = median(gaps) || bodySize * 1.4;

  // Body text edges: left margin per doc, right edge for "short line" checks.
  const bodyLines = kept.filter(isBody);
  const bodyLeft = mode(bodyLines.map((l) => l.x0), 2);
  const bodyRight = mode(bodyLines.map((l) => l.x1), 2, (i) => bodyLines[i].x1);
  const indentMin = Math.max(4, bodySize * 0.5);

  // --- Pass 4: assemble blocks ---------------------------------------------
  const blocks = [];
  let para = null; // { runs: [...] }
  const flush = () => {
    if (!para) return;
    const text = runsToMarkdown(para.runs);
    if (text) blocks.push({ type: 'paragraph', text });
    para = null;
  };

  let prev = null; // previous body line (with page index)
  pages.forEach((pg, pageIdx) => {
    for (const line of pg.lines) {
      if (isSceneText(line.text)) {
        flush();
        blocks.push({ type: 'scene-break', text: '' });
        prev = null;
        continue;
      }

      if (line.size > bodySize * 1.15) {
        flush();
        const level = headingLevel(line.size);
        const prevBlock = blocks[blocks.length - 1];
        // Multi-line headings: merge into the previous heading of same level.
        if (prev && prev.heading === level && prev.pageIdx === pageIdx &&
            prevBlock && prevBlock.type === 'heading' && prevBlock.level === level) {
          prevBlock.text += ' ' + line.text;
        } else {
          blocks.push({ type: 'heading', level, text: line.text });
        }
        prev = { heading: level, pageIdx };
        continue;
      }

      // Body line — does it start a new paragraph?
      let breaks = false;
      if (!para || !prev || prev.heading) {
        breaks = true;
      } else if (line.x0 > bodyLeft + indentMin) {
        breaks = true; // first-line indent
      } else if (prev.pageIdx === pageIdx && prev.y - line.y > lineGap * 1.6) {
        breaks = true; // extra vertical space
      } else if (prev.x1 < bodyRight - bodySize * 2) {
        breaks = true; // previous line stopped short of the right edge
      }

      if (breaks) flush();
      if (!para) {
        para = { runs: line.runs };
      } else {
        // De-hyphenate words split across lines; otherwise join with a space.
        const lastRun = para.runs[para.runs.length - 1];
        if (/[a-z]-$/i.test(lastRun.text.trimEnd()) && /^[a-z]/.test(line.text)) {
          lastRun.text = lastRun.text.trimEnd().slice(0, -1);
        } else {
          lastRun.text += ' ';
        }
        para.runs.push(...line.runs);
      }
      prev = { y: line.y, x1: line.x1, pageIdx };
    }
  });
  flush();

  await loadingTask.destroy();
  return { title, blocks };
}

module.exports = { pdfToBlocks };
