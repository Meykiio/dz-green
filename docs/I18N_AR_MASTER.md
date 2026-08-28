# Arabic translation master (2026-08-28)

Source: full scan of every user-facing English string in the platform (routes,
components, libs, server error messages, SEO meta, aria-labels). Companion to
`CHANGELOG.md` (48th pass → new pass when implemented). This document is the
**design**: the Arabic strings here are what get built. Owner review is the
gate — everything can be edited here before code.

## Register and rules

- **Language:** Modern Standard Arabic, warm and plain (فصحى مبسطة), the
  register of community platforms (like Houari/Annaba forums, not official
  government prose). Short sentences. No "قم بـ…" constructions, no اليتان-style
  stiff prose.
- **Numbers:** Western digits (Algeria standard). `1.5M` style numerals render
  `-٢٠٢٦`? No — keep Latin digits everywhere, they match the English UI's
  tabular-nums and Algerian reading habits.
- **Plurals:** Arabic plural rules differ by count. The UI has count phrases
  like "24 trees". A small client helper `pluralAr(n, one, two, few, many)`
  will handle: n=2 → dual form, 3–10 → plural, 11+ → singular. Until built,
  all count strings below are translated **for n=11+** (the common case on
  stats) and the code picks the right form at runtime.
- **Wilaya names:** use the existing `nameAr` data (correct, already shipped).
- **Brand:** keep "Green Algeria" in the wordmark; Arabic UI shows the tagline
  «الجزائر الخضراء». (Owner call — see Open questions.)
- **RTL:** implemented via `dir=rtl` + the existing `start`/`end` logical CSS
  (already used). Icons that imply direction (ArrowRight in flows) get a
  locale flip. `display-hero` (Manrope) has no Arabic glyphs → swap to the
  Arabic font stack in AR mode.
- **Fonts:** `@fontsource-variable/noto-sans-arabic` added self-hosted; the
  AR font stack: `"Noto Sans Arabic Variable", "Inter Variable", system-ui`.
  Hero: `"Noto Kufi Arabic Variable"` for the display treatment (kufi reads
  better at display weight for Arabic headlines).

## Glossary — fixed terms (consistent everywhere)

| Term (EN) | Arabic (fixed) | Note |
|---|---|---|
| Green Algeria | الجزائر الخضراء | Only as tagline; wordmark stays Latin |
| the map / community map | الخريطة / خريطة المجتمع | "ستبقى الخريطة حقيقية" style copy → "الخريطة" |
| planting (n) | بلاغ الغرس | Used for submissions; the event = الغرسة الغرسة |
| tree / trees | شجرة / أشجار | pluralAr handles |
| planted (date) | غُرست في | row subtitle |
| care / care log | متابعة / سجل المتابعة | Watering/checking on a site |
| watered | سُقيت | care action |
| checked on it | تابعتها | care action |
| needs attention | تحتاج إلى عناية | care action + site chip |
| fire report | بلاغ حريق | |
| report a fire | أبلغ عن حريق | CTA |
| reporter | المبلِّغ | |
| moderator | المشرف | volunteer reviewers |
| volunteer | متطوع | |
| wilaya | الولاية | |
| commune | البلدية | |
| receipt link | رابط الوصل / _ink_ | "رابط متابعة بلاغك" in copy |
| under review | قيد المراجعة | status |
| approved | مقبول | status |
| not approved / rejected | غير مقبول | status |
| active | نشط | fire status |
| resolved | معالج | fire status |
| false alarm | إنذار كاذب | fire status |
| wilaya-level | مستوى الولاية | "موقع تقريبي" when location is approximate |
| exact location | الموقع الدقيق | |
| unknown | غير معروف | wilayaName fallback |
| Protection Civile | الحماية المدنية | official; 14 / 1021 verified |
| no account needed | بدون حساب | privacy draw |
| one-way hash | بصمة أحادية الاتجاه | with a tooltip |
| reviewers | مراجعو الخريطة | alt phrasing for volunteers reviewing |
| send | أرسل | button verb; "إرسال" matches "submit" |

## Surfaces

### A. App shell / chrome (`AppShell.tsx`, `EmergencyContacts.tsx`, `__root.tsx`, `error-page.ts`)

| Key | EN | AR | Notes |
|---|---|---|---|
| nav.map | Map | الخريطة | |
| nav.plant | I planted a tree | أنا غرست شجرة | |
| nav.care | Log care | سجّل متابعة | |
| nav.fire | Report a fire | أبلغ عن حريق | |
| nav.about | About | عن المشروع | |
| nav.volunteer | Volunteer | تطوّع | |
| nav.privacy | Privacy | الخصوصية | |
| nav.terms | Terms | شروط الاستخدام | |
| nav.activity | My activity | نشاطي | |
| nav.moderate | Moderate | المراجعة | |
| nav.admin | Admin | الإدارة | |
| aria.openMenu | Open menu | فتح القائمة | |
| aria.closeMenu | Close menu | إغلاق القائمة | |
| aria.menu | Menu | القائمة | |
| aria.main | Main | الرئيسية | nav label (screen reader) |
| aria.sections | Sections | الأقسام | desktop sidebar nav |
| aria.github | GitHub repository | مستودع GitHub | |
| aria.theme.dark | Switch to dark theme | تفعيل الوضع الداكن | |
| aria.theme.light | Switch to light theme | تفعيل الوضع الفاتح | |
| auth.signout | Sign out | تسجيل الخروج | |
| auth.signin | Sign in | تسجيل الدخول | |
| emergency.label | Emergency contacts | أرقام الطوارئ | aria |
| emergency.sos | SOS · 14 | SOS · 14 | number stays Latin |
| emergency.sos.mobile | SOS | SOS | |
| emergency.heading | Call first — no dispatch here | اتصل أولًا — هذا الموقع لا يُرسِل نجدة | |
| emergency.close | Close emergency contacts | إغلاق أرقام الطوارئ | |
| emergency.protection | Protection Civile | الحماية المدنية | |
| emergency.police | Police | الشرطة | |
| emergency.gendarmerie | Gendarmerie Nationale | الدرك الوطني | |
| emergency.samu | SAMU | الإسعاف (SAMU) | |
| browser.404.heading | Page not found | الصفحة غير موجودة | |
| browser.404.body | The page you're looking for doesn't exist or has been moved. | الصفحة التي تبحث عنها غير موجودة أو تم تغيير مكانها. | |
| browser.404.home | Go home | العودة إلى البداية | |
| browser.error.heading | This page didn't load | لم تُحمَّل هذه الصفحة | in route + error-page |
| browser.error.body | Something went wrong on our end. You can try refreshing or head back home. | وقع خطأ من طرفنا. يمكنك تحديث الصفحة أو العودة إلى البداية. | |
| browser.error.retry | Try again | المحاولة مجددًا | |
| brand.tagline | (Green Algeria) | الموئل: «خريطة مجتمعية لغرس الأشجار في الجزائر» | meta tagline in AR |

### B. Home (`index.tsx`, `HeroMap.tsx`, `ViewToggle.tsx`, `Leaderboard.tsx`, `useMapRealtime.ts`, `SiteList.tsx`, `DetailPanel.tsx`)

| Key | EN | AR |
|---|---|---|
| home.title | Every tree Algeria plants, on one living map. | خريطة واحدة لكل شجرة في الجزائر | Shorter for the compact card (2 lines max in AR). About's hero keeps the same phrase. |
| home.stats | {trees} trees · {wilayas} wilayas · {thirsty} need water · {fires} active fires | {trees} شجرة · {wilayas} ولاية · {thirsty} تحتاج إلى سقاية · {fires} حريق نشط |
| home.cta.plant | I planted a tree | أنا غرست شجرة |
| home.cta.care | Log care | سجّل متابعة |
| home.cta.fire | Report a fire | أبلغ عن حريق |
| home.how | How it works | كيف تعمل الخريطة |
| home.layer.trees | Trees | أشجار |
| home.layer.care | Care | متابعة |
| home.layer.fires | Fires | حرائق |
| home.aria.showCard | Show the action card | إظهار بطاقة الإجراءات |
| home.aria.hideCard | Hide the action card | إخفاء بطاقة الإجراءات |
| home.aria.loading | Loading the map | جارٍ تحميل الخريطة |
| map.view.map | Map | الخريطة |
| map.view.list | List | القائمة |
| map.view.board | Board | لوحة الصدارة |
| board.aria | (Board = Leaderboard) | لوحة الصدارة | keep aria "Leaderboard" → «لوحة الصدارة» |
| board.heading | This month's race | سباق هذا الشهر |
| board.subtitle | {total} trees across {n} wilayas — approved plantings only. Resets on the 1st. | {total} شجرة في {n} ولاية — الغرسات المقبولة فقط. تُصفَّر في كل أول شهر. |
| board.empty | No plantings this month yet. | لا غرسات هذا الشهر بعد. |
| board.empty.cta | The first tree of the month could be yours. | الشجرة الأولى لهذا الشهر قد تكون شجرتك. |
| board.leading | Leading | في الصدارة |
| board.count | {trees} this month | {trees} هذا الشهر |
| ticker.planted | {count} trees just planted in {wilaya} | {count} غرست للتو في {wilaya} | (wilaya may follow with «ولاية» via context; grammar handled by pluralAr) |
| ticker.fire | Fire just reported in {wilaya} | بلاغ حريق للتو في {wilaya} |
| ticker.care | Trees just watered in {wilaya} | سُقيت الأشجار للتو في {wilaya} |
| map.fail.webgl.title | This browser can't draw the map | المتصفح لا يستطيع رسم الخريطة |
| map.fail.webgl.body | The map needs WebGL2 (3D graphics), which this browser or device doesn't provide. Try updating your browser or enabling hardware acceleration. | الخريطة تحتاج إلى WebGL2 (رسوميات ثلاثية الأبعاد) غير متوفرة في هذا المتصفح أو الجهاز. حدّث المتصفح أو فعّل تسريع الرسوميات. |
| map.fail.lost.title | The map lost its connection | الخريطة فقدت الاتصال |
| map.fail.lost.body | The graphics connection dropped. If it doesn't come back, reload the page. | انقطع اتصال الرسوميات. إذا لم يعد تلقائيًا، أعد تحميل الصفحة. |
| map.fail.reload | Reload map | إعادة تحميل الخريطة |
| map.aria | Interactive map of Algeria showing tree plantings, care updates and fire reports | خريطة تفاعلية للجزائر تعرض الغرسات ومتابعات الشجرة وبلاغات الحرائق |
| picker.aria | Drag the pin to the exact location | اسحب المؤشر إلى الموقع الدقيق |
| list.empty | Nothing on the map yet — be the first. | لا شيء على الخريطة بعد — كن الأول. |
| list.wilayaCount | {trees} trees · {fires} fires | {trees} شجرة · {fires} حريق | pluralAr each |
| list.planted | planted {date} | غُرست في {date} |
| list.reported | reported {date} | أُبلِغ عنها في {date} |
| list.wilayaLevel | wilaya-level | مستوى الولاية | chip — see tooltips |
| list.needsWater | Needs water | تحتاج إلى سقاية |
| detail.aria | Details | التفاصيل |
| detail.close | Close details | إغلاق التفاصيل |
| detail.alt.planting | Planting in {wilaya} | غرسة في {wilaya} |
| detail.field.wilaya | Wilaya | الولاية |
| detail.field.commune | Commune | البلدية |
| detail.field.trees | Trees | الأشجار |
| detail.field.planted | Planted | الغرس |
| detail.field.species | Species | النوع |
| detail.field.by | By | من طرف |
| detail.approx.notice | Wilaya-level location — the reporter didn't drop an exact pin, so the marker sits at the wilaya's centre, not the real spot. | الموقع على مستوى الولاية — لم يضف المبلِّغ نقطة دقيقة، لذا يوضع المؤشر في مركز الولاية وليس في المكان الحقيقي. |
| detail.thirsty | No care logged in the last 14 days — this site may need water. | لا متابعة مسجلة خلال 14 يومًا — قد تحتاج هذه الشجرة إلى سقاية. |
| detail.timeline | Care timeline | سجل المتابعة |
| detail.timeline.planted | Planted · {date} | غُرست · {date} |
| detail.timeline.empty | No care logged yet. | لا متابعة مسجلة بعد. |
| detail.careCta | Log care for this site | سجّل متابعة لهذه الموقع |
| detail.directions | Directions | الاتجاهات |
| detail.eyebrow.fire | Fire report | بلاغ حريق |
| detail.eyebrow.care | Care update | متابعة شجرة |
| detail.eyebrow.site | Planting site | موقع الغرس |
| detail.field.status | Status | الحالة | values: نشط / معالج / إنذار كاذب |
| detail.field.reported | Reported | بلاغ |
| detail.field.severity | Severity | الحجم | values: صغير / كبير |
| detail.fire.notice | Wilaya-level location — no exact pin was dropped, so the marker sits at the wilaya's centre. | الموقع على مستوى الولاية — لم تُضف نقطة دقيقة، لذا يظهر المؤشر في مركز الولاية. |
| detail.fire.disclaimer | Community report — not an emergency service. For immediate danger call Protection Civile (14) or 1021. | بلاغ مجتمعي — ليست خدمة طوارئ. في الخطر المباشر اتصل بالحماية المدنية (14) أو 1021. | NEVER soften |
| detail.fire.directions | Directions to this report | الاتجاهات إلى هذا البلاغ |
| detail.photo.prev | Selected | الصورة المختارة |
| photo.remove | Remove photo | حذف الصورة |
| photo.busy | Preparing photo… | جارٍ تجهيز الصورة… |
| photo.cta | Take or choose a photo | التقط أو اختر صورة |
| photo.error | Could not read that photo. Try another one. | تعذّر قراءة الصورة. جرّب صورة أخرى. |

### C. Form flows (`plant.tsx`, `care.tsx`, `fire.tsx`, `LocationField.tsx`, `PhotoInput.tsx`, `FormShell.tsx`, `ReceiptLink.tsx`, `PrecisionPicker.tsx`)

| Key | EN | AR |
|---|---|---|
| plant.title | Log a tree planting — Green Algeria | سجّل غرسة شجرة — الجزائر الخضراء |
| plant.desc | Add the trees you planted to Algeria's public map: photo, exact location, species and count. No account needed. | أضف الأشجار التي غرستها إلى الخريطة الوطنية: صورة، الموقع الدقيق، النوع والعدد. بدون حساب. |
| plant.done.title | Thank you — it's under review | شكرًا — بلاغك قيد المراجعة |
| plant.done.body | A volunteer moderator will approve your planting shortly. Once approved it appears on the map for everyone. | سيقوم مشرف متطوع بقبول غرسة قريبًا. بعد القبول تظهر في الخريطة للجميع. |
| plant.done.public | Public on the map: your photo, wilaya, commune, species, tree count, date and display name. Never public: your phone number, IP or device (stored only as hashes). | يظهر على الخريطة: الصورة، الولاية، البلدية، النوع، عدد الأشجار، التاريخ والاسم. لا يُعرض أبدًا: رقم الهاتف، عنوان IP أو الجهاز (تُخزَّن كبصمات فقط). |
| plant.done.back | Back to the map | العودة إلى الخريطة |
| plant.done.again | Log another | سجّل غرسة أخرى |
| plant.form.title | I planted a tree | أنا غرست شجرة |
| plant.form.subtitle | Photo and location are required so the record can be trusted. | الصورة والموقع إلزاميان حتى تكون الخريطة موثوقة. |
| plant.error.missing | Add a photo and choose a wilaya first. | أضف صورة واختر الولاية أولًا. |
| plant.photo.label | Photo of the planting | صورة الغرسة |
| plant.field.treeCount | Number of trees * | عدد الأشجار * |
| plant.field.date | Date planted * | تاريخ الغرس * |
| plant.field.species | Species (optional) | النوع (اختياري) |
| plant.field.species.placeholder | Aleppo pine, olive, eucalyptus… | صنوبر حلبي، زيتون، كالبتوس… |
| plant.field.notes | Notes (optional) | ملاحظات (اختياري) |
| plant.field.name | Your name or group (optional) | اسمك أو اسم المجموعة (اختياري) |
| plant.field.phone | Phone number (optional) | رقم الهاتف (اختياري) |
| plant.field.phone.helper | Optional, but it helps a lot — a moderator may call to verify the planting before approving it. Never public, never shared. | اختياري لكنه مفيد جدًا — قد يتصل بك مشرف للتأكد من الغرسة قبل قبولها. لا يُعرض ولا يُشارك أبدًا. |
| plant.field.phonewhy | Why we ask | لماذا نطلب رقمه |
| plant.submit | Submit planting | إرسال الغرسة |
| plant.submit.pending | Sending… | جارٍ الإرسال… |
| plant.review.note | Plantings are reviewed by volunteer moderators before appearing on the map. | تُراجع الغرسات من طرف مشرفين متطوعين قبل ظهورها في الخريطة. |
| forms.back.map | Map | الخريطة | FormShell back link + icon flips in RTL |
| care.title | Log care for a planting — Green Algeria | سجّل متابعة لغرسة — الجزائر الخضراء |
| care.desc | Watered or checked on a planting site? Log it so everyone can see which trees are still being looked after. | سقيتَ الشجرة أو تابعتَها؟ سجّل ذلك ليعرف الجميع أي الأشجار ما تزال تحت العناية. |
| care.done.title | Care logged | تم تسجيل المتابعة |
| care.done.body | Thank you — it's on the map straight away. Care logs don't need review. | شكرًا — ستظهر في الخريطة مباشرة. متابعات الشجرة لا تحتاج إلى مراجعة. |
| care.form.title | Log care | سجّل متابعة |
| care.form.subtitle | Anyone can care for any site — no ownership, no assignment. Publishes immediately. | يمكن لأي شخص متابعة أي موقع — بدون ملكية وبدون تكليف. يُنشر مباشرة. |
| care.error.noSite | Choose the site you cared for. | اختر الموقع الذي تابعته. |
| care.field.site | Site * | الموقع * |
| care.field.site.choose | Choose a planting site | اختر موقع غرسة |
| care.field.site.empty | No approved sites yet — add a planting first. | لا مواقع مقبولة بعد — أضف غرسة أولًا. |
| care.field.action | What did you do? * | ماذا فعلت؟ * |
| care.action.watered | Watered | سقيتها |
| care.action.checked | Checked on it | تابعتها |
| care.action.needs_attention | Needs attention | تحتاج عناية |
| care.action.other | Other | شيء آخر |
| care.field.date | Date * | التاريخ * |
| care.photo.label | Photo | صورة |
| care.field.notes | Notes (optional) | ملاحظات (اختياري) |
| care.field.name | Your name (optional) | اسمك (اختياري) |
| care.submit | Log care | سجّل المتابعة |
| fire.title | Report a wildfire — Green Algeria | أبلغ عن حريق — الجزائر الخضراء |
| fire.desc | Report a fire on Algeria's community map in seconds. This is not an emergency service — call Protection Civile on 14 or 1021 first. | أبلغ عن حريق على خريطة الجزائر في ثوانٍ. هذه ليست خدمة طوارئ — اتصل بالحماية المدنية على 14 أو 1021 أولًا. |
| fire.banner | **Call Protection Civile first: 14 or 1021.** Green Algeria is a community map, not an emergency service. | **اتصل بالحماية المدنية أولًا: 14 أو 1021.** الجزائر الخضراء خريطة مجتمعية، ليست خدمة طوارئ. |
| fire.done.title | Report posted | تم نشر البلاغ |
| fire.done.body | Your report is live on the map now. If there is danger to people, call Protection Civile on 14 or 1021 — this platform does not dispatch help. | بلاغك منشور على الخريطة الآن. إذا وُجد خطر على الناس اتصل بالحماية المدنية على 14 أو 1021 — هذا الموقع لا يرسل أجهزة مساعدة. |
| fire.done.public | Public on the map: location, wilaya, severity, description and photo. Never public: your name and phone number — they stay on the server, unreachable from the map. | يظهر على الخريطة: الموقع، الولاية، الحجم، الوصف والصورة. لا يُعرض أبدًا: اسمك ورقم هاتفك — يبقيان في الخادم، لا يمكن الوصول إليهما من الخريطة. |
| fire.form.title | Report a fire | أبلغ عن حريق |
| fire.form.subtitle | Just the wilaya is enough — everything else is optional. Reports publish immediately. | الولاية كافية — كل ما عداها اختياري. تُنشر البلاغات مباشرة. |
| fire.error.noWilaya | Choose a wilaya first. | اختر الولاية أولًا. |
| fire.field.severity | How big? (optional) | ما حجم الحريق؟ (اختياري) |
| fire.severity.small | Small / starting | صغير / في بدايته |
| fire.severity.large | Large / spreading | كبير / ينتشر |
| fire.field.desc | What do you see? (optional) | ماذا ترى؟ (اختياري) |
| fire.photo.label | Photo | صورة |
| fire.field.name | Your name (optional) | اسمك (اختياري) |
| fire.field.phone | Phone for moderators (optional, private) | هاتف للمشرفين (اختياري، خاص) |
| fire.field.phone.helper | Optional, but it helps a lot — a moderator may call to verify the report. Never public, never shared. | اختياري لكنه مفيد جدًا — قد يتصل بك مشرف للتحقق من البلاغ. لا يُعرض ولا يُشارك أبدًا. |
| fire.submit | Post fire report | نشر بلاغ الحريق |
| location.wilaya | Wilaya * | الولاية * |
| location.wilaya.choose | Choose a wilaya | اختر الولاية |
| location.detected | Detected from your pin — change it here if it's wrong. | حُدِّدت من مؤشرك — عدّلها هنا إذا كانت خاطئة. |
| location.commune | Commune (optional) | البلدية (اختياري) |
| location.exact | Exact location (optional) | الموقع الدقيق (اختياري) |
| location.helper | Used once, never stored. Skip it and the report is wilaya-level. | يُستعمل مرة واحدة ولا يُحفَظ. إن لم تضفه يكون البلاغ على مستوى الولاية. |
| location.use | Use my location | استخدم موقعي | + icon (LocateFixed) stays |
| location.hideMap | Hide map | إخفاء الخريطة |
| location.adjust | Adjust on map | عدّل على الخريطة |
| location.removePin | Remove pin | إزالة المؤشر |
| location.pasteLink | Or paste a Google Maps link | أو ألصق رابط خرائط Google |
| location.linkOk | Pin set from the link — adjust it below if needed. | حُدِّد المؤشر من الرابط — عدّله أسفل إذا لزم. |
| location.linkError | Couldn't read coordinates from that link. Open the place in Google Maps, copy the full URL from the address bar, and paste that. | تعذّرت قراءة الإحداثيات من الرابط. افتح المكان في خرائط Google وانسخ الرابط كاملًا من شريط العنوان ثم ألصقه. |
| location.pinAt | Pin at {lat}, {lng} | المؤشر في {lat}، {lng} |
| location.accuracy | · accuracy ±{m} m ({tone}) | · الدقة ±{m} م ({tone}) |
| location.tone.excellent | excellent | ممتازة |
| location.tone.good | good | جيدة |
| location.tone.rough | rough | تقريبية |
| location.tone.poor | poor | ضعيفة |
| location.adjustSuffix | — adjust the pin if needed | — عدّل المؤشر إذا لزم |
| receipt.heading | Save your receipt link | احفظ رابط متابعة بلاغك |
| receipt.body | No account, no email — this private link is the only way to check your submission's status later. Bookmark it or copy it somewhere safe. | بدون حساب وبدون بريد — هذا الرابط الخاص هو الطريقة الوحيدة لمعرفة حالة بلاغك لاحقًا. أضفه إلى المفضلة أو احفظه في مكان آمن. |
| receipt.copy | Copy receipt link | نسخ الرابط |
| receipt.copied | Copied. | تم النسخ. |

### D. Info + volunteer pages (`about.tsx`, `privacy.tsx`, `terms.tsx`, `volunteer.tsx`, `auth.tsx`, `my/$token.tsx`)

| Key | EN | AR |
|---|---|---|
| about.title | One map for every tree in Algeria. | خريطة واحدة لكل شجرة في الجزائر. |
| about.lead | Planting in Algeria happens everywhere and is recorded almost nowhere. … | الغرس في الجزائر يحدث في كل مكان ويُسجَّل في أي مكان تقريبًا. الجزائر الخضراء مكان مفتوح يُدار من المجتمع لتضعوا فيه كل شيء على خريطة واحدة: ما غُرس، أين غُرس، وما زال أحد يعتني به. |
| about.flow.you | **You report** — a planting, care, or a fire. No account. | **أنت تسجّل** — غرسة أو متابعة أو حريق. بدون حساب. |
| about.flow.review | **A volunteer reviews** — local moderators, per wilaya. | **متطوع يراجع** — مشرفون محليون، لكل ولاية. |
| about.flow.map | **It's on the map** — for everyone. | **تخرج في الخريطة** — للجميع. |
| about.sec.independent.title | Independent | مستقل |
| about.sec.independent.body | This platform is not affiliated with any single page, association or institution. … | هذا الموقع غير تابع لأي صفحة أو جمعية أو مؤسسة. هو ملك لكل من يغرس في الجزائر. يمكن لأي شخص أن يشارك، مع حساب أو بدونه — وكل شجرة في الخريطة تحفّز الشخص التالي على الغرس. |
| about.sec.reviewed.title | Reviewed before it's public | تُراجع قبل أن تُنشر |
| about.sec.reviewed.body | Planting submissions are reviewed by volunteer moderators in the wilaya they were reported in. … | تُراجع الغرسات من طرف مشرفين متطوعين في الولاية التي أُبلِغ عنها. وهذا ما يحفظ مصداقية عدد الأشجار. رابط متابعتك يظهر الحالة وقت تغيرها — قيد المراجعة، مقبولة أو غير مقبولة، مع ملاحظة المشرف عند وجودها. |
| about.sec.immediate.title | Care and fire are immediate | المتابعة والحرائق فورية |
| about.sec.immediate.body | Anyone can log watering or a check-up on any approved site — no ownership, no assignment. Fire reports skip review entirely and appear on the map straight away, because speed matters more than tidiness there. | يمكن لأي شخص تسجيل سقاية أو متابعة لأي موقع مقبول — بدون ملكية وبدون تكليف. بلاغات الحرائق لا تُراجع إطلاقًا وتظهر في الخريطة مباشرة، لأن السرعة هناك أهم من الترتيب. |
| about.notemergency.title | This is not an emergency service | هذه ليست خدمة طوارئ |
| about.notemergency.body | Green Algeria is a community map. Nobody is on duty here. If there is immediate danger, contact Protection Civile directly on 14 or 1021. Reporting a fire here does not send help. | الجزائر الخضراء خريطة مجتمعية. لا أحد في مهمة هنا. إذا كان هناك خطر مباشر اتصل بالحماية المدنية مباشرة على 14 أو 1021. الإبلاغ عن الحريق هنا لا يستدعي النجدة. |
| about.sec.privacy.title | Privacy, in plain terms | الخصوصية، بكلمات واضحة |
| about.sec.privacy.body | Submissions work without an account. We never store raw IP addresses — only one-way hashes used to slow down spam. Your device secret rotates daily and is never stored raw. Reporter name and phone on fire reports stay on the server, unreachable from the map. | البلاغات تعمل بدون حساب. لا نخزّن عناوين IP الخام أبدًا — فقط بصمات أحادية الاتجاه تستعمل لإبطاء البريد المزعج. سرّ جهازك يتجدد يوميًا ولا يُخزَّن أبدًا بشكل خام. اسم ورقم مبلِّغ الحرائق يبقيان في الخادم، بعيدًا عن الخريطة. |
| about.back | Back to the map | العودة إلى الخريطة |
| about.plantCta | Plant a tree | غرست شجرة |
| privacy.title | Your data, in plain terms. | بياناتك، بكلمات واضحة. |
| privacy.lead | Green Algeria collects the minimum needed to run a public map and keep it honest. This page says exactly what that is — and what it never is. | تجمع الجزائر الخضراء الحد الأدنى اللازم لعمل خريطة عامة موثوقة. هذه الصفحة توضح بالضبط ما هو هذا الحد — وما ليس منه. |
| privacy.sec.public.title | Public on the map | يظهر في الخريطة |
| privacy.sec.public.body | What you send with a planting, care log or fire report: the photo, wilaya, commune, species and tree count, dates, your display name if you add one, and the location you chose. That is the point of the platform — anyone can see it. | ما ترسله مع غرسة أو متابعة أو بلاغ: الصورة، الولاية، البلدية، النوع وعدد الأشجار، التواريخ، اسمك إن أضفته، والموقع الذي اخترته. هذا هو معنى المنصة — أي شخص يستطيع رؤيتها. |
| privacy.sec.never.title | Never public | لا يُعرض أبدًا |
| privacy.never.phone | **Your phone number** (if you add one on the plant or fire form). It exists so a moderator can call to verify a submission before approving it. It is stored server-side only — no visitor, no public API and no other user can read it, ever. It is never shared or sold. | **رقم هاتفك** (إذا أضفته في نموذج الغرس أو الحريق). وجوده فقط كي يتصل مشرف للتأكد من البلاغ قبل قبوله. يُخزَّن في الخادم فقط — لا زائر ولا واجهة عامة ولا مستخدم آخر يستطيع قراءته، أبدًا. لا يُشارك ولا يُباع. |
| privacy.never.ip | **Your IP address and device identifier.** They are stored only as one-way hashes, used to stop spam and flooding. The raw values are never written down. | **عنوان IP ومعرّف جهازك.** يُخزَّنان فقط كبصمات أحادية الاتجاه لوقف الإزعاج والغرق. القيم الخام لا تُكتب أبدًا. |
| privacy.never.email | **Your email** (only if you create an account — most people never do). Used for sign-in only. | **بريدك الإلكتروني** (فقط إن أنشأت حسابًا — ولا يفعل ذلك أغلب الناس). يُستعمل للتسجيل فقط. |
| privacy.sec.where.title | Where it lives | أين تُحفَظ |
| privacy.sec.where.body | The database runs on Supabase and the site on Vercel — your submissions may be stored on servers outside Algeria. Anonymous usage statistics (page views) are collected by Vercel Analytics; there is no advertising and no tracking across other sites. Theme and preferences stay in your own browser's local storage. | قاعدة البيانات تعمل على Supabase والموقع على Vercel — قد تُخزَّن بلاغاتك على خوادم خارج الجزائر. إحصائيات الاستخدام المجهولة (الزيارات) تجمعها Vercel Analytics؛ لا إعلانات ولا تتبع عبر مواقع أخرى. المظهر والتفضيلات تبقى في تخزين متصفحك المحلي. |
| privacy.sec.rights.title | Your rights | حقوقك |
| privacy.sec.rights.body | Under Algerian law (**Law 18-07** on personal data protection) you can ask to see, correct or delete the personal data tied to you — including a phone number you submitted. … Approved plantings stay on the public map (they are the map), but anything that identifies you personally can be removed on request. | وفقًا للقانون الجزائري (**القانون 18-07** المتعلق بحماية المعطيات ذات الطابع الشخصي) يمكنك طلب الاطلاع على بياناتك الشخصية أو تصحيحها أو حذفها — بما فيها رقم هاتف أرسلته. افتح إشكالاً في GitHub واذكر ما تحتاجه. الغرسات المقبولة تبقى على الخريطة (هي الخريطة)، لكن كل ما يدل عليك شخصيًا يمكن حذفه عند الطلب. | use "فتح إشكالاً" (issue) with the GitHub link |
| privacy.sec.who.title | Who runs this | من يدير هذا |
| privacy.sec.who.body | Green Algeria is a community project run by Sifeddine Mebarki (Meykiio), Algiers — not a company, not a government body. … | الجزائر الخضراء مشروع مجتمعي يديره سيف الدين مباركي (ميكيو)، الجزائر العاصمة — ليست شركة وليست هيئة حكومية. أسئلتك حول هذه الصفحة: رابط GitHub نفسه. اطلع أيضًا على **شروط الاستخدام**. |
| privacy.termsLink | terms of use | شروط الاستخدام |
| terms.intro | The deal, plainly. | الاتفاق، بوضوح. |
| terms.lead | Green Algeria is a community-run map. Using it means accepting a few simple rules that keep the map trustworthy. | الجزائر الخضراء خريطة يديرها المجتمع. استخدامها يعني قبول بضع قواعد بسيطة تحافظ على مصداقية الخريطة. |
| terms.sec.honest.title | Honest submissions | بلاغات صادقة |
| terms.sec.honest.body | Only report what is real: plantings that happened, care you actually gave, fires you actually see. Fake or abusive submissions are rejected, and the abuse gate limits repeat flooding. What you post is public — post accordingly. | بلّغ عمّا هو حقيقي فقط: غرسات جرت فعلاً، متابعة قدمتها فعلاً، حرائق تراها فعلاً. البلاغات المزيفة أو المسيئة تُرفض، وبوابة الحماية تحدّ من تكرار الغرق. ما تنشره عام — فانشره على هذا الأساس. |
| terms.sec.moderate.title | Volunteer moderation | مراجعة المتطوعين |
| terms.sec.moderate.body | Plantings are reviewed by volunteer moderators before they appear. They can approve, reject, and leave a note (visible on your receipt link). Their call keeps the counts honest; it is not a government certification of anything. | تُراجع الغرسات من طرف مشرفين متطوعين قبل ظهورها. يمكنهم قبول أو رفض أو ترك ملاحظة (تظهر في رابط متابعة بلاغك). قرارهم يحفظ مصداقية الأعداد؛ وهو ليس تصديقًا حكوميًا لأي شيء. |
| terms.sec.emergency.title | Not an emergency service | ليست خدمة طوارئ |
| terms.sec.emergency.body | Fire reports on this map are community information, nothing more. **In any danger, call Protection Civile on 14 or 1021 first.** This platform does not dispatch help, does not alert authorities, and must never be your only call for help. | بلاغات الحرائق في هذا الخريطة معلومات مجتمعية، لا أكثر. **في أي خطر اتصل أولاً بالحماية المدنية على 14 أو 1021.** هذا الموقع لا يرسل النجدة ولا ينبّه السلطات، ولا يجب أن يكون أبدًا وسيلة مساعدتك الوحيدة. |
| terms.sec.warranty.title | No warranty | بدون ضمان |
| terms.sec.warranty.body | The map is built from community submissions — it can be incomplete, wrong, or out of date. Do not rely on it for safety, travel, or legal decisions. The platform is provided as is, run by volunteers, with no guarantee of availability. Your photos stay yours; by posting you allow the project to display them on the map. The code is open source under AGPL-3.0. | الخريطة مبنية من بلاغات المجتمع — يمكن أن تكون ناقصة أو خاطئة أو قديمة. لا تعتمد عليها لأمور السلامة أو السفر أو قرارات قانونية. المنصة تُقدَّم كما هي، يديرها متطوعون، بدون ضمان توفر. الصور تبقى ملكك؛ وبنشرك لها تسمح للمشروع بعرضها على الخريطة. الشيفرة مفتوحة المصدر برخصة AGPL-3.0. |
| terms.questions | Questions: open an issue on GitHub. Also read the privacy page. | أسئلتك: افتح إشكالاً في GitHub. اطلع أيضًا على **صفحة الخصوصية**. |
| volunteer.title | Volunteer for your wilaya — Green Algeria | تطوّع لولايتك — الجزائر الخضراء |
| volunteer.hero | Every green dot starts with a person. | كل نقطة خضراء تبدأ بشخص. |
| volunteer.lead | Plantings are being reported, trees are being watered, and — these days, hard days — fires are being watched. The map is only as true as the people who keep it. We're building a small local team in every wilaya, and we're looking for people like you. | تُبلَّغ الغرسات ويُروى الشجر و— في هذه الأيام الصعبة — تُراقب الحرائق. الخريطة لا تُصدَّق إلا بقدر صدق الناس الذين يحمونها. نبني فريقًا محليًا صغيرًا في كل ولاية، ونبحث عن أمثالك. |
| volunteer.what.title | What volunteers do | ماذا يفعل المتطوعون |
| volunteer.what.review | **Review plantings.** A few minutes a week: does this photo show what people say it does? | **يراجعون الغرسات.** بضع دقائق في الأسبوع: هل هذه الصورة تظهر فعلاً ما ذكرَه الناس؟ |
| volunteer.what.triage | **Triage fire reports.** Verify, mark resolved, flag false alarms — so the community map stays useful. | **يعالجون بلاغات الحرائق.** تحقق، وضع علامة معالج، وميّز الإنذارات الكاذبة — حفاظًا على فائدة الخريطة. |
| volunteer.what.rally | **Rally your area.** Tell your neighbors, your association, your city. The map grows by word of mouth. | **يحشدون منطقتهم.** أخبر جيرانك وجمعيتك ومدينتك. الخريطة تنمو بالكلمة. |
| volunteer.ask.title | What we ask | ماذا نطلب |
| volunteer.ask.body | Honesty and a few minutes, a few times a week. No experience needed — we'll walk you through the tool together. | الصدق وبضع دقائق مرات قليلة في الأسبوع. لا خبرة مطلوبة — سنشرح لك الأداة معًا. |
| volunteer.never.title | What we never ask | ما لا نطلبه أبدًا |
| volunteer.never.body | Money, equipment, or firefighting. We are a community map, not an emergency service — in danger, call Protection Civile on **14 or 1021** first. | المال أو المعدات أو إطفاء الحرائق. نحن خريطة مجتمعية، ليست خدمة طوارئ — في الخطر اتصل بالحماية المدنية على **14 أو 1021** أولاً. |
| volunteer.form.title | Tell us about yourself | عرّفنا بنفسك |
| volunteer.form.lead | A short form. We read every one, and we'll answer by email or WhatsApp — that's the only way we contact you. | نموذج قصير. نقرؤها كلها، ونرد عليك بالبريد أو عبر واتساب — الطريقة الوحيدة للتواصل معك. |
| volunteer.field.name | Your name * | اسمك * |
| volunteer.field.email | Email * | البريد الإلكتروني * |
| volunteer.field.email.ph | you@example.com | you@example.com |
| volunteer.field.phone | Phone / WhatsApp (so we can reach you quickly) | الهاتف / واتساب (حتى نصل إليك بسرعة) |
| volunteer.field.wilaya | Your wilaya * | ولايتك * |
| volunteer.field.extra | Also happy to help elsewhere? | مستعد للمساعدة في ولاية أخرى؟ |
| volunteer.field.extra.ph | e.g. Als also neighboring wilayas | مثل: ولاية مجاورة مثل البويرة | also fixes the "Als" typo |
| volunteer.field.intents | I can help with (pick any) * | أستطيع المساعدة في (اختر ما تشاء) * |
| volunteer.intent.review | Review plantings | مراجعة الغرسات |
| volunteer.intent.triage | Triage fire reports | معالجة بلاغات الحرائق |
| volunteer.intent.organize | Rally my area | حشد منطقتي |
| volunteer.intent.share | Spread the word | نشر الخبر |
| volunteer.intent.other | Other | شيء آخر |
| volunteer.field.time | How much time do you have? | كم من الوقت لديك؟ |
| volunteer.field.time.ph | e.g. 10 minutes, a few evenings a week | مثل: 10 دقائق، مساءً مرات في الأسبوع |
| volunteer.field.msg | Anything you want us to know? | أي شيء تريد أن نعرفه؟ |
| volunteer.field.msg.ph | Your town, your group, your motivation — anything | مدينتك، جمعيتك، دافعك — آي ما كان |
| volunteer.field.priv | This form goes straight to the maintainers. Your details stay private — they are read only by us, never shown on the map. | هذا النموذج يصل مباشرة إلى القائمين على المشروع. تفاصيلك تبقى خاصة — نقرؤها نحن فقط، ولا تظهر أبدًا في الخريطة. |
| volunteer.submit | Send my offer to help | أرسل عرضي للمساعدة |
| volunteer.done.title | Thank you — we've got it. | شكرًا — وصلنا. |
| volunteer.done.body | We read every application and we'll reach out by email or WhatsApp. Until then, the best help is a true report: keep using the map. | نقرأ كل طلب وسنتواصل معك بالبريد أو واتساب. حتى ذلك الحين، أفضل مساعدة هي بلاغ صادق: تابع استخدام الخريطة. |
| auth.meta.title | Moderator sign in — Green Algeria | تسجيل دخول المشرفين — الجزائر الخضراء |
| auth.meta.desc | Sign in to review planting submissions... | سجّل الدخول لمراجعة بلاغات الغرس في الجزائر الخضراء. المساهمة في الخريطة لا تتطلب حسابًا أبدًا. |
| auth.title.signin | Sign in | تسجيل الدخول |
| auth.title.signup | Create an account | إنشاء حساب |
| auth.lead | Accounts are only for moderators and for keeping track of your own contributions. Planting, care and fire reports work without one. | الحسابات فقط للمشرفين ولتتبع مساهماتك الشخصية. بلاغات الغرس والمتابعة والحرائق تعمل بدونها. |
| auth.email | Email | البريد الإلكتروني |
| auth.password | Password | كلمة المرور |
| auth.cta.wait | Please wait… | لحظة من فضلك… |
| auth.cta.signin | Sign in | الدخول |
| auth.cta.signup | Create account | إنشاء الحساب |
| auth.toggle.toSignup | Need an account? Sign up | تحتاج حسابًا؟ سجّل |
| auth.toggle.toSignin | Already have an account? Sign in | لديك حساب؟ ادخل |
| auth.toast.signupOk | Account created. You can sign in now. | تم إنشاء الحساب. يمكنك التسجيل الآن. |
| auth.toast.error | Something went wrong. | وقع خطأ ما. |
| receipt.eyebrow | Receipt | وصل البلاغ |
| receipt.heading | Your submission | بلاغك |
| receipt.checking | Checking… | جارٍ التحقق… |
| receipt.notfound.title | This link doesn't match any submission | هذا الرابط لا يطابق أي بلاغ |
| receipt.notfound.body | Receipt links are shown once, right after you submit. … | تظهر روابط المتابعة مرة واحدة فقط، مباشرة بعد الإرسال. تأكد من الرابط — إن ضاع فلا طريقة لاستعادته (لا يمكننا معرفة أي بلاغ لك، وهذا مقصود). |
| receipt.status.pending | Under review | قيد المراجعة |
| receipt.status.approved | Approved — on the map | مقبول — في الخريطة |
| receipt.status.rejected | Not approved | غير مقبول |
| receipt.status.published | Published on the map | منشور في الخريطة |
| receipt.status.active | Active | نشط |
| receipt.status.resolved | Resolved | معالج |
| receipt.status.false_alarm | Marked as false alarm | مُيّز كإنذار كاذب |
| receipt.dateSubmitted | Submitted {date} • {wilaya} | أُرسِل في {date} • {wilaya} |
| receipt.pending.msg | A volunteer moderator will review it shortly. Check this page again later — it updates on its own. | سيراجعه مشرف متطوع قريبًا. عُد إلى هذه الصفحة لاحقًا — تتحدث تلقائيًا. |
| receipt.approved.msg | It's live. Thank you — every tree on the map nudges the next person to plant one. | أصبح ظاهرًا. شكرًا — كل شجرة في الخريطة تحفز الشخص التالي على الغرس. |

### E. Moderation + user dashboards (`moderate.tsx`, `PendingQueue.tsx`, `FireTriage.tsx`, `ContactReveal.tsx`, `StatusBadge.tsx`-context, `activity.tsx`, `admin.tsx`, `AdminOverview.tsx`, `FeedbackPanel.tsx`, `VolunteerPanel.tsx`, `AssignWilayasDialog.tsx`)

| Key | EN | AR |
|---|---|---|
| mod.meta.title | Moderation — Green Algeria | المراجعة — الجزائر الخضراء |
| mod.meta.desc | Review pending plantings and triage fire reports. | راجع الغرسات المنتظرة وبلاغات الحرائق. |
| mod.section.queue | Pending plantings | الغرسات المنتظرة |
| mod.section.fires | Fire reports | بلاغات الحرائق |
| mod.stat.pending | Pending | منتظرة |
| mod.stat.approvedToday | Approved today | مقبول اليوم |
| mod.stat.activeFires | Active fires | حرائق نشطة |
| mod.stat.total | Total submissions | مجموع البلاغات |
| mod.tabs.pending | Pending plantings | الغرسات المنتظرة |
| mod.tabs.fires | Fire reports | بلاغات الحرائق |
| mod.tabs.aria | Moderation sections | أقسام المراجعة |
| queue.loading | Loading queue… | جارٍ تحميل القائمة… |
| queue.error | Couldn't load the queue — check your connection and refresh. | تعذّر تحميل القائمة — تحقق من الاتصال وحدّث الصفحة. |
| queue.empty | Nothing waiting. The queue is clear. | لا شيء منتظر. القائمة فارغة. |
| queue.trees | {count} trees | {count} شجرة |
| queue.submitted | submitted {dateTime} | أُرسِل {dateTime} |
| queue.note.label | Moderator note (optional — recommended when rejecting) | ملاحظة المشرف (اختياري — يُنصح بها عند الرفض) |
| queue.note.ph | Why this was approved or rejected | لماذا قُبل هذا أو رُفض |
| queue.approve | Approve | قبول |
| queue.reject | Reject | رفض |
| triage.status.active | Active | نشط |
| triage.status.resolved | Resolved | معالج |
| triage.status.false_alarm | False alarm | إنذار كاذب |
| triage.loading | Loading fire reports… | جارٍ تحميل بلاغات الحرائق… |
| triage.error | Couldn't load fire reports — check your connection and refresh. | تعذّر تحميل بلاغات الحرائق — تحقق من الاتصال وحدّث الصفحة. |
| triage.empty | No fire reports yet. | لا بلاغات حرائق بعد. |
| triage.reported | Reported {dateTime} | أُبلِغ في {dateTime} |
| triage.severity.large | Large | كبير |
| triage.severity.small | Small | صغير |
| triage.resolvedAt | Resolved on {dateTime} | عولج في {dateTime} |
| triage.falseAt | Marked false alarm on {dateTime} | مُيّز كإنذار كاذب في {dateTime} |
| triage.btn.resolve | Mark resolved | وسم معالج |
| triage.btn.false | False alarm | إنذار كاذب |
| triage.btn.reopen | Reopen | إعادة فتح |
| contact.error | Could not load the contact. | تعذّر تحميل بيانات الاتصال. |
| contact.loading | Loading… | جارٍ التحميل… |
| contact.show | Show contact | إظهار الاتصال |
| contact.none | No contact info left by the submitter. | لم يُترك رقم اتصال من طرف المبلِّغ. |
| contact.prefix | Contact: | الاتصال: |
| act.meta.title | My activity — Green Algeria | نشاطي — الجزائر الخضراء |
| act.heading | Everything you've added to the map | كل ما أضفته إلى الخريطة |
| act.lead | Your plantings, care logs and fire reports — including the ones still in review. | غرساتك ومتابعاتك وبلاغات الحرائق — بما فيها التي ما تزال قيد المراجعة. |
| act.error | Couldn't load your activity — check your connection and refresh. | تعذّر تحميل نشاطك — تحقق من الاتصال وحدّث الصفحة. |
| act.section.plantings | Plantings | الغرسات |
| act.section.care | Care logs | متابعات الشجرة |
| act.section.fires | Fire reports | بلاغات الحرائق |
| act.empty.plantings | No plantings yet. | لا غرسات بعد. |
| act.empty.care | No care logged yet. | لا متابعة بعد. |
| act.empty.fires | No fire reports. | لا بلاغات حرائق. |
| act.cta.plant | Plant your first tree | أضف أول شجرة |
| act.cta.care | Log care for a site | سجّل متابعة |
| act.cta.fire | Report a fire | أبلغ عن حريق |
| act.row.rejected | Moderator note: {note} | ملاحظة المشرف: {note} |
| act.status.pending | Under review | قيد المراجعة |
| act.status.approved | On the map | في الخريطة |
| act.status.rejected | Not approved | غير مقبول |
| act.care.watered | Watered | سقيتها |
| act.care.checked | Checked on it | تابعتها |
| act.care.needs_attention | Reported needs attention | أبلغ أني تحتاج عناية |
| act.care.other | Update | تحديث |
| adm.role.admin | Admin | الإدارة |
| adm.role.moderator | Moderator | مشرف |
| adm.toast.roleUpdated | Role updated | تم تحديث الدور |
| adm.toast.signedOut | User signed out | تم تسجيل خروج المستخدم |
| adm.loading | Checking your access… | جارٍ التحقق من صلاحياتك… |
| adm.heading.overview | Overview | نظرة عامة |
| adm.heading.volunteers | Volunteers | المتطوعون |
| adm.heading.feedback | Feedback | الملاحظات |
| adm.heading.roles | Moderators & roles | المشرفون والأدوار |
| adm.err.users | Couldn't load the user list — refresh to try again. | تعذّر تحميل قائمة المستخدمين — حدّث للاستعادة. |
| adm.loading.users | Loading users… | جارٍ تحميل المستخدمين… |
| adm.user.noName | No display name | بدون اسم ظاهر |
| adm.roles.wilayas | · {n} wilayas: {names} | · {n} ولايات: {names} |
| adm.roles.noWilayas | · no wilayas assigned yet | · لم تُسند ولايات بعد |
| adm.roles.noRole | No role | بدون دور |
| adm.btn.makeAdmin | Make admin | جعل إداريًا |
| adm.btn.makeModerator | Make moderator | جعل مشرفًا |
| adm.btn.assignWilayas | Assign wilayas | إسناد ولايات |
| adm.btn.removeRole | Remove role | إزالة الدور |
| adm.users.empty | No users yet. | لا مستخدمين بعد. |
| adm.volunteers.lead | People who offered to help their wilaya. When the time comes, create their account match and assign a role under "Moderators & roles". | أشخاص عرضوا مساعدة ولاياتهم. عند الحاجة أنشئ حسابهم وُطابقه مع طلبهم وأسند دورًا في «المشرفون والأدوار». |
| adm.feedback.lead | Messages from the Feedback button, newest first. | رسائل زر «الملاحظات»، أحدثها أولًا. |
| adm.roles.lead | Admins control everything. Moderators act only inside their assigned wilayas. | الإداريون يتحكمون في كل شيء. المشرفون يتصرفون فقط داخل الولايات المسندة إليهم. |
| ovr.loading | Loading platform stats… | جارٍ تحميل إحصائيات المنصة… |
| ovr.error | Couldn't load platform stats — refresh to try again. | تعذّر تحميل الإحصائيات — حدّث للاستعادة. |
| ovr.stat.users | Users | المستخدمون |
| ovr.stat.pending | Pending | منتظر |
| ovr.stat.approved | Approved | مقبول |
| ovr.stat.activeFires | Active fires | حرائق نشطة |
| ovr.stat.care | Care logs | متابعات |
| ovr.stat.submissions | Submissions (24h) | بلاغات (24 س) |
| ovr.wilayas | Wilaya oversight | متابعة الولايات |
| ovr.empty | Nothing pending anywhere — every queue is clear. | لا شيء منتظر في كل الولايات — القوائم فارغة. |
| ovr.wilaya.pending | {n} pending | {n} منتظر |
| ovr.wilaya.fires | {n} active fire(s) | {n} حريق نشط |
| fb.loading | Loading feedback… | جارٍ تحميل الملاحظات… |
| fb.error | Couldn't load feedback — refresh to try again. | تعذّر تحميل الملاحظات — حدّث للاستعادة. |
| fb.empty | No feedback yet. | لا ملاحظات بعد. |
| fb.kind.bug | Bug | خلل |
| fb.kind.idea | Idea | فكرة |
| fb.kind.other | Other | أخرى |
| fb.origin | · from {page} | · من {page} |
| vol.status.new | New | جديد |
| vol.status.contacted | Contacted | تم التواصل |
| vol.status.onboarded | Onboarded | تم استيعابه |
| vol.intent.review | Review plantings | مراجعة الغرسات |
| vol.intent.triage | Triage fire reports | معالجة بلاغات الحرائق |
| vol.intent.organize | Rally my area | حشد منطقتي |
| vol.intent.share | Spread the word | نشر الخبر |
| vol.loading | Loading volunteers… | جارٍ تحميل المتطوعين… |
| vol.error | Couldn't load volunteers — refresh to try again. | تعذّر تحميل المتطوعين — حدّث للاستعادة. |
| vol.empty | No volunteers yet. Share the volunteer page — it takes a minute. | لا متطوعين بعد. شارك صفحة التطوع — دقيقة واحدة تكفي. |
| vol.applied | · applied {date} | · أرسل في {date} |
| vol.aria.status | Volunteer status | وضع المتطوع |
| vol.also | Also: {extra} | أيضًا: {extra} |
| vol.time | Time: {availability} | الوقت: {availability} |
| vol.onboard.hint | To onboard: make sure the person has an account, then assign the moderator role + wilaya in "Moderators & roles". | للاستيعاب: تأكد أن الشخص لديه حساب، ثم أسند دور المشرف + الولاية في «المشرفون والأدوار». |
| assign.title | Assign wilayas — {name} | إسناد ولايات — {name} |
| assign.desc | This moderator reviews submissions only in the selected wilayas. New wilayas share their historic parent's territory. | يراجع هذا المشرف بلاغات الولايات المحددة فقط. الولايات الجديدة تشارك إقليم الولاية الأم التاريخية. |
| assign.cancel | Cancel | إلغاء |
| assign.save | Save | حفظ |
| assign.toast | Wilayas updated | تم تحديث الولاية |

### F. Feedback dialog + toasts + server error messages + offline

| Key | EN | AR |
|---|---|---|
| feedback.aria | Send feedback | إرسال ملاحظة |
| feedback.label | Feedback | ملاحظة |
| feedback.desc | Found a bug, want a feature, or just have something to say? Say it plainly — it goes straight to the maintainers. | وجدت خللًا، تريد ميزة، أو عندك شيء تقوله؟ قله ببساطة — يصل مباشرة إلى القائمين على المشروع. |
| feedback.kind | Feedback type | نوع الملاحظة |
| feedback.ph | Your message… | رسالتك… |
| feedback.cta | Send | إرسال |
| feedback.cta.pending | Sending… | جارٍ الإرسال… |
| feedback.toast.ok | Received — thanks. Every message is read. | وصلت — شكرًا. كل رسالة تُقرأ. |
| toast.genericError | Could not submit. Try again. | تعذّر الإرسال. أعد المحاولة. |
| offline.queued | You're offline — we'll send this as soon as you reconnect. | أنت غير متصل — سنرسل بلاغك فور عودة الاتصال. |
| offline.sent | Your submission was sent. | تم إرسال بلاغك. |
| offline.failed | Could not send your submission. Please try again. | تعذّر إرسال بلاغك. أعد المحاولة من فضلك. |
| err.futureDate | Date can't be in the future. | التاريخ لا يمكن أن يكون في المستقبل. |
| err.locPair | Location needs both latitude and longitude, or neither. | الموقع يحتاج خط العرض وخط الطول معًا، أو لا شيء. |
| err.generic | Something went wrong. Please try again. | وقع خطأ ما. أعد المحاولة من فضلك. |
| err.outsideAlgeria | That location isn't inside a mapped wilaya. Please move the pin onto Algeria. | هذا الموقع خارج الولايات المعروفة في الخريطة. انقل المؤشر إلى داخل الجزائر. |
| err.badWilaya | Choose a valid wilaya. | اختر ولاية صحيحة. |
| err.siteUnavailable | That planting site is not available yet. | موقع الغرسة هذا غير متاح بعد. |
| err.tooFast | That was too fast — please try again. | هذا سريع جدًا — أعد المحاولة من فضلك. |
| err.rateLimit | You've sent a lot of reports in the last hour. Please try again later. | أرسلت الكثير من البلاغات في الساعة الأخيرة. أعد المحاولة لاحقًا. |
| err.deviceLimit | Too many submissions from this device. Please try again later. | بلاغات كثيرة من هذا الجهاز. أعد المحاولة لاحقًا. |
| err.imgUnsupported | Unsupported image format. | صيغة الصورة غير مدعومة. |
| err.imgTooLarge | Photo is too large. | الصورة كبيرة جدًا. |
| err.imgSave | Could not save the photo. Please try again. | تعذّر حفظ الصورة. أعد المحاولة. |
| err.feedbackSave | Could not save feedback. Try again. | تعذّر حفظ الملاحظة. أعد المحاولة. |
| err.volunteerSave | Could not send your application. Try again. | تعذّر إرسال طلبك. أعد المحاولة. |
| err.requireAdmin | You need administrator access to do that. | تحتاج صلاحيات الإدارة للقيام بهذا. |
| err.notModerator | That user is not a moderator. | هذا المستخدم ليس مشرفًا. |
| err.needSignin | Sign in to see your activity. | سجّل الدخول لرؤية نشاطك. |

### G. SEO (head meta — server-rendered per locale)

| EN | AR |
|---|---|
| Green Algeria — the live map of Algeria's tree planting | الجزائر الخضراء — خريطة حيّة لغرس الأشجار في الجزائر |
| See every tree planted across Algeria's 58 wilayas, log care for sites near you, and report wildfires on one community-run map. | شاهد كل شجرة غُرست في ولايات الجزائر الـ58، سجّل متابعة الشجر القريب منك، وأبلغ عن الحرائق — على خريطة مجتمعية واحدة. |
| About Green Algeria — a community map, not an emergency service | عن الجزائر الخضراء — خريطة مجتمعية، ليست خدمة طوارئ |
| How Green Algeria works: open planting records reviewed before publishing, immediate care logs and fire reports, run by the community for the whole country. | كيف تعمل الجزائر الخضراء: سجلات غرس مفتوحة تُراجع قبل النشر، متابعة وبلاغات حرائق فورية، يديرها المجتمع لكل البلاد. |
| Privacy — Green Algeria | الخصوصية — الجزائر الخضراء |
| What Green Algeria collects, why, what is public, and what never is. Plain language, no legal fog. | ماذا تجمع الجزائر الخضراء ولماذا، وما يظهر وما لا يظهر أبدًا. بلغة واضحة، بدون غموض قانوني. |
| Terms of use — Green Algeria | شروط الاستخدام — الجزائر الخضراء |
| The rules of the community map: honest submissions, volunteer moderation, and why this is not an emergency service. | قواعد الخريطة المجتمعة: بلاغات صادقة، مراجعة متطوعين، وسبب أن هذا ليس خدمة طوارئ. (نوع: مجتمعة) |
| Volunteer for your wilaya — Green Algeria | تطوّع لولايتك — الجزائر الخضراء |
| Help your wilaya keep the map honest, fast and alive: review plantings, triage fire reports, rally your neighbors. | ساعد ولايتك على إبقاء الخريطة صادقة وحيّة: راجع الغرسات، عالج بلاغات الحرائق، وحشد جيرانك. |
| Log a tree planting — Green Algeria | سجّل غرسة شجرة — الجزائر الخضراء |
| Log care for a planting — Green Algeria | سجّل متابعة لغرسة — الجزائر الخضراء |
| Report a wildfire — Green Algeria | أبلغ عن حريق — الجزائر الخضراء |
| Your submission — Green Algeria | بلاغك — الجزائر الخضراء |
| Moderator sign in — Green Algeria | تسجيل دخول المشرفين — الجزائر الخضراء |
| Admin — Green Algeria | الإدارة — الجزائر الخضراء |
| My activity — Green Algeria | نشاطي — الجزائر الخضراء |
| Moderation — Green Algeria | المراجعة — الجزائر الخضراء |
| 404 / This page didn't load | الصفحة غير موجودة / لم تُحمَّل هذه الصفحة |

## Tooltips to add (owner asked: hard-to-understand → tooltip)

React: hovering (desktop) or tap-hold (mobile). Radix tooltip is already a dependency.

| Target | EN tooltip | AR tooltip | Where |
|---|---|---|---|
| Legend dot "Trees/Care/Fires" (mobile, text hidden) | "Show/hide trees · plantings" | «إظهار/إخفاء الأشجار · الغرسات» | home legend pill |
| "wilaya-level" badge | "The reporter didn't pin an exact spot — this marker sits at the wilaya's centre." | «لم يحدد المبلِّغ نقطة دقيقة — يظهر المؤشر في مركز الولاية.» | SiteList rows, DetailPanel, queue, activity |
| "Needs water" chip | "No care logged for this site in the last 14 days." | «لا متابعة مسجلة لهذا الموقع خلال آخر 14 يومًا.» | SiteList, home stat |
| Board/Leaderboard toggle | "Monthly wilaya race — approved plantings are summed per wilaya, reset on the 1st." | «سباق ولايات شهري — تجمع الغرسات المقبولة لكل ولاية، ويُصفَّر كل أول شهر.» | ViewToggle |
| "active fires" stat | "Fire reports currently marked active, not yet resolved." | «بلاغات حرائق مرمَّزة ك‍"نشط" ولم تُعالج بعد.» | home stat line |
| "One-way hash" (privacy page) | "A one-way fingerprint: it can check that a report came from this device, but it can never be turned back into your IP/device ID." | «بصمة أحادية الاتجاه: تتيح القول أن بلاغًا جاء من جهازك، لكن لا يمكن إرجاعها أبدًا إلى عنوان IP أو معرّف جهازك.» | privacy/about |
| "severity: Small/Large" | "Small: smoke or a small patch. Large: flames or smoke spreading." | «صغير: دخان أو بقعة صغيرة. كبير: ألسنة اللهب أو دخان ينتشر.» | DetailPanel fire, fire form chips |
| "Under review" badge | "A volunteer moderator hasn't decided yet — check back later." | «لم يبت المشرف المتطوع بعد — عُد لاحقًا.» | receipt, activity, queue badges |
| "Moderator note" field | "Moderators write why they approved or rejected — this is shown to the submitter." | «يكتب المشرف سبب القبول أو الرفض — ويظهر للمُرسل.» | PendingQueue |
| ReceiptLink copy button | "Save this link in your browser bookmarks." | «احفظ هذا الرابط في مفضلة متصفحك.» | ReceiptLink |
| "Remove pin" | "Remove the exact location — the report becomes wilaya-level." | «إزالة الموقع الدقيق — يصبح البلاغ على مستوى الولاية.» | LocationField |
| "Use my location" | "Uses your phone's/GPS best fix. Only sent to the server once — never stored." | «يستعمل أحدث تحديد GPS لجهازك. يُرسل للخادم مرة واحدة — ولا يُخزَّن.» | LocationField |
| Send feedback pill (mobile) | "Found a bug? Tell the maintainers." | «وجدت خللًا؟ أخبر القائمين على المشروع.» | AppShell |

## Open questions for Mekhi

**RESOLVED 2026-08-28** — Arabic default ✅; brand switches to «الجزائر الخضراء» in AR mode ✅ (Latin wordmark in EN); wilaya names in Arabic in AR mode ✅. Question 4 stays open forever: anything in this table that reads wrong to you — mark it and it gets fixed in one place (the dict), not across files.

---

## Implementation plan (after approval)

1. `src/i18n/` — typed dictionary `ar.ts` (keys above), `en.ts` (existing strings moved), `useLocale()` + `setLocale()` storing `ga-locale` in localStorage + cookie for SSR head, `<html lang dir>` in `__root.tsx`, font stacks (add `@fontsource-variable/noto-sans-arabic` + Noto Kufi for display), `pluralAr` helper.
2. Migrate components to `t()` — one PR per surface (chrome, home, forms, info, moderation/admin, errors/meta), each verified headless + tsc + build before the next.
3. Tooltips pass (Radix — already installed).
4. RTL pass: swap directional icons, verify chart/arrow alignment, map attribution stays LTR; test both themes + mobile.
5. Docs: CHANGELOG new pass, FEATURES (i18n section), PROJECT_STRUCTURE (i18n files), DATABASE untouched (no schema change).
