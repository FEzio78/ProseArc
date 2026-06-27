// DOCX import — read a Word .docx into typed blocks.
//
// mammoth converts the document to clean semantic HTML (Word heading styles →
// <h1..h6>, bold → <strong>, italic → <em>, lists → <ul>/<ol>, quotes →
// <blockquote>), which we normalize through the shared HTML→blocks converter.
// Pure JS, fully offline.

const mammoth = require('mammoth');
const { htmlToBlocks } = require('./html-to-blocks');

/**
 * Parse a DOCX buffer into { title, blocks }.
 * @param {Buffer} buffer
 */
async function docxToBlocks(buffer) {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return { title: '', blocks: htmlToBlocks(html) };
}

module.exports = { docxToBlocks };
