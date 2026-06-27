// Segmenter — turns a manuscript into structure-aware, translation-sized pieces.
//
// Two layers:
//   1. textToBlocks(text)  — parse a raw txt/Markdown string into an ordered list
//      of TYPED blocks (heading / paragraph / blockquote / verse / scene-break /
//      list-item). Inline emphasis is left as Markdown (*em*, **strong**) inside
//      the text so it can round-trip through translation and into every export.
//   2. segmentBlocks(blocks) — split any over-long prose block on sentence
//      boundaries, carrying each piece's type forward. Headings, verse, lists and
//      scene-breaks are never split.
//
// EPUB/DOCX importers (later phases) produce the SAME typed-block shape and feed
// it straight to segmentBlocks, so structure is preserved uniformly.
//
// We work in characters, not tokens — a good-enough proxy that needs no
// model-specific tokenizer. The limit is conservative so prompts (which also
// carry context + glossary) fit comfortably in a small local model.

// Max characters per segment before we try to split a prose block further.
const MAX_SEGMENT_CHARS = 1500;

// A line that is only repeated * - _ (e.g. "* * *", "***", "---") is a scene break.
const SCENE_BREAK_RE = /^\s*([*\-_]\s*){3,}$/;

/**
 * Parse a raw txt/Markdown string into an ordered list of typed blocks.
 * @param {string} text
 * @returns {Array<{type:string, level?:number, ordered?:boolean, text:string}>}
 */
function textToBlocks(text) {
  // Normalize line endings so Windows (\r\n) and Unix (\n) behave identically.
  const normalized = String(text || '').replace(/\r\n?/g, '\n');

  // A block break is one-or-more blank lines (whitespace-only lines count).
  const rawBlocks = normalized.split(/\n[ \t]*\n+/);

  const blocks = [];
  for (const raw of rawBlocks) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Scene break (a divider line on its own).
    if (SCENE_BREAK_RE.test(trimmed)) {
      blocks.push({ type: 'scene-break', text: '' });
      continue;
    }

    const lines = trimmed.split('\n');

    // ATX heading: a single line like "## Chapter Two".
    const h = lines.length === 1 && lines[0].match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push({ type: 'heading', level: h[1].length, text: h[2].trim() });
      continue;
    }

    // Blockquote: every line begins with ">".
    if (lines.every((l) => /^>\s?/.test(l))) {
      const body = lines.map((l) => l.replace(/^>\s?/, '')).join(' ').replace(/\s+/g, ' ').trim();
      blocks.push({ type: 'blockquote', text: body });
      continue;
    }

    // List: every line is a bullet ("- ", "* ", "+ ") or numbered ("1. ").
    if (lines.every((l) => /^\s*([-*+]|\d+[.)])\s+/.test(l))) {
      for (const l of lines) {
        const m = l.match(/^\s*([-*+]|\d+[.)])\s+(.*)$/);
        blocks.push({ type: 'list-item', ordered: /\d/.test(m[1]), text: m[2].trim() });
      }
      continue;
    }

    // Default: a prose paragraph. Collapse soft-wrapped lines into one flowing line.
    blocks.push({ type: 'paragraph', text: lines.join(' ').replace(/\s+/g, ' ').trim() });
  }

  return blocks;
}

/**
 * Split a long prose block into sentence-grouped chunks under maxChars.
 * Sentence boundary = . ! ? … (and common variants) followed by whitespace.
 * If a single sentence is itself longer than the limit, it's kept whole rather
 * than chopped mid-thought — a slightly long segment beats a broken sentence.
 */
function splitLongParagraph(paragraph, maxChars) {
  // Capture the punctuation so we don't lose it when splitting.
  const sentences = paragraph.match(/[^.!?…]+(?:[.!?…]+["'”’)\]]*\s*|$)/g);

  // No detectable sentence breaks — return the paragraph as a single chunk.
  if (!sentences || sentences.length <= 1) return [paragraph.trim()];

  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current + sentence;
    if (candidate.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current.trim().length > 0) chunks.push(current.trim());

  return chunks;
}

function makeSegment(block, text) {
  const seg = { type: block.type || 'paragraph', original: text };
  if (block.level) seg.level = block.level;
  if (block.ordered) seg.ordered = true;
  return seg;
}

/**
 * Turn typed blocks into raw segments, splitting over-long prose.
 * @param {Array<{type:string, level?:number, ordered?:boolean, text:string}>} blocks
 * @param {object} [opts]
 * @param {number} [opts.maxChars]
 * @returns {Array<{type:string, level?:number, ordered?:boolean, original:string}>}
 *   (Callers add id/translation/status — see store.js.)
 */
function segmentBlocks(blocks, opts = {}) {
  const maxChars = opts.maxChars || MAX_SEGMENT_CHARS;
  const segments = [];

  for (const block of blocks || []) {
    if (block.type === 'scene-break') {
      segments.push({ type: 'scene-break', original: '' });
      continue;
    }

    const text = (block.text || '').trim();
    if (!text) continue;

    // Only prose blocks are split; headings/verse/lists stay whole.
    const splittable = block.type === 'paragraph' || block.type === 'blockquote';
    if (splittable && text.length > maxChars) {
      for (const chunk of splitLongParagraph(text, maxChars)) {
        if (chunk.length > 0) segments.push(makeSegment(block, chunk));
      }
    } else {
      segments.push(makeSegment(block, text));
    }
  }

  return segments;
}

/**
 * Segment a raw manuscript string (txt/Markdown). Convenience wrapper that
 * parses structure first, then splits long prose.
 * @param {string} text
 * @param {object} [opts]
 * @returns {Array<{type:string, level?:number, ordered?:boolean, original:string}>}
 */
function segment(text, opts = {}) {
  return segmentBlocks(textToBlocks(text), opts);
}

module.exports = { segment, segmentBlocks, textToBlocks, splitLongParagraph, MAX_SEGMENT_CHARS };
