# QControl — المرجع الشامل للبيزنس والـ API

## Full Business Reference - As-Is

مرجع موحد لفهم الموديولات، القواعد المؤكدة، العلاقات، دورة الحياة، الصلاحيات، والـ Endpoints وتأثير كل عملية على البيزنس.

### نطاق هذه النسخة

تمت مراجعة آخر Dump Source متاح بتاريخ **20 أغسطس 2026** الساعة **14:21**، ويحتوي حالياً على **19 Controller** و **126 API action** موثقة مباشرة. كما يتضمن المرجع قرارات Business مؤكدة من مراحل المشروع السابقة، مع فصل أي نقطة لم تعد ظاهرة في آخر Snapshot أو لم يكتمل تنفيذها.

**تاريخ إعداد المرجع:** 23 أغسطس 2026

> هذا المستند Reference Functional/Business؛ لا يحتوي على كود تنفيذ، ولا يفترض Workflow غير معتمد.

---

## كيفية قراءة هذا المرجع

المرجع يفرق بين ثلاثة مستويات حتى لا تختلط النية التصميمية بالمنفذ فعلياً:

1. **موثق في آخر Snapshot Source**: يمكن تتبع الـ Handler/Entity/Controller أو الاختبارات داخل النسخة الحالية.
2. **Business مؤكد من مرحلة سابقة**: قاعدة تم اعتمادها وتنفيذها في Snapshot سابق، لكن قد لا تكون ملفاتها ظاهرة في آخر Dump؛ يتم التنبيه عليها بدل افتراض أنها ما زالت مدمجة.
3. **غير منفذ أو غير محسوم**: جزء من نطاق Management/Queue الأوسع لكنه لا يملك Business Flow نهائية معتمدة؛ لا يتم اختراع Endpoints أو حالات له.

### مبدأ مهم

وجود Field أو Flag في قاعدة البيانات لا يعني تلقائياً وجود Runtime Flow مكتمل. مثل `HasReservation` أو `EnableDirectCall` أو `Priority`: هذه إعدادات قدرات، ولا نحولها إلى Workflow كامل إلا إذا كانت قواعد التشغيل والـ Endpoints مؤكدة.

### الخريطة التنفيذية الحالية

| المؤشر | القيمة | المعنى |
|---|---|---|
| Snapshot Source | 20-08-2026 14:21 | آخر dump تمت مراجعته لهذا المرجع. |
| Controllers | 19 | واجهات API حالية موزعة على الموديولات. |
| API actions | 126 | عدد actions الموثقة مباشرة في آخر snapshot. |
| Public runtime routes | 3 مؤكدة | Ticket-issuable services + Display runtime configuration + Display runtime playlist. |
| Business model | Modular Monolith | الموديولات لها حدود واضحة مع الحفاظ على نفس الـ Architecture Clean الحالية. |

### الخريطة الكبرى للنظام

يمكن قراءة QControl حالياً كسلسلتين رئيسيتين مترابطتين: سلسلة إعداد الفرع والخدمات، وسلسلة عرض المحتوى على الـ Runtime. Calling/Operator/Ticket Displays ما زالت مرحلة مستقلة لم تعتمد تفاصيلها النهائية.

- الإدارة المركزية تعرف الفروع، الكتالوج المركزي للخدمات والـ Segments، والـ Branding العام.
- الفرع يمتلك بنية تشغيلية: Waiting Areas ثم Windows ثم Terminals وDisplays.
- الخدمة قد تكون Global أو BranchScoped، ولا تصبح خدمة مقدمة في فرع لمجرد وجود تعريفها؛ يلزم سياق BranchService أو الملكية المحلية المناسبة.
- Service Schedule تحدد زمن الإتاحة، وQuota/Segment تحدد تصنيفات السعة، وWorkflow يعرف مسارات خدمة ممكنة كتعريف فقط.
- شاشات الفرع تستخدم Branch Display Configuration ورسائل Ticker وplaylist فيديو واحدة مشتركة على مستوى الفرع.

### فهرس الموديولات

1. الهوية والوصول والصلاحيات
2. إدارة الفروع
3. Branch Configuration وAllowedTime
4. General Brand وBranch Branding
5. إعلانات الفرع
6. Waiting Areas
7. Windows
8. Terminals
9. Displays وDisplayWindow
10. Service Definition
11. Service Custom Input
12. Service Media
13. Branch Services وService Trees
14. Service Schedule
15. Service Workflow
16. Service Globalization
17. Segments
18. Branch Service Segments & Quotas
19. Segment Globalization
20. Branch Videos وHLS Playlist
21. Branch Display Configuration & Messages
22. Customer/Public Runtime
23. سلوكيات مشتركة عبر النظام
24. End-to-End Business Flows
25. الموديولات غير المنفذة أو غير المحسومة
26. كتالوج كل الـ Endpoints الحالية

---

## 1. الهوية والوصول والصلاحيات

**حالة الموديول:** موثق في آخر Snapshot Source ومؤكد Business-wise.

### الهدف من الموديول

هذا الموديول يحدد من يستطيع الدخول للنظام، ما هو نوع المستخدم، ما الفرع الفعال للمستخدم الفرعي، وما الـ Permissions التي يجب أن تمر قبل تنفيذ أي Business Operation. المقصود ليس Login فقط، بل إنشاء سياق آمن تستخدمه كل الموديولات الأخرى.

### المفاهيم والكيانات الرئيسية

- **ApplicationUser**: حساب الدخول الأساسي.
- **Actor: TechnicalAdmin** على مستوى النظام.
- **Actor: BranchAdmin** مرتبط بفرع تشغيلي.
- **Role / Permission / UserRole**: طبقة التفويض المعتمدة.
- **ActiveBranchId**: سياق الفرع للمستخدم Branch-scoped.

### قواعد البيزنس المؤكدة

1. المصادقة تتم بـ JWT، بينما التفويض يعتمد على Permission policies وليس على اسم Role وحده.
2. إنشاء Branch Admin يتم من خلال عملية داخل Branch، ولا يعتبر إنشاء مستخدم عام بلا Scope.
3. في الـ flow الحالي، Technical Admin هو الـ system-level actor الذي ينشئ Branch Admin.
4. الـ Branch Admin الناتج يرتبط بفرع واحد في flow الـ token الحالي؛ وجود أكثر من Branch assignment يعتبر حالة غير مدعومة في هذا المسار.
5. الفرع المستهدف لإنشاء Branch Admin يجب أن يكون موجوداً وصالحاً للتشغيل وفق الـ handler الحالي.
6. الحساب الجديد يستخدم Temporary Password ومسار First Login؛ لا يسمح له باعتماد نفس الـ Temporary Password ككلمة المرور النهائية.
7. بعد تغيير كلمة المرور الأولية يتم إصدار سياق دخول عادي لا يحمل متطلب تغيير أولي.
8. Branch Scope يتم التحقق منه داخل Application layer أيضاً؛ Permission وحدها لا تعني حق إدارة أي Branch.

### ما الذي يمكن للإدارة فعله؟

- تسجيل الدخول.
- تغيير كلمة المرور الأولية.
- إنشاء Branch Admin من داخل الفرع لمن يملك Permission المناسبة.

### العلاقات وتأثيرها على باقي النظام

- كل عملية فرع تعتمد على الهوية + Branch scope + Permission rule.
- فشل المصادقة ينتج Unauthorized، وفشل نطاق الفرع/Permission ينتج Security/Forbidden result بدل Business exception متوقعة.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| تسجيل الدخول | `POST /api/auth/login` | عام | تسجيل الدخول وإنشاء سياق المصادقة. |
| تغيير كلمة المرور الأولية | `POST /api/auth/change-initial-password` | Authenticated | إكمال First Login وتغيير Temporary Password. |
| إنشاء Branch Admin | `POST /api/branches/{branchId:int}/admins` | BranchAdmins.Create | إنشاء Branch Admin وربطه بالفرع. |

### سيناريو Business عملي

مثال: ينشئ Technical Admin فرعاً، ثم ينشئ Branch Admin داخله. يدخل الـ Branch Admin لأول مرة بكلمة المرور المؤقتة، يغيرها، وبعدها يحصل على Token طبيعي يحتوي سياق فرعه ويستخدم Permissions الممنوحة له.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- لا نفترض أن Role بعينها تدير Module كامل ما لم تكن Permission الحالية تقول ذلك.
- لا يوجد في الـ snapshot الحالي CRUD عام لإدارة User لكل أنواع المستخدمين؛ لذلك لا نختلق endpoints لإدارة المستخدمين.

---

## 2. إدارة الفروع

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

الـ Branch هو أعلى Operational Location داخل النظام. كل تجربة عميل أو شاشة أو Waiting Area أو Service availability مرتبطة في النهاية بسياق فرع.

### المفاهيم والكيانات الرئيسية

- **Branch**: التعريف التشغيلي للفرع.
- **Location**: City, Governorate, Area, Address, Latitude, Longitude.
- **BranchAdmin assignment**.
- **Branch-owned collections**: WaitingAreas, Displays, Advertisements, Videos, DisplayMessages, BranchServices وOwnedServices.

### قواعد البيزنس المؤكدة

9. الفرع ينشأ Active افتراضياً.
10. ArabicName وEnglishName بيانات أساسية مطلوبة، وIPAddress يتم التحقق منها مع دعم مناسب لـ IPv4/IPv6 وتفردها حسب قواعد قاعدة البيانات الحالية.
11. تعديل الفرع يغير البيانات المسموح بها والموقع، ولا يستخدم لتغيير حالة IsActive بشكل ضمني.
12. التحول Inactive -> Active يتم بعملية Deactivate صريحة، والعودة بـ Reactivate صريحة.
13. Deactivate لا يحذف Waiting Areas أو Windows أو Displays أو Services أو Media؛ هو إيقاف تشغيلي مع حفظ البيانات.
14. Permanent Delete عملية منفصلة ومشروطة، ويمكن رفضها عند وجود Related Operational Data أو علاقات تمنع الحذف.
15. RowVersion مستخدمة لمنع الكتابة فوق تعديل أحدث عند عمليات التحديث التي تتطلبها الحالة.

### ما الذي يمكن للإدارة فعله؟

- عرض القائمة مع Search/Pagination.
- قراءة تفاصيل فرع.
- إنشاء وتعديل الفرع وموقعه.
- Deactivate / Reactivate.
- Permanent Delete عند السماح.
- إنشاء Branch Admin ضمن الفرع.

### العلاقات وتأثيرها على باقي النظام

- WaitingArea وDisplay مرتبطان مباشرة بالـ Branch.
- Service يمكن أن تكون مملوكة للـ Branch عندما تكون BranchScoped أو مرتبطة به عبر BranchService.
- Branding / Display Configuration / Videos / Ads كلها إعدادات محتوى على مستوى الفرع.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الفروع | `GET /api/branches` | Branches.ViewAll | قراءة الفروع دون تغيير حالتها. |
| قراءة تفاصيل فرع | `GET /api/branches/{branchId:int}` | Branches.ViewDetails | قراءة التفاصيل الكاملة للفرع. |
| إنشاء فرع | `POST /api/branches` | Branches.Create | إنشاء Branch Active جديدة. |
| تعديل فرع | `PUT /api/branches/{branchId:int}` | Branches.Update | تعديل بيانات الفرع والموقع مع التزامن. |
| إيقاف فرع | `POST /api/branches/{branchId:int}/deactivate` | Branches.Deactivate | إيقاف الفرع تشغيلياً مع حفظ البيانات. |
| إعادة تفعيل فرع | `POST /api/branches/{branchId:int}/reactivate` | Branches.Reactivate | إعادة الفرع للعمل. |
| حذف نهائي | `DELETE /api/branches/{branchId:int}/permanent` | Branches.DeletePermanent | حذف نهائي مشروط بالعلاقات والحالة. |

### سيناريو Business عملي

إذا أوقفت Branch مستشفى للصيانة، تبقى إعداداتها وشاشاتها وخدماتها محفوظة. عند Reactivate تعود نفس البنية بدل إعادة إنشائها.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- إيقاف Branch لا يعني تلقائياً Soft Delete لكل البيانات التابعة.
- لا نفترض Cascade Delete للبيانات التشغيلية.

---

## 3. Branch Configuration وAllowedTime

**حالة الموديول:** Business مؤكد ومنفذ في Snapshot سابق بتاريخ 5 أغسطس 2026، لكن Entity/Controller الخاصين بهما غير ظاهرين في آخر Dump بتاريخ 20 أغسطس. يجب اعتبار هذا فرق Source يحتاج مراجعة Merge، وليس مبرراً لاختراع Implementation جديد.

### الهدف من الموديول

الغرض هو تخزين إعداد تشغيل خاص بالفرع يؤثر على كيفية حساب الخدمات القابلة للإصدار للعميل. الإعداد المؤكد هو AllowedTime، أي نافذة النظر للأمام زمنياً عند تقييم Service Schedule.

### المفاهيم والكيانات الرئيسية

- **BranchConfiguration**: إعداد واحد لكل Branch.
- **AllowedTime**: نافذة Look Ahead.
- **IsConfigured** في Response لتمييز عدم وجود Configuration عن قيمة صفر معرفة.
- **RowVersion** للتزامن.

### قواعد البيزنس المؤكدة

16. AllowedTime يجب أن تكون => 00:00 وأقل من 24 ساعة.
17. القيمة 00:00 تعني عدم النظر للمستقبل؛ الخدمة يجب أن تكون متاحة الآن لكي تعتبر Eligible زمنياً.
18. عدم وجود Configuration حالة مقبولة؛ الـ GET السابق كان يعيد NotConfigured model بدل إنشاء سجل تلقائي.
19. لا يتم إنشاء BranchConfiguration تلقائياً لمجرد إنشاء Branch.
20. في حساب Ticket-Issuable Services، AllowedTime توسع نافذة قبول Schedule إلى المستقبل ضمن القواعد الزمنية المعتمدة.
21. الـ scope يبقى Branch-scoped ويتم فحص حق المستخدم في الفرع.

### ما الذي يمكن للإدارة فعله؟

- قراءة حالة Configuration.
- إنشاء Configuration إذا لم تكن موجودة.
- تحديث AllowedTime مع RowVersion.

### العلاقات وتأثيرها على باقي النظام

- يتأثر بها Customer Runtime الخاص بالخدمات المتاحة.
- لا علاقة لها بـ Display Styling أو Branch Branding.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الإعداد | `GET /api/branches/{branchId:int}/configuration` | BranchConfigurations.View | قراءة AllowedTime أو حالة NotConfigured. |
| إنشاء الإعداد | `POST /api/branches/{branchId:int}/configuration` | BranchConfigurations.Create | إنشاء الإعداد لأول مرة. |
| تعديل الإعداد | `PUT /api/branches/{branchId:int}/configuration` | BranchConfigurations.Update | تعديل AllowedTime مع Concurrency protection. |

### سيناريو Business عملي

إذا كانت الساعة 10:00 والخدمة تبدأ 10:20، فـ AllowedTime = 30 دقيقة يسمح باعتبارها ضمن نافذة الإتاحة، أما AllowedTime = 10 دقائق فلا يسمح.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- هذا الموديول غير ظاهر في آخر dump source الحالي؛ يجب التحقق هل تم إسقاطه بالخطأ من الفرع الحالي أم نُقل/حذف عمداً.
- لا نعتبر AllowedTime إعداداً عالمياً لكل الفروع؛ هو Branch-specific.

---

## 4. General Brand وBranch Branding

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

الـ Branding تفصل بين look General/Default على مستوى النظام وبين Theme خاصة بفرع. هذا الموديول مسؤول عن presentation assets وإعداداتها البصرية/السلوكية الخاصة بواجهة العميل، وليس عن تعريف physical Display device.

### المفاهيم والكيانات الرئيسية

- **GeneralBrand**: Singleton system-level brand.
- **BranchBranding**: واحد لكل Branch عند وجوده.
- **Branch Logo**: مصدر Logo الفرع.
- **Layout/UX settings**: colors, language, behavior, buttons, dimensions, texts.

### قواعد البيزنس المؤكدة

22. GeneralBrand سجل عام واحد للنظام، وBranchBranding يسمح بتخصيص فرع بعينه.
23. ألوان الـ Branding تحفظ بصيغة RGB Hex من نوع #RRGGBB وفق القيود الحالية.
24. تشمل BranchBranding: MainColor, SecondaryColor, BackgroundColor, HeaderColor, FooterColor, MainTextColor.
25. تشمل Flags مثل: ShowLanguagePage, DefaultLanguageIsArabic, AlwaysRequireUserInput, ShowServiceNavigationPath, AllowOperatorSelection, AllowRequestMoreServices.
26. تشمل إعدادات أزرار Footer/Keypad/Service/Language من ألوان وأبعاد ونصوص وفق الـ contract الحالي.
27. رفع Logo منفصل عن تحديث Theme حتى لا يختلط File Upload مع إعدادات الشكل.
28. Logo الخاصة بالـ Branch لا تتكرر داخل Branch Display Configuration؛ Runtime Display يعيد استخدامها كمصدر واحد للحقيقة.
29. في response الحالي لـ Customer ticket-issuable، عند غياب BranchBranding تم اعتماد fallback إلى GeneralBrand في الـ implementation السابق لهذه القراءة.

### ما الذي يمكن للإدارة فعله؟

- قراءة/إنشاء/تحديث GeneralBrand.
- قراءة BranchBranding.
- تحديث Theme الفرع.
- رفع/استبدال Logo الفرع.

### العلاقات وتأثيرها على باقي النظام

- Customer service selection يستخدم Branding لتشكيل تجربة العميل.
- Display Runtime يأخذ Logo من BranchBranding، بينما بقية ألوان Display تأتي من Display Configuration المنفصلة.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة General Brand | `GET /api/general-brand` | GeneralBrand.View | قراءة الـ General Brand. |
| إنشاء General Brand | `POST /api/general-brand` | GeneralBrand.Create | إنشاء Singleton General Brand. |
| تحديث General Brand | `PUT /api/general-brand` | GeneralBrand.Update | تحديث الـ General Brand. |
| قراءة Branding فرع | `GET /api/branches/{branchId:int}/branding` | Branches.ViewDetails | قراءة Branding فرع. |
| تعديل Theme | `PUT /api/branches/{branchId:int}/branding/theme` | Branches.Update | تعديل Theme/UX settings للفرع. |
| رفع/استبدال Logo | `PUT /api/branches/{branchId:int}/branding/logo` | Branches.Update | رفع/استبدال Logo الفرع. |

### سيناريو Business عملي

فرع A يمكن أن يستخدم MainColor أزرق وLogo مستشفى A بينما فرع B له Theme وLogo مختلفة، مع بقاء GeneralBrand كتعريف عام للنظام.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- Branch Branding ليست Display Configuration.
- وجود AllowOperatorSelection كـ Flag لا يعني أن Operator runtime مكتمل.

---

## 5. إعلانات الفرع

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

إدارة صور إعلانية Branch-level تظهر حسب موضع استخدامها في تجربة الفرع، منفصلة عن Service images وعن Video playlist.

### المفاهيم والكيانات الرئيسية

- **BranchAdvertisement**: ImagePath, DisplayOrder, IsActive, RowVersion.
- **Media storage** للملفات.
- **Reorder repository** للتحديث الذري للترتيب.

### قواعد البيزنس المؤكدة

30. كل Advertisement تنتمي لـ Branch واحدة.
31. الإعلان ينشأ Active وله DisplayOrder موجب.
32. الـ implementation الحالي يضع حداً أقصى 20 إعلاناً للفرع في مسار الإضافة.
33. DisplayOrder يجب ألا يدخل في تضارب/تكرار مع ترتيب آخر داخل نفس Branch حسب القيود الحالية.
34. Deactivate يخفي الإعلان تشغيلياً لكنه لا يحذفه ولا يزيل الملف.
35. Reactivate يعيد الإعلان إذا كان Inactive؛ محاولة تفعيل Active أو تعطيل Inactive تعامل كحالة conflict/validation حسب الـ handler.
36. Reorder يستخدم RowVersion لكل item لتجنب overwrite عند تعديل متزامن.
37. Delete يزيل السجل ويحاول تنظيف media file، وهو مختلف عن Deactivate.

### ما الذي يمكن للإدارة فعله؟

- عرض إعلانات الفرع مع filter للحالة.
- رفع مجموعة صور.
- إعادة ترتيب.
- Deactivate/Reactivate.
- Delete.

### العلاقات وتأثيرها على باقي النظام

- لا تتداخل مع BranchVideo أو ServiceImage؛ كل نوع Media له Ownership مختلف.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الإعلانات | `GET /api/branches/{branchId:int}/advertisements` | Branches.ViewDetails | قراءة إعلانات الفرع. |
| إضافة صور | `POST /api/branches/{branchId:int}/advertisements` | Branches.Update | إضافة صور إعلانية. |
| إعادة ترتيب | `PUT /api/branches/{branchId:int}/advertisements/order` | Branches.Update | إعادة ترتيب الإعلانات. |
| إيقاف إعلان | `POST /api/branches/{branchId:int}/advertisements/{advertisementId:int}/deactivate` | Branches.Update | إيقاف إعلان دون حذفه. |
| إعادة إعلان | `POST /api/branches/{branchId:int}/advertisements/{advertisementId:int}/reactivate` | Branches.Update | إعادة الإعلان. |
| حذف إعلان | `DELETE /api/branches/{branchId:int}/advertisements/{advertisementId:int}` | Branches.Update | حذف الإعلان ومرجعه. |

### سيناريو Business عملي

يمكن إيقاف حملة إعلانية مؤقتاً دون فقد الملف، ثم Reactivate لاحقاً مع الحفاظ على سجلها وترتيبها.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- إعلانات الفرع صور وليست HLS videos الخاصة بشاشات النداء.

---

## 6. Waiting Areas

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

Waiting Area تمثل منطقة انتظار تشغيلية داخل Branch وتجمع Windows مكانياً/تشغيلياً. هي Master Data وليست Queue transaction بحد ذاتها.

### المفاهيم والكيانات الرئيسية

- **WaitingArea**: BranchId, Number, AudioDevice, ControlDevice, DescriptiveName, IsActive.
- علاقة one-to-many من WaitingArea إلى Windows.

### قواعد البيزنس المؤكدة

38. WaitingArea تنتمي إلى Branch واحدة.
39. تنشأ Active وتدعم Update ثم Deactivate/Reactivate.
40. Number يستخدم كمعرف تشغيلي داخل الفرع وفق uniqueness/validation الحالية.
41. AudioDevice وControlDevice وDescriptiveName معلومات تعريفية اختيارية؛ وجودها لا يعني أن audio runtime مكتمل.
42. Permanent Delete قد يرفض إذا كانت هناك Windows/records related تعتمد عليها.
43. Deactivate يحافظ على السجل والعلاقات ولا يحذف Windows التابعة.

### ما الذي يمكن للإدارة فعله؟

- List/Search.
- Details.
- Create/Update.
- Deactivate/Reactivate.
- Permanent Delete عند خلو الاعتماديات.

### العلاقات وتأثيرها على باقي النظام

- Branch تحتوي WaitingAreas.
- WaitingArea تحتوي Windows.
- Window هي نقطة الخدمة الفعلية التي تبنى فوق WaitingArea.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الكل | `GET /api/waiting-areas` | WaitingAreas.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| قراءة تفاصيل | `GET /api/waiting-areas/{waitingAreaId:int}` | WaitingAreas.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| إنشاء | `POST /api/waiting-areas` | WaitingAreas.Create | إنشاء سجل تعريف جديد بعد التحقق من Business Rules والScope. |
| تعديل | `PUT /api/waiting-areas/{waitingAreaId:int}` | WaitingAreas.Update | تعديل البيانات مع validation وحماية التزامن. |
| إيقاف | `POST /api/waiting-areas/{waitingAreaId:int}/deactivate` | WaitingAreas.Deactivate | إيقاف المورد مع الاحتفاظ به. |
| إعادة تفعيل | `POST /api/waiting-areas/{waitingAreaId:int}/reactivate` | WaitingAreas.Reactivate | إعادة المورد للحالة Active. |
| حذف نهائي | `DELETE /api/waiting-areas/{waitingAreaId:int}/permanent` | WaitingAreas.DeletePermanent | حذف نهائي مشروط بالحالة والعلاقات. |

### سيناريو Business عملي

مثال: منطقة "العيادات الخارجية" تحتوي Clinics/Windows متعددة. إيقاف المنطقة يمنع استخدامها تشغيلياً وفق flows تشترط ancestors active، مع بقاء تعريف Windows محفوظاً.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- WaitingArea ليست Ticket Queue state، ولا ننسب إليها Calling Algorithm غير موجود.

---

## 7. Windows

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

Window هي نقطة تقديم الخدمة الفعلية داخل Waiting Area؛ قد تمثل شباكاً أو عيادة أو Counter حسب الجهة.

### المفاهيم والكيانات الرئيسية

- **Window**: BranchId, WaitingAreaId, Number, DescriptiveName, IPAddress, EnableTicketBooking, EnableDirectCall, IsActive.
- **Terminals collection**.
- **DisplayWindow collection**.

### قواعد البيزنس المؤكدة

44. Window مرتبطة بـ WaitingArea وبالسياق التشغيلي للـ Branch.
45. رقم Window والنطاقات المتعلقة بالـ IP يتم التحقق منها وفق current database/validators constraints.
46. Flags: EnableTicketBooking وEnableDirectCall تعبر عن Capability/Configuration وليست Runtime Flow مكتملة بذاتها.
47. Window تنشأ Active وتدعم Deactivate/Reactivate.
48. Permanent Delete عملية منفصلة ويمكن منعها عند وجود Terminals أو DisplayWindow أو علاقات تشغيلية.

### ما الذي يمكن للإدارة فعله؟

- List/Search وDetails.
- Create/Update.
- Deactivate/Reactivate.
- Permanent Delete المشروط.

### العلاقات وتأثيرها على باقي النظام

- WaitingArea -> Windows.
- Window -> Terminals.
- Display <-> Window عبر DisplayWindow.
- قد ترتبط بالخدمات عبر WindowService مستقبلاً، لكن قواعد هذا الربط ليست جزءاً موثقاً من snapshot الحالي.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الكل | `GET /api/windows` | Windows.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| قراءة تفاصيل | `GET /api/windows/{windowId:int}` | Windows.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| إنشاء | `POST /api/windows` | Windows.Create | إنشاء سجل تعريف جديد. |
| تعديل | `PUT /api/windows/{windowId:int}` | Windows.Update | تعديل البيانات مع حماية التزامن. |
| إيقاف | `POST /api/windows/{windowId:int}/deactivate` | Windows.Deactivate | إيقاف المورد مع الاحتفاظ به. |
| إعادة تفعيل | `POST /api/windows/{windowId:int}/reactivate` | Windows.Reactivate | إعادة المورد للحالة Active. |
| حذف نهائي | `DELETE /api/windows/{windowId:int}/permanent` | Windows.DeletePermanent | حذف نهائي مشروط. |

### سيناريو Business عملي

إذا كانت Window "عيادة رقم 5" يمكن ربط Terminal العامل عليها وربط Display تعرض calls مرتبطة بها. تغيير Flag DirectCall لا ينشئ Calling Algorithm تلقائياً.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- لا نحدد من يخدم Window أو كيف يتم Operator session لأن هذا Runtime غير محسوم حالياً.

---

## 8. Terminals

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

Terminal يمثل الجهاز الفيزيائي/العميل التشغيلي المرتبط بـ Window، ويخزن معلومات الاتصال والتعريف اللازمة لإدارة الجهاز.

### المفاهيم والكيانات الرئيسية

- **Terminal**: WindowId, Number, IPAddress, SerialNo, Type, IsActive.

### قواعد البيزنس المؤكدة

49. Terminal يجب أن يرتبط بـ Window موجودة وفق قواعد الإنشاء.
50. IPAddress يخزن بصيغة تدعم IPv4/IPv6، وSerialNo يخضع لقواعد uniqueness الحالية داخل نطاقه التشغيلي.
51. Terminal تنشأ Active وتدعم lifecycle صريح.
52. Permanent Delete يمكن أن يرفض عند وجود related operational records.
53. Terminal تعريف Device وليس Operator Session أو Ticket Session.

### ما الذي يمكن للإدارة فعله؟

- List/Search.
- Get details.
- Create/Update.
- Deactivate/Reactivate.
- Permanent Delete.

### العلاقات وتأثيرها على باقي النظام

- كل Terminal تحت Window.
- أي ربط مستقبلي بالـ Operator أو Call runtime يجب أن يبنى كـ flow منفصل ولا يستنتج من وجود Terminal.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الكل | `GET /api/terminals` | Terminals.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| قراءة تفاصيل | `GET /api/terminals/{terminalId:int}` | Terminals.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| إنشاء | `POST /api/terminals` | Terminals.Create | إنشاء سجل تعريف جديد. |
| تعديل | `PUT /api/terminals/{terminalId:int}` | Terminals.Update | تعديل البيانات مع حماية التزامن. |
| إيقاف | `POST /api/terminals/{terminalId:int}/deactivate` | Terminals.Deactivate | إيقاف المورد مع الاحتفاظ به. |
| إعادة تفعيل | `POST /api/terminals/{terminalId:int}/reactivate` | Terminals.Reactivate | إعادة المورد للحالة Active. |
| حذف نهائي | `DELETE /api/terminals/{terminalId:int}/permanent` | Terminals.DeletePermanent | حذف نهائي مشروط. |

### سيناريو Business عملي

يمكن تغيير IP/Type/Serial لجهاز Window من خلال Update مع RowVersion، أو Deactivate الجهاز عند خروجه من الخدمة بدل حذفه مباشرة.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- لا يوجد Terminal login/session lifecycle موثق في current API.

---

## 9. Displays وDisplayWindow

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

Display هنا هو الشاشة الفيزيائية نفسها، بينما DisplayWindow هي علاقة تحدد Windows المرتبطة بهذه الشاشة. Styling ومحتوى الشاشة لهما Module منفصل على مستوى Branch.

### المفاهيم والكيانات الرئيسية

- **Display**: BranchId, Number, IPAddress, SerialNo, Type, IsActive.
- **DisplayWindow**: join entity بين Display وWindow.
- **BranchDisplayConfiguration**: ليس جزءاً من physical Display entity.

### قواعد البيزنس المؤكدة

54. Display تنتمي إلى Branch وتخزن تعريف الجهاز فقط.
55. يمكن إنشاء/تعديل/إيقاف/إعادة تفعيل الشاشة وحذفها نهائياً عند استيفاء القيود.
56. DisplayWindow تمنع تكرار نفس WindowId + DisplayId.
57. Assign/Unassign Window يغير العلاقة فقط؛ لا يغير تعريف Display أو Window.
58. Permanent Delete للشاشة يتطلب قواعد حالة/اعتماديات، ومن أبرزها عدم ترك روابط تمنع الحذف حسب implementation الحالي.
59. لا نخلط بين Display device وبين Branch Display Configuration المشتركة على كل شاشات الفرع.
60. كقاعدة تصميم للمشروع لا نفترض تلقائياً أن كل DisplayWindow يجب أن تكون داخل نفس Branch ما لم تكن هذه القاعدة مؤكدة في use case؛ التنفيذ الحالي لـ available candidates هو المرجع للـ API نفسها.

### ما الذي يمكن للإدارة فعله؟

- إدارة الأجهزة.
- عرض Windows المرتبطة.
- عرض Windows المتاحة للربط.
- Assign/Unassign العلاقة.
- Lifecycle للشاشة.

### العلاقات وتأثيرها على باقي النظام

- Display تعرض calls المرتبطة بنطاق Windows عندما يصبح Calling runtime مكتملاً.
- جميع Displays الفرع تستخدم نفس Branch Display Configuration وVideo Playlist حسب قواعد الـ Branch runtime الحالية.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الكل | `GET /api/displays` | Displays.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| قراءة تفاصيل | `GET /api/displays/{displayId:int}` | Displays.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| Windows مرتبطة | `GET /api/displays/{displayId:int}/windows` | DisplayWindows.ViewLinked | قراءة Windows المرتبطة بالشاشة حالياً. |
| Windows متاحة | `GET /api/displays/{displayId:int}/available-windows` | DisplayWindows.ViewAvailable | إرجاع Windows المرشحة للربط بالشاشة. |
| ربط Window | `POST /api/displays/{displayId:int}/windows/{windowId:int}` | DisplayWindows.Assign | إنشاء DisplayWindow link ومنع تكرار نفس الزوج. |
| فك ربط Window | `DELETE /api/displays/{displayId:int}/windows/{windowId:int}` | DisplayWindows.Unassign | إزالة علاقة DisplayWindow بدون حذف الشاشة أو الـ Window. |
| إنشاء شاشة | `POST /api/displays` | Displays.Create | إنشاء سجل تعريف جديد. |
| تعديل شاشة | `PUT /api/displays/{displayId:int}` | Displays.Update | تعديل البيانات مع حماية التزامن. |
| إيقاف شاشة | `POST /api/displays/{displayId:int}/deactivate` | Displays.Deactivate | إيقاف المورد مع الاحتفاظ به. |
| إعادة تفعيل شاشة | `POST /api/displays/{displayId:int}/reactivate` | Displays.Reactivate | إعادة المورد للحالة Active. |
| حذف نهائي | `DELETE /api/displays/{displayId:int}/permanent` | Displays.DeletePermanent | حذف نهائي مشروط. |

### سيناريو Business عملي

في Branch بها 3 شاشات، يمكن لكل Display الاحتفاظ بعلاقات Window مختلفة، لكن الثلاثة تشترك في Display Theme وVideo playlist الخاصة بالـ Branch.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- DisplayWindow لا تعني أن call events نفسها منفذة؛ هي مجرد Mapping تشغيلي.

---

## 10. Service Definition

**حالة الموديول:** موثق في آخر Snapshot Source وهو من أكثر الموديولات نضجاً.

### الهدف من الموديول

هذا الموديول يعرف ماذا تقدم المنظومة كخدمة، وكيف تبنى الخدمة داخل Hierarchy، وما خصائصها التشغيلية العامة. Service Definition لا تساوي تلقائياً Service متاحة داخل كل Branch.

### المفاهيم والكيانات الرئيسية

- **Service**: Aggregate, Parent/Children, Scope, OwnerBranchId, names, ServiceCode, ticket flags, priority, range, messages, custom inputs, media.
- **ServiceScope**: Global أو BranchScoped.
- **Soft Delete fields + RowVersion**.

### قواعد البيزنس المؤكدة

61. الخدمات تدعم Parent/Child hierarchy؛ Parent تستخدم للتنظيم/navigation، بينما Ticket-Issuable node يجب أن تكون Leaf وفق business الحالي.
62. Service قد تكون Global بدون OwnerBranchId أو BranchScoped مملوكة لـ Branch واحدة.
63. ServiceCode منفصلة عن RangePrefix. عندما IsServiceCodeRequired=true تصبح ServiceCode مطلوبة، وعندما لا تكون مطلوبة يمكن أن تكون null وفق القواعد المعتمدة.
64. ServiceCode غير null يجب أن تكون Unique عبر الخدمات حسب القرار المعتمد في مرحلة Service Code.
65. IsTicketIssuable لا يكفي وحده للظهور للعميل؛ يلزم Branch active + ownership/relation + hierarchy effective + schedule eligibility.
66. Service Parent لا تقبل Custom Inputs؛ IsClientInputRequired عليها يجب أن تبقى false وفق business المعتمد.
67. HasReservation تعني أن تعريف الخدمة يدعم reservation capability، لكنها لا تنشئ Reservation workflow تلقائياً.
68. Priority قيمة Business Configuration مخزنة، ولا نعتبرها صيغة Calling Algorithm نهائية حتى تعتمد قواعد الخوارزمية.
69. RangePrefix/RangeStartNumber/RangeEndNumber تمثل Ticket numbering range، وتستخدم كما السعة في Segment quotas بصيغة RangeEnd-RangeStart+1.
70. OrderNo يتحكم في ترتيب العرض داخل hierarchy.
71. يمكن Soft Delete ثم Restore؛ Permanent Delete منفصل ومشروط بعدم وجود استخدام/علاقات تمنع الحذف النهائي.
72. فعالية Child تشغيلياً تتأثر بحالة ancestors؛ لا نحتاج تعديل كل descendant في DB حتى تصبح الشجرة غير صالحة للـ runtime عندما Parent غير active/deleted.

### ما الذي يمكن للإدارة فعله؟

- List/Search مع filters.
- Tree كاملة مع scope/owner/search filters.
- Central tree.
- Available parents/selection options.
- Create/Update.
- Soft Delete/Restore/Permanent Delete.

### العلاقات وتأثيرها على باقي النظام

- BranchService يحدد أين تقدم Global Service.
- BranchScoped Service تملكها Branch.
- Schedule/Segments/Workflow كلها تبنى فوق Leaf Service في سياق Branch.
- Service media جزء من التعريف وليس Branch media.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الكل | `GET /api/services` | Services.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| شجرة الخدمات | `GET /api/services/tree` | Services.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| شجرة مركزية | `GET /api/services/central-tree` | Services.ViewCentralTree | قراءة شجرة الخدمات المركزية ككتالوج Central. |
| Parents متاحة | `GET /api/services/available-parents` | Services.ViewAll | إرجاع Parents المسموح اختيارها عند إنشاء/نقل Service. |
| خيارات الاختيار | `GET /api/services/selection-options` | Services.ViewAll | إرجاع الخيارات المساندة لإدارة تعريف الخدمة. |
| قراءة تفاصيل | `GET /api/services/{serviceId:int}` | Services.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| إنشاء | `POST /api/services` | Services.Create | إنشاء سجل تعريف جديد. |
| تعديل | `PUT /api/services/{serviceId:int}` | Services.Update | تعديل البيانات مع حماية التزامن. |
| حذف مؤقت | `DELETE /api/services/{serviceId:int}` | Services.Delete | Soft Delete لتعريف الخدمة مع الحفاظ على السجل. |
| استعادة | `POST /api/services/{serviceId:int}/restore` | Services.Restore | إعادة Service soft-deleted عند استيفاء القواعد. |
| حذف نهائي | `DELETE /api/services/{serviceId:int}/permanent` | Services.DeletePermanent | حذف نهائي لتعريف الخدمة فقط عندما لا تمنعه العلاقات/الاستخدام التاريخي. |

### سيناريو Business عملي

مثال: "العيادات" Parent، تحتها "الباطنة" Parent، وتحتها "كشف باطنة" Leaf Issuable-Ticket. العميل لا يأخذ Ticket من "العيادات"، لكنه يحتاج Parents في tree حتى يصل للـ Leaf.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- لا نستنتج Service Workflow execution من وجود service workflow definitions.
- لا نستنتج reservation conversion أو calling behavior من الـ flags الحالية.

---

## 11. Service Custom Input

**حالة الموديول:** موثق داخل Service Aggregate وUpdate/Create contracts الحالية؛ لا يملك Controller مستقل.

### الهدف من الموديول

يسمح للـ Service Leaf بطلب بيانات إضافية من العميل قبل إصدار Ticket، مع قيود validation معرفة لكل Input.

### المفاهيم والكيانات الرئيسية

- **ServiceCustomInput**: Name, LabelAr, LabelEn, Type, IsRequired, Order.
- **String constraints**: MinLength, MaxLength, StartWith.
- **Integer constraints**: MinValue, MaxValue.
- **Service.IsClientInputRequired**: gate على وجود الـ inputs.

### قواعد البيزنس المؤكدة

73. الأنواع الحالية المؤكدة هي String وInteger.
74. إذا IsClientInputRequired=true على Service Leaf يجب توفير Custom Inputs صالحة؛ وإذا false فلا يتم قبول Custom Inputs لهذه الخدمة وفق الـ business المعتمد.
75. Service Parent لا تقبل Custom Input، وبالتالي IsClientInputRequired عليها false.
76. قيود String لا تخلط مع Integer: طول/Prefix للنصوص، Min/Max Value للأرقام.
77. Min يجب ألا يتجاوز Max في نفس نوع القيد.
78. Name وOrder داخل خدمة واحدة يخضعان لمنع التعارض/التكرار وفق validation الحالية.
79. Service Update/Create يعيدان بيانات Custom Inputs وقيودها حتى يستطيع العميل/الإدارة معرفة طريقة الإدخال.

### ما الذي يمكن للإدارة فعله؟

- تعريف Inputs أثناء Create Service.
- تعديل/إضافة/إزالة definitions ضمن Service Update حسب الـ contract الحالي.

### العلاقات وتأثيرها على باقي النظام

- يؤثر على UX الخاص بـ Service Leaf قبل Ticket issuance.
- لا يوجد endpoint مستقل مثل /custom-inputs؛ الإدارة تتم كجزء من تعريف Service.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| إنشاء مع Inputs | `POST /api/services` | Services.Create | إنشاء Service مع CustomInputs عندما تسمح قواعد Leaf وIsClientInputRequired. |
| تعديل Inputs | `PUT /api/services/{serviceId:int}` | Services.Update | تعديل تعريف الـ Custom Inputs والقيود كجزء من تحديث Service. |
| قراءة تفاصيل | `GET /api/services/{serviceId:int}` | Services.ViewDetails | قراءة الخدمة بما فيها تعريفات الإدخال المرتبطة. |
| خدمات قابلة للإصدار | `GET /api/branches/{branchId:int}/ticket-issuable-services` | عام - AllowAnonymous | إرجاع البيانات التي يحتاجها العميل، بما في ذلك مدخلات الخدمة عندما تكون مطلوبة. |

### سيناريو Business عملي

خدمة "فتح ملف" يمكن أن تطلب رقم الهوية String بطول 14 ويبدأ بقيمة محددة، بينما خدمة أخرى تطلب Age كـ Integer بين 18 و100.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- وجود CustomInput لا يعني أن بيانات العميل نفسها تم تخزينها في Ticket حالياً؛ Ticket runtime لم يعتمد بعد.

---

## 12. Service Media

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

إدارة الصور المرتبطة بتعريف Service نفسها: Logo وIcon وAdvertisement Images. الغرض هو إعطاء service presentation assets مستقلة عن Branch Branding وBranch Advertisements.

### المفاهيم والكيانات الرئيسية

- **ServiceImage**.
- **ServiceImageType**: Logo / Icon / Advertisement.
- **Media paths/files**.

### قواعد البيزنس المؤكدة

80. Logo وIcon لهما uniqueness per service/type حسب قاعدة البيانات الحالية؛ لا يسمح بأكثر من Logo أو Icon فعال لنفس الخدمة في نفس التعريف.
81. Ads images يمكن أن تكون متعددة.
82. كل image مرتبطة بـ ServiceId وتتحقق ownership قبل الحذف.
83. رفع Service media لا يغير Branch logo ولا Branch advertisement list.

### ما الذي يمكن للإدارة فعله؟

- Get images مع filter type.
- Upload Logo.
- Upload Icon.
- Upload Ads.
- Delete image.

### العلاقات وتأثيرها على باقي النظام

- Customer/service catalog قد يستخدم هذه الصور في العرض.
- Branch media لها مسارات وإدارة منفصلة.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الصور | `GET /api/services/{serviceId:int}/images` | Services.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| رفع Logo | `POST /api/services/{serviceId:int}/images/logo` | Services.Update | رفع Logo خاص بالخدمة، منفصل عن Logo الفرع. |
| رفع Icon | `POST /api/services/{serviceId:int}/images/icon` | Services.Update | رفع Icon خاص بالخدمة. |
| رفع Ads | `POST /api/services/{serviceId:int}/images/ads` | Services.Update | إضافة صور Ads مرتبطة بالخدمة نفسها. |
| حذف صورة | `DELETE /api/services/{serviceId:int}/images/{imageId:int}` | Services.Update | حذف Media مرتبطة بالخدمة وفق نوعها. |

### سيناريو Business عملي

يمكن أن يكون للخدمة Icon لعرضها في شجرة العميل، بينما Logo الفرع يظل من BranchBranding ولا يتأثر.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- Service ad images ليست نفس BranchAdvertisement ولا BranchVideo.

---

## 13. Branch Services وService Trees

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

يفصل هذا الموديول بين تعريف Service موجود في النظام وبين "Service يقدمها Branch بعينها". كما يسمح للفرع بامتلاك Service tree محلية BranchScoped.

### المفاهيم والكيانات الرئيسية

- **BranchService**: العلاقة بين Branch وService.
- **OwnedServices**: خدمات BranchScoped مملوكة للفرع.
- **CreateBranchServiceTree/Subtree flows**.

### قواعد البيزنس المؤكدة

84. Service Global لا تصبح offered in Branch لمجرد وجودها في Central Catalog؛ يجب Assign للفرع.
85. Assign يضيف BranchService relations ولا يعدل تعريف Global Service.
86. Service BranchScoped ليست مجرد assigned Global Service؛ هي definition مملوكة للفرع ولها OwnerBranchId.
87. الفرع يمكنه إنشاء Tree محلية أو Subtree تحت Parent يسمح بها السياق الحالي.
88. الـ Business المعتمد يسمح بإنشاء Leaf محلية تحت Global Parent، مع إبقاء BranchScoped Leaf حتى قبول Globalization إن طُلب.
89. Unassign route موجهة لـ Leaf Service. بالنسبة لـ Global Service: يزيل BranchService relation؛ لا يحذف service definition.
90. Service BranchScoped لا يتم التعامل معها كـ Unassign عالمي بسيط؛ إزالة توفرها تعتمد على lifecycle الخاص بالخدمة والقواعد المؤكدة.
91. Ticket-Issuable Service الجديدة/المربوطة تدخل في قواعد Default Segment assignment وفق module Segment عندما تنطبق شروط السعة.

### ما الذي يمكن للإدارة فعله؟

- عرض service tree الخاصة بالفرع مع filters البحث/include.
- Assign Global services.
- إنشاء local tree/subtree.
- Unassign Leaf عندما يسمح scope.
- قراءة public ticket-issuable tree.

### العلاقات وتأثيرها على باقي النظام

- Schedule/Segments/Workflow تعتمد على Branch + LeafService context.
- Globalization يمكن أن تحول local definition إلى Global لاحقاً بعد review.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| شجرة خدمات الفرع | `GET /api/branches/{branchId:int}/services/tree` | BranchServices.View | قراءة بيانات لا تغير الحالة التشغيلية. |
| خدمات قابلة للإصدار | `GET /api/branches/{branchId:int}/ticket-issuable-services` | عام - AllowAnonymous | إرجاع شجرة الخدمات المؤهلة للعميل حالياً؛ لا ينشئ تذكرة. |
| ربط خدمات | `POST /api/branches/{branchId:int}/services/assign` | BranchServices.Assign | ربط تعريفات خدمات بالفرع؛ لا يغير تعريف الخدمة نفسها. |
| إنشاء شجرة محلية | `POST /api/branches/{branchId:int}/service-trees` | BranchServiceTrees.Create | إنشاء شجرة خدمات BranchScoped مملوكة للفرع. |
| إضافة Subtree | `POST /api/branches/{branchId:int}/services/{parentServiceId:int}/subtree` | BranchServiceTrees.Create | إضافة Subtree محلية تحت Parent مسموح بها. |
| فك ربط | `DELETE /api/branches/{branchId:int}/services/{leafServiceId:int}` | BranchServices.Unassign | فك ربط Service Leaf من الفرع؛ لا يعني حذف تعريف الخدمة. |

### سيناريو Business عملي

إذا كانت "كشف باطنة" Global في Central Catalog، تعمل Assign لها Branch A بينما Branch B لا تعمل Assign؛ الخدمة تظهر فقط في السياق التشغيلي للـ Branch التي تقدمها عندما تستوفي باقي الشروط.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- لا نعتبر Unassign حذفاً للخدمة.
- لا ننقل service local إلى Global بمجرد ارتباطها بأكثر من استخدام؛ يلزم Globalization flow.

---

## 14. Service Schedule

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

يحدد متى تكون Service Leaf متاحة داخل Branch معينة. نفس Service يمكن أن تملك مواعيد مختلفة من Branch إلى أخرى لأن Schedule ترتبط بالسياق LeafService + Branch.

### المفاهيم والكيانات الرئيسية

- **ServiceSchedule**.
- **Schedule Days**.
- **ServiceScheduleTimeSlot**.
- **IsSlotCodeRequired / SlotCode**.
- **RowVersion**.

### قواعد البيزنس المؤكدة

92. يوجد Schedule واحدة لكل Service Leaf + Branch في الـ business الحالي.
93. الـ Schedule تبنى على أيام أسبوع، وكل يوم يحتوي Time Slot واحدة أو أكثر.
94. لا يقبل Duplicate Day definitions داخل نفس Schedule.
95. كل Time Slot يجب أن يكون StartTime < EndTime، ولا يسمح بتداخل slots في اليوم نفسه.
96. كل يوم معرف يجب أن يحتوي slot صالحة وفق validation الحالية.
97. إذا IsSlotCodeRequired=true تصبح SlotCode مطلوبة، وإذا false لا تصبح إجبارية.
98. SlotCode معتمدة كقيمة فريدة عبر ServiceSchedules داخل Branch وفق قرار البيزنس السابق.
99. وجود Schedule لا يكفي إذا Service غير assigned/غير active/ليست ticket-issuable leaf؛ runtime يجمع الشروط معاً.
100. AllowedTime من BranchConfiguration — عند وجوده — يؤثر على مدى النظر للأمام عند تقييم Schedule.
101. المعالجة الزمنية الحالية تعتمد سياق الوقت في التطبيق ولم يتم تعريف Branch TimeZone مستقل؛ لذلك لا نفترض timezone-specific behavior جديد.

### ما الذي يمكن للإدارة فعله؟

- Get schedule.
- Create schedule.
- Update schedule مع RowVersion.

### العلاقات وتأثيرها على باقي النظام

- Customer Ticket-Issuable Services تستخدم Schedule كشرط أساسي.
- service Unassign يمنعها تشغيلياً حتى لو بقي جدولها مخزناً.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الجدول | `GET /api/branches/{branchId:int}/services/{leafServiceId:int}/schedule` | ServiceSchedules.View | قراءة جدول إتاحة Leaf Service داخل Branch. |
| إنشاء الجدول | `POST /api/branches/{branchId:int}/services/{leafServiceId:int}/schedule` | ServiceSchedules.Create | إنشاء Schedule واحدة للخدمة بأيام وفترات عمل وقواعد SlotCode. |
| تعديل الجدول | `PUT /api/branches/{branchId:int}/services/{leafServiceId:int}/schedule` | ServiceSchedules.Update | تعديل أيام/فترات الجدول وSlotCode مع RowVersion. |

### سيناريو Business عملي

خدمة تعمل السبت من 08:00-12:00 و14:00-18:00 يمكن أن تملك slotين في نفس اليوم بشرط عدم التداخل.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- Schedule لا تنشئ Reservation Slots بحد ذاتها.
- لا يوجد automatic schedule state change أو expiration؛ هي تعريف للإتاحة.

---

## 15. Service Workflow

**حالة الموديول:** موثق في آخر Snapshot Source كتعريف Workflow، وليس كـ Ticket execution engine.

### الهدف من الموديول

يسمح بتعريف أكثر من مسار محتمل لـ Service Leaf داخل Branch، وكل مسار عبارة عن Steps مرتبة لخدمات. الهدف الحالي هو Configuration/Selection definition.

### المفاهيم والكيانات الرئيسية

- **ServiceWorkflow**: BranchId, LeafServiceId, names, IsDefault, IsActive, RowVersion.
- **ServiceWorkflowStep**: ServiceId + StepOrder.
- **Workflow candidates query**.
- **Workflow start options**.

### قواعد البيزنس المؤكدة

102. الـ Workflow مرتبطة بـ Branch + Leaf Service.
103. الـ Workflow تحتوي Steps مرتبة ومتسلسلة؛ business السابق اعتمد حداً أدنى Stepين.
104. StepOrder يبدأ من 1 ويكون sequential بدون duplicate orders.
105. الخدمات المستخدمة كـ Steps يجب أن تكون ضمن candidate rules الحالية ولا يتم قبول IDs عشوائية.
106. يمكن وجود أكثر من Workflow للخدمة، مع إمكانية تحديد واحدة Default.
107. لا يمكن اعتبار Inactive Workflow اختياراً افتراضياً صالحاً؛ SetDefault يتحقق من الحالة والملكية.
108. Deactivate/Reactivate تغير availability للـ definition ولا تنفذ Ticket transitions.
109. Workflow Start Options تعكس cardinality: لا توجد مسارات -> NoWorkflow؛ مسار واحد صالح -> AutoApply؛ أكثر من مسار -> SelectionRequired وفق business المعتمد.

### ما الذي يمكن للإدارة فعله؟

- List/Search workflows.
- Get details.
- Create/Update.
- Set Default.
- Deactivate/Reactivate.
- قراءة start options.
- قراءة candidate services.

### العلاقات وتأثيرها على باقي النظام

- قد تستخدم لاحقاً عند start Ticket لاختيار workflow، لكن تنفيذ انتقال Ticket بين steps لم يعتمد بعد.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الكل | `GET /api/branches/{branchId:int}/services/{leafServiceId:int}/workflows` | ServiceWorkflows.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| قراءة تفاصيل | `GET /api/branches/{branchId:int}/services/{leafServiceId:int}/workflows/{workflowId:int}` | ServiceWorkflows.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| إنشاء | `POST /api/branches/{branchId:int}/services/{leafServiceId:int}/workflows` | ServiceWorkflows.Create | إنشاء سجل تعريف جديد. |
| تعديل | `PUT /api/branches/{branchId:int}/services/{leafServiceId:int}/workflows/{workflowId:int}` | ServiceWorkflows.Update | تعديل البيانات مع حماية التزامن. |
| تعيين Default | `POST .../workflows/{workflowId:int}/set-default` | ServiceWorkflows.SetDefault | تعيين Active Workflow كالمسار الافتراضي وإزالة Default عن السابق. |
| إيقاف | `POST .../workflows/{workflowId:int}/deactivate` | ServiceWorkflows.Deactivate | إيقاف المورد مع الاحتفاظ به. |
| إعادة تفعيل | `POST .../workflows/{workflowId:int}/reactivate` | ServiceWorkflows.Reactivate | إعادة المورد للحالة Active. |
| خيارات البدء | `GET .../workflow-start-options` | ServiceWorkflows.ViewStartOptions | تحديد هل لا يوجد Workflow أو يطبق تلقائياً أو يلزم اختيار. |
| خدمات مرشحة | `GET /api/branches/{branchId:int}/services/workflow-candidates` | ServiceWorkflows.ViewCandidateServices | إرجاع الخدمات التي تصلح كخطوات داخل Workflow. |

### سيناريو Business عملي

إذا كانت الخدمة لها Workflow واحدة Active، يستطيع runtime المستقبلي تطبيقها تلقائياً؛ إذا لها أكثر من واحدة فالـ API الحالية تستطيع إرجاع أن الاختيار مطلوب، لكن transition الـ ticket نفسها ليست ضمن هذا الموديول.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- لا نعتبر ServiceWorkflow الحالية state machine للتذكرة.
- لا نضيف Park/Transfer/Complete بين steps بدون قواعد Ticket مؤكدة.

---

## 16. Service Globalization

**حالة الموديول:** موثق في آخر Snapshot Source من ناحية عرض طلبات الفرع والمراجعة المركزية.

### الهدف من الموديول

يعالج ترقية Service أو Tree محلية BranchScoped إلى definition Global/Central بعد Review بدل تعديل Scope مباشرة من الفرع.

### المفاهيم والكيانات الرئيسية

- **ServiceGlobalizationRequest**.
- **ServiceGlobalizationRequestItem**.
- **Status**: Pending / Approved / Rejected.
- **RequestType** لتحديد نوع الطلب.
- **If-Match/RowVersion** للمراجعة.

### قواعد البيزنس المؤكدة

110. الطلب يبدأ Pending ولا يمكن Review طلب ليس Pending.
111. Branch side ترى own طلباتها فقط عبر permission منفصلة.
112. Central side تعرض القائمة والتفاصيل وتملك permissions Approve/Reject مستقلة.
113. Approve يحول التعريفات المعتمدة في الطلب إلى Global ويزيل branch owner حيث تقتضي عملية globalization.
114. Reject لا يحذف service local؛ تبقى BranchScoped وتستمر في فرعها.
115. RejectionReason يمكن حفظها عند الرفض.
116. Reject/Approve تستخدم RowVersion عبر If-Match لمنع مراجعتين متعارضتين لنفس الطلب.
117. الـ Request قد تضم Items + Root عندما تشمل subtree/tree وليست بالضرورة Service واحدة فقط.

### ما الذي يمكن للإدارة فعله؟

- Branch: رؤية طلباته.
- Central: List/Details.
- Approve.
- Reject.

### العلاقات وتأثيرها على باقي النظام

- بعد approval تصبح الخدمة جزءاً من Central catalog ويمكن أن تستخدمها فروع أخرى عبر BranchService assignment.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| طلبات الفرع | `GET /api/branches/{branchId:int}/service-globalization-requests` | ServiceGlobalizationRequests.ViewOwn | قراءة بيانات لا تغير الحالة التشغيلية. |
| كل الطلبات | `GET /api/service-globalization-requests` | ServiceGlobalizationRequests.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| تفاصيل طلب | `GET /api/service-globalization-requests/{requestId:int}` | ServiceGlobalizationRequests.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| اعتماد | `POST /api/service-globalization-requests/{requestId:int}/approve` | ServiceGlobalizationRequests.Approve | اعتماد الطلب وتحويل التعريفات المعتمدة إلى Global. |
| رفض | `POST /api/service-globalization-requests/{requestId:int}/reject` | ServiceGlobalizationRequests.Reject | رفض الطلب مع بقاء الخدمة BranchScoped. |

### سيناريو Business عملي

فرع ينشئ Leaf محلية تحت Global Parent. إذا تم قبول Globalization تصبح الخدمة Global؛ إذا رفضت تظل local ولا تختفي من الفرع.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- لم يظهر في آخر Endpoint snapshot Controller مستقل واضح لإنشاء globalization request؛ لذلك لا يوثق هذا المرجع route إنشاء غير متحقق منها.

---

## 17. Segments

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

يستخدم Segment لتصنيف Business يميز سعة/أولوية/أنواع العملاء أو التذاكر. النظام يدعم Global Segments وBranchScoped Segments مع System Default Segment خاصة.

### المفاهيم والكيانات الرئيسية

- **Segment**: ArabicName, EnglishName, Priority, Scope, OwnerBranchId, IsSystemDefault, RowVersion.
- **SegmentScope**: Global / BranchScoped.
- **System Default Segment**.

### قواعد البيزنس المؤكدة

118. Segment Global لا تملك OwnerBranchId ويمكن إتاحتها لفروع متعددة.
119. Segment BranchScoped مملوكة لـ Branch واحدة ولا يجوز استخدامها كتعريف محلي لفرع آخر.
120. إنشاء Global يتم من route Central، وإنشاء BranchScoped يتم من route تحتوي branchId.
121. Priority قيمة ترتيب أولوية business؛ حالياً تستخدم أيضاً في ترتيب الخيارات، لكنها ليست Calling Algorithm نهائية.
122. System Default Segment حالة خاصة معتمدة: Global، Priority=0، IsSystemDefault=true.
123. System Default ليست Segment عادية يغير admin quota الخاصة بها يدوياً؛ quota الخاصة بها ناتجة عن المتبقي في module BranchServiceSegment.
124. Update يستخدم RowVersion ويجب أن يحترم القيود الخاصة بالـ Default System والـ Scope.

### ما الذي يمكن للإدارة فعله؟

- List/Search segments.
- Get details.
- Create Global.
- Create BranchScoped.
- Update permitted fields.

### العلاقات وتأثيرها على باقي النظام

- BranchServiceSegment يربط Segment بخدمة Leaf داخل Branch ويحدد quota.
- Globalization يسمح بتحويل BranchScoped Segment إلى Global بعد review.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| إنشاء BranchScoped | `POST /api/branches/{branchId:int}/segments` | Segments.CreateBranchScoped | إنشاء Segment BranchScoped مملوكة للفرع. |
| قراءة الكل | `GET /api/segments` | Segments.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| قراءة تفاصيل | `GET /api/segments/{segmentId:int}` | Segments.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| إنشاء Global | `POST /api/segments` | Segments.CreateGlobal | إنشاء Global Segment قابلة للاستخدام عبر الفروع. |
| تعديل | `PUT /api/segments/{segmentId:int}` | Segments.Update | تعديل البيانات مع حماية التزامن. |

### سيناريو Business عملي

يمكن تعريف "VIP" كـ Segment Global، وتعريف "موظفو الفرع" كـ BranchScoped في Branch واحدة. كلاهما يمكن أن يصبح مرشحاً لخدمة داخل الفرع إذا استوفى rules eligibility.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- لا نربط Priority الحالية مباشرة بترتيب call النهائي حتى يعتمد Calling Algorithm.

---

## 18. Branch Service Segments & Quotas

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

يربط Segment بخدمة Ticket-Issuable داخل Branch ويحدد مقدار السعة المحجوزة للـ Segments غير الافتراضية، بينما System Default Segment تحصل آلياً على باقي السعة.

### المفاهيم والكيانات الرئيسية

- **BranchServiceSegment**: BranchId + ServiceId + SegmentId + Quota + RowVersion.
- **Service ticket range capacity**.
- **System Default residual quota**.

### قواعد البيزنس المؤكدة

125. الربط يتم في سياق LeafService + Branch.
126. الخدمة يجب أن تكون مناسبة لـ quota logic، وأهم شرط عملي هو Ticket-Issuable مع Range صالح.
127. Capacity تحسب: RangeEndNumber - RangeStartNumber + 1.
128. مجموع quotas Segment non-default لا يجوز أن يتجاوز Capacity.
129. Default quota لا يدخلها admin يدوياً؛ تحسب: Capacity - Sum(non-default quotas).
130. Available Segments تستبعد System Default وتطبق: scope Global أو BranchScoped owned by same Branch.
131. Assign/UpdateQuota/Unassign يعيد حساب default quota حتى تظل السعة متوازنة.
132. لا يسمح بإلغاء ربط System Default كـ Segment عادية.
133. RowVersion تستخدم في تحديث quota وunassign، وIf-Match في عملية الحذف/فك الربط الحالية.

### ما الذي يمكن للإدارة فعله؟

- قراءة assigned segments.
- قراءة available candidates.
- Assign مجموعة segments مع quotas.
- Update quota.
- Unassign non-default segment.

### العلاقات وتأثيرها على باقي النظام

- Ticket Range في Service هي مصدر Capacity.
- Segment Priority موجودة لكن quota ليست calling-order formula.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة المرتبطة | `GET .../services/{leafServiceId:int}/segments` | BranchServiceSegments.View | قراءة الـ Segments المرتبطة فعلياً مع Quotas. |
| قراءة المتاحة | `GET .../segments/available` | BranchServiceSegments.ViewAvailable | إرجاع Segments الصالحة للربط مع استبعاد غير المسموح. |
| ربط Segments | `POST .../segments/assign` | BranchServiceSegments.Assign | ربط Segments وتخصيص Quotas مع احترام سعة Range. |
| تعديل Quota | `PUT .../segments/{segmentId:int}/quota` | BranchServiceSegments.UpdateQuota | تعديل Quota وإعادة حساب المتبقي للـ Default. |
| فك ربط | `DELETE .../segments/{segmentId:int}` | BranchServiceSegments.Unassign | فك Segment غير افتراضية ثم إعادة حساب Default quota. |

### سيناريو Business عملي

Range من 1 إلى 100 => Capacity=100. إذا VIP=20 وElderly=10، يصبح Default=70. طلب VIP=80 ثم Elderly=30 يرفض لأن الإجمالي 110 > 100.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- Quota الحالية لا تعني تلقائياً Reservation capacity ولا daily quota؛ هي مرتبطة بسعة range وفق الـ business الحالي.

---

## 19. Segment Globalization

**حالة الموديول:** موثق في آخر Snapshot Source من ناحية القراءة والمراجعة.

### الهدف من الموديول

يسمح بترقية BranchScoped Segment إلى Global بعد Approval مركزي، مع الاحتفاظ بها local إذا تم الرفض.

### المفاهيم والكيانات الرئيسية

- **SegmentGlobalizationRequest**.
- **Status**: Pending / Approved / Rejected.
- **RequestedBy/ReviewedBy/Times/RejectionReason**.
- **RowVersion**.

### قواعد البيزنس المؤكدة

134. الطلب Pending فقط قابل للمراجعة.
135. Branch side ترى own requests ضمن scope الفرع.
136. Central side تملك ViewAll/ViewDetails/Approve/Reject.
137. Approve يحول Segment إلى Global وفق قواعد domain ويزيل ownership المحلي المطلوب.
138. Reject يبقي Segment BranchScoped ولا يحذفها.
139. المراجعة تستخدم If-Match لمنع double review المتزامن.

### ما الذي يمكن للإدارة فعله؟

- Branch: list own requests.
- Central: list/details.
- Approve/Reject.

### العلاقات وتأثيرها على باقي النظام

- بعد approval يمكن أن تصبح Segment مرشحة لفروع أخرى من خلال BranchServiceSegment eligibility.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| طلبات الفرع | `GET /api/branches/{branchId:int}/segment-globalization-requests` | SegmentGlobalizationRequests.ViewOwn | قراءة بيانات لا تغير الحالة التشغيلية. |
| كل الطلبات | `GET /api/segment-globalization-requests` | SegmentGlobalizationRequests.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| تفاصيل طلب | `GET /api/segment-globalization-requests/{requestId:int}` | SegmentGlobalizationRequests.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| اعتماد | `POST /api/segment-globalization-requests/{requestId:int}/approve` | SegmentGlobalizationRequests.Approve | اعتماد Segment محلية لتصبح Global. |
| رفض | `POST /api/segment-globalization-requests/{requestId:int}/reject` | SegmentGlobalizationRequests.Reject | رفض Globalization مع بقاء Segment محلية. |

### سيناريو Business عملي

رفض طلب تحويل Segment محلية لا يعطل الـ Segment في فرعها؛ فقط يبقي scope المحلية.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- كما في Service Globalization، لا يظهر في آخر snapshot route Controller إنشاء request مستقل، لذلك لا نختلق واحداً.

---

## 20. Branch Videos وHLS Playlist

**حالة الموديول:** موثق في آخر Snapshot Source ومؤكد Business-wise.

### الهدف من الموديول

إدارة Playlist فيديو واحدة على مستوى Branch، مشتركة بين جميع Displays التابعة لها. الفيديو يمر بـ Processing إلى HLS حتى يكون مناسباً للتشغيل المستمر على الشاشات.

### المفاهيم والكيانات الرئيسية

- **BranchVideo**: original file/path, HlsManifestPath, DisplayOrder, IsActive, ProcessingStatus, RowVersion.
- **Processing states**: Processing / Ready / Failed.
- **Branch-level playlist**.
- **HLS runtime manifest**.

### قواعد البيزنس المؤكدة

140. لكل Branch playlist واحدة من الفيديوهات، وليس Playlist منفصلة لكل Display.
141. Upload ينشئ الفيديو Active لكنه يبدأ Processing؛ Active وحدها لا تكفي لاعتباره playable.
142. Runtime eligibility: IsActive=true + ProcessingStatus=Ready + HlsManifestPath موجود.
143. الفيديوهات القابلة للتشغيل ترتب ascending DisplayOrder.
144. Deactivate يبقي السجل والملفات لكنه يستبعد الفيديو من playlist runtime.
145. Reactivate يعيد الفيديو للحالة Active؛ ظهوره runtime يظل مشروطاً بـ HLS/Ready.
146. Permanent Delete معتمد فقط للفيديو Inactive؛ يجب Deactivate أولاً.
147. Reorder يستخدم RowVersion ويمنع duplicate/invalid display order.
148. الـ management endpoint /playlist يبقى protected، بينما Display public runtime يستخدم route مستقلة حتى لا يتجاوز logic ICurrentUser بطريقة غير آمنة.

### ما الذي يمكن للإدارة فعله؟

- List/filter videos.
- Upload.
- Reorder.
- Deactivate/Reactivate.
- Permanent Delete.
- قراءة playlist management.

### العلاقات وتأثيرها على باقي النظام

- Display runtime العام يعيد نفس eligible video logic من endpoint مستقلة.
- Physical Displays لا تملك video list خاصة بها.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة الفيديوهات | `GET /api/branches/{branchId:int}/display-videos` | Branches.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| رفع فيديو | `POST /api/branches/{branchId:int}/display-videos` | Branches.Update | رفع فيديو وإدخاله في مسار المعالجة إلى HLS؛ لا يجعله Playable حتى يصبح Ready. |
| إعادة ترتيب | `PUT /api/branches/{branchId:int}/display-videos/order` | Branches.Update | تغيير ترتيب Playlist مع حماية التزامن. |
| إيقاف | `POST /api/branches/{branchId:int}/display-videos/{videoId:int}/deactivate` | Branches.Update | إيقاف المورد مع الاحتفاظ به. |
| إعادة تفعيل | `POST /api/branches/{branchId:int}/display-videos/{videoId:int}/reactivate` | Branches.Update | إعادة المورد للحالة Active. |
| حذف نهائي | `DELETE /api/branches/{branchId:int}/display-videos/{videoId:int}/permanent` | Branches.Update | حذف الفيديو نهائياً بعد أن يكون Inactive أولاً. |
| قراءة playlist إدارية | `GET /api/branches/{branchId:int}/display-videos/playlist` | Branches.ViewDetails | قراءة الـ playlist الإدارية المحمية. |

### سيناريو Business عملي

عند رفع فيديو جديد لن يظهر على الشاشات أثناء Processing. بعد MarkReady ووجود HLS manifest يظهر إذا كان Active وفي ترتيبه. إذا Deactivate يختفي فوراً من runtime دون حذف الملفات.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- لا نعتبر رفع الفيديو Real-Time Streaming حياً؛ الـ implementation يعتمد HLS segmented media.

---

## 21. Branch Display Configuration & Messages

**حالة الموديول:** موثق في آخر Snapshot Source؛ الاختبارات تؤكد 11 route وأن reads الـ runtime فقط هما Anonymous.

### الهدف من الموديول

يوفر Theme ومحتوى Ticker لشاشة النداء على مستوى Branch. Configuration واحدة مشتركة لكل Displays الفرع، والرسائل قائمة مستقلة مرتبة وقابلة للتفعيل/الإيقاف.

### المفاهيم والكيانات الرئيسية

- **BranchDisplayConfiguration**: one-per-Branch.
- **BranchDisplayMessage**: many-per-Branch.
- **BranchBranding Logo** كـ source خارجي للـ Logo.
- **Public runtime response**.

### قواعد البيزنس المؤكدة

149. لا توجد Display Configuration لكل جهاز؛ Branch واحدة = Configuration واحدة مشتركة لكل شاشاتها.
150. الحقول الحالية: DisplayBackgroundColor; MainTitleAr/En; HeaderBackgroundColor; MainTitleTextColor; MainTitleFontSize.
151. Calling Table: TableHeaderBackgroundColor/TextColor; TableRowBackgroundColor/TextColor; TicketNumberBackgroundColor/TextColor.
152. Column labels بالعربي والإنجليزي: Ticket/Service/Window titles.
153. Ticker styling: TickerBackgroundColor, TickerTextColor, TickerFontSize.
154. Clock: ShowClock, ClockBackgroundColor, ClockTextColor.
155. لا توجد Highlighted/Called Row style؛ كل table rows تستخدم نفس style، ولا نبني status-specific colors من Ticket state.
156. Logo لا تخزن في DisplayConfiguration؛ Runtime تأخذها من BranchBranding.
157. Colors بصيغة #RRGGBB، وFont sizes ضمن limits الحالية (domain normalization في 1..100).
158. BranchDisplayMessage تحتوي: TextAr/TextEn, DisplayOrder, IsActive. الرسالة تنشأ Active.
159. لا يوجد endpoint Delete Message في المرحلة الحالية؛ lifecycle هو Update/Reorder/Deactivate/Reactivate.
160. Runtime Configuration لا تعيد RowVersion أو audit/admin metadata، وتعيد فقط Active messages وبالترتيب.

### ما الذي يمكن للإدارة فعله؟

- Create/Get/Update configuration.
- Get/Create/Update messages.
- Reorder messages.
- Deactivate/Reactivate messages.
- Public runtime config + public runtime playlist.

### العلاقات وتأثيرها على باقي النظام

- كل Displays Physical التابعة للـ Branch تقرأ نفس config.
- Logo من BranchBranding.
- Videos من BranchVideo runtime playlist.
- Calls نفسها ستأتي من Calling/Ticket runtime لاحقاً ولا تدمج هنا.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| قراءة Configuration | `GET /api/branches/{branchId:int}/display-configuration` | Branches.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| إنشاء Configuration | `POST /api/branches/{branchId:int}/display-configuration` | Branches.Update | إنشاء Configuration واحدة لشاشات الفرع؛ محاولة إنشاء ثانية تعتبر Conflict. |
| تعديل Configuration | `PUT /api/branches/{branchId:int}/display-configuration` | Branches.Update | تعديل مظهر شاشة النداء المشتركة. |
| قراءة الرسائل | `GET /api/branches/{branchId:int}/display-messages` | Branches.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| إضافة رسالة | `POST /api/branches/{branchId:int}/display-messages` | Branches.Update | إضافة رسالة Ticker جديدة Active بترتيب محدد. |
| تعديل رسالة | `PUT /api/branches/{branchId:int}/display-messages/{messageId:int}` | Branches.Update | تعديل البيانات مع حماية التزامن. |
| إعادة ترتيب الرسائل | `PUT /api/branches/{branchId:int}/display-messages/order` | Branches.Update | تعديل ترتيب رسائل الـ Ticker مع منع duplicate order. |
| إيقاف رسالة | `POST /api/branches/{branchId:int}/display-messages/{messageId:int}/deactivate` | Branches.Update | إخفاء رسالة من Runtime بدون حذفها. |
| إعادة تفعيل رسالة | `POST /api/branches/{branchId:int}/display-messages/{messageId:int}/reactivate` | Branches.Update | إعادة رسالة Inactive للـ Runtime. |
| Runtime Configuration عام | `GET /api/branches/{branchId:int}/display-runtime-configuration` | عام - AllowAnonymous | قراءة عامة: Logo + Display Configuration + الرسائل Active المرتبة، بدون metadata إدارية. |
| Runtime Playlist عام | `GET /api/branches/{branchId:int}/display-runtime-playlist` | عام - AllowAnonymous | قراءة عامة للـ playlist HLS القابلة للتشغيل: فيديوهات Ready + Active فقط وبالترتيب. |

### سيناريو Business عملي

صفحة Display تستقبل branchId فقط، تقرأ display-runtime-configuration لتكوين العنوان والألوان والـ Ticker والساعة، ثم display-runtime-playlist لتشغيل videos HLS. لا تحتاج JWT لهذه القراءات العامة.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- لا تضف DisplayId إلى runtime configuration لمجرد وجود displays physical؛ الـ business الحالي Branch-wide.
- لا يوجد hard delete للرسائل.

---

## 22. Customer/Public Runtime

**حالة الموديول:** موثق في آخر Snapshot Source.

### الهدف من الموديول

يجمع القراءات التي تحتاجها واجهات العميل/الشاشة بدون Admin session. الهدف أن تكون Runtime DTOs صغيرة وموجهة للعرض، مع إعادة استخدام نفس Business filters بدل كشف endpoints إدارية.

### المفاهيم والكيانات الرئيسية

- **Ticket-Issuable Services public read**.
- **Display Runtime Configuration public read**.
- **Display Runtime Playlist public read**.
- **Login route** عام لكنه ليس display/customer data read.

### قواعد البيزنس المؤكدة

161. GET ticket-issuable-services أصبح AllowAnonymous في آخر snapshot الحالي.
162. الخدمة لا تظهر لمجرد أنها IsTicketIssuable؛ يجب أن تكون Leaf، فعالة، غير محذوفة، متاحة في branch، وتحقق schedule eligibility.
163. Effective hierarchy مهم: Parent inactive/deleted يمكن أن يجعل descendant غير eligible حتى لو كانت child نفسها active.
164. الـ response يعيد tree path المطلوبة للـ Navigation؛ Parent قد تظهر في tree للعبور لكنها ليست ticket-issuable نفسها.
165. عند عدم وجود أي service eligible، النجاح بقائمة فارغة أفضل من تحويل الحالة إلى error.
166. Display runtime configuration يعيد Logo + config + Active ordered messages، وليس admin RowVersions.
167. Display runtime playlist يعيد فقط الفيديوهات Active + Ready + HLS manifest وبالترتيب.
168. Public endpoints لا يجب أن تعتمد على ICurrentUser لإتاحة البيانات؛ يتم بناء query عامة آمنة ومقيدة بالـ BranchId وrules الـ runtime.

### ما الذي يمكن للإدارة فعله؟

- قراءة الخدمات المؤهلة للعميل.
- قراءة شكل Display ورسائلها.
- قراءة video playlist العامة.

### العلاقات وتأثيرها على باقي النظام

- Schedule وBranchConfiguration يؤثران على خدمة العميل.
- Branding يرافق تجربة الخدمة.
- Display public reads لا تنشئ/تعدل أي business state.

### الـ Endpoints وتأثير كل واحدة على البيزنس

| العملية | Endpoint | Permission / الوصول | التأثير على البيزنس |
|---|---|---|---|
| تسجيل الدخول | `POST /api/auth/login` | عام | تسجيل دخول المستخدم وإصدار سياق المصادقة المطلوب لباقي النظام. |
| Runtime Configuration عام | `GET /api/branches/{branchId:int}/display-runtime-configuration` | عام - AllowAnonymous | قراءة عامة: Logo + Display Configuration + الرسائل Active المرتبة. |
| Runtime Playlist عام | `GET /api/branches/{branchId:int}/display-runtime-playlist` | عام - AllowAnonymous | قراءة عامة للـ playlist HLS: فيديوهات Ready + Active فقط وبالترتيب. |
| خدمات قابلة للإصدار | `GET /api/branches/{branchId:int}/ticket-issuable-services` | عام - AllowAnonymous | إرجاع شجرة الخدمات المؤهلة حالياً؛ لا ينشئ تذكرة. |

### سيناريو Business عملي

عميل يفتح Terminal/واجهة خدمة لـ Branch 10: النظام يعيد فقط service tree المؤهلة الآن. شاشة نداء في نفس Branch تستدعي runtime config وplaylist. كل هذه عمليات Read-only.

### ما الذي لا يجب استنتاجه من هذا الموديول؟

- هذه القراءات لا تصدر Ticket حتى الآن.
- لا تسمح endpoints العامة بإدارة الفرع أو تغيير الرسائل/الفيديوهات.

---

## 23. سلوكيات Business مشتركة عبر النظام

### التزامن Optimistic Concurrency

عدد كبير من الموارد يحمل RowVersion. الفكرة Business-wise أن مستخدماً لا يجب أن يكتب فوق تعديل أحدث لمستخدم آخر بدون أن يعرف. Update أو Change State تستقبل RowVersion في Body أو If-Match حسب الـ endpoint، وعند stale version يرجع Conflict بدل silent overwrite.

Branch/Branding/Service/Segment/Schedule/Workflow/Quotas/Media ordering/Display messages/config كلها تستخدم التزامن بدرجات مختلفة.

- بعد mutation ناجحة يجب اعتماد RowVersion الجديدة الناتجة وعدم إعادة استخدام القديمة.
- عمليات reorder تستخدم versions لكل item لأن التغيير يمس مجموعة records في عملية واحدة.

### Result Pattern وProblemDetails

الأخطاء المتوقعة Business-wise لا تستخدم exceptions كمسار عادي؛ يتم تحويلها إلى Result ثم ProblemDetails/HTTP semantics ثابتة.

| الفئة | متى تستخدم Business-wise |
|---|---|
| Validation | مدخلات غير صالحة مثل Id <= 0، format غير صحيح، quota خارج السعة، color غير صالح. |
| NotFound | المورد أو المرجع المطلوب غير موجود. |
| Conflict | Duplicate، حالة غير صالحة للانتقال، stale RowVersion، order conflict، record موجود بالفعل. |
| Unauthorized | لا يوجد سياق Authentication صالح. |
| Forbidden/Security | المستخدم authenticated لكنه لا يملك permission أو branch scope المطلوبة. |

### Delete مقابل Deactivate

Deactivate يعني إيقافاً قابلاً للعكس مع الاحتفاظ بالتاريخ والعلاقات، مع Operational Masters. Permanent Delete يعني إزالة نهائية ومشروطة. لا يتم استخدام Delete كاختصار لإيقاف عنصر ما.

### Localization

النظام يدعم رسائل عربية وإنجليزية عبر Resource files وتُحترم Accept-Language/Culture في الرسائل. بيانات الأعمال التي تحتاج presentation bilingual — مثل titles/messages/names — تخزن حقولاً عربية وإنجليزية حيث تم اعتماد ذلك.

### Search وPagination

قوائم الإدارة الثقيلة تستخدم Pagination وSearchText حيث تم إضافته، مع no-tracking/projection على read paths حسب architecture الحالية. Business effect: الإدارة تستطيع البحث دون تحميل كامل dataset أو تغيير state.

### Caching وRuntime

الـ runtime reads — مثل branding/service selection وdisplay configuration/playlist — عالية التكرار وتستخدم cache tags/invalidation في application architecture. أي mutation للمورد المؤثر يجب أن تبطل cache ذات الصلة حتى ترى الشاشة/العميل التعديل بدون انتظار بيانات قديمة.

---

## 24. End-to-End Business Flows الحالية

### Flow A - تجهيز Branch جديدة

169. إنشاء Branch وتحديد IP/Location الأساسية.
170. إنشاء Branch Admin بواسطة user يملك Create BranchAdmins.
171. Branch Admin يغير Temporary Password في First Login.
172. إنشاء Waiting Areas ثم Windows ثم Displays/Terminals حسب البنية الفعلية.
173. تكوين Branch Branding وLogo وAdvertisements عند الحاجة.
174. إنشاء/ربط Services ثم Schedule وSegments/Quotas وWorkflow definitions.
175. تهيئة Display Configuration ورسائل Ticker ورفع videos ومعالجتها إلى HLS.

### Flow B - إعداد خدمة للعميل

176. تعريف Service في Central Catalog أو إنشاء BranchScoped tree.
177. إذا Global: Assign الخدمة للـ Branch.
178. التأكد أن node نهائي Leaf وأن IsTicketIssuable=true وأن ancestors فعالة.
179. إنشاء ServiceSchedule للـ Branch + Leaf.
180. تطبيق Segment quotas إذا كانت ticket range مستخدمة.
181. عند طلب العميل: public ticket-issuable endpoint يجمع Branch + Service + Hierarchy + Schedule + AllowedTime rules ويرجع tree eligible فقط.

### Flow C - شاشة النداء

182. تعريف Display physical وربط Windows المطلوبة عبر DisplayWindow.
183. إنشاء BranchDisplayConfiguration واحدة للفرع.
184. إضافة رسائل ticker وترتيبها وتفعيل المطلوب.
185. رفع videos للـ Branch؛ تنتظر حتى ProcessingStatus=Ready ومanifest HLS موجود.
186. صفحة Display العامة تقرأ display-runtime-configuration وdisplay-runtime-playlist بواسطة branchId.
187. Call rows نفسها ستحتاج Calling/Ticket runtime لاحقاً؛ هذا المرجع لا يخترع مصدرها الحالي.

### Flow D - Globalization

188. فرع يمتلك Service أو BranchScoped Segment.
189. توجد Globalization Request بحالة Pending.
190. الفرع يستطيع رؤية own requests.
191. Central reviewer يعرض التفاصيل ويعمل Approve أو Reject مع If-Match.
192. Approve يحول التعريف إلى Global؛ Reject يتركه BranchScoped وقابلاً للاستخدام محلياً.

---

## 25. الموديولات غير المنفذة أو غير المحسومة بالكامل

### سبب وجود هذا القسم

الهدف حماية المشروع من اعتبار أسماء موجودة في الـ business context كأنها flows مكتملة. هذه النقاط تظل open intentionally حتى تعتمد متطلباتها.

| المنطقة | الوضع الحالي |
|---|---|
| Ticket Runtime | Ticket هي المعاملة المركزية المتوقعة للـ Queue، لكن إنشاء التذكرة وLifecycle النهائية لم توثق في الـ snapshot API الحالي كـ Flow مكتمل. النموذج المحتمل New -> Waiting -> Called -> In Progress -> Completed -> Archived لا يثبت كنهائي إلا بعد اعتماد القواعد. |
| Reservation Runtime | HasReservation موجودة كقابلية على Service، لكن Reservation -> Ticket conversion، expiration، cancellation، no-show وسياسات الحجز لم تحسم. لا نفترض أي automation. |
| Calling Algorithm | قد يأخذ WindowService priority وService priority وSegment priority وService weight وwaiting time/type وreservation/ticket، لكن الترتيب والمعادلة النهائية غير معتمدة. لا يوجد سبب لتثبيت formula الآن. |
| Operator & Sessions | Operator assignment/login/session/start/complete runtime لم يظهر كموديول API مكتمل في snapshot الحالي. |
| Ticket actions | Park, Transfer, Recall, Cancel, NoShow, Resolved ليست حالات نضيفها حتى تعتمد كل واحدة Business-wise. |
| WindowService | العلاقة ضمن الصورة الكبرى للنظام، لكن rules/API الحالية الخاصة بربط Window بالخدمات ليست جزءاً من source snapshot المراجع. |
| GlobalConfiguration | المفهوم موجود في سياق المشروع الأوسع كـ PropertyName/PropertyValue/ModuleName، لكن لم يتم العثور على Controller/Entity موثق في آخر dump الحالي؛ لذلك لا نوثق CRUD غير موجود. |
| Logging / Map / Audit / Synchronization | هذه areas Business ضمن scope الأوسع، لكن لا توجد endpoints/flows مكتملة موثقة في snapshot الحالي تكفي لكتابة مرجع Business لها بدون افتراض. |

---

## 26. كتالوج كل الـ Endpoints الحالية

القائمة التالية مولدة من آخر Snapshot Source وتم التحقق من وجود 126 API action. الهدف أن يكون لديك مرجع route-by-route مع business impact/access. الـ 3 endpoints الخاصة بـ BranchConfiguration موثقة في فصلها كـ Snapshot سابق ولا تدخل في هذا العدد.

### AuthController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| POST | `/api/auth/login` | عام | تسجيل دخول المستخدم والتحقق من بيانات الاعتماد وإصدار سياق المصادقة المطلوب لباقي النظام. |
| POST | `/api/auth/change-initial-password` | Authenticated | إجبار المستخدم الذي دخل بكلمة مرور مؤقتة على استبدالها قبل الاستخدام التشغيلي الطبيعي. |

### BranchDisplaysController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/branches/{branchId:int}/display-configuration` | Branches.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/branches/{branchId:int}/display-configuration` | Branches.Update | إنشاء Configuration واحدة لشاشات الفرع كلها؛ محاولة إنشاء ثانية تعتبر Conflict. |
| PUT | `/api/branches/{branchId:int}/display-configuration` | Branches.Update | تعديل مظهر شاشة النداء المشتركة لكل Displays الفرع. |
| GET | `/api/branches/{branchId:int}/display-messages` | Branches.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/branches/{branchId:int}/display-messages` | Branches.Update | إضافة رسالة Ticker جديدة Active بترتيب محدد. |
| PUT | `/api/branches/{branchId:int}/display-messages/{messageId:int}` | Branches.Update | تعديل البيانات المسموح بها مع تطبيق validation وحماية التزامن عند وجود RowVersion. |
| PUT | `/api/branches/{branchId:int}/display-messages/order` | Branches.Update | تعديل ترتيب رسائل الـ Ticker مع منع duplicate order وحماية RowVersion. |
| POST | `/api/branches/{branchId:int}/display-messages/{messageId:int}/deactivate` | Branches.Update | إخفاء رسالة من Runtime بدون حذفها. |
| POST | `/api/branches/{branchId:int}/display-messages/{messageId:int}/reactivate` | Branches.Update | إعادة رسالة Inactive للـ Runtime. |
| GET | `/api/branches/{branchId:int}/display-runtime-configuration` | عام - AllowAnonymous | قراءة عامة لشاشة العرض: Logo + Display Configuration + الرسائل Active المرتبة، بدون metadata إدارية. |
| GET | `/api/branches/{branchId:int}/display-runtime-playlist` | عام - AllowAnonymous | قراءة عامة للـ playlist HLS القابلة للتشغيل: فيديوهات Ready + Active فقط وبالترتيب. |

### BranchSegmentGlobalizationRequestsController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/branches/{branchId:int}/segment-globalization-requests` | SegmentGlobalizationRequests.ViewOwn | قراءة بيانات لا تغير الحالة التشغيلية. |

### BranchSegmentsController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| POST | `/api/branches/{branchId:int}/segments` | Segments.CreateBranchScoped | إنشاء Segment BranchScoped مملوكة للفرع. |

### BranchServiceSchedulesController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/branches/{branchId:int}/services/{leafServiceId:int}/schedule` | ServiceSchedules.View | قراءة جدول إتاحة Service Leaf داخل Branch. |
| POST | `/api/branches/{branchId:int}/services/{leafServiceId:int}/schedule` | ServiceSchedules.Create | إنشاء Schedule واحدة للخدمة داخل الفرع بأيام وفترات عمل وقواعد SlotCode. |
| PUT | `/api/branches/{branchId:int}/services/{leafServiceId:int}/schedule` | ServiceSchedules.Update | تعديل أيام/فترات الجدول وSlotCode مع RowVersion. |

### BranchServiceSegmentsController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/branches/{branchId:int}/services/{leafServiceId:int}/segments` | BranchServiceSegments.View | قراءة الـ Segments المرتبطة فعلياً بالخدمة داخل الفرع مع Quotas. |
| GET | `/api/branches/{branchId:int}/services/{leafServiceId:int}/segments/available` | BranchServiceSegments.ViewAvailable | إرجاع Segments الصالحة للربط بالخدمة مع استبعاد غير المسموح ومنها System Default. |
| POST | `/api/branches/{branchId:int}/services/{leafServiceId:int}/segments/assign` | BranchServiceSegments.Assign | ربط Segments بالخدمة وتخصيص Quotas مع احترام سعة Ticket Range وإعادة حساب Default quota. |
| PUT | `/api/branches/{branchId:int}/services/{leafServiceId:int}/segments/{segmentId:int}/quota` | BranchServiceSegments.UpdateQuota | تعديل Segment Quota وإعادة التحقق من إجمالي السعة وإعادة حساب المتبقي للـ Default Segment. |
| DELETE | `/api/branches/{branchId:int}/services/{leafServiceId:int}/segments/{segmentId:int}` | BranchServiceSegments.Unassign | فك Segment غير افتراضية من الخدمة ثم إعادة حساب Default quota. |

### BranchServiceWorkflowsController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/branches/{branchId:int}/services/{leafServiceId:int}/workflows` | ServiceWorkflows.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/branches/{branchId:int}/services/{leafServiceId:int}/workflows/{workflowId:int}` | ServiceWorkflows.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/branches/{branchId:int}/services/{leafServiceId:int}/workflows` | ServiceWorkflows.Create | إنشاء سجل تعريف جديد بعد التحقق من الـ Business Rules والـ Scope والبيانات المرجعية. |
| PUT | `/api/branches/{branchId:int}/services/{leafServiceId:int}/workflows/{workflowId:int}` | ServiceWorkflows.Update | تعديل البيانات المسموح بها مع تطبيق validation وحماية التزامن عند وجود RowVersion. |
| POST | `/api/branches/{branchId:int}/services/{leafServiceId:int}/workflows/{workflowId:int}/set-default` | ServiceWorkflows.SetDefault | تعيين Active Workflow كالمسار الافتراضي للخدمة وإزالة Default عن المسار السابق. |
| POST | `/api/branches/{branchId:int}/services/{leafServiceId:int}/workflows/{workflowId:int}/deactivate` | ServiceWorkflows.Deactivate | إيقاف المورد عن الاستخدام التشغيلي مع الاحتفاظ به بدل الحذف. |
| POST | `/api/branches/{branchId:int}/services/{leafServiceId:int}/workflows/{workflowId:int}/reactivate` | ServiceWorkflows.Reactivate | إعادة المورد الموقوف إلى الحالة Active عند السماح بذلك. |
| GET | `/api/branches/{branchId:int}/services/{leafServiceId:int}/workflow-start-options` | ServiceWorkflows.ViewStartOptions | تحديد هل لا يوجد Workflow أو يطبق تلقائياً أو يلزم اختيار حسب عدد المسارات المتاحة. |

### BranchVideosController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/branches/{branchId:int}/display-videos` | Branches.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/branches/{branchId:int}/display-videos` | Branches.Update | رفع فيديو للفرع وإدخاله في مسار المعالجة إلى HLS؛ الرفع وحده لا يجعله Playable حتى يصبح Ready. |
| PUT | `/api/branches/{branchId:int}/display-videos/order` | Branches.Update | تغيير ترتيب Playlist الفرع مع حماية التزامن ومنع تضارب DisplayOrder. |
| POST | `/api/branches/{branchId:int}/display-videos/{videoId:int}/deactivate` | Branches.Update | إيقاف المورد عن الاستخدام التشغيلي مع الاحتفاظ به بدل الحذف. |
| POST | `/api/branches/{branchId:int}/display-videos/{videoId:int}/reactivate` | Branches.Update | إعادة المورد الموقوف إلى الحالة Active عند السماح بذلك. |
| DELETE | `/api/branches/{branchId:int}/display-videos/{videoId:int}/permanent` | Branches.Update | حذف الفيديو نهائياً بعد استيفاء قاعدة أنه يجب أن يكون Inactive أولاً. |
| GET | `/api/branches/{branchId:int}/display-videos/playlist` | Branches.ViewDetails | قراءة الـ playlist الإدارية المحمية للفيديوهات القابلة للتشغيل. |

### BranchWorkflowCandidatesController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/branches/{branchId:int}/services/workflow-candidates` | ServiceWorkflows.ViewCandidateServices | إرجاع الخدمات التي تصلح كخطوات داخل Workflow في سياق الفرع. |

### BranchesController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/branches` | Branches.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/branches/{branchId:int}` | Branches.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/branches/{branchId:int}/services/tree` | BranchServices.View | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/branches/{branchId:int}/ticket-issuable-services` | عام - AllowAnonymous | إرجاع شجرة الخدمات التي يمكن للعميل الوصول إليها حالياً؛ لا ينشئ تذكرة. |
| POST | `/api/branches/{branchId:int}/services/assign` | BranchServices.Assign | ربط تعريفات خدمات بالفرع؛ الربط لا يغير تعريف الخدمة نفسها. |
| POST | `/api/branches/{branchId:int}/service-trees` | BranchServiceTrees.Create | إنشاء شجرة خدمات BranchScoped مملوكة للفرع وفق قواعد الـ Hierarchy والـ Leaf. |
| POST | `/api/branches/{branchId:int}/services/{parentServiceId:int}/subtree` | BranchServiceTrees.Create | إضافة Subtree محلية تحت Parent مسموح بها دون إعادة بناء الشجرة كاملة. |
| GET | `/api/branches/{branchId:int}/service-globalization-requests` | ServiceGlobalizationRequests.ViewOwn | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/branches/{branchId:int}/branding` | Branches.ViewDetails | قراءة الشكل والـ UX configuration الخاصة بالفرع. |
| PUT | `/api/branches/{branchId:int}/branding/theme` | Branches.Update | تعديل ألوان وسلوكيات واجهة العميل الخاصة بالفرع مع حماية التزامن. |
| PUT | `/api/branches/{branchId:int}/branding/logo` | Branches.Update | تغيير Logo الفرع، وهو مصدر الـ Logo الذي يعاد استخدامه أيضاً في أي Display Runtime. |
| GET | `/api/branches/{branchId:int}/advertisements` | Branches.ViewDetails | قراءة صور إعلانات الفرع، مع إمكانية التصفية بالحالة. |
| POST | `/api/branches/{branchId:int}/advertisements` | Branches.Update | إضافة صور إعلانية للفرع وإدخالها في ترتيب العرض مع تحقق السعة/الملف. |
| PUT | `/api/branches/{branchId:int}/advertisements/order` | Branches.Update | إعادة ترتيب الإعلانات بدون حذفها أو تغيير تعريف الفرع. |
| POST | `/api/branches/{branchId:int}/advertisements/{advertisementId:int}/deactivate` | Branches.Update | إخفاء الإعلان تشغيلياً مع الاحتفاظ بالسجل والملف. |
| POST | `/api/branches/{branchId:int}/advertisements/{advertisementId:int}/reactivate` | Branches.Update | إعادة إعلان Inactive للاستخدام التشغيلي. |
| DELETE | `/api/branches/{branchId:int}/advertisements/{advertisementId:int}` | Branches.Update | حذف الإعلان وإزالة مرجعه، مع محاولة تنظيف ملفه. |
| POST | `/api/branches` | Branches.Create | إنشاء سجل تعريف جديد بعد التحقق من الـ Business Rules والـ Scope والبيانات المرجعية. |
| POST | `/api/branches/{branchId:int}/admins` | BranchAdmins.Create | إنشاء Branch Admin وربطه بالفرع مع كلمة مرور مؤقتة ومسار First Login. |
| PUT | `/api/branches/{branchId:int}` | Branches.Update | تعديل البيانات المسموح بها مع تطبيق validation وحماية التزامن عند وجود RowVersion. |
| POST | `/api/branches/{branchId:int}/deactivate` | Branches.Deactivate | إيقاف المورد عن الاستخدام التشغيلي مع الاحتفاظ به بدل الحذف. |
| POST | `/api/branches/{branchId:int}/reactivate` | Branches.Reactivate | إعادة المورد الموقوف إلى الحالة Active عند السماح بذلك. |
| DELETE | `/api/branches/{branchId:int}/permanent` | Branches.DeletePermanent | حذف نهائي مشروط بالحالة والعلاقات؛ لا يستخدم كبديل عادي للـ Deactivate. |
| DELETE | `/api/branches/{branchId:int}/services/{leafServiceId:int}` | BranchServices.Unassign | فك ربط Service Leaf من الفرع عندما تسمح قواعد الـ Scope بذلك؛ لا يعني حذف تعريف الخدمة. |

### DisplaysController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/displays` | Displays.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/displays/{displayId:int}` | Displays.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/displays/{displayId:int}/windows` | DisplayWindows.ViewLinked | قراءة Windows المرتبطة بالشاشة حالياً. |
| GET | `/api/displays/{displayId:int}/available-windows` | DisplayWindows.ViewAvailable | إرجاع Windows المرشحة للربط بالشاشة وفق القواعد الحالية. |
| POST | `/api/displays/{displayId:int}/windows/{windowId:int}` | DisplayWindows.Assign | إنشاء DisplayWindow link لتحديد Window مرتبطة بالشاشة ومنع تكرار نفس الزوج. |
| DELETE | `/api/displays/{displayId:int}/windows/{windowId:int}` | DisplayWindows.Unassign | إزالة علاقة DisplayWindow بدون حذف الشاشة أو الـ Window. |
| POST | `/api/displays` | Displays.Create | إنشاء سجل تعريف جديد بعد التحقق من الـ Business Rules والـ Scope والبيانات المرجعية. |
| PUT | `/api/displays/{displayId:int}` | Displays.Update | تعديل البيانات المسموح بها مع تطبيق validation وحماية التزامن عند وجود RowVersion. |
| POST | `/api/displays/{displayId:int}/deactivate` | Displays.Deactivate | إيقاف المورد عن الاستخدام التشغيلي مع الاحتفاظ به بدل الحذف. |
| POST | `/api/displays/{displayId:int}/reactivate` | Displays.Reactivate | إعادة المورد الموقوف إلى الحالة Active عند السماح بذلك. |
| DELETE | `/api/displays/{displayId:int}/permanent` | Displays.DeletePermanent | حذف نهائي مشروط بالحالة والعلاقات؛ لا يستخدم كبديل عادي للـ Deactivate. |

### GeneralBrandController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/general-brand` | GeneralBrand.View | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/general-brand` | GeneralBrand.Create | إنشاء Singleton General Brand للنظام، ويعمل كتعريف Branding عام. |
| PUT | `/api/general-brand` | GeneralBrand.Update | تعديل الـ General Brand مع RowVersion. |

### SegmentGlobalizationRequestsController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/segment-globalization-requests` | SegmentGlobalizationRequests.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/segment-globalization-requests/{requestId:int}` | SegmentGlobalizationRequests.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/segment-globalization-requests/{requestId:int}/approve` | SegmentGlobalizationRequests.Approve | اعتماد Segment محلية لتصبح Global. |
| POST | `/api/segment-globalization-requests/{requestId:int}/reject` | SegmentGlobalizationRequests.Reject | رفض Globalization مع بقاء Segment محلية في فرعها. |

### SegmentsController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/segments` | Segments.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/segments/{segmentId:int}` | Segments.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/segments` | Segments.CreateGlobal | إنشاء Global Segment قابلة للاستخدام عبر الفروع وفق قواعد الـ Scope. |
| PUT | `/api/segments/{segmentId:int}` | Segments.Update | تعديل البيانات المسموح بها مع تطبيق validation وحماية التزامن عند وجود RowVersion. |

### ServiceGlobalizationRequestsController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/service-globalization-requests` | ServiceGlobalizationRequests.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/service-globalization-requests/{requestId:int}` | ServiceGlobalizationRequests.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/service-globalization-requests/{requestId:int}/approve` | ServiceGlobalizationRequests.Approve | اعتماد طلب Globalization وتحويل التعريفات المعتمدة إلى Global وفق الطلب. |
| POST | `/api/service-globalization-requests/{requestId:int}/reject` | ServiceGlobalizationRequests.Reject | رفض طلب Globalization مع بقاء الخدمة BranchScoped قابلة للاستخدام في فرعها. |

### ServicesController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/services` | Services.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/services/tree` | Services.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/services/central-tree` | Services.ViewCentralTree | قراءة شجرة الخدمات المركزية المستخدمة ككتالوج Central. |
| GET | `/api/services/available-parents` | Services.ViewAll | إرجاع Parents المسموح اختيارها عند إنشاء/نقل Service مع منع تكوين Hierarchy غير صالحة. |
| GET | `/api/services/selection-options` | Services.ViewAll | إرجاع الخيارات المساندة المطلوبة لإدارة تعريف الخدمة. |
| GET | `/api/services/{serviceId:int}` | Services.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/services` | Services.Create | إنشاء سجل تعريف جديد بعد التحقق من الـ Business Rules والـ Scope والبيانات المرجعية. |
| PUT | `/api/services/{serviceId:int}` | Services.Update | تعديل البيانات المسموح بها مع تطبيق validation وحماية التزامن عند وجود RowVersion. |
| GET | `/api/services/{serviceId:int}/images` | Services.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/services/{serviceId:int}/images/logo` | Services.Update | رفع Logo خاص بالخدمة، منفصل عن Logo الفرع. |
| POST | `/api/services/{serviceId:int}/images/icon` | Services.Update | رفع Icon خاص بالخدمة. |
| POST | `/api/services/{serviceId:int}/images/ads` | Services.Update | إضافة صور Ads مرتبطة بالخدمة نفسها، لا بإعلانات الفرع. |
| DELETE | `/api/services/{serviceId:int}/images/{imageId:int}` | Services.Update | حذف Media مرتبطة بالخدمة وفق نوعها. |
| DELETE | `/api/services/{serviceId:int}` | Services.Delete | Soft Delete لتعريف الخدمة مع الحفاظ على السجل والعلاقات التاريخية. |
| POST | `/api/services/{serviceId:int}/restore` | Services.Restore | إعادة Service soft-deleted عند استيفاء القواعد. |
| DELETE | `/api/services/{serviceId:int}/permanent` | Services.DeletePermanent | حذف نهائي لتعريف الخدمة فقط عندما لا تمنعه العلاقات/الاستخدام التاريخي. |

### TerminalsController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/terminals` | Terminals.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/terminals/{terminalId:int}` | Terminals.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/terminals` | Terminals.Create | إنشاء سجل تعريف جديد بعد التحقق من الـ Business Rules والـ Scope والبيانات المرجعية. |
| PUT | `/api/terminals/{terminalId:int}` | Terminals.Update | تعديل البيانات المسموح بها مع تطبيق validation وحماية التزامن عند وجود RowVersion. |
| POST | `/api/terminals/{terminalId:int}/deactivate` | Terminals.Deactivate | إيقاف المورد عن الاستخدام التشغيلي مع الاحتفاظ به بدل الحذف. |
| POST | `/api/terminals/{terminalId:int}/reactivate` | Terminals.Reactivate | إعادة المورد الموقوف إلى الحالة Active عند السماح بذلك. |
| DELETE | `/api/terminals/{terminalId:int}/permanent` | Terminals.DeletePermanent | حذف نهائي مشروط بالحالة والعلاقات؛ لا يستخدم كبديل عادي للـ Deactivate. |

### WaitingAreasController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/waiting-areas` | WaitingAreas.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/waiting-areas/{waitingAreaId:int}` | WaitingAreas.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/waiting-areas` | WaitingAreas.Create | إنشاء سجل تعريف جديد بعد التحقق من الـ Business Rules والـ Scope والبيانات المرجعية. |
| PUT | `/api/waiting-areas/{waitingAreaId:int}` | WaitingAreas.Update | تعديل البيانات المسموح بها مع تطبيق validation وحماية التزامن عند وجود RowVersion. |
| POST | `/api/waiting-areas/{waitingAreaId:int}/deactivate` | WaitingAreas.Deactivate | إيقاف المورد عن الاستخدام التشغيلي مع الاحتفاظ به بدل الحذف. |
| POST | `/api/waiting-areas/{waitingAreaId:int}/reactivate` | WaitingAreas.Reactivate | إعادة المورد الموقوف إلى الحالة Active عند السماح بذلك. |
| DELETE | `/api/waiting-areas/{waitingAreaId:int}/permanent` | WaitingAreas.DeletePermanent | حذف نهائي مشروط بالحالة والعلاقات؛ لا يستخدم كبديل عادي للـ Deactivate. |

### WindowsController

| Method | Endpoint | الوصول | Business-wise التأثير |
|---|---|---|---|
| GET | `/api/windows` | Windows.ViewAll | قراءة بيانات لا تغير الحالة التشغيلية. |
| GET | `/api/windows/{windowId:int}` | Windows.ViewDetails | قراءة بيانات لا تغير الحالة التشغيلية. |
| POST | `/api/windows` | Windows.Create | إنشاء سجل تعريف جديد بعد التحقق من الـ Business Rules والـ Scope والبيانات المرجعية. |
| PUT | `/api/windows/{windowId:int}` | Windows.Update | تعديل البيانات المسموح بها مع تطبيق validation وحماية التزامن عند وجود RowVersion. |
| POST | `/api/windows/{windowId:int}/deactivate` | Windows.Deactivate | إيقاف المورد عن الاستخدام التشغيلي مع الاحتفاظ به بدل الحذف. |
| POST | `/api/windows/{windowId:int}/reactivate` | Windows.Reactivate | إعادة المورد الموقوف إلى الحالة Active عند السماح بذلك. |
| DELETE | `/api/windows/{windowId:int}/permanent` | Windows.DeletePermanent | حذف نهائي مشروط بالحالة والعلاقات؛ لا يستخدم كبديل عادي للـ Deactivate. |

---

## ملحق A - خريطة الكيانات الحالية

| Entity | الدور Business-wise |
|---|---|
| Branch | الموقع التشغيلي الأعلى. |
| Location | عنوان وإحداثيات الفرع. |
| BranchBranding | Theme وLogo الخاصة بالفرع. |
| GeneralBrand | Theme العام Singleton. |
| BranchAdvertisement | صورة إعلان Branch-level. |
| WaitingArea | منطقة انتظار داخل الفرع. |
| Window | نقطة تقديم خدمة داخل WaitingArea. |
| Terminal | جهاز مرتبط بـ Window. |
| Display | شاشة فيزيائية داخل Branch. |
| DisplayWindow | علاقة Display <-> Window. |
| Service | تعريف خدمة Hierarchical Global/BranchScoped. |
| ServiceCustomInput | تعريف بيانات إضافية تطلبها Service Leaf. |
| ServiceImage | Media خاصة بالخدمة. |
| BranchService | ربط Service بـ Branch. |
| ServiceSchedule | جدول إتاحة خدمة داخل Branch. |
| ServiceScheduleTimeSlot | فترة زمنية داخل يوم schedule. |
| ServiceWorkflow | تعريف Workflow لخدمة داخل Branch. |
| ServiceWorkflowStep | خطوة مرتبة داخل Workflow. |
| ServiceGlobalizationRequest | طلب تحويل خدمة محلية إلى Global. |
| ServiceGlobalizationRequestItem | الخدمات المشمولة بطلب Globalization. |
| Segment | تصنيف عميل/تذكرة Global أو BranchScoped. |
| BranchServiceSegment | ربط Segment بخدمة مع Quota. |
| SegmentGlobalizationRequest | طلب تحويل Segment محلية إلى Global. |
| BranchVideo | فيديو Branch-level مع HLS processing. |
| BranchDisplayConfiguration | شكل شاشة النداء المشترك للفرع. |
| BranchDisplayMessage | رسالة Ticker مرتبة قابلة للتفعيل. |

---

## ملحق B - قواعد العلاقة السريعة

- `Branch -> WaitingAreas -> Windows -> Terminals`
- `Branch -> Displays`، وWindow <-> Display عبر DisplayWindow.
- `Branch <-> Service` عبر BranchService للخدمات المربوطة، وBranch -> OwnedServices للخدمات BranchScoped.
- `Service -> Children/Parent + CustomInputs + Images`
- `Branch + LeafService -> ServiceSchedule / ServiceWorkflow / BranchServiceSegments`
- `Branch -> BranchBranding / BranchAdvertisements / BranchVideos / BranchDisplayConfiguration / BranchDisplayMessages`
- ServiceGlobalizationRequest وSegmentGlobalizationRequest تربطان التعريف المحلي بعملية review مركزية.

---

## ملحق C - نقاط المراجعة المطلوبة قبل المرحلة التالية

193. حسم سبب غياب BranchConfiguration من آخر dump رغم اعتمادها وتنفيذها في Snapshot 5 أغسطس.
194. اعتماد Ticket lifecycle النهائية قبل بناء Ticket runtime.
195. حسم relationship Ticket / TicketReservation / Reservation وسياسات التحويل والانتهاء والإلغاء.
196. اعتماد Calling Algorithm exact ordering/weight/priority rules قبل أي implementation.
197. اعتماد Operator/Window session lifecycle وصلاحياته.
198. تحديد endpoints/rules management WindowService إذا أصبحت المرحلة التالية.
199. عدم إضافة Park/Transfer/Recall/Cancel/NoShow لكل Business Transition قبل اعتماد.

---

## الخلاصة المرجعية

QControl الحالي يملك Foundation قوية لإدارة الفروع والبنية التشغيلية، تعريف الخدمات المحلية والعالمية، جداول الإتاحة، الـ Segments والـ Quotas، تعريفات الـ Workflows، الـ Branding والـ Media، وتجربة Customer/Display public Runtime نفسه. الجزء الذي يجب أن يبقى منفصلاً حتى يتم اعتماده هو Reservation + Ticket runtime Transaction: Waiting + Operator + Calling Algorithm.

---

*نهاية المرجع. المصدر الأساسي: `BuildingBlock-Without-Qcontrol-20260820_142201.txt`، مع الإشارة الواضحة لأي Business مؤكدة من Snapshot سابق.*
