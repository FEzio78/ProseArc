// HTML → typed blocks — the shared bridge for structured imports.
//
// Both EPUB (XHTML chapters) and DOCX (via mammoth → HTML) normalize their
// markup through this converter, producing the same typed-block shape the
// segmenter consumes (see segmenter.js: segmentBlocks). Inline emphasis is
// emitted as Markdown (*em*, **strong**) so it round-trips through translation
// and into every export.

const { parse } = require('node-html-parser');

// A line that is only repeated divider glyphs (e.g. "* * *", "***", "⁂").
const SCENE_TEXT_RE = /^([*\-_•·◆◇⁂~=]\s*){2,}$/;
function isSceneText(t) {
  const s = (t || '').trim();
  return s === '⁂' || s === '* * *' || SCENE_TEXT_RE.test(s);
}

const BLOCK_TAGS = /^(h[1-6]|p|div|blockquote|ul|ol|hr|pre|table|section|article|header|footer|main|aside)$/;
function hasBlockChild(node) {
  return node.childNodes.some(
    (n) => n.nodeType === 1 && BLOCK_TAGS.test((n.rawTagName || '').toLowerCase())
  );
}

// Build a Markdown string for a node's inline content (recursing into spans/links).
function inlineMd(node) {
  let out = '';
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      out += child.text; // text node, entities already decoded
      continue;
    }
    if (child.nodeType !== 1) continue;
    const tag = (child.rawTagName || '').toLowerCase();
    if (tag === 'br') {
      out += '\n';
    } else if (tag === 'em' || tag === 'i') {
      const inner = inlineMd(child).trim();
      out += inner ? `*${inner}*` : '';
    } else if (tag === 'strong' || tag === 'b') {
      const inner = inlineMd(child).trim();
      out += inner ? `**${inner}**` : '';
    } else {
      out += inlineMd(child); // span, a, sup, etc. — keep the words, drop the tag
    }
  }
  return out;
}

const clean = (s) => String(s).replace(/\s+/g, ' ').trim();

function walk(node, blocks) {
  for (const child of node.childNodes) {
    if (child.nodeType !== 1) continue;
    const tag = (child.rawTagName || '').toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      const text = clean(inlineMd(child));
      if (text) blocks.push({ type: 'heading', level: Number(tag[1]), text });
      continue;
    }

    if (tag === 'p' || tag === 'div') {
      // A div is often just a wrapper; recurse if it holds block-level children.
      if (tag === 'div' && hasBlockChild(child)) { walk(child, blocks); continue; }
      const text = clean(inlineMd(child));
      if (!text) continue;
      if (isSceneText(text)) blocks.push({ type: 'scene-break', text: '' });
      else blocks.push({ type: 'paragraph', text });
      continue;
    }

    if (tag === 'blockquote') {
      const ps = child.childNodes.filter(
        (n) => n.nodeType === 1 && (n.rawTagName || '').toLowerCase() === 'p'
      );
      const sources = ps.length ? ps : [child];
      for (const p of sources) {
        const text = clean(inlineMd(p));
        if (text) blocks.push({ type: 'blockquote', text });
      }
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      const ordered = tag === 'ol';
      for (const li of child.childNodes) {
        if (li.nodeType !== 1 || (li.rawTagName || '').toLowerCase() !== 'li') continue;
        const text = clean(inlineMd(li));
        if (text) blocks.push({ type: 'list-item', ordered, text });
      }
      continue;
    }

    if (tag === 'hr') { blocks.push({ type: 'scene-break', text: '' }); continue; }

    if (tag === 'pre') {
      // Preformatted text → verse (preserve line breaks, trim trailing space).
      const text = inlineMd(child).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      if (text) blocks.push({ type: 'verse', text });
      continue;
    }

    // section / article / body / unknown wrappers → descend.
    walk(child, blocks);
  }
}

/**
 * Convert an HTML/XHTML string into an ordered list of typed blocks.
 * @param {string} html
 * @returns {Array<{type:string, level?:number, ordered?:boolean, text:string}>}
 */
function htmlToBlocks(html) {
  const root = parse(String(html || ''), { comment: false });
  for (const sel of ['script', 'style', 'head', 'title', 'nav']) {
    root.querySelectorAll(sel).forEach((n) => n.remove());
  }
  const body = root.querySelector('body') || root;
  const blocks = [];
  walk(body, blocks);
  return blocks;
}

module.exports = { htmlToBlocks };
