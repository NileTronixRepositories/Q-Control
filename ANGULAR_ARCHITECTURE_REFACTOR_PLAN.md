# خطة إعادة هيكلة Angular Architecture لمشروع Q-SYSTEM

## 1. الهدف

إعادة تنظيم مشروع Q-SYSTEM إلى Architecture واضحة وقابلة للتوسع، مبنية على:

- Angular 21 Standalone Architecture.
- Domain-Driven Feature Boundaries.
- Lazy Loading لكل Feature رئيسية.
- فصل البنية التحتية عن Business Logic.
- تقليل التبعيات بين الـ Features.
- قابلية حذف أي Feature مع معرفة التأثيرات المباشرة فقط.
- مصدر واحد لكل Service وModel وRoute وPermission.
- الحفاظ على المشروع قابلاً للبناء والاختبار بعد كل مرحلة.

هذه الخطة تخص التطبيق الحالي فقط، ولا تتضمن تعدد التطبيقات أو تغييرات في أسلوب النشر.

---

## 2. الوضع الحالي

المشروع يستخدم Angular 21 وStandalone Components، لكنه يحتوي على خلط بين:

- Business Domains.
- أدوار المستخدمين.
- Layouts.
- Guards.
- API Services.
- Models.

أبرز المشكلات الحالية:

1. مجلد `features/technical-admin` يحتوي على Admin Shell وصفحات تخص الفروع والطوابير وخدمات مشتركة.
2. مجلد `features/branch-admins` يحتوي على Dialog تابع فعلياً لإدارة الفروع، وليس Feature مستقلة.
3. Routes الخاصة بـ `branch-management` و`queue-management` تستورد صفحاتها من `technical-admin`.
4. وجود Models وServices مكررة بين `technical-admin` وDomains أخرى.
5. وجود Guards وStores مرتبطة باسم Role بدلاً من مسؤولية واضحة.
6. بعض المكونات العامة في `shared` تحمل أسماء مرتبطة بدور مستخدم معين.
7. ملف routing الرئيسي يجب أن يبقى Composition Root وليس مكاناً لتفاصيل كل صفحة.
8. الصلاحيات وسياق الفرع يحتاجان إلى حدود أوضح بين Infrastructure وBusiness Features.

---

## 3. الـ Architecture المستهدفة

```text
src/app/
├── core/
│   ├── auth/
│   ├── authorization/
│   ├── http/
│   ├── errors/
│   ├── localization/
│   ├── config/
│   └── routing/
│
├── layout/
│   ├── admin-shell/
│   ├── organization-shell/
│   ├── navigation/
│   └── components/
│
├── shared/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   ├── dialogs/
│   ├── states/
│   ├── directives/
│   ├── pipes/
│   ├── utils/
│   └── styles/
│
└── features/
    ├── auth/
    ├── organization/
    ├── branch-management/
    ├── queue-management/
    ├── service-management/
    ├── segment-management/
    ├── service-request/
    └── display/
```

### القاعدة الأساسية

```text
Core    = Infrastructure عامة
Shared  = UI وUtilities عامة
Layout  = Shells وتجميع الواجهات
Feature = Business Domain مستقل
Role    = Authorization وليس Feature
```

---

## 4. مسؤولية كل طبقة

### 4.1 Core

يحتوي على الخدمات والبنية العامة التي يحتاجها التطبيق كله:

- Authentication Session.
- Authorization Infrastructure.
- Permission Resolution.
- HTTP Interceptors.
- Global Error Handling.
- Application Configuration.
- Language Infrastructure.
- Global Route Guards.
- Logging وTelemetry عند الحاجة.

ممنوع وضع Business Logic داخل `core`.

أمثلة ممنوعة:

```text
PatientsService
BranchesApiService
QueueManagementFacade
```

### 4.2 Shared

يحتوي فقط على عناصر عامة لا تعرف أي Business Domain:

- Generic Buttons.
- Generic Inputs.
- Generic Tables.
- Generic Dialogs.
- Pagination.
- Loading, Empty, Error States.
- Generic Pipes وDirectives.
- Generic Formatting Utilities.

ممنوع وضع عناصر خاصة بالفروع أو الطوابير أو الأدوار داخل `shared`.

### 4.3 Layout

مسؤول عن الهيكل العام للواجهة:

- Admin Shell.
- Organization Shell.
- Sidebar.
- Header.
- Navigation.
- Branch Context Selector إذا كان متعلقاً بالـ Shell.

الـ Layout يجمع الـ Features ولا يمتلك منطقها الداخلي.

### 4.4 Features

كل Feature تمثل Business Domain واضحاً وتمتلك كودها الخاص:

- Routes.
- Pages.
- Components.
- Services.
- Models.
- State.
- Permissions Metadata.
- Translations.
- Tests.

---

## 5. حدود الـ Features الحالية

### 5.1 `auth`

مسؤول عن واجهات المصادقة فقط:

- Login.
- Change Initial Password.
- Access State.

أما Session Management وAuthentication Infrastructure فمكانها `core/auth`.

### 5.2 `organization`

مسؤول عن وظائف وإعدادات المنظمة، مثل:

- Global Configurations.
- Ticket Status Management.
- Ticket Calling Management.
- Audio Announcement.

### 5.3 `branch-management`

مسؤول عن كل ما يخص إدارة الفروع:

- Branch Editor.
- Branch Branding.
- Branch Videos.
- Branch Configuration.
- General Brand.
- Display Configuration المرتبطة بالفرع.
- Create Branch Admin Dialog.

يتم دمج محتويات `features/branch-admins` داخله، ثم حذف المجلد القديم.

### 5.4 `queue-management`

مسؤول عن إدارة الطوابير والأجهزة:

- Waiting Areas.
- Windows.
- Terminals.
- Displays المرتبطة بإدارة الطوابير.

يتم نقل الصفحات الحالية من `technical-admin/pages` إلى هذا الـ Feature.

### 5.5 `service-management`

مسؤول عن:

- Service Catalog.
- Branch Services.
- Service Workflows.
- Service Schedules.
- Service Globalization Requests.
- Central Service Tree.

### 5.6 `segment-management`

مسؤول عن:

- Segment List.
- Segment Details.
- Branch Segment Requests.
- Segment Globalization Requests.

### 5.7 `service-request`

مسؤول عن تجربة طلب الخدمة الذاتية ومكوناتها وبياناتها.

### 5.8 `display`

مسؤول عن شاشات العرض ومكوناتها وبيانات التشغيل الخاصة بها.

---

## 6. الشكل الداخلي للـ Feature

يتم استخدام الطبقات الداخلية حسب حجم وتعقيد الـ Feature، وليس بشكل إجباري لكل Feature.

الشكل المقترح للـ Feature الكبيرة:

```text
features/branch-management/
├── domain/
│   ├── models/
│   ├── contracts/
│   └── rules/
├── application/
│   ├── facades/
│   ├── use-cases/
│   └── services/
├── infrastructure/
│   ├── api/
│   ├── dto/
│   ├── mappers/
│   └── repositories/
├── presentation/
│   ├── pages/
│   ├── components/
│   ├── dialogs/
│   └── forms/
├── i18n/
├── branch-management.routes.ts
├── branch-management.providers.ts
└── public-api.ts
```

الـ Feature الصغيرة يمكن أن تستخدم شكلاً أبسط:

```text
features/display/
├── pages/
├── components/
├── services/
├── models/
├── display.routes.ts
└── public-api.ts
```

---

## 7. قواعد الاعتماد بين المجلدات

التدفق المسموح:

```text
Presentation → Application → Domain
Infrastructure → Domain/Application Contracts
Feature → Core
Feature → Shared
Layout → Feature Public APIs وRoutes
```

ممنوع:

```text
Feature A → Feature B internal files
Feature → technical-admin internal files
Feature → shared business logic
Domain → Angular HTTP details
Domain → UI Components
```

أي Feature تحتاج استخدام شيء من Feature أخرى يجب أن تستخدم:

- Public API.
- Contract واضح.
- Facade.
- Application Orchestration عند الضرورة.

يمنع الاستيراد المباشر من:

```text
internal/
infrastructure/
presentation/
```

في Feature أخرى.

---

## 8. Public API لكل Feature

كل Feature رئيسية يجب أن تحدد ما يمكن استخدامه خارجها في ملف:

```text
public-api.ts
```

مثال:

```text
branch-management/public-api.ts
```

يُسمح بتصدير:

- Public Models.
- Public Contracts.
- Facades المطلوبة.
- Route Providers عند الحاجة.

ولا يتم تصدير كل الملفات بشكل عشوائي لتجنب Circular Dependencies.

---

## 9. Routing Strategy

`app.routes.ts` يجب أن يكون ملف تركيب فقط.

يحتوي على المسارات الرئيسية:

```text
auth
organization
admin
service-request
display
```

وكل Feature تملك Route File مستقلاً:

```text
branch-management.routes.ts
queue-management.routes.ts
service-management.routes.ts
segment-management.routes.ts
```

القواعد:

- Lazy Loading للـ Features الكبيرة.
- عدم وضع تفاصيل الصفحات كلها داخل `app.routes.ts`.
- وضع Permission Metadata مع Route المناسبة.
- إبقاء Guards قابلة لإعادة الاستخدام.
- عدم تكرار Route authorization داخل كل Component.

---

## 10. Authorization Strategy

التعامل مع الصلاحيات يكون مركزياً، لكن تعريف الصلاحيات الخاصة بالـ Domain يبقى قريباً منه.

```text
core/authorization/
├── guards/
├── permission.service.ts
├── scope.service.ts
└── authorization.models.ts
```

القواعد:

- عدم كتابة Role checks داخل الـ Components.
- استخدام Permission keys بدلاً من أسماء Roles.
- فحص `error.code` في أخطاء الـ API، وليس النص المترجم.
- تطبيق الصلاحيات على Routes والأزرار والإجراءات.
- اعتبار Backend هو مصدر الحماية الحقيقي.
- عدم إنشاء Permissions أو GUIDs غير موجودة في Backend.
- إبقاء Branch Scope وOrganization Scope واضحين ومركزيين.

---

## 11. State Management Strategy

يتم اختيار أصغر نطاق مناسب للحالة:

```text
Component State
    ↓
Feature State
    ↓
Domain State
    ↓
Global Application State
```

القواعد:

- استخدام Signals للحالة الجديدة عندما تكون مناسبة.
- عدم إنشاء Global Store لكل النظام.
- الحالة المؤقتة للـ Dialog تبقى داخل المكون.
- حالة الصفحة تبقى داخل Feature.
- Session وLanguage وGlobal Context فقط يمكن أن تكون عامة.
- لا يتم إدخال NgRx أو State Library جديدة إلا بناءً على تعقيد حقيقي.

---

## 12. API وData Strategy

المسار المفضل:

```text
Component
    ↓
Facade / Application Service
    ↓
API Service أو Repository
    ↓
HttpClient
    ↓
Backend API
```

عند اختلاف DTO عن نموذج الواجهة:

```text
API DTO → Mapper → Domain Model
```

القواعد:

- عدم تكرار API Services لنفس Endpoint.
- إبقاء API Services داخل الـ Feature المالكة للـ Endpoint.
- عدم وضع HTTP Logic داخل Components.
- تمرير RowVersion كما ورد من Backend بدون تعديل.
- توحيد Error Handling مع الاحتفاظ بالـ Domain Interpretation داخل الـ Feature.

---

## 13. خطة التنفيذ المرحلية

### المرحلة صفر: Audit بدون تعديل

يتم إنشاء خرائط واضحة لـ:

- الملفات.
- الـ Imports.
- الـ Routes.
- الـ Services.
- الـ Models.
- الـ Stores.
- الـ Guards.
- الـ Translations.
- التكرارات.
- Circular Dependencies.
- الملفات الكبيرة.
- الـ Shared Business Leakage.

المخرجات:

```text
Architecture Assessment
Domain Ownership Map
Dependency Map
Route Map
Migration Map
```

### المرحلة الأولى: تثبيت القواعد

- تثبيت Angular Standalone conventions.
- مراجعة Path Aliases.
- تحديد Naming Convention.
- منع إضافة كود جديد إلى `technical-admin`.
- منع وضع Business Logic جديد داخل `shared`.
- تحديد قواعد Import واضحة.

### المرحلة الثانية: فصل Core وLayout

- نقل `AdminShell` إلى `layout/admin-shell`.
- نقل Organization Shell إلى `layout/organization-shell` إذا لزم.
- نقل Authentication Infrastructure إلى `core/auth`.
- نقل Authorization Infrastructure إلى `core/authorization`.
- فصل Branch Context حسب مسؤولية الكود.
- تحديث Providers وImports والاختبارات.

### المرحلة الثالثة: استخراج `branch-management`

- نقل صفحات الفروع.
- نقل Models الخاصة بالفروع.
- نقل API Services الخاصة بالفروع.
- نقل Permission Services الخاصة بالفروع.
- نقل Translations الخاصة بالفروع.
- نقل Dialog إنشاء مدير الفرع.
- دمج `branch-admins`.
- تحديث Routes.
- حذف الملفات القديمة بعد التأكد من عدم وجود References.

### المرحلة الرابعة: استخراج `queue-management`

- نقل Waiting Areas.
- نقل Windows.
- نقل Terminals.
- نقل Displays الخاصة بإدارة الطوابير.
- نقل Models وServices وPermissions.
- تحديث Route Imports.
- إزالة الاعتماد على `technical-admin`.

### المرحلة الخامسة: توحيد بقية الـ Features

مراجعة وتثبيت:

- `service-management`.
- `segment-management`.
- `organization`.
- `service-request`.
- `display`.

كل Feature يجب أن تملك Routes وServices وModels وTests في حدودها الصحيحة.

### المرحلة السادسة: Public APIs والحدود

- إنشاء Public API للـ Features الرئيسية.
- تحديث الاستيرادات الخارجية.
- منع الوصول للملفات الداخلية.
- اكتشاف Circular Dependencies.
- استخراج Contracts عند الحاجة.
- عدم نقل Business Logic إلى Shared لحل مشكلة Dependency.

### المرحلة السابعة: تنظيف `technical-admin`

بعد اكتمال نقل كل مسؤولياته:

- حذف Pages القديمة.
- حذف Models المكررة.
- حذف Services المكررة.
- حذف Stores التي تم نقلها.
- حذف Routes القديمة.
- حذف CSS وComponents غير المستخدمة.
- حذف مجلد `technical-admin` إذا لم يعد له دور واضح.

### المرحلة الثامنة: مراجعة الجودة

- مراجعة حجم الملفات.
- مراجعة أسماء المجلدات.
- مراجعة Duplicate Selectors.
- مراجعة Unused Styles.
- مراجعة Unused Imports.
- مراجعة Duplicate Services.
- مراجعة Public APIs.
- مراجعة Lazy Loading.
- مراجعة Accessibility.

---

## 14. معايير الحذف الآمن

لكل Feature، يجب الإجابة عن السؤال التالي:

> ماذا سيحدث إذا حذفنا هذه الـ Feature بالكامل؟

المطلوب أن تتأثر فقط:

- Route الخاصة بها.
- Navigation الخاصة بها.
- أي Integration معلنة معها.
- أي Feature تعتمد عليها بشكل صريح.

ولا يجب أن يتسبب حذف Feature في كسر:

- Auth.
- Core Infrastructure.
- Shared UI.
- Feature غير مرتبطة بها.

---

## 15. الاختبارات والتحقق

بعد كل مرحلة مؤثرة:

```powershell
npx ng build --configuration development
npx ng test --watch=false
```

يتم اختبار:

- Login.
- Change Initial Password.
- Authentication Guards.
- Permission Guards.
- Branch Context.
- Organization Routes.
- Admin Routes.
- Lazy Loading.
- API URLs.
- RowVersion Handling.
- Error Codes.
- RTL وLTR.
- Translation Loading.

يجب عدم الانتقال إلى المرحلة التالية قبل نجاح Build واختبارات المرحلة الحالية.

---

## 16. مخاطر يجب تجنبها

### نقل الملفات بدون تحليل Imports

قد ينتج عنه Circular Dependencies أو كسر في Runtime.

### تطبيق Clean Architecture بشكل مبالغ فيه

لا يتم إنشاء طبقات كثيرة لصفحة بسيطة بدون حاجة حقيقية.

### وضع Business Logic في Shared

هذا يجعل حذف الـ Feature مستحيلاً ويزيد Coupling.

### ترك التسمية القديمة بعد النقل

يجب حذف أسماء Role من أسماء المكونات العامة والـ Services غير المرتبطة فعلاً بالـ Role.

### الاعتماد على Role داخل Components

الأفضل الاعتماد على Permissions وScope من خلال Authorization Abstraction.

### Refactor شامل مرة واحدة

يتم النقل بشكل تدريجي، مع Build واختبارات بعد كل خطوة.

---

## 17. Definition of Done

تعتبر عملية إعادة الهيكلة مكتملة عندما:

- لا توجد Business Pages داخل `technical-admin`.
- لا يوجد `branch-admins` كـ Feature مستقلة بدون سبب.
- كل Domain يملك Routes الخاصة به.
- كل Domain يملك Models وServices التابعة له.
- لا توجد API Services مكررة لنفس المسؤولية.
- لا توجد Imports مباشرة إلى Internal Files من Feature أخرى.
- Core لا يحتوي Business Logic.
- Shared لا يحتوي Business Components.
- Layout لا يحتوي Domain Services.
- كل Route رئيسية Lazy Loaded عند الحاجة.
- Build ينجح.
- Unit Tests تنجح.
- لا توجد ملفات أو Styles أو Imports ميتة.
- يمكن اختبار حذف كل Feature ومعرفة التأثيرات بوضوح.
- الصلاحيات تعتمد على Permission وScope وليس Role Checks متناثرة.

---

## القرار المعماري النهائي

يعتمد Q-SYSTEM على:

```text
Angular 21 Standalone
+
Domain-Driven Features
+
Core Infrastructure
+
Generic Shared Layer
+
Layout Shells
+
Lazy Modular Routing
+
Centralized Authorization
+
Explicit Feature Boundaries
+
Incremental Refactoring
```

ويتم التعامل مع كل Feature كـ Business Domain مستقل، وليس كـ Role Folder أو تجميع تقني عام.
