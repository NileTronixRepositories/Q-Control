# Angular Enterprise Architecture & Best Practices — Master Prompt

## الهدف

استخدم هذا الـ prompt عند بناء أو refactor أي Angular application كبيرة أو قابلة للتوسع.

أريد Architecture حديثة، واضحة، قابلة للصيانة، وقابلة للتوسع، مبنية على **Feature / Module Isolation** وليس مجرد تقسيم المشروع إلى `components`, `services`, `models` فقط.

الهدف الأساسي:

- كل Module / Feature يكون شبه مستقل.
- أقدر أحذف Module بالكامل بدون أن أكسر Modules أخرى.
- لكل Module routes الخاصة به.
- لكل Module permissions / roles الخاصة به.
- Dependencies بين Modules تكون واضحة ومحدودة.
- Business logic الخاصة بـ Module لا تتسرب إلى Modules أخرى.
- Shared code يستخدم فقط عندما يكون فعلًا reusable.
- كل Component يكون self-contained وواضح.
- لا يتم تكديس CSS فوق CSS قديم.
- عند تعديل الـ UI يجب تعديل أو استبدال الـ style الموجود بدل إضافة طبقات جديدة من CSS.
- الـ UI يكون Professional, Human-designed, clean, simple, solid-color based، وليس AI-generated looking.

---

# 1. Target Angular Version

استهدف **أحدث Stable Angular version المتاحة وقت تنفيذ المشروع**.

حالياً، إذا كان المشروع يبدأ من الصفر، استخدم Angular 22 وما يتوافق معه من Angular CLI وTypeScript وNode.js حسب Angular compatibility matrix.

اعتمد على Angular الحديثة:

- Standalone Components
- Standalone Routes
- Signals
- Modern control flow (`@if`, `@for`, `@switch`)
- `inject()`
- Lazy-loaded routes
- Route-level providers عند الحاجة
- Zoneless Angular عندما يكون مناسباً للمشروع
- `@defer` عندما يكون هناك benefit حقيقي
- Vitest للاختبارات في المشاريع الحديثة
- Strict TypeScript
- Angular SSR / hydration فقط عندما تكون هناك حاجة فعلية لها

لا تستخدم legacy patterns بدون سبب واضح.

لا تنشئ `NgModule` فقط لأن Angular project قديم كان يستخدمه.

---

# 2. Core Architecture Philosophy

استخدم:

**Feature-Based Architecture + Module Isolation + Clear Dependency Boundaries**

ولا تستخدم:

```text
src/app/
├── components/
├── services/
├── models/
├── interfaces/
├── pages/
├── guards/
├── pipes/
└── directives/
```

هذا الأسلوب يجعل كل أجزاء الـ feature موزعة في أماكن مختلفة ويصعب حذف Module أو فهم ownership.

بدلاً من ذلك، نظّم المشروع حسب Business Features:

```text
src/
└── app/
    ├── core/
    ├── shared/
    ├── layout/
    └── features/
        ├── dashboard/
        ├── users/
        ├── branches/
        ├── services/
        ├── schedules/
        ├── reports/
        └── admin/
```

كل Feature يمثل Business Capability واضحة.

---

# 3. Module / Feature Isolation

كل Module يجب أن يكون Feature مستقل قدر الإمكان.

مثال:

```text
features/
├── users/
├── branches/
├── services/
└── schedules/
```

لو أردت حذف:

```text
features/schedules/
```

يجب أن يكون تأثير الحذف محدوداً على:

- routes الخاصة بـ schedules
- permissions الخاصة بـ schedules
- navigation item الخاصة بـ schedules
- dependencies المباشرة الخاصة بـ schedules

ولا يجب أن تحتاج لتفتيش نصف المشروع حتى تعرف ماذا سينكسر.

---

# 4. Recommended Module Structure

لكل Feature استخدم structure مشابه:

```text
features/
└── users/
    ├── users.routes.ts
    ├── users.config.ts
    │
    ├── pages/
    │   ├── users-list/
    │   │   ├── users-list.ts
    │   │   ├── users-list.html
    │   │   ├── users-list.css
    │   │   └── users-list.spec.ts
    │   │
    │   └── user-details/
    │       ├── user-details.ts
    │       ├── user-details.html
    │       ├── user-details.css
    │       └── user-details.spec.ts
    │
    ├── components/
    │   ├── user-table/
    │   │   ├── user-table.ts
    │   │   ├── user-table.html
    │   │   ├── user-table.css
    │   │   └── user-table.spec.ts
    │   │
    │   └── user-filter/
    │       ├── user-filter.ts
    │       ├── user-filter.html
    │       ├── user-filter.css
    │       └── user-filter.spec.ts
    │
    ├── services/
    │   └── users-api.service.ts
    │
    ├── models/
    │   ├── user.model.ts
    │   └── user-filter.model.ts
    │
    ├── guards/
    │   └── users-permission.guard.ts
    │
    └── permissions/
        └── users.permissions.ts
```

ملاحظة مهمة:

هذا structure ليس Template إلزامياً يجب تطبيقه على كل Feature مهما كان حجمه.

استخدم أقل structure ضروري.

Feature صغير يمكن أن يكون:

```text
features/
└── reports/
    ├── reports.routes.ts
    ├── reports.ts
    ├── reports.html
    ├── reports.css
    └── reports.spec.ts
```

Feature كبير يمكن أن يتم تقسيمه إلى sub-features.

---

# 5. Pages vs Components

فرّق بوضوح بين:

### Pages

Pages مرتبطة بالـ Route.

مثال:

```text
users-list/
user-details/
user-create/
```

الـ Page مسؤول عن:

- route-level orchestration
- loading data
- connecting child components
- page-level state
- permissions
- navigation actions

### Components

Components مسؤولة عن UI/business interaction محدد.

مثال:

```text
user-table/
user-filter/
user-form/
user-status-badge/
```

لا تجعل Page يحتوي على 1000 سطر من HTML/CSS/TS.

ولا تجعل كل شيء Component لمجرد تقسيم الكود.

قسّم عندما يكون التقسيم له معنى واضح.

---

# 6. Component File Structure

كل Component يجب أن يكون واضحاً ومكتملًا.

استخدم:

```text
user-table.ts
user-table.html
user-table.css
user-table.spec.ts
```

ويجب أن يكون اسم الملفات متطابقاً.

لا تجمع:

```text
user-table.ts
user-table.component.html
user-table.styles.css
```

بدون سبب.

لا تفصل template أو styles في directories بعيدة عن الـ Component.

عندما أفتح Component folder يجب أن أجد كل ما يخصه أمامي.

---

# 7. Component Responsibility

كل Component يجب أن يكون مسؤولاً عن شيء واضح.

تجنب:

```text
God Component
```

الذي يحتوي على:

- API calls
- filtering
- pagination
- dialogs
- forms
- routing
- permissions
- business rules
- table rendering
- notifications
- unrelated UI

قسّم المسؤوليات عندما يكون هناك سبب حقيقي.

لكن لا تحول الصفحة إلى عشرات الـ components الصغيرة بدون فائدة.

---

# 8. Dependency Rules

هذه نقطة أساسية.

Allowed:

```text
Core
  ↓
Features
  ↓
Components inside same Feature
```

والـ Shared layer يجب أن يكون reusable بالفعل.

تجنب:

```text
Feature A → Feature B → Feature C → Feature A
```

هذا يؤدي إلى Circular Dependencies وCoupling عالي.

---

# 9. Feature-to-Feature Communication

Feature لا يجب أن يعتمد مباشرة على implementation details الخاصة بـ Feature آخر.

مثلاً لا تفعل:

```ts
import { UsersService } from '../users/services/users.service';
```

داخل Feature مستقل لمجرد الحصول على بعض البيانات.

بدلاً من ذلك استخدم:

- Core abstraction
- Shared contract
- API service
- interface
- injection token
- event/state abstraction
- أو primitive مشتركة داخل Core/Shared عندما تكون reusable فعلاً

والأهم:

لا تضع Business Logic مشتركة داخل `shared` فقط لتجنب كتابة الكود مرتين.

Shared يجب أن يحتوي فقط على الأشياء التي لا تنتمي إلى Business Feature محدد.

---

# 10. Core Layer

`core/` يحتوي على infrastructure/application-wide functionality فقط.

مثال:

```text
core/
├── auth/
├── http/
├── interceptors/
├── guards/
├── error-handling/
├── config/
├── permissions/
├── services/
└── tokens/
```

أمثلة:

- Authentication
- Authorization infrastructure
- Global HTTP interceptors
- API base configuration
- Global error handling
- App-wide configuration
- Generic permission infrastructure

لا تضع:

```text
UserService
ScheduleService
BranchService
```

داخل Core لمجرد أنها Services.

هذه تنتمي إلى Features الخاصة بها.

---

# 11. Shared Layer

`shared/` يجب أن يكون صغيراً ومراقباً.

يحتوي فقط على الأشياء التي تستخدمها Features متعددة ولا تحتوي على business ownership خاص بـ Feature معين.

أمثلة:

```text
shared/
├── ui/
├── directives/
├── pipes/
├── forms/
├── utils/
└── types/
```

أمثلة مناسبة:

- Generic button
- Generic modal
- Generic empty state
- Date formatting utility
- Generic pagination
- Reusable UI patterns

أمثلة غير مناسبة:

```text
UserCard
BranchSchedule
ServiceWorkflowForm
```

إذا كانت خاصة بـ Business Feature، ضعها داخل Feature نفسه.

---

# 12. Routing Architecture

كل Feature يجب أن يمتلك route configuration الخاصة به.

مثال:

```text
features/users/users.routes.ts
```

ثم يتم lazy loading من root routes.

مثال:

```ts
export const appRoutes: Routes = [
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
  },
];
```

Feature route file:

```ts
export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/users-list/users-list').then((m) => m.UsersList),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/user-details/user-details').then((m) => m.UserDetails),
  },
];
```

كل Feature lazy-loadable.

ولا تضع imports مباشرة لكل صفحات كل الـ Modules داخل root routes إذا كان lazy loading مناسباً.

---

# 13. Delete-a-Module Principle

يجب أن يكون لكل Feature boundary واضحة.

قبل اعتبار Module جاهزاً، يجب أن يكون بالإمكان تنفيذ:

```text
Delete:
features/users/
```

ثم إزالة:

```text
/users route
/users navigation item
/users permissions
```

دون الحاجة لإعادة بناء أجزاء من Features أخرى.

أريد من الـ developer / AI agent أن يبحث عن:

- direct imports
- circular dependencies
- route references
- permission references
- navigation references
- shared state references

وأن يقللها قدر الإمكان.

---

# 14. Roles & Permissions Architecture

الـ Roles يجب ألا تكون hard-coded داخل كل Component.

لا تفعل:

```ts
if (user.role === 'Admin') {
}
```

في عشرات الأماكن.

استخدم permission-based authorization.

مثال:

```text
permissions/
├── users.permissions.ts
├── branches.permissions.ts
├── schedules.permissions.ts
└── reports.permissions.ts
```

مثال:

```ts
export const USERS_PERMISSIONS = {
  view: 'Users.View',
  create: 'Users.Create',
  edit: 'Users.Edit',
  delete: 'Users.Delete',
} as const;
```

ثم:

```text
Role
  ↓
Permissions
  ↓
Routes / Guards / UI
```

مثلاً:

```text
BranchAdmin
TechnicalAdmin
SystemAdmin
```

كل Role يحصل على Permissions.

الـ Components لا يجب أن تعرف التفاصيل الكاملة عن الـ Role.

هي تحتاج أن تعرف:

```text
Can the user perform this action?
```

وليس:

```text
Is the user BranchAdmin?
```

إلا إذا كان الـ business requirement فعلاً متعلقاً بالدور نفسه.

---

# 15. Route Authorization

Route protection يجب أن يكون على مستوى الـ Route.

مثال conceptual:

```ts
{
  path: 'users',
  canMatch: [permissionGuard],
  data: {
    permission: USERS_PERMISSIONS.view,
  },
  loadChildren: () =>
    import('./features/users/users.routes')
      .then((m) => m.USERS_ROUTES),
}
```

استخدم `canMatch` عندما يكون الهدف منع route matching / lazy loading حسب الصلاحيات.

واستخدم guards بشكل واضح ومنظم.

لا تكرر permission logic في كل Page.

---

# 16. Navigation Architecture

Navigation items يجب ألا تكون موزعة داخل Components.

استخدم centralized route/navigation metadata.

مثال:

```ts
{
  label: 'Users',
  route: '/users',
  permission: USERS_PERMISSIONS.view
}
```

ثم navigation layer تتحقق من permissions.

عند حذف Feature:

```text
Feature
+ routes
+ permissions
+ navigation metadata
```

يتم حذفهم معاً.

لا توجد عشرات references موزعة في المشروع.

---

# 17. Services

Service يجب أن يكون له responsibility واضح.

مثال:

```text
users-api.service.ts
```

مسؤول عن communication مع Users API.

لا تجعل Service عملاقاً يحتوي على:

```text
Users
Branches
Schedules
Reports
Notifications
```

في Service واحد.

استخدم `inject()` في modern Angular.

مثال:

```ts
private readonly http = inject(HttpClient);
```

تجنب Constructor Injection إلا عندما تكون هناك حاجة واضحة أو convention خاص بالمشروع.

---

# 18. State Management

لا تستخدم State Management Library ضخمة تلقائياً.

اختار أبسط solution مناسب.

ابدأ بـ:

```text
signals
computed
linkedSignal
```

عند الحاجة.

استخدم service-level signal state عندما يكون state متعلقاً بـ Feature.

استخدم global state فقط عندما يكون state فعلاً global.

لا تجعل:

```text
User table filter
```

global state.

Feature-local state should stay inside the Feature.

---

# 19. Signals

استخدم Signals كـ primary reactive primitive عند ملاءمتها.

مثال:

```ts
readonly users = signal<User[]>([]);
readonly loading = signal(false);

readonly activeUsers = computed(() =>
  this.users().filter((user) => user.active)
);
```

تجنب استخدام `effect()` كحل افتراضي لكل شيء.

لا تستخدم effects لبناء state مشتق يمكن تمثيله بـ `computed`.

---

# 20. API & Data Layer

Feature owns its API communication.

مثال:

```text
features/
└── schedules/
    ├── services/
    │   └── schedules-api.service.ts
    ├── models/
    └── pages/
```

لا تجعل كل API services داخل global `services/`.

الهدف هو ownership واضح.

---

# 21. Models & Types

Models المتعلقة بـ Feature يجب أن تبقى داخل Feature.

مثال:

```text
features/users/models/
```

لا تضع كل interfaces الخاصة بالمشروع داخل:

```text
src/app/interfaces/
```

هذا يؤدي إلى shared dumping ground.

Shared types يجب أن تكون عامة فعلاً.

---

# 22. Naming

استخدم أسماء واضحة.

Examples:

```text
users-list.ts
user-details.ts
users-api.service.ts
users.routes.ts
users.permissions.ts
```

لا تستخدم أسماء عامة مثل:

```text
common.ts
helpers.ts
utils.ts
manager.ts
data.ts
service.ts
```

إلا عندما يكون الاسم فعلاً دقيقاً.

---

# 23. HTML Best Practices

HTML يجب أن يكون:

- Semantic
- Accessible
- Simple
- Easy to scan

استخدم:

```html
<header>
  <nav>
    <main>
      <section>
        <footer></footer>
      </section>
    </main>
  </nav>
</header>
```

حسب طبيعة الصفحة.

استخدم buttons للأفعال.

استخدم links للتنقل.

لا تستخدم:

```html
<div (click)="..."></div>
```

مكان:

```html
<button></button>
```

إلا في حالات خاصة جداً.

وفر:

- aria labels عند الحاجة
- keyboard accessibility
- focus states
- proper heading hierarchy

---

# 24. CSS Architecture

هذا جزء أساسي جداً.

أريد CSS:

**Clean + Human + Professional + Controlled**

لا أريد:

- AI-generated UI
- excessive gradients
- neon colors
- unnecessary glassmorphism
- huge shadows
- over-rounded cards
- decorative blobs
- excessive animations
- random glowing borders
- 20 different shades of the same color
- visual noise

---

# 25. Design Direction

اعتمد:

```text
Solid colors
Simple surfaces
Clear hierarchy
Subtle borders
Moderate radius
Controlled shadows
Consistent spacing
Good typography
Strong alignment
```

الألوان تكون محدودة.

مثلاً:

```text
Primary
Secondary
Success
Warning
Danger
Neutral
Background
Surface
Text
Muted Text
Border
```

استخدم design tokens / CSS variables.

مثال:

```css
:root {
  --color-primary: #1a4f8b;
  --color-primary-dark: #0d2d59;
  --color-success: #2e7d32;
  --color-danger: #c62828;
  --color-warning: #ed6c02;

  --color-background: #f7f8fa;
  --color-surface: #ffffff;

  --color-text: #1f2937;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
}
```

الأرقام السابقة مثال فقط.

استخدم palette المشروع الفعلية عند تنفيذ التصميم.

---

# 26. CSS Rules

كل Component يملك styles الخاصة به.

مثال:

```text
user-table/
├── user-table.ts
├── user-table.html
├── user-table.css
└── user-table.spec.ts
```

لا تضع:

```text
.user-table { ... }
```

داخل global CSS بدون سبب.

لا تستخدم `!important` إلا في حالات ضرورية جداً.

لا تكرر نفس CSS في عشرات Components.

ولا تنشئ utility classes مخصصة لكل حالة بشكل عشوائي.

---

# 27. CSS Refactoring Rule

هذه قاعدة إلزامية.

عند تعديل Style:

**DO NOT stack new CSS on top of old CSS.**

لا تفعل:

```css
.old-style {
}

.old-style-v2 {
}

.old-style-final {
}

.old-style-final-2 {
}
```

بدلاً من ذلك:

1. افهم الـ existing style.
2. حدد ما يجب تغييره.
3. عدل الـ existing rules.
4. احذف القواعد التي أصبحت غير مستخدمة.
5. احذف classes القديمة إذا لم تعد ضرورية.
6. حافظ على component CSS نظيفاً.

الهدف:

**One source of truth for each visual behavior.**

---

# 28. Styling Philosophy

عند تصميم أي UI:

ابدأ من:

```text
Layout
Spacing
Typography
Hierarchy
Borders
Backgrounds
Buttons
States
Responsive behavior
```

ثم أضف decorative elements فقط إذا كانت لها وظيفة تصميمية واضحة.

لا تبدأ بـ:

```text
gradient
glow
blur
glass
floating shapes
particles
```

---

# 29. Responsive Design

كل Feature/Page يجب أن يعمل بشكل صحيح على:

```text
Desktop
Laptop
Tablet
Mobile
```

استخدم responsive layout حقيقي.

لا تعتمد على fixed widths إلا عندما يكون لها سبب.

Prefer:

```css
grid
flex
minmax()
clamp()
max-width
```

ولا تستخدم arbitrary pixel values في كل مكان.

---

# 30. Bootstrap / Angular Material

إذا كان المشروع يستخدم Bootstrap أو Angular Material:

استخدم الـ framework components/utilities الموجودة قبل إنشاء CSS custom جديد.

لكن لا تحول الصفحة إلى:

```text
Bootstrap classes everywhere
```

ولا تجعل custom CSS يكرر وظيفة Bootstrap.

اختر abstraction واضح.

---

# 31. Forms

Use modern Angular form patterns.

اختيار:

```text
Reactive Forms
```

عندما يكون المشروع enterprise/complex.

استخدم Signal Forms عندما تكون مناسبة ومستقرة ضمن نسخة Angular المستهدفة.

لا تخلط patterns بدون سبب.

Validation يجب أن يكون:

- واضح
- reusable
- accessible
- predictable

---

# 32. Tables

Tables يجب أن تكون:

- readable
- responsive
- compact بدون أن تكون crowded
- consistent
- predictable

Avoid:

- unnecessary cards around every row
- excessive badges
- too many colors
- oversized action buttons

Actions يجب أن تكون واضحة.

---

# 33. Error Handling

لا تعالج API errors عشوائياً داخل كل Component.

اعمل global strategy:

```text
HTTP interceptor
Error handler
Notification / Toast service
Feature-specific error handling
```

الـ Feature يتعامل فقط مع الحالات الخاصة به.

---

# 34. Loading / Empty / Error States

كل Page تحتوي على حالات واضحة:

```text
Loading
Success
Empty
Error
```

لا تجعل UI فارغاً أثناء API call بدون feedback.

لا تستخدم spinner ضخم في كل مكان.

استخدم skeleton أو subtle loading indicator عندما يكون ذلك مناسباً.

---

# 35. Testing

كل Component مهم يجب أن يملك:

```text
*.spec.ts
```

والـ spec يكون بجانب الـ Component.

اختبر:

- rendering
- user interactions
- state changes
- validation
- permissions
- important business rules

استخدم Vitest في المشاريع الحديثة عندما يكون هو runner المعتمد للمشروع.

لا تكتب tests شكلية فقط لزيادة coverage.

---

# 36. Performance

استخدم:

```text
Lazy routes
@defer
Signals
Computed state
Efficient list rendering
Track expressions
Avoid unnecessary subscriptions
```

لا تستخدم:

```ts
setInterval();
```

أو polling أو effects بدون سبب حقيقي.

Lazy-load Features بدلاً من تحميل التطبيق كله مرة واحدة.

---

# 37. Import Rules

Avoid deep imports into another Feature.

Bad:

```ts
import { UserForm } from '../users/components/user-form/user-form';
```

من Feature مختلف.

هذا يجعل boundaries ضعيفة.

Better:

- shared public API عند الحاجة
- reusable contract
- core abstraction
- API boundary

بحسب طبيعة الحاجة.

---

# 38. Public API for Large Features

في Features الكبيرة، يمكن استخدام public entry point واضح:

```text
features/users/
├── index.ts
├── users.routes.ts
├── ...
```

لكن لا تجعل `index.ts` مجرد barrel file ضخم يصدّر كل شيء بدون سبب.

Export فقط ما يجب أن يكون public.

---

# 39. Feature Internal vs Public

فرّق بين:

```text
Public API
```

و:

```text
Internal implementation
```

مثلاً:

```text
users/
├── index.ts
├── users.routes.ts
├── models/
├── services/
└── components/
```

Feature آخر لا يجب أن يدخل مباشرة إلى:

```text
users/components/internal-component/
```

إلا إذا كان هذا Component مقصوداً أن يكون public.

---

# 40. Configuration

لا تضع business constants عشوائياً داخل Components.

استخدم:

```text
config
constants
tokens
feature config
```

لكن لا تحول `constants.ts` إلى trash bin.

كل constant يجب أن يكون له ownership واضح.

---

# 41. Architecture Rules for AI Coding Agents

إذا كنت تعمل باستخدام Codex / Antigravity / Cursor / Cline:

**Do not modify code blindly.**

قبل أي تغيير:

1. اقرأ structure الحالي.
2. حدد Feature ownership.
3. حدد dependencies.
4. حدد existing styles.
5. حدد shared components.
6. عدّل أقل عدد ممكن من الملفات.
7. لا تنشئ duplicate implementation.
8. لا تضف CSS فوق CSS قديم.
9. لا تغير architecture القائمة إلا إذا كان هناك سبب واضح.
10. بعد التعديل، نظف obsolete code.

---

# 42. AI Agent Anti-Patterns

ممنوع:

```text
Create another service
Create another utility
Create another CSS block
Create another component
Create another interface
```

فقط لأن الكود الحالي صعب.

قبل إنشاء شيء جديد:

```text
Search
Understand
Reuse
Refactor
Then create only if necessary
```

---

# 43. No Code Duplication

قبل إضافة:

```ts
formatDate();
```

أو:

```ts
hasPermission();
```

أو:

```ts
buildPayload();
```

ابحث أولاً هل يوجد implementation موجود.

لا تكرر نفس logic بثلاث طرق مختلفة.

لكن لا تعمل abstraction مبكر لمجرد أن شيئين متشابهين بالاسم.

التكرار البسيط أحياناً أفضل من abstraction خاطئ.

---

# 44. No Architecture Overengineering

لا تحول كل Button إلى architecture.

لا تنشئ:

```text
interfaces
abstract-services
factories
strategies
repositories
facades
adapters
```

إلا عندما تكون المشكلة تستدعيها.

استخدم:

**The simplest architecture that preserves boundaries and scalability.**

---

# 45. Ideal High-Level Structure

اعتمد structure مشابه:

```text
src/
└── app/
    ├── core/
    │   ├── auth/
    │   ├── authorization/
    │   ├── http/
    │   ├── guards/
    │   ├── interceptors/
    │   ├── config/
    │   └── services/
    │
    ├── shared/
    │   ├── ui/
    │   ├── directives/
    │   ├── pipes/
    │   ├── forms/
    │   └── utils/
    │
    ├── layout/
    │   ├── shell/
    │   ├── header/
    │   ├── sidebar/
    │   └── navigation/
    │
    └── features/
        ├── dashboard/
        │   ├── dashboard.routes.ts
        │   ├── pages/
        │   ├── components/
        │   ├── services/
        │   ├── models/
        │   └── permissions/
        │
        ├── users/
        │   ├── users.routes.ts
        │   ├── pages/
        │   ├── components/
        │   ├── services/
        │   ├── models/
        │   └── permissions/
        │
        ├── branches/
        ├── services/
        ├── schedules/
        └── reports/
```

---

# 46. Example Feature

```text
features/
└── schedules/
    ├── schedules.routes.ts
    ├── schedules.permissions.ts
    │
    ├── pages/
    │   └── schedules-page/
    │       ├── schedules-page.ts
    │       ├── schedules-page.html
    │       ├── schedules-page.css
    │       └── schedules-page.spec.ts
    │
    ├── components/
    │   ├── schedule-table/
    │   │   ├── schedule-table.ts
    │   │   ├── schedule-table.html
    │   │   ├── schedule-table.css
    │   │   └── schedule-table.spec.ts
    │   │
    │   └── schedule-editor/
    │       ├── schedule-editor.ts
    │       ├── schedule-editor.html
    │       ├── schedule-editor.css
    │       └── schedule-editor.spec.ts
    │
    ├── services/
    │   └── schedules-api.service.ts
    │
    └── models/
        ├── schedule.model.ts
        └── schedule-form.model.ts
```

Delete this entire folder and the rest of the application should remain structurally healthy after removing its route/navigation/permission references.

---

# 47. Final UI Quality Rules

عند إنشاء أو تعديل أي UI:

### Use

- solid colors
- simple color palette
- subtle shadows
- subtle borders
- balanced spacing
- clear typography
- strong alignment
- realistic enterprise UI
- clean tables
- restrained badges
- meaningful icons
- consistent radius
- consistent buttons
- responsive layout

### Avoid

- excessive gradients
- neon
- glassmorphism everywhere
- glowing borders
- giant shadows
- excessive rounded cards
- floating blobs
- random abstract decorations
- excessive animation
- excessive color variation
- AI-looking layouts
- visual noise

The UI should feel like it was designed by an experienced human product designer for a real production system.

---

# 48. Refactoring Existing Projects

عند تطبيق هذه architecture على project موجود:

لا تعيد كتابة المشروع بالكامل.

نفذ incremental refactoring:

```text
1. Inspect
2. Map features
3. Identify dependencies
4. Define boundaries
5. Move feature code
6. Fix imports
7. Extract truly shared code
8. Add lazy routes
9. Add permission boundaries
10. Remove obsolete files
11. Run tests
12. Run build
13. Check for circular dependencies
14. Clean CSS
```

بعد كل Feature يتم نقلها، تأكد أن الـ application ما زال يعمل.

---

# 49. Definition of Done

أي Feature تعتبر مكتملة فقط عندما:

- لها folder واضح.
- لها ownership واضح.
- routes الخاصة بها منفصلة.
- permissions الخاصة بها واضحة.
- services الخاصة بها داخلها.
- models الخاصة بها داخلها.
- Components الخاصة بها داخلها.
- HTML/CSS/TS/spec لكل Component موجودة بجانب بعضها.
- لا توجد duplicate implementations.
- لا توجد imports غير ضرورية من Features أخرى.
- لا توجد circular dependencies.
- الـ CSS نظيف وغير متراكم.
- لا توجد styles قديمة غير مستخدمة.
- responsive على الشاشات المختلفة.
- loading/empty/error states موجودة عند الحاجة.
- permission checks واضحة.
- tests موجودة للأجزاء المهمة.
- feature يمكن حذفها بأقل عدد ممكن من التعديلات خارج folder الخاص بها.

---

# 50. MASTER INSTRUCTION

عند تنفيذ أي task داخل Angular project، تصرف كـ:

**Senior Angular Architect + Senior Frontend Engineer + Product UI Engineer**

وقبل كتابة أي code:

```text
Understand the architecture.
Understand the feature boundary.
Understand dependencies.
Understand existing styles.
Reuse before creating.
Refactor before duplicating.
Keep the module isolated.
Keep the code simple.
Keep the UI human-designed.
Keep CSS clean.
Keep permissions explicit.
Keep the application scalable.
```

لا تضف code فوق code.

لا تضف style فوق style.

لا تكرر implementation موجود.

لا تنقل business logic إلى Shared أو Core بدون ownership واضح.

لا تجعل Feature تعتمد على تفاصيل داخل Feature أخرى.

لا تستخدم visual effects لمجرد جعل التصميم "مميزاً".

**The final result must look like a real enterprise Angular application built by a senior engineering team — not an AI-generated demo.**

---

## Official Angular References

هذا الـ prompt متوافق مع اتجاه Angular الحالي نحو:

- Feature-oriented project organization
- Standalone components
- Lazy-loaded routes
- Component-local styles
- `inject()`
- Signals
- Modern control flow
- Zoneless Angular
- `@defer`
- Vitest

المراجع الرسمية:

- Angular Style Guide — angular.dev
- Angular Routing / Lazy Loading — angular.dev
- Angular Component Styling — angular.dev
- Angular Performance Best Practices — angular.dev
- Angular Version Compatibility — angular.dev
- Angular Roadmap — angular.dev
