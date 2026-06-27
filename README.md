<p align="center">
  <img src="assets/logo.png" alt="ProseArc" width="420" />
</p>

<p align="center"><a href="#arabic">العربية ↓</a></p>

A **human‑in‑the‑loop workspace for translating novels** with a local AI model. Import a manuscript, let a local model produce a first‑pass translation, then review it side‑by‑side, read it as a book, and polish it — keeping full control over quality, consistency, and tone.

> **Privacy first.** Every AI call goes to a *local* OpenAI‑compatible server (LM Studio by default). Nothing leaves your machine.

Built with Electron + plain HTML/CSS/JS — no UI framework.

---

## Features

- **Project library & per‑book hub** — each book is one project; open it to a page with **Read / Translate / Review / Export** and progress at a glance.
- **Structure‑aware import** — import **TXT, Markdown, EPUB, or Word (.docx)**. Headings, paragraphs, block quotes, lists, scene breaks, and *italic* / **bold** emphasis are preserved through translation and back out to every export — not flattened into a wall of text.
- **Translation engine** — streams progress and a live activity log; per‑request timeout + auto‑retry; resumable runs.
- **Per‑book translation style** — an optional brief (tone, formality, audience) sent with every segment.
- **Split‑screen review editor** — original vs. editable translation, **RTL‑aware** (e.g. Arabic), a virtualized navigator for tens of thousands of segments, **filter by status**, search with live match **highlighting**, **find & replace** across all translations, and one‑click *retranslate* / *mark all reviewed*.
- **Reader** — read the finished translation as a book: chapter **contents**, adjustable **font / size / width / theme** (dark · sepia · light), **resume position**, per‑paragraph **bookmarks & notes**, and **bilingual** tap‑to‑reveal of the original.
- **Glossary** — a shared dictionary plus per‑project terms (project overrides shared), injected only into segments where a term appears, to stop name‑drift — plus **auto‑suggested names** detected from the book.
- **Export** — TXT, Markdown, PDF, and EPUB (RTL‑aware), with a warning if any segment is still untranslated.
- **Settings** — app‑wide defaults for new projects (model, languages, context) plus appearance.
- **Polish** — bundled fonts (Spectral / Amiri / Inter), dark + light themes, and a full **English / Arabic** interface with RTL.

---

## Download & run

For most people — no Node, no setup:

**[⬇ Download the latest release](https://github.com/FEzio78/ProseArc/releases/latest)** (Windows)

- **Installer** (`ProseArc‑Setup‑*.exe`) — adds a Start Menu shortcut + uninstaller, or
- **Portable** (`ProseArc‑*‑portable.exe`) — a single file, just double‑click.

> Because the app isn't code‑signed, Windows SmartScreen may say *“Windows protected your PC.”* Click **More info → Run anyway**.

## You'll also need: a local AI model

ProseArc doesn't bundle an AI model — it connects to a **local** OpenAI‑compatible server on your own machine (that's why nothing leaves it). The easiest is **[LM Studio](https://lmstudio.ai/)**:

1. Install LM Studio and **load** a chat/instruct model.
2. Open the **Developer / Local Server** tab → **Start Server** (defaults to `http://localhost:1234`).

In ProseArc, use **Test connection** (Settings or Workspace) to confirm it's reachable.

## Using ProseArc

Create a project and import a `.txt`, `.md`, `.epub`, or `.docx`. Set the source/target languages, then press **Start translating** (with your local server running). Polish in **Review**, **Read** the result as a book, and **Export** to TXT / Markdown / PDF / EPUB. Set defaults once in **Settings**.

---

## Build from source

Only needed if you want to run or build it yourself. Requires **[Node.js](https://nodejs.org/) 18+** (developed on 26).

```bash
npm install
npm start        # run in dev
npm run dist     # build a portable .exe + installer into dist/
```

## Where data lives

Each project is a single JSON file under your OS per‑app data folder — `%APPDATA%\prosearc\projects\` on Windows (i.e. `C:\Users\<you>\AppData\Roaming\prosearc\projects\`). Saves are atomic (written to a temp file, then renamed into place), so an interrupted save never leaves a half‑written, corrupt project. The shared glossary sits alongside that folder at `%APPDATA%\prosearc\glossary-global.json`.

## License

MIT — see [LICENSE](LICENSE).

---

<a id="arabic"></a>

<div dir="rtl">

# ProseArc — بالعربية

**مساحة عمل لترجمة الروايات بإشراف بشري** باستخدام نموذج ذكاء اصطناعي محلي. استورد مخطوطة، ودع نموذجًا محليًا يُنتج ترجمة أولية، ثم راجِعها جنبًا إلى جنب، واقرأها ككتاب، وهذّبها — مع تحكّم كامل في الجودة والاتساق والأسلوب.

> **الخصوصية أولًا.** كل طلب للذكاء الاصطناعي يذهب إلى خادم محلي متوافق مع OpenAI (LM Studio افتراضيًا). لا شيء يغادر جهازك.

مبني على Electron وHTML/CSS/JS عادي — دون إطار عمل للواجهة.

## المزايا

- **مكتبة المشاريع وصفحة لكل كتاب** — كل كتاب مشروع؛ افتحه لتظهر صفحته مع **قراءة / ترجمة / مراجعة / تصدير** والتقدّم في لمحة.
- **استيراد واعٍ بالبنية** — استورد **TXT وMarkdown وEPUB وWord ‏(.docx)**. تُحفَظ العناوين والفقرات والاقتباسات والقوائم وفواصل المشاهد والتشكيل *المائل* / **العريض** خلال الترجمة وفي كل تصدير — دون تحويلها إلى نص متراصّ.
- **محرّك الترجمة** — يعرض التقدّم وسجلًا حيًّا؛ مهلة لكل طلب مع إعادة محاولة تلقائية؛ تشغيل قابل للاستئناف.
- **أسلوب ترجمة لكل كتاب** — موجز اختياري (النبرة، الرسمية، الجمهور) يُرسَل مع كل مقطع.
- **محرّر مراجعة بشاشة مقسّمة** — الأصل مقابل ترجمة قابلة للتحرير، **يدعم RTL** (مثل العربية)، متصفّح مُحسَّن لعشرات آلاف المقاطع، **تصفية حسب الحالة**، بحث مع **تظليل** للمطابقات، و**بحث واستبدال** في كل الترجمات.
- **القارئ** — اقرأ الترجمة النهائية ككتاب: **محتويات** الفصول، وضبط **الخط/الحجم/العرض/السمة** (داكن · بنّي · فاتح)، و**استئناف الموضع**، و**إشارات وملاحظات** لكل فقرة، وكشف **ثنائي اللغة** للأصل بنقرة.
- **المسرد** — قاموس مشترك ومصطلحات لكل مشروع (مصطلحات المشروع تتجاوز المشتركة)، تُحقَن فقط في المقاطع التي يظهر فيها المصطلح لمنع تذبذب الأسماء — مع **أسماء مقترحة** تلقائيًا من الكتاب.
- **التصدير** — TXT وMarkdown وPDF وEPUB (يدعم RTL)، مع تنبيه إن بقي أي مقطع غير مترجم.
- **الإعدادات** — قيم افتراضية على مستوى التطبيق للمشاريع الجديدة (النموذج، اللغات، السياق) إضافةً إلى المظهر.
- **لمسات** — خطوط مضمّنة (Spectral / Amiri / Inter)، سمتان داكنة وفاتحة، وواجهة كاملة **بالإنجليزية / العربية** مع RTL.

## التنزيل والتشغيل

لمعظم الناس — دون Node ودون إعداد:

**[⬇ نزّل أحدث إصدار](https://github.com/FEzio78/ProseArc/releases/latest)** (ويندوز)

- **المثبِّت** (`ProseArc‑Setup‑*.exe`) — يضيف اختصارًا في قائمة ابدأ وأداة إزالة، أو
- **المحمول** (`ProseArc‑*‑portable.exe`) — ملف واحد، انقر نقرًا مزدوجًا فحسب.

> لأن التطبيق غير موقَّع رقميًا، قد يعرض ويندوز تحذير SmartScreen («حمى ويندوز جهازك»). اضغط **مزيد من المعلومات ← التشغيل على أي حال**.

## ستحتاج أيضًا إلى نموذج ذكاء اصطناعي محلي

لا يتضمّن ProseArc نموذجًا — بل يتصل بخادم **محلي** متوافق مع OpenAI على جهازك (لذلك لا شيء يغادره). الأسهل هو **[LM Studio](https://lmstudio.ai/)**:

1. ثبّت LM Studio و**حمّل** نموذج محادثة/تعليمات.
2. افتح تبويب **Developer / Local Server** ← **Start Server** (الافتراضي `http://localhost:1234`).

داخل ProseArc، استخدم زر **اختبار الاتصال** (في الإعدادات أو مساحة العمل) للتأكد.

## كيفية الاستخدام

أنشئ مشروعًا واستورد ملف `.txt` أو `.md` أو `.epub` أو `.docx`. اضبط لغتي المصدر والهدف، ثم اضغط **بدء الترجمة** (مع تشغيل الخادم المحلي). هذّب في **المراجعة**، و**اقرأ** النتيجة ككتاب، و**صدّر** إلى TXT / Markdown / PDF / EPUB. اضبط الافتراضيات مرة واحدة في **الإعدادات**.

## البناء من المصدر

يلزم فقط إن أردت تشغيله أو بناءه بنفسك. يتطلّب **[Node.js](https://nodejs.org/) 18+**.

```bash
npm install
npm start        # التشغيل للتطوير
npm run dist     # بناء نسخة محمولة ومثبِّت في dist/
```

## أين تُحفَظ البيانات

كل مشروع ملف JSON واحد داخل مجلد بيانات التطبيق في نظامك — `%APPDATA%\prosearc\projects\` على ويندوز. عمليات الحفظ ذرّية (تُكتب في ملف مؤقت ثم يُعاد تسميته)، فلا يترك أي انقطاع مشروعًا تالفًا. يوجد المسرد المشترك بجوار ذلك المجلد في `%APPDATA%\prosearc\glossary-global.json`.

## الرخصة

MIT — انظر [LICENSE](LICENSE).

</div>
