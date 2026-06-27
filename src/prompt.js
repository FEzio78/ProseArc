// Prompt builder — turns a project + a target segment into the chat messages
// we send to the local model. Kept in its own module so it's easy to read,
// tweak, and (in Stage 5) extend with glossary injection.
//
// Design goals from the brief:
//   - Compact prompts (small local models have limited context).
//   - Feed N preceding *translated* segments as continuity context, clearly
//     marked "context only — do not translate".
//   - Literary tone; output only the translation, no commentary.

/**
 * Merge the shared dictionary with the project's own terms. When the same
 * source term exists in both, the PROJECT entry wins (so a name can be
 * translated differently in one novel without touching the shared dictionary).
 */
function effectiveGlossary(projectGlossary, globalGlossary) {
  const bySource = new Map();
  for (const g of globalGlossary || []) {
    if (g && g.source) bySource.set(g.source.toLowerCase(), g);
  }
  for (const g of projectGlossary || []) {
    if (g && g.source) bySource.set(g.source.toLowerCase(), g); // overrides shared
  }
  return [...bySource.values()];
}

/**
 * Find glossary pairs whose source term actually appears in this segment.
 */
function relevantGlossary(glossary, originalText) {
  if (!glossary || glossary.length === 0) return [];
  const haystack = originalText.toLowerCase();
  return glossary.filter(
    (g) => g.source && haystack.includes(g.source.toLowerCase())
  );
}

/**
 * Build the messages array for translating segments[index].
 * @param {object} project - full project object.
 * @param {number} index - position in project.segments to translate.
 * @param {Array} [globalGlossary] - the shared dictionary (merged with project's).
 * @returns {Array<{role:string, content:string}>}
 */
function buildMessages(project, index, globalGlossary = []) {
  const { sourceLang, targetLang, contextWindow, segments, glossary } = project;
  const target = segments[index];
  const merged = effectiveGlossary(glossary, globalGlossary);

  // --- System: the translator's standing instructions ---
  let system =
    `You are a literary translator localizing a novel from ${sourceLang} into ${targetLang}. ` +
    `Translate faithfully while keeping the author's tone, voice, and rhythm so it reads naturally in ${targetLang}. ` +
    `Output ONLY the translated text — no notes, labels, explanations, or surrounding quotation marks.`;

  // Preserve inline emphasis: the text may contain Markdown markers that carry
  // meaning (italics for a character's thoughts or stress, bold for emphasis).
  system +=
    ` The text may contain Markdown emphasis markers (*italics* and **bold**). ` +
    `Keep them, wrapping the SAME words you emphasize in ${targetLang}; never output the markers as literal words.`;

  // Per-block hint so the model treats a heading as a heading, etc.
  const typeHint = {
    heading: ` This passage is a chapter or section HEADING — translate it as a short, title-style line and keep any chapter number.`,
    blockquote: ` This passage is a block quotation.`,
    verse: ` This passage is verse/poetry — preserve the line breaks exactly.`,
    'list-item': ` This passage is a single list item.`,
  }[target.type];
  if (typeHint) system += typeHint;

  // Per-book translation brief (tone/formality/audience), if the user set one.
  const brief = (project.styleBrief || '').trim();
  if (brief) {
    system += `\n\nTranslation brief for this book (follow it):\n${brief}`;
  }

  // --- Glossary: only terms present in this segment ---
  const terms = relevantGlossary(merged, target.original);
  if (terms.length > 0) {
    const lines = terms.map((g) => `- "${g.source}" → "${g.target}"`).join('\n');
    system +=
      `\n\nUse these exact translations for the following terms every time they appear:\n${lines}`;
  }

  const messages = [{ role: 'system', content: system }];

  // --- Continuity context: preceding translated segments (target text only) ---
  const n = Math.max(0, Number(contextWindow) || 0);
  if (n > 0) {
    const preceding = [];
    for (let i = index - 1; i >= 0 && preceding.length < n; i--) {
      if (segments[i].translation && segments[i].status !== 'pending') {
        preceding.unshift(segments[i].translation);
      }
    }
    if (preceding.length > 0) {
      messages.push({
        role: 'user',
        content:
          `CONTEXT ONLY — do not translate or repeat this. It is the preceding ` +
          `text already translated into ${targetLang}, given so pronouns and tense ` +
          `stay consistent:\n\n${preceding.join('\n\n')}`,
      });
      messages.push({
        role: 'assistant',
        content: 'Understood. I will use it only as context.',
      });
    }
  }

  // --- The actual segment to translate ---
  messages.push({
    role: 'user',
    content:
      `Translate the following ${sourceLang} passage into ${targetLang}. ` +
      `Output only the translation:\n\n${target.original}`,
  });

  return messages;
}

module.exports = { buildMessages, relevantGlossary, effectiveGlossary };
