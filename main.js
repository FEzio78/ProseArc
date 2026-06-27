// Main process — the Node.js side of the app.
// Creates the window and exposes file-system / project operations to the UI
// over IPC (inter-process communication). The renderer can't touch the disk
// directly; it calls these handlers through the preload bridge.

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fsp = require('fs/promises');
const fs = require('fs');

const { createStore } = require('./src/store');
const { createEngine } = require('./src/engine');
const { buildExport, buildHtmlDocument, buildEpub } = require('./src/exporter');
const { epubToBlocks } = require('./src/epub');
const { docxToBlocks } = require('./src/docx');
const os = require('os');

let store;  // initialised once the app is ready and userData path is known.
let engine; // translation engine, created alongside the store.

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 980,            // brief: graceful down to ~980px
    minHeight: 600,
    backgroundColor: '#1F1E26',
    autoHideMenuBar: true,   // hide the dev-looking File/Edit/View bar; Alt reveals it
    icon: path.join(__dirname, 'build', 'icon.ico'), // window + taskbar icon in dev
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
  win.once('ready-to-show', () => win.show());
  return win;
}

// Render an HTML string to a PDF file using a hidden window + Chromium's
// printToPDF (handles Arabic shaping / RTL natively, no extra dependencies).
async function writePdf(html, filePath) {
  const tmpHtml = path.join(os.tmpdir(), `nls-export-${Date.now()}.html`);
  await fsp.writeFile(tmpHtml, html, 'utf8');

  const pdfWin = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await pdfWin.loadFile(tmpHtml);
    const data = await pdfWin.webContents.printToPDF({ printBackground: true });
    await fsp.writeFile(filePath, data);
  } finally {
    pdfWin.destroy();
    fsp.unlink(tmpHtml).catch(() => {});
  }
}

// ---- IPC handlers -----------------------------------------------------------
// Each handler is async and returns a value (or throws) back to the renderer.

function registerIpc() {
  ipcMain.handle('projects:list', () => store.listProjects());
  ipcMain.handle('projects:get', (_e, id) => store.getProject(id));
  ipcMain.handle('projects:delete', (_e, id) => store.deleteProject(id));
  ipcMain.handle('projects:create', (_e, input) => store.createProject(input));
  ipcMain.handle('projects:save', (_e, project) => store.saveProject(project));
  ipcMain.handle('projects:updateSegment', (_e, { projectId, segmentId, fields }) =>
    store.updateSegment(projectId, segmentId, fields));
  ipcMain.handle('projects:saveGlossary', (_e, { projectId, glossary }) =>
    store.saveGlossary(projectId, glossary));
  ipcMain.handle('glossary:getGlobal', () => store.getGlobalGlossary());
  ipcMain.handle('glossary:saveGlobal', (_e, glossary) => store.saveGlobalGlossary(glossary));

  // Open a native file picker and read the chosen manuscript.
  // Returns one of:
  //   { fileName, text }            — plain txt/Markdown
  //   { fileName, blocks, title }   — structured import (EPUB/DOCX)
  //   { fileName, error }           — parse failed
  //   null                          — the user cancelled
  ipcMain.handle('manuscript:pick', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const result = await dialog.showOpenDialog(win, {
      title: 'Choose a manuscript',
      properties: ['openFile'],
      filters: [
        { name: 'Books & manuscripts', extensions: ['txt', 'md', 'markdown', 'epub', 'docx'] },
        { name: 'Text & Markdown', extensions: ['txt', 'md', 'markdown'] },
        { name: 'EPUB', extensions: ['epub'] },
        { name: 'Word', extensions: ['docx'] },
        { name: 'All files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    try {
      if (ext === '.epub') {
        const { title, blocks } = await epubToBlocks(await fsp.readFile(filePath));
        return { fileName, blocks, title };
      }
      if (ext === '.docx') {
        const { title, blocks } = await docxToBlocks(await fsp.readFile(filePath));
        return { fileName, blocks, title };
      }
      // txt / md / markdown / anything else: read as UTF-8 text.
      const text = await fsp.readFile(filePath, 'utf8');
      return { fileName, text };
    } catch (err) {
      return { fileName, error: err.message || String(err) };
    }
  });

  // Export — the format is chosen in-app; here we just save & generate it.
  ipcMain.handle('export:project', async (e, { projectId, format }) => {
    const project = await store.getProject(projectId);

    const FORMATS = {
      txt: { name: 'Text', ext: 'txt' },
      md: { name: 'Markdown', ext: 'md' },
      pdf: { name: 'PDF', ext: 'pdf' },
      epub: { name: 'EPUB', ext: 'epub' },
    };
    const fmt = FORMATS[(format || 'txt').toLowerCase()] || FORMATS.txt;

    const { text, total, untranslated } = buildExport(project, fmt.ext);

    const win = BrowserWindow.fromWebContents(e.sender);
    const safeName = (project.name || 'export').replace(/[\\/:*?"<>|]/g, '_');
    const result = await dialog.showSaveDialog(win, {
      title: `Export as ${fmt.name}`,
      defaultPath: `${safeName}.${fmt.ext}`,
      filters: [{ name: fmt.name, extensions: [fmt.ext] }],
    });

    if (result.canceled || !result.filePath) return { canceled: true };

    if (fmt.ext === 'pdf') {
      await writePdf(buildHtmlDocument(project), result.filePath);
    } else if (fmt.ext === 'epub') {
      await fsp.writeFile(result.filePath, await buildEpub(project));
    } else {
      await fsp.writeFile(result.filePath, text, 'utf8'); // txt, md
    }

    return { canceled: false, path: result.filePath, total, untranslated, format: fmt.ext };
  });

  // Translation engine. Events stream back on the 'engine:event' channel to the
  // window that started the run (e.sender).
  ipcMain.handle('engine:start', (e, projectId) => engine.start(projectId, e.sender));
  ipcMain.handle('engine:stop', () => engine.stop());
  ipcMain.handle('engine:retranslateSegment', (e, { projectId, segmentId }) =>
    engine.retranslateSegment(projectId, segmentId, e.sender));
  ipcMain.handle('engine:testConnection', (_e, apiUrl) => engine.testConnection(apiUrl));
  ipcMain.handle('projects:resetForRetranslate', (_e, { projectId, includeReviewed }) =>
    store.resetForRetranslate(projectId, includeReviewed));
  ipcMain.handle('projects:markAllReviewed', (_e, projectId) => store.markAllReviewed(projectId));
}

// One-time migration: the app was renamed (folder "novel-localization-suite" →
// "prosearc"), and Electron derives userData from the package name. Copy any
// existing projects + shared glossary from the legacy folder into the new one so
// nothing is lost. Copy (not move) leaves the old folder as a safety backup.
function migrateLegacyUserData() {
  const dest = app.getPath('userData');
  const legacy = path.join(app.getPath('appData'), 'novel-localization-suite');
  const destProjects = path.join(dest, 'projects');
  try {
    if (legacy === dest || !fs.existsSync(legacy) || fs.existsSync(destProjects)) return;
    fs.mkdirSync(dest, { recursive: true });
    const legacyProjects = path.join(legacy, 'projects');
    if (fs.existsSync(legacyProjects)) fs.cpSync(legacyProjects, destProjects, { recursive: true });
    const legacyGlossary = path.join(legacy, 'glossary-global.json');
    if (fs.existsSync(legacyGlossary)) fs.copyFileSync(legacyGlossary, path.join(dest, 'glossary-global.json'));
  } catch {
    // Non-fatal: a fresh install simply has nothing to migrate.
  }
}

app.whenReady().then(() => {
  // userData is the OS-specific per-app data folder (safe, writable, persists
  // across app updates). Projects live in a subfolder of it.
  migrateLegacyUserData();
  store = createStore(path.join(app.getPath('userData'), 'projects'));
  engine = createEngine({ store });

  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
