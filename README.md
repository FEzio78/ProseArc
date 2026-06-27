<p align="center">
  <img src="assets/logo.png" alt="ProseArc" width="420" />
</p>

A **calm, offline, human‑in‑the‑loop workspace for translating novels** with a local AI model. Import a manuscript, let a local model produce a first‑pass translation, then review it side‑by‑side and polish it — keeping full control over quality, consistency, and tone.

> **Privacy first.** Every AI call goes to a *local* OpenAI‑compatible server (LM Studio by default). Nothing leaves your machine.

Built with Electron + plain HTML/CSS/JS — no framework, no build step.

## Download

**[⬇ Download the latest release](https://github.com/FEzio78/ProseArc/releases/latest)** — a portable `.exe` (no install, just run) or a Windows installer.

> ProseArc needs a local AI server to translate — see [Requirements](#requirements). Nothing leaves your machine.

---

## Features

- **Project library** — each book is one project; progress bars show translated / reviewed counts.
- **Structure‑aware import** — import **TXT, Markdown, EPUB, or Word (.docx)**. Headings, paragraphs, block quotes, lists, scene breaks, and *italic* / **bold** emphasis are preserved through translation and back out to every export — not flattened into a wall of text.
- **Translation engine** — streams progress and a live activity log; per‑request timeout + auto‑retry; resumable runs.
- **Per‑book translation style** — an optional brief (tone, formality, audience) sent with every segment.
- **Split‑screen review editor** — original vs. editable translation, **RTL‑aware** (e.g. Arabic), a virtualized navigator that handles tens of thousands of segments, **filter by status**, search with live match **highlighting**, **find & replace** across all translations, status dots, keyboard navigation, and one‑click *retranslate* / *mark all reviewed*.
- **Glossary** — a shared dictionary plus per‑project terms (project overrides shared); injected only into segments where a term appears, to stop name‑drift — plus **auto‑suggested names** detected from the book.
- **Export** — TXT, Markdown, PDF, and EPUB (RTL‑aware), with a warning if any segment is still untranslated.
- **Polish** — bundled fonts (Spectral / Amiri / Inter), dark + light themes, and a full **English / Arabic** interface with RTL.
- **"Test connection"** button to verify the local server before a run.

---

## Requirements

- [Node.js](https://nodejs.org/) 18+ (developed on 26).
- A local OpenAI‑compatible server — **[LM Studio](https://lmstudio.ai/)** recommended:
  1. Download and **load** a chat/instruct model.
  2. Open the **Developer / Local Server** tab and **Start Server** (defaults to `http://localhost:1234`).

## Run

```bash
npm install
npm start
```

The app opens a window. Create a project, import a `.txt`, `.md`, `.epub`, or `.docx`, set your languages and model, and press **Start translating** (with LM Studio running). Review in the **Review** tab; export from **Workspace → Export…**.

## Build a standalone executable (optional)

```bash
npm run dist
```

Produces a portable `.exe` in `dist/` (Windows) — no Node required to run it.

---

## Where data lives

Each project is a single JSON file under your OS per‑app data folder — `%APPDATA%\prosearc\projects\` on Windows (i.e. `C:\Users\<you>\AppData\Roaming\prosearc\projects\`). Saves are atomic (written to a temp file, then renamed into place), so an interrupted save never leaves a half‑written, corrupt project. The shared glossary sits alongside that folder at `%APPDATA%\prosearc\glossary-global.json`.

## License

MIT — see [LICENSE](LICENSE).
