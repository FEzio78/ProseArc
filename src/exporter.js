// Exporter — turns a project's segments into a deliverable file.
//
// Plain text (TXT/MD): segments joined in order, separated by a blank line.
// PDF: a clean light-themed HTML document we hand to Electron's printToPDF.
// EPUB: a minimal EPUB 3 package (a ZIP of XHTML) built with JSZip.
//
// In every format, a segment without a translation falls back to its original
// text, and we count those so the UI can warn the export isn't fully done.

const crypto = require('crypto');

const RTL_LANGS = ['arabic', 'hebrew', 'persian', 'farsi', 'urdu', 'pashto', 'kurdish', 'yiddish', 'dhivehi'];
function isRtl(lang) {
  return RTL_LANGS.includes(String(lang || '').trim().toLowerCase());
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]
  ));
}

/** Render inline Markdown emphasis (*em* / **strong**) to HTML, escaping first. */
function inlineHtml(text) {
  let s = escapeXml(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  return s;
}

/** Strip inline Markdown emphasis markers, leaving plain words (for .txt). */
function inlinePlain(text) {
  return String(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1');
}

/**
 * Resolve a project into structural blocks ready for rendering. Each block uses
 * the translation when present, the original as fallback. Scene breaks carry no
 * text and never count as "untranslated".
 */
function resolveBlocks(project) {
  const segments = project.segments || [];
  let untranslated = 0;
  const blocks = segments.map((s) => {
    const type = s.type || 'paragraph';
    if (type === 'scene-break') return { type };
    const hasTranslation = s.translation && s.translation.trim().length > 0;
    if (!hasTranslation) untranslated += 1;
    return {
      type,
      level: s.level,
      ordered: s.ordered,
      text: (hasTranslation ? s.translation.trim() : s.original),
    };
  });
  return { blocks, total: segments.length, untranslated };
}

/**
 * Plain text / Markdown export. `format` 'md' keeps Markdown structure markers;
 * 'txt' (default) renders clean prose with the markers stripped.
 */
function buildExport(project, format = 'txt') {
  const md = String(format).toLowerCase() === 'md';
  const { blocks, total, untranslated } = resolveBlocks(project);

  const pieces = blocks.map((b) => {
    if (b.type === 'scene-break') return '* * *';
    const text = md ? b.text : inlinePlain(b.text);
    switch (b.type) {
      case 'heading':    return md ? `${'#'.repeat(Math.min(b.level || 2, 6))} ${text}` : text;
      case 'blockquote': return md ? `> ${text}` : text;
      case 'list-item':  return `${md && b.ordered ? '1.' : '-'} ${text}`;
      case 'verse':      return text; // preserve internal line breaks as-is
      default:           return text;
    }
  });

  return { text: pieces.join('\n\n') + '\n', total, untranslated };
}

/** Render resolved blocks to an HTML body string (shared by PDF + EPUB). */
function blocksToHtmlBody(project) {
  const { blocks } = resolveBlocks(project);
  const out = [];
  let listOpen = null; // 'ul' | 'ol' | null

  const closeList = () => { if (listOpen) { out.push(`</${listOpen}>`); listOpen = null; } };

  for (const b of blocks) {
    if (b.type === 'list-item') {
      const want = b.ordered ? 'ol' : 'ul';
      if (listOpen !== want) { closeList(); out.push(`<${want}>`); listOpen = want; }
      out.push(`<li>${inlineHtml(b.text)}</li>`);
      continue;
    }
    closeList();
    switch (b.type) {
      case 'scene-break': out.push('<p class="scene-break">* * *</p>'); break;
      case 'heading': {
        const lvl = Math.min(Math.max(b.level || 2, 1), 6);
        out.push(`<h${lvl}>${inlineHtml(b.text)}</h${lvl}>`);
        break;
      }
      case 'blockquote': out.push(`<blockquote><p>${inlineHtml(b.text)}</p></blockquote>`); break;
      case 'verse': out.push(`<p class="verse">${inlineHtml(b.text).replace(/\n/g, '<br/>')}</p>`); break;
      default: out.push(`<p>${inlineHtml(b.text)}</p>`);
    }
  }
  closeList();
  return out.join('\n  ');
}

/** A standalone HTML document for PDF rendering (light, book-like, RTL-aware). */
function buildHtmlDocument(project) {
  const rtl = isRtl(project.targetLang);
  const body = blocksToHtmlBody(project);

  return `<!DOCTYPE html>
<html lang="${rtl ? 'ar' : 'en'}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 2.2cm; }
  body { font-family: ${rtl ? "'Traditional Arabic', 'Times New Roman', serif" : 'Georgia, serif'};
         font-size: 13pt; line-height: 1.9; color: #1a1a1a; }
  h1.book-title { font-size: 22pt; text-align: center; margin: 0 0 0.15em; }
  h1, h2, h3, h4, h5, h6 { line-height: 1.4; margin: 1.6em 0 0.6em; page-break-after: avoid; }
  .meta { text-align: center; color: #666; font-size: 11pt; margin-bottom: 2.4em; }
  p { margin: 0 0 1em; text-align: justify; }
  blockquote { margin: 0 0 1em; padding-inline-start: 1.2em; border-inline-start: 3px solid #ccc; color: #333; }
  .verse { text-align: center; font-style: italic; }
  .scene-break { text-align: center; letter-spacing: 0.4em; margin: 1.6em 0; color: #888; }
  ul, ol { margin: 0 0 1em; padding-inline-start: 1.6em; }
  li { margin: 0 0 0.4em; }
</style>
</head>
<body>
  <h1 class="book-title">${escapeXml(project.name)}</h1>
  <div class="meta" dir="ltr">${escapeXml(project.sourceLang)} → ${escapeXml(project.targetLang)}</div>
  ${body}
</body>
</html>`;
}

/**
 * Build an EPUB 3 file as a Buffer.
 * @param {object} project
 * @param {Buffer|null} [cover] - optional JPEG cover image to embed.
 */
async function buildEpub(project, cover = null) {
  const JSZip = require('jszip');
  const rtl = isRtl(project.targetLang);
  const lang = rtl ? 'ar' : 'en';
  const dir = rtl ? 'rtl' : 'ltr';
  const uuid = crypto.randomUUID();
  const modified = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const title = escapeXml(project.name || 'Untitled');

  const body = blocksToHtmlBody(project);

  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${lang}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:language>${lang}</dc:language>
    <meta property="dcterms:modified">${modified}</meta>${cover ? '\n    <meta name="cover" content="cover-img"/>' : ''}
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${cover ? `
    <item id="cover-img" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>
    <item id="coverpage" href="cover.xhtml" media-type="application/xhtml+xml"/>` : ''}
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine page-progression-direction="${dir}">${cover ? '\n    <itemref idref="coverpage"/>' : ''}
    <itemref idref="content"/>
  </spine>
</package>`;

  const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}" dir="${dir}">
<head><meta charset="utf-8"/><title>${title}</title>
<style> body { margin: 0; text-align: center; } img { max-width: 100%; max-height: 100%; } </style>
</head>
<body epub:type="cover" xmlns:epub="http://www.idpf.org/2007/ops"><img src="cover.jpg" alt="${title}"/></body>
</html>`;

  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" dir="${dir}">
<head><meta charset="utf-8"/><title>${title}</title></head>
<body><nav epub:type="toc"><h1>Contents</h1><ol><li><a href="content.xhtml">${title}</a></li></ol></nav></body>
</html>`;

  const contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  body { font-family: serif; line-height: 1.85; }
  h1.book-title { text-align: center; margin-bottom: 1.5em; }
  h1, h2, h3, h4, h5, h6 { line-height: 1.4; margin: 1.4em 0 0.5em; }
  p { margin: 0 0 1em; text-align: justify; }
  blockquote { margin: 0 0 1em; padding-inline-start: 1.2em; border-inline-start: 3px solid #ccc; }
  .verse { text-align: center; font-style: italic; }
  .scene-break { text-align: center; letter-spacing: 0.4em; margin: 1.5em 0; }
  ul, ol { margin: 0 0 1em; padding-inline-start: 1.6em; }
</style>
</head>
<body>
  <h1 class="book-title">${title}</h1>
  ${body}
</body>
</html>`;

  const zip = new JSZip();
  // mimetype must be stored uncompressed and first.
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', containerXml);
  zip.file('OEBPS/content.opf', contentOpf);
  zip.file('OEBPS/nav.xhtml', navXhtml);
  zip.file('OEBPS/content.xhtml', contentXhtml);
  if (cover) {
    zip.file('OEBPS/cover.jpg', cover);
    zip.file('OEBPS/cover.xhtml', coverXhtml);
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = { buildExport, buildHtmlDocument, buildEpub, isRtl };
