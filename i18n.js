// i18n — tiny localization layer. Defines the EN/AR string tables and helpers
// the renderer uses. Loaded before renderer.js so window.t / setLang exist.
//
// UI language is independent of a project's translation languages. Switching to
// Arabic also flips the whole layout to RTL.

const I18N = {
  en: {
    'brand.sub': "The translator's desk",
    'nav.library': 'Library', 'nav.workspace': 'Workspace', 'nav.review': 'Review', 'nav.glossary': 'Glossary', 'nav.settings': 'Settings',
    'theme.dark': 'Dark', 'theme.light': 'Light',
    'set.title': 'Settings', 'set.lede': 'Defaults applied to new projects, and app appearance.',
    'set.defaults': 'Defaults for new projects',
    'set.note': 'These apply to new projects only. Each project keeps its own settings, editable in its Workspace.',
    'set.appearance': 'Appearance', 'set.theme': 'Theme', 'set.language': 'Interface language',
    'set.appearanceNote': 'Appearance is saved on this device.',

    'lib.title': 'Library', 'lib.lede': 'Your translation projects.', 'lib.new': 'New Project',
    'lib.emptyTitle': 'Your desk is clear.',
    'lib.emptyBody': 'Import a manuscript to begin your first translation project.',
    'lib.emptyBtn': 'Start a project',
    'card.open': 'Open', 'card.delete': 'Delete',
    'stats': '{t} / {n} translated · {r} reviewed',

    'ws.title': 'Workspace',
    'ws.lede': 'Control center for translating the current project.',
    'ws.export': 'Export…', 'ws.start': 'Start translating', 'ws.stop': 'Stop',
    'ws.stopping': 'Stopping after the current segment…',
    'ws.empty': 'Open a project from the Library to see it here.',
    'ws.test': 'Test connection',

    'settings.title': 'Settings',
    'f.name': 'Project name', 'f.source': 'Source language', 'f.target': 'Target language',
    'f.url': 'Local API URL', 'f.model': 'Model name', 'f.modelOpt': '(optional)',
    'f.modelPh': 'leave blank for loaded model', 'f.context': 'Context window',
    'f.style': 'Translation style', 'f.styleOpt': '(optional)',
    'f.stylePh': 'e.g. Formal classical Arabic; keep an intimate, lyrical tone; address the reader formally.',
    'f.styleHint': 'A short brief sent with every segment — tone, formality, audience.',
    'settings.note': 'Changes save automatically.',
    'activity.title': 'Activity',
    'activity.ready': 'Ready. Press “Start translating” when LM Studio is running.',

    'review.lede': 'Side-by-side editing.',
    'review.empty': 'Open a project from the Library to start reviewing.',
    'rv.segments': '{n} segments', 'rv.matches': '{n} matches', 'rv.fAll': 'All',
    'rv.search': 'Search original or translation…',
    'fr.open': '⇄ Replace', 'fr.title': 'Find & replace',
    'fr.sub': 'Replace text across every translation in this project.',
    'fr.find': 'Find', 'fr.replace': 'Replace with', 'fr.case': 'Match case',
    'fr.go': 'Replace all', 'fr.count': '{n} matches in {m} segments', 'fr.none': 'No matches',
    'fr.done': 'Replaced {n} matches in {m} segments',
    'rv.all': '↻ All', 'rv.segment': '↻ Segment',
    'rv.prev': '↑ Prev', 'rv.next': 'Next ↓', 'rv.reviewAll': '✓ All reviewed',
    'rv.save': 'Save & mark reviewed', 'rv.stop': '■ Stop',
    'ed.position': 'Segment {n} of {m}', 'ed.saved': 'Saved ✓',
    'ed.dividerPh': 'Scene break — nothing to translate.',
    'segtype.heading': 'Heading {level}', 'segtype.blockquote': 'Quote',
    'segtype.verse': 'Verse', 'segtype.list-item': 'List item', 'segtype.scene-break': 'Scene break',
    'status.pending': 'pending', 'status.translated': 'translated', 'status.reviewed': 'reviewed',
    'pane.original': 'Original · {lang}', 'pane.translation': 'Translation · {lang}',

    'gloss.title': 'Glossary',
    'gloss.lede': 'Terms are injected only into segments where they appear. Project terms override shared ones.',
    'gloss.shared': 'Shared dictionary', 'gloss.scopeAll': '· all projects',
    'gloss.project': 'This project only', 'gloss.scopeNo': '· no project open', 'gloss.scopeName': '· {name}',
    'gloss.srcPh': 'Source term — e.g. Shadow Blade', 'gloss.tgtPh': 'Target term — e.g. سيف الظل',
    'gloss.srcPh2': 'Source term', 'gloss.tgtPh2': 'Target term',
    'gloss.add': 'Add pair', 'gloss.projectHint': 'Open a project from the Library to add terms that apply only to it.',
    'gloss.emptyShared': 'No shared terms yet. Add a name here and every project will use it.',
    'gloss.emptyProject': 'No project-only terms. These override the shared dictionary for this novel.',
    'gloss.suggested': 'Suggested names', 'gloss.suggestedHint': '· recurring terms found in this book',
    'gloss.suggestTgtPh': 'Translation…', 'gloss.addBook': 'Add to book', 'gloss.addShared': 'Shared',
    'gloss.dismiss': 'Dismiss', 'gloss.needTarget': 'Type a translation first.',
    'gloss.added': 'Added “{term}” to the glossary',
    'gloss.popHead': '⋮⋮ Add to glossary', 'gloss.popTgtPh': 'Its translation…',
    'gloss.popShared': 'Add to shared', 'gloss.popProject': 'This project',
    'gloss.addedShared': 'Added to shared dictionary — {src}', 'gloss.addedProject': 'Added to this project — {src}',

    'np.title': 'New Project', 'np.sub': 'Import a manuscript and set up its translation.',
    'np.file': 'Manuscript file', 'np.noFile': 'No file chosen', 'np.choose': 'Choose…',
    'np.fileHint': 'TXT, Markdown, EPUB, or Word (.docx). Structure is preserved.',
    'np.name': 'Project name', 'np.namePh': 'e.g. The Shadow Blade',
    'np.cancel': 'Cancel', 'np.create': 'Create Project',

    'ex.title': 'Export', 'ex.sub': 'Choose a format.',
    'ex.txtDesc': 'Plain text', 'ex.mdDesc': '.md plain text',
    'ex.pdfDesc': 'Print-ready book', 'ex.epubDesc': 'For e-readers',
    'ex.cancel': 'Cancel', 'ex.go': 'Export {fmt}',
    'ex.statusAll': 'All {n} segments translated.',
    'ex.statusWarn': '⚠ {u} of {n} segments aren’t translated yet — their original text will be used.',

    'rt.title': 'Retranslate segments', 'rt.subDefault': 'Choose what to re-run through the AI.',
    'rt.sub': '{total} segments · {reviewed} reviewed · {unreviewed} not reviewed yet.',
    'rt.unreviewed': 'Re-do {unreviewed} unreviewed only',
    'rt.all': 'Re-do all {total}', 'rt.allOverwrite': 'Re-do all {total} — overwrites {reviewed} reviewed',
    'rt.cancel': 'Cancel',

    'confirm.delete': 'Delete “{name}”? This removes the project and its translations.',
    'confirm.retransReviewed': 'This segment is marked reviewed. Retranslate and overwrite your reviewed version?',
    'confirm.markAll': 'Mark all {n} translated segment(s) as reviewed? You can still edit any of them afterward.',
    'toast.created': 'Created “{name}” · {n} segments',
    'toast.importError': 'Could not read that file — it may be corrupt or unsupported.',
    'toast.importEmpty': 'No readable text found in that file.',
    'toast.deleted': 'Project deleted',
    'toast.complete': 'Translation complete',
    'toast.allReviewed': 'All translated segments marked reviewed',
    'toast.nothingMark': 'Nothing to mark — no unreviewed translations.',
    'toast.nothingRetrans': 'Nothing to retranslate — every segment is reviewed.',
    'toast.exported': 'Exported all {n} segments to {fmt}',
    'toast.exportedWarn': 'Exported {fmt} · {u} of {n} still untranslated',

    'log.runStarted': 'Translation run started.',
    'log.translating': 'Translating segment {n} of {total}…',
    'log.segTranslated': 'Segment {n} translated.',
    'log.allTranslated': 'All segments translated.',
    'log.stopped': 'Stopped.',
    'log.runHalted': 'Run halted — see the message above.',
    'log.retry': 'Segment {n}: attempt {attempt} failed ({reason}). Retrying…',
    'log.retranslating': 'Retranslating segment {n}…',
    'log.exported': 'Exported {fmt} to {path}.',
    'log.exportedWarn': 'Exported {fmt} to {path} — {u} of {n} segments were not translated; their original text was used instead.',

    'err.banner': 'Couldn’t continue.',
    'err.unreachable': 'Couldn’t reach the AI server. In LM Studio, open the Developer (Local Server) tab and click Start Server, and make sure a model is loaded. If you use a different port or Ollama, update the API URL in settings.',
    'err.http404': 'The server replied “404 Not Found”. Check the API URL — it should end in /v1/chat/completions.',
    'err.http': 'The AI server responded with an error (HTTP {status}). Make sure a model is loaded in LM Studio.{detail}',
    'err.empty': 'The model returned an empty translation. It may still be loading — try again.',
    'err.timeout': 'The model didn’t respond within {sec} seconds. It may be overloaded, or the prompt/context is too long — try lowering the context window or loading a smaller model.',
    'err.generic': 'Translation stopped: {msg}',
    'err.projectOpen': 'Could not open the project file.',
    'err.segNotFound': 'That segment could not be found.',

    'test.testing': 'Testing…',
    'test.noUrl': 'Enter the local API URL first.',
    'test.http': 'Server reachable but returned HTTP {status}. Check the URL.',
    'test.noModel': 'Connected, but no model appears to be loaded. Load a model in LM Studio.',
    'test.connected': 'Connected. {count} model(s) available: {list}',
    'test.unreachable': 'Couldn’t reach a server. In LM Studio, open Developer → Start Server, and load a model.',
    'test.failed': 'Connection test failed: {msg}',
  },

  ar: {
    'brand.sub': 'مكتب المترجم',
    'nav.library': 'المكتبة', 'nav.workspace': 'مساحة العمل', 'nav.review': 'المراجعة', 'nav.glossary': 'المسرد', 'nav.settings': 'الإعدادات',
    'theme.dark': 'داكن', 'theme.light': 'فاتح',
    'set.title': 'الإعدادات', 'set.lede': 'إعدادات افتراضية تُطبَّق على المشاريع الجديدة، ومظهر التطبيق.',
    'set.defaults': 'الإعدادات الافتراضية للمشاريع الجديدة',
    'set.note': 'تنطبق على المشاريع الجديدة فقط. يحتفظ كل مشروع بإعداداته الخاصة، القابلة للتعديل في مساحة عمله.',
    'set.appearance': 'المظهر', 'set.theme': 'السمة', 'set.language': 'لغة الواجهة',
    'set.appearanceNote': 'يُحفَظ المظهر على هذا الجهاز.',

    'lib.title': 'المكتبة', 'lib.lede': 'مشاريع الترجمة الخاصة بك.', 'lib.new': 'مشروع جديد',
    'lib.emptyTitle': 'مكتبك خالٍ.',
    'lib.emptyBody': 'استورد مخطوطة لبدء أول مشروع ترجمة لك.',
    'lib.emptyBtn': 'ابدأ مشروعًا',
    'card.open': 'فتح', 'card.delete': 'حذف',
    'stats': '{t} / {n} مُترجَمة · {r} مُراجَعة',

    'ws.title': 'مساحة العمل',
    'ws.lede': 'مركز التحكم لترجمة المشروع الحالي.',
    'ws.export': 'تصدير…', 'ws.start': 'بدء الترجمة', 'ws.stop': 'إيقاف',
    'ws.stopping': 'سيتوقف بعد انتهاء المقطع الحالي…',
    'ws.empty': 'افتح مشروعًا من المكتبة لعرضه هنا.',
    'ws.test': 'اختبار الاتصال',

    'settings.title': 'الإعدادات',
    'f.name': 'اسم المشروع', 'f.source': 'لغة المصدر', 'f.target': 'لغة الهدف',
    'f.url': 'رابط الواجهة المحلية', 'f.model': 'اسم النموذج', 'f.modelOpt': '(اختياري)',
    'f.modelPh': 'اتركه فارغًا لاستخدام النموذج المحمَّل', 'f.context': 'نافذة السياق',
    'f.style': 'أسلوب الترجمة', 'f.styleOpt': '(اختياري)',
    'f.stylePh': 'مثال: عربية فصحى رسمية؛ حافظ على نبرة حميمة وشاعرية؛ خاطب القارئ بصيغة الاحترام.',
    'f.styleHint': 'موجز قصير يُرسَل مع كل مقطع — النبرة، الرسمية، الجمهور.',
    'settings.note': 'يتم الحفظ تلقائيًا.',
    'activity.title': 'النشاط',
    'activity.ready': 'جاهز. اضغط «بدء الترجمة» عندما يكون LM Studio يعمل.',

    'review.lede': 'تحرير جنبًا إلى جنب.',
    'review.empty': 'افتح مشروعًا من المكتبة لبدء المراجعة.',
    'rv.segments': '{n} مقطعًا', 'rv.matches': '{n} نتيجة', 'rv.fAll': 'الكل',
    'rv.search': 'ابحث في الأصل أو الترجمة…',
    'fr.open': '⇄ استبدال', 'fr.title': 'بحث واستبدال',
    'fr.sub': 'استبدل النص في جميع ترجمات هذا المشروع.',
    'fr.find': 'بحث', 'fr.replace': 'استبدال بـ', 'fr.case': 'مطابقة حالة الأحرف',
    'fr.go': 'استبدال الكل', 'fr.count': '{n} تطابقًا في {m} مقطعًا', 'fr.none': 'لا تطابقات',
    'fr.done': 'استُبدل {n} تطابقًا في {m} مقطعًا',
    'rv.all': '↻ الكل', 'rv.segment': '↻ المقطع',
    'rv.prev': '↑ السابق', 'rv.next': 'التالي ↓', 'rv.reviewAll': '✓ مراجعة الكل',
    'rv.save': 'حفظ ووضع علامة مُراجَع', 'rv.stop': '■ إيقاف',
    'ed.position': 'المقطع {n} من {m}', 'ed.saved': 'تم الحفظ ✓',
    'ed.dividerPh': 'فاصل مشهد — لا شيء للترجمة.',
    'segtype.heading': 'عنوان {level}', 'segtype.blockquote': 'اقتباس',
    'segtype.verse': 'شعر', 'segtype.list-item': 'عنصر قائمة', 'segtype.scene-break': 'فاصل مشهد',
    'status.pending': 'قيد الانتظار', 'status.translated': 'مُترجَم', 'status.reviewed': 'مُراجَع',
    'pane.original': 'الأصل · {lang}', 'pane.translation': 'الترجمة · {lang}',

    'gloss.title': 'المسرد',
    'gloss.lede': 'تُحقَن المصطلحات فقط في المقاطع التي تظهر فيها. مصطلحات المشروع تتجاوز المشتركة.',
    'gloss.shared': 'القاموس المشترك', 'gloss.scopeAll': '· لكل المشاريع',
    'gloss.project': 'هذا المشروع فقط', 'gloss.scopeNo': '· لا مشروع مفتوح', 'gloss.scopeName': '· {name}',
    'gloss.srcPh': 'مصطلح المصدر — مثل Shadow Blade', 'gloss.tgtPh': 'مصطلح الهدف — مثل سيف الظل',
    'gloss.srcPh2': 'مصطلح المصدر', 'gloss.tgtPh2': 'مصطلح الهدف',
    'gloss.add': 'إضافة زوج', 'gloss.projectHint': 'افتح مشروعًا من المكتبة لإضافة مصطلحات خاصة به.',
    'gloss.emptyShared': 'لا مصطلحات مشتركة بعد. أضف اسمًا هنا وستستخدمه كل المشاريع.',
    'gloss.emptyProject': 'لا مصطلحات خاصة بالمشروع. هذه تتجاوز القاموس المشترك لهذه الرواية.',
    'gloss.suggested': 'أسماء مقترحة', 'gloss.suggestedHint': '· مصطلحات متكررة في هذا الكتاب',
    'gloss.suggestTgtPh': 'الترجمة…', 'gloss.addBook': 'إضافة للكتاب', 'gloss.addShared': 'مشترك',
    'gloss.dismiss': 'تجاهل', 'gloss.needTarget': 'اكتب الترجمة أولًا.',
    'gloss.added': 'أُضيف «{term}» إلى المسرد',
    'gloss.popHead': '⋮⋮ إضافة إلى المسرد', 'gloss.popTgtPh': 'ترجمته…',
    'gloss.popShared': 'إضافة للمشترك', 'gloss.popProject': 'هذا المشروع',
    'gloss.addedShared': 'أُضيف إلى القاموس المشترك — {src}', 'gloss.addedProject': 'أُضيف إلى هذا المشروع — {src}',

    'np.title': 'مشروع جديد', 'np.sub': 'استورد مخطوطة وأعدّ ترجمتها.',
    'np.file': 'ملف المخطوطة', 'np.noFile': 'لم يُختَر ملف', 'np.choose': 'اختيار…',
    'np.fileHint': 'TXT أو Markdown أو EPUB أو Word‏ (.docx). تُحفَظ البنية.',
    'np.name': 'اسم المشروع', 'np.namePh': 'مثل: سيف الظل',
    'np.cancel': 'إلغاء', 'np.create': 'إنشاء المشروع',

    'ex.title': 'تصدير', 'ex.sub': 'اختر صيغة.',
    'ex.txtDesc': 'نص عادي', 'ex.mdDesc': 'نص ‎.md',
    'ex.pdfDesc': 'كتاب جاهز للطباعة', 'ex.epubDesc': 'لقارئات الكتب',
    'ex.cancel': 'إلغاء', 'ex.go': 'تصدير {fmt}',
    'ex.statusAll': 'كل المقاطع ({n}) مُترجَمة.',
    'ex.statusWarn': '⚠ {u} من {n} مقطعًا لم تُترجَم بعد — سيُستخدم نصها الأصلي.',

    'rt.title': 'إعادة ترجمة المقاطع', 'rt.subDefault': 'اختر ما تريد إعادة تمريره عبر الذكاء الاصطناعي.',
    'rt.sub': '{total} مقطعًا · {reviewed} مُراجَع · {unreviewed} لم تُراجَع بعد.',
    'rt.unreviewed': 'إعادة {unreviewed} غير المُراجَعة فقط',
    'rt.all': 'إعادة الكل ({total})', 'rt.allOverwrite': 'إعادة الكل ({total}) — يستبدل {reviewed} مُراجَعة',
    'rt.cancel': 'إلغاء',

    'confirm.delete': 'حذف «{name}»؟ سيؤدي هذا إلى إزالة المشروع وترجماته.',
    'confirm.retransReviewed': 'هذا المقطع مُعلَّم كمُراجَع. إعادة ترجمته والكتابة فوق نسختك المُراجَعة؟',
    'confirm.markAll': 'وضع علامة مُراجَع على كل المقاطع المُترجَمة ({n})؟ يمكنك تعديل أيٍّ منها لاحقًا.',
    'toast.created': 'أُنشئ «{name}» · {n} مقطعًا',
    'toast.importError': 'تعذّرت قراءة الملف — قد يكون تالفًا أو غير مدعوم.',
    'toast.importEmpty': 'لم يُعثَر على نص قابل للقراءة في الملف.',
    'toast.deleted': 'حُذف المشروع',
    'toast.complete': 'اكتملت الترجمة',
    'toast.allReviewed': 'تم وضع علامة مُراجَع على كل المقاطع المُترجَمة',
    'toast.nothingMark': 'لا شيء لوضع علامة عليه — لا ترجمات غير مُراجَعة.',
    'toast.nothingRetrans': 'لا شيء لإعادة ترجمته — كل المقاطع مُراجَعة.',
    'toast.exported': 'صُدِّرت كل المقاطع ({n}) بصيغة {fmt}',
    'toast.exportedWarn': 'صُدِّر {fmt} · {u} من {n} لم تُترجَم بعد',

    'log.runStarted': 'بدأت جولة الترجمة.',
    'log.translating': 'ترجمة المقطع {n} من {total}…',
    'log.segTranslated': 'تُرجم المقطع {n}.',
    'log.allTranslated': 'تُرجمت كل المقاطع.',
    'log.stopped': 'تم الإيقاف.',
    'log.runHalted': 'توقفت الجولة — انظر الرسالة أعلاه.',
    'log.retry': 'المقطع {n}: فشلت المحاولة {attempt} ({reason}). إعادة المحاولة…',
    'log.retranslating': 'إعادة ترجمة المقطع {n}…',
    'log.exported': 'صُدِّر {fmt} إلى {path}.',
    'log.exportedWarn': 'صُدِّر {fmt} إلى {path} — {u} من {n} مقطعًا لم تُترجَم؛ استُخدم نصها الأصلي.',

    'err.banner': 'تعذّر المتابعة.',
    'err.unreachable': 'تعذّر الوصول إلى خادم الذكاء الاصطناعي. في LM Studio، افتح تبويب Developer (الخادم المحلي) واضغط Start Server، وتأكد من تحميل نموذج. إن كنت تستخدم منفذًا مختلفًا أو Ollama، حدّث رابط الواجهة في الإعدادات.',
    'err.http404': 'ردّ الخادم بـ «404 Not Found». تحقق من الرابط — يجب أن ينتهي بـ /v1/chat/completions.',
    'err.http': 'ردّ الخادم بخطأ (HTTP {status}). تأكد من تحميل نموذج في LM Studio.{detail}',
    'err.empty': 'أعاد النموذج ترجمة فارغة. قد يكون لا يزال يُحمَّل — حاول مجددًا.',
    'err.timeout': 'لم يستجب النموذج خلال {sec} ثانية. قد يكون محمَّلًا بشدة أو النص/السياق طويل جدًا — جرّب تقليل نافذة السياق أو تحميل نموذج أصغر.',
    'err.generic': 'توقفت الترجمة: {msg}',
    'err.projectOpen': 'تعذّر فتح ملف المشروع.',
    'err.segNotFound': 'تعذّر العثور على ذلك المقطع.',

    'test.testing': 'جارٍ الاختبار…',
    'test.noUrl': 'أدخل رابط الواجهة المحلية أولًا.',
    'test.http': 'الخادم متاح لكنه أعاد HTTP {status}. تحقق من الرابط.',
    'test.noModel': 'تم الاتصال، لكن لا يبدو أن نموذجًا محمَّل. حمّل نموذجًا في LM Studio.',
    'test.connected': 'تم الاتصال. {count} نموذج متاح: {list}',
    'test.unreachable': 'تعذّر الوصول إلى خادم. في LM Studio، افتح Developer ← Start Server، وحمّل نموذجًا.',
    'test.failed': 'فشل اختبار الاتصال: {msg}',
  },
};

let currentLang = 'en';

function t(key, params) {
  const table = I18N[currentLang] || I18N.en;
  let str = (key in table) ? table[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
  if (params) {
    for (const k in params) str = str.split('{' + k + '}').join(params[k]);
  }
  return str;
}

// Apply translations to all tagged static elements.
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.setAttribute('placeholder', t(el.dataset.i18nPh)); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
}

function setLang(lang) {
  currentLang = (lang === 'ar') ? 'ar' : 'en';
  localStorage.setItem('lang', currentLang);
  document.documentElement.lang = currentLang;
  document.documentElement.dir = (currentLang === 'ar') ? 'rtl' : 'ltr';
  applyI18n();
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: currentLang } }));
}

function getLang() { return currentLang; }

window.t = t;
window.setLang = setLang;
window.getLang = getLang;
window.applyI18n = applyI18n;
