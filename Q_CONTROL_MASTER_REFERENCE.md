# Q-Control Enterprise System — Master Business & API Reference

## المرجع الشامل الموحد للبيزنس وتذاكر الجيرا وخرائط الـ API وقواعد النظام

---

## الفهرس العام للمرجع الشامل (Table of Contents)

1. [نظرة عامة على النظام ومعايير التطوير](#1-نظرة-عامة-على-النظام-ومعايير-التطوير)
2. [الخريطة الكاملة لـ Endpoints الـ API ومجموعات البيزنس (27 Business Feature Blocks)](#2-الخريطة-الكاملة-لـ-endpoints-الـ-api-ومجموعات-البيزنس)
   - [Block 1: Authentication & Initial Password](#block-1--authentication)
   - [Block 2: Branch Management](#block-2--branch-management)
   - [Block 3: Branch Branding & Advertisements](#block-3--branch-branding--advertisements)
   - [Block 4: Branch Configuration](#block-4--branch-configuration)
   - [Block 5: Waiting Areas](#block-5--waiting-areas)
   - [Block 6: Windows](#block-6--windows)
   - [Block 7: Terminals](#block-7--terminals)
   - [Block 8: Physical Displays & DisplayWindow](#block-8--physical-displays--displaywindow)
   - [Block 9: Branch Display Runtime & Messages](#block-9--branch-display-runtime--messages)
   - [Block 10: Branch Videos](#block-10--branch-videos)
   - [Block 11: General Brand](#block-11--general-brand)
   - [Block 12: Service Catalog](#block-12--service-catalog)
   - [Block 13: Service Images](#block-13--service-images)
   - [Block 14: Branch Service Assignment & Trees](#block-14--branch-service-assignment--service-trees)
   - [Block 15: Service Schedule](#block-15--service-schedule)
   - [Block 16: Service Workflow](#block-16--service-workflow)
   - [Block 17: Segments](#block-17--segments)
   - [Block 18: Branch Service Segments & Quota](#block-18--branch-service-segments--quota)
   - [Block 19: Service Globalization](#block-19--service-globalization)
   - [Block 20: Segment Globalization](#block-20--segment-globalization)
   - [Block 21: Reservation Runtime](#block-21--reservation-runtime)
   - [Block 22: Ticket Runtime](#block-22--ticket-runtime)
   - [Block 23: Kiosk Runtime](#block-23--kiosk-runtime)
   - [Block 24: Kiosk Service Discovery](#block-24--kiosk-service-discovery)
   - [Block 25: Public Display Runtime](#block-25--public-display-runtime)
   - [Block 26: Globalization Review](#block-26--globalization-review)
   - [Block 27: Out-of-Scope / Non-Existent Endpoints Audit](#block-27--api-areas-غير-موجود-لها-endpoint-حاليًا)
3. [المواصفات التفصيلية لتدفقات الجيرا (Jira Features & Specifications)](#3-المواصفات-التفصيلية-لتدفقات-الجيرا)
   - [Jira: Customer Ticket Issuance Flow (Kiosk)](#jira-fe-kiosk-implement-customer-ticket-issuance-flow)
   - [End-to-End Workflow Map](#end-to-end-workflow-map)
   - [قواعد البحث عن الحجز وتحويله](#قواعد-البحث-عن-حجز-مسبق-flow-a)
   - [قواعد إصدار التذكرة المباشرة](#قواعد-إصدار-تذكرة-مباشرة-flow-b)
   - [إدارة الأخطاء ورسائل البيزنس](#إدارة-الأخطاء-ورسائل-البيزنس-problem-details)
4. [القاموس الشامل وقواعد البيانات المشتركة (Domain Terminology, Enums & Rules)](#4-القاموس-الشامل-وقواعد-البيانات-المشتركة)

---

# 1. نظرة عامة على النظام ومعايير التطوير

## رؤية المنتج (Product Purpose & Vision)

**Q-SYSTEM (NileTronix Q-Control)** هو نظام مؤسسي متقدم لإدارة وتنظيم طوابير الانتظار وتدفقات العملاء والمرضى داخل المنشآت الطبية والمراكز الخدمية متعددة الفروع. يربط النظام بين:

- لوحات التحكم الإدارية المركزية للفرع والمنظمة.
- أجهزة الخدمة الذاتية (Self-Service Kiosks) لإصدار تذاكر الانتظار.
- شبابيك ونقاط تقديم الخدمة (Service Windows / Counters).
- شاشات العرض والنداء الآلي المشتركة (Audio-Visual Calling Displays).

## المستخدمون والجهات المستفيدة (Target Actors)

1. **المدير الفني للنظام (`TechnicalAdmin`)**: يدير البنية التحتية، الفروع، الربط الشبكي، والشاشات وأجهزة التشغيل.
2. **مدير الفرع (`BranchAdmin`)**: يدير إعدادات الفرع التشغيلية، مواعيد العمل (Schedules)، الإعلانات، وتخصيص الكوتة للشرائح.
3. **عملاء وزوار الفرع (`Kiosk Users / Patients`)**: يتفاعلون مع شاشات اللمس الخاصة بالـKiosk لاختيار الخدمات وإصدار التذاكر أو تأكيد الحجوزات السابقة.

## المعايير المعمارية للواجهات الأمامية (Frontend Architecture Standards)

- **Angular 21+ Modern Standalone**: اعتماد Signal-based reactivity (`signal`, `computed`, `linkedSignal`)، و`inject()`، وControl Flow الحديث (`@if`, `@for`, `@switch`).
- **العزل الوظيفي (Feature Isolation)**: عدم وجود اعتماديات متداخلة بين الـ Features؛ الموديولات مستقلة وتتواصل عبر العقود الرسمية.
- **التصميم وتجربة المستخدم**:
  - اعتماد Bootstrap Responsive Grid (`row`, `col-*`, `container-fluid`).
  - هوية بصرية مستوحاة من NileTronix (ألوان Deep Slate `#0f2a3a`، وNile Cyan `#009bb6`، وEmerald `#10b981`).
  - دعم كامل للغتين العربية (RTL) والإنجليزية (LTR).
  - استخدام استايلات الطباعة `@media print` لطباعة إيصالات التذاكر.

---

# 2. الخريطة الكاملة لـ Endpoints الـ API ومجموعات البيزنس

## القواعد العامة لجميع الـ Endpoints

- **نمط التنفيذ في الباك إند**:
  ```text
  Controller → MediatR Command / Query → Handler → Repository / Domain → Result<T> → ToIActionResult() → ProblemDetails on failure
  ```
- **التفويض**: يعتمد على `[Authorize]` و`[Permission("...")]` مع حماية `TicketRuntimeRequestGuard`.
- **التزامن المتفائل**: استخدام `RowVersion` لمنع الكتابة المتزامنة الخاطئة.
- **الهيدرز العامة**: إرسال `Accept-Language: ar` أو `Accept-Language: en` مع `Authorization: Bearer {token}` في الطلبات المصادق عليها.

---

### Block 1 — Authentication

#### 1. تسجيل الدخول (Login)

- **Endpoint**: `POST /api/auth/login`
- **Authorization**: `AllowAnonymous`
- **Request**:
  ```json
  {
    "userNameOrEmail": "admin@example.com",
    "password": "******"
  }
  ```
- **Response**: `UserTokenDto` (JWT, Roles, Permissions, Branch Context, Password Lifecycle).

#### 2. تغيير كلمة المرور في أول تسجيل دخول (Change Initial Password)

- **Endpoint**: `POST /api/auth/change-initial-password`
- **Authorization**: `Authenticated`
- **Request**:
  ```json
  {
    "newPassword": "..."
  }
  ```
- **Business**: إكمال مسار First Login، التحقق من سياسة كلمة المرور، واستبدال التوكن بآخر صالح بدون قيد `passwordChangeRequired`.

---

### Block 2 — Branch Management

| العملية            | الـ Method والـ URL                         | الـ Permission             | التأثير والوظيفة                                |
| ------------------ | ------------------------------------------- | -------------------------- | ----------------------------------------------- |
| عرض قائمة الفروع   | `GET /api/branches`                         | `Branches.ViewAll`         | استرجاع قائمة الفروع مع Pagination وSearch.     |
| تفاصيل الفرع       | `GET /api/branches/{branchId}`              | `Branches.ViewDetails`     | استرجاع بيانات الفرع وموقعه الجغرافي.           |
| إنشاء فرع جديد     | `POST /api/branches`                        | `Branches.Create`          | إنشاء موقع تشغيلي جديد بحالة Active افتراضياً.  |
| تعديل بيانات الفرع | `PUT /api/branches/{branchId}`              | `Branches.Update`          | تحديث بيانات الفرع مع فحص الـ `RowVersion`.     |
| إيقاف تشغيل الفرع  | `POST /api/branches/{branchId}/deactivate`  | `Branches.Deactivate`      | إيقاف الفرع تشغيلياً دون حذف بياناته التابعة.   |
| إعادة تفعيل الفرع  | `POST /api/branches/{branchId}/reactivate`  | `Branches.Reactivate`      | استعادة تشغيل الفرع بعد الصيانة أو الإيقاف.     |
| حذف الفرع نهائياً  | `DELETE /api/branches/{branchId}/permanent` | `Branches.DeletePermanent` | حذف صلب مشروط بعدم وجود بيانات تشغيلية معتمدة.  |
| إنشاء مدير فرع     | `POST /api/branches/{branchId}/admins`      | `BranchAdmins.Create`      | إنشاء حساب `BranchAdmin` مرتبط بالفرع المستهدف. |

---

### Block 3 — Branch Branding & Advertisements

#### إدارة الهوية البصرية للفرع (Branding & Theme)

- `GET /api/branches/{branchId}/branding` (`Branches.ViewDetails`): قراءة إعدادات الألوان، الخطوط، وأحجام وأزرار الكشك.
- `PUT /api/branches/{branchId}/branding/theme` (`Branches.Update`): تحديث ألوان وأزرار وسلوكيات شاشة الكشك.
- `PUT /api/branches/{branchId}/branding/logo` (`Branches.Update`): رفع شعار الفرع عبر `multipart/form-data`.

#### إدارة إعلانات الفرع (Advertisements)

- `GET /api/branches/{branchId}/advertisements`: استعراض الإعلانات النشطة.
- `POST /api/branches/{branchId}/advertisements`: رفع صور إعلانات جديدة (بحد أقصى 20 إعلان للفرع).
- `PUT /api/branches/{branchId}/advertisements/order`: إعادة ترتيب الإعلانات تسلسلياً باستخدام الـ `RowVersion`.
- `POST /api/branches/{branchId}/advertisements/{id}/deactivate` & `reactivate`.
- `DELETE /api/branches/{branchId}/advertisements/{id}`: حذف الإعلان.

---

### Block 4 — Branch Configuration

- `GET /api/branches/{branchId}/configuration` (`BranchConfigurations.View`): استعراض إعدادات التشغيل.
- `POST /api/branches/{branchId}/configuration` (`BranchConfigurations.Create`).
- `PUT /api/branches/{branchId}/configuration` (`BranchConfigurations.Update`).
- **المعاملات التشغيلية**:
  - `allowedTime`: نافذة وقت العمل المسموح بها.
  - `maximumTicketCallAttempts`: الحد الأقصى لمحاولات نداء التذكرة (افتراضياً 3).
  - `ticketNoShowAutoCancellationMinutes`: مدة الإلغاء التلقائي في حالة عدم الحضور (NoShow).
  - `ticketArchiveRetentionDays`: مدة بقاء التذاكر في الـHot Tables قبل الأرشفة.

---

### Block 5 — Waiting Areas

- `GET /api/waiting-areas` & `GET /api/waiting-areas/{id}`
- `POST /api/waiting-areas`
- `PUT /api/waiting-areas/{id}`
- `POST /api/waiting-areas/{id}/deactivate` & `reactivate`
- `DELETE /api/waiting-areas/{id}/permanent`
- **الوظيفة**: تقسيم الفرع إلى صالات ومناطق انتظار تضم شبابيك تقديم الخدمة وأجهزة الصوت.

---

### Block 6 — Windows (Service Counters)

- `GET /api/windows` & `GET /api/windows/{id}`
- `POST /api/windows`
- `PUT /api/windows/{id}`
- `POST /api/windows/{id}/deactivate` & `reactivate`
- `DELETE /api/windows/{id}/permanent`
- **المعاملات**: `number`, `descriptiveName`, `ipAddress`, `enableTicketBooking`, `enableDirectCall`.

---

### Block 7 — Terminals

- `GET /api/terminals` & `GET /api/terminals/{id}`
- `POST /api/terminals`
- `PUT /api/terminals/{id}`
- `POST /api/terminals/{id}/deactivate` & `reactivate`
- `DELETE /api/terminals/{id}/permanent`
- **الوظيفة**: ربط أجهزة التشغيل الفعلية (Hardware Terminals) بالشبابيك (`WindowId`).

---

### Block 8 — Physical Displays & DisplayWindow

- `GET /api/displays` & `GET /api/displays/{id}`
- `POST /api/displays` & `PUT /api/displays/{id}`
- `POST /api/displays/{id}/deactivate` & `reactivate`
- `DELETE /api/displays/{id}/permanent`
- **ربط الشاشات بالشبابيك**:
  - `GET /api/displays/{displayId}/windows`: الشبابيك المربوطة حالياً.
  - `GET /api/displays/{displayId}/available-windows`: الشبابيك المتاحة للربط.
  - `POST /api/displays/{displayId}/windows/{windowId}`: تخصيص الشباك للشاشة.
  - `DELETE /api/displays/{displayId}/windows/{windowId}`: فك ارتباط الشباك بالشاشة.

---

### Block 9 — Branch Display Runtime & Messages

- `GET /api/branches/{branchId}/display-configuration`: إعدادات ألوان شاشة العرض والجداول والساعة والشريط الإخباري.
- `PUT /api/branches/{branchId}/display-configuration`: حفظ تعديلات شكل شاشة العرض.
- `GET /api/branches/{branchId}/display-messages`: قراءة الرسائل الإخبارية (Ticker Messages).
- `POST /api/branches/{branchId}/display-messages`: إضافة رسالة جديدة (عربي/إنجليزي).
- `PUT /api/branches/{branchId}/display-messages/{id}` & `order`: تعديل وإعادة ترتيب الرسائل.
- `POST /api/branches/{branchId}/display-messages/{id}/deactivate` & `reactivate`.

---

### Block 10 — Branch Videos

- `GET /api/branches/{branchId}/display-videos`: قائمة الفيديوهات.
- `POST /api/branches/{branchId}/display-videos`: رفع فيديو جديد ومعالجته إلى HLS Stream.
- `PUT /api/branches/{branchId}/display-videos/order`: إعادة ترتيب Playlist الفيديوهات.
- `DELETE /api/branches/{branchId}/display-videos/{id}/permanent`: حذف الفيديو (يشترط إيقافه أولاً).
- `GET /api/branches/{branchId}/display-videos/playlist`: جلب Playlist الفيديو للتشغيل.

---

### Block 11 — General Brand

- `GET /api/general-brand`: جلب الهوية البصرية العامة للنظام (Default Brand).
- `POST /api/general-brand`: إنشاء الهوية المركزية.
- `PUT /api/general-brand`: تحديث الهوية المركزية الافتراضية.

---

### Block 12 — Service Catalog

- `GET /api/services`: قائمة الخدمات المركزية مع الفلاتر.
- `GET /api/services/tree`: استعراض الشجرة الهرمية للخدمات.
- `GET /api/services/central-tree`: شجرة الخدمات المركزية العامة.
- `GET /api/services/available-parents`: جلب الآباء المتاحين لتحديد علاقات الـHierarchy.
- `GET /api/services/{serviceId}`: تفاصيل الخدمة والـCustom Inputs التابعة لها.
- `POST /api/services`: إنشاء خدمة جديدة (مع تحديد `HasReservation`, `IsTicketIssuable`, `CustomInputs`).
- `PUT /api/services/{serviceId}`: تعديل تعريف الخدمة مع فحص `RowVersion`.
- `DELETE /api/services/{serviceId}` & `restore` & `permanent`: الحذف والاستعادة والحذف النهائي.

---

### Block 13 — Service Images

- `GET /api/services/{serviceId}/images`: قراءة صور الخدمة (Logo, Icon, Ads).
- `POST /api/services/{serviceId}/images/logo`: رفع لوجو الخدمة.
- `POST /api/services/{serviceId}/images/icon`: رفع أيقونة الخدمة.
- `POST /api/services/{serviceId}/images/ads`: رفع صور إعلانات الخدمة.
- `DELETE /api/services/{serviceId}/images/{imageId}`: حذف صورة.

---

### Block 14 — Branch Service Assignment & Service Trees

- `GET /api/branches/{branchId}/services/tree`: شجرة الخدمات المخصصة للفرع.
- `GET /api/branches/{branchId}/ticket-issuable-services`: **Endpoint الخدمة الذاتية الأساسية للكشك** (AllowAnonymous).
- `POST /api/branches/{branchId}/services/assign`: ربط خدمات مركزية موجودة بالفرع.
- `DELETE /api/branches/{branchId}/services/{leafServiceId}`: فك ارتباط الخدمة بالفرع دون حذفها المركزية.
- `POST /api/branches/{branchId}/service-trees`: إنشاء شجرة خدمات كاملة للفرع.
- `POST /api/branches/{branchId}/services/{parentServiceId}/subtree`: إضافة شجرة فرعية تحت خدمة معينة.

---

### Block 15 — Service Schedule

- `GET /api/branches/{branchId}/services/{leafServiceId}/schedule`: قراءة مواعيد إتاحة الخدمة الأسبوعية.
- `POST /api/branches/{branchId}/services/{leafServiceId}/schedule`: تعيين جدول المواعيد وساعات العمل والـ TimeSlots.
- `PUT /api/branches/{branchId}/services/{leafServiceId}/schedule`: تحديث الجدول مع فحص `RowVersion`.

---

### Block 16 — Service Workflow

- `GET /api/branches/{branchId}/services/{leafServiceId}/workflows`: قائمة مسارات الخدمة متعددة المراحل.
- `POST /api/branches/{branchId}/services/{leafServiceId}/workflows`: إنشاء رحلة خدمة متعددة الخطوات (خطوتين على الأقل).
- `PUT /api/branches/{branchId}/services/{leafServiceId}/workflows/{id}`: تحديث مسار الخدمة.
- `POST /api/branches/{branchId}/services/{leafServiceId}/workflows/{id}/set-default`: تحديد المسار الافتراضي.
- `POST /api/branches/{branchId}/services/{leafServiceId}/workflows/{id}/deactivate` & `reactivate`.

---

### Block 17 — Segments

- `GET /api/segments` & `GET /api/segments/{id}`: الشرائح العامة (مثل Normal, VIP, Elderly).
- `POST /api/segments` & `PUT /api/segments/{id}`: إدارة الشرائح وتحديد أولوياتها (`Priority`).
- `POST /api/branches/{branchId}/segments`: إنشاء شريحة مخصصة للفرع محلياً.

---

### Block 18 — Branch Service Segments & Quota

- `GET /api/branches/{branchId}/services/{leafServiceId}/segments`: الشرائح المخصصة للخدمة في الفرع وسعتها (Quota).
- `GET /api/branches/{branchId}/services/{leafServiceId}/segments/available`: الشرائح المتاحة للتخصيص.
- `POST /api/branches/{branchId}/services/{leafServiceId}/segments/assign`: تخصيص كوتة لشرائح الخدمة.
- `PUT /api/branches/{branchId}/services/{leafServiceId}/segments/{segmentId}/quota`: تعديل الكوتة.
- `DELETE /api/branches/{branchId}/services/{leafServiceId}/segments/{segmentId}`: فك ارتباط الشريحة بالخدمة.

---

### Block 19 — Service Globalization

- `GET /api/branches/{branchId}/service-globalization-requests`: استعراض طلبات الفرع لتعميم الخدمات.
- `GET /api/service-globalization-requests`: استعراض كافة الطلبات المركزية المعلقة للمراجعة.
- `POST /api/service-globalization-requests/{id}/approve`: الموافقة على تحويل الخدمة من فرعية إلى عامة مركزياً.
- `POST /api/service-globalization-requests/{id}/reject`: رفض الطلب مع إرسال سبب الرفض (`rejectionReason`).

---

### Block 20 — Segment Globalization

- `GET /api/branches/{branchId}/segment-globalization-requests`: طلبات الفرع لتعميم الشرائح.
- `GET /api/segment-globalization-requests`: قائمة الطلبات المركزية.
- `POST /api/segment-globalization-requests/{id}/approve` & `reject`: اعتماد أو رفض تعميم الشريحة.

---

### Block 21 — Reservation Runtime

| العملية            | الـ Method والـ URL                                      | الـ Permission                 | الوظيفة                                                        |
| ------------------ | -------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| إنشاء حجز مسبق     | `POST /api/branches/{branchId}/reservations`             | `Reservations.Create`          | تسجيل موعد حجز جديد مع بيانات `customInputs` أو `field`.       |
| قائمة الحجوزات     | `GET /api/branches/{branchId}/reservations`              | `Reservations.View`            | استعراض الحجوزات الحالية مع Pagination وفلاتر الحالة والتاريخ. |
| تفاصيل الحجز       | `GET /api/branches/{branchId}/reservations/{id}`         | `Reservations.ViewDetails`     | قراءة بيانات الحجز التفصيلية.                                  |
| سجل الحجز          | `GET /api/branches/{branchId}/reservations/{id}/history` | `Reservations.ViewHistory`     | استعراض التغييرات السابقة على الحجز.                           |
| إلغاء حجز          | `POST /api/branches/{branchId}/reservations/{id}/cancel` | `Reservations.Cancel`          | إلغاء الموعد مع تسجيل سبب الإلغاء.                             |
| تحويل الحجز لتذكرة | `POST /api/branches/{branchId}/reservations/{id}/ticket` | `Reservations.ConvertToTicket` | تحويل الحجز المؤكد إلى تذكرة انتظار فورية.                     |
| أرشيف الحجوزات     | `GET /api/branches/{branchId}/reservations/archive`      | `Reservations.ViewArchive`     | استرجاع الحجوزات القديمة المؤرشفة.                             |

---

### Block 22 — Ticket Runtime

| العملية               | الـ Method والـ URL                                            | الـ Permission                  | الوظيفة                                                              |
| --------------------- | -------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| إنشاء تذكرة           | `POST /api/branches/{branchId}/tickets`                        | `Tickets.Create`                | إنشاء تذكرة انتظار للعميل وإدراجها في قائمة `Waiting`.               |
| قائمة التذاكر         | `GET /api/branches/{branchId}/tickets`                         | `Tickets.ViewAll`               | استعراض التذاكر الحالية بالفرع.                                      |
| تفاصيل التذكرة        | `GET /api/branches/{branchId}/tickets/{id}`                    | `Tickets.ViewDetails`           | قراءة تفاصيل التذكرة وموقعها في الطابور.                             |
| سجل حركات التذكرة     | `GET /api/branches/{branchId}/tickets/{id}/history`            | `Tickets.ViewHistory`           | استعراض تاريخ النداءات والتحويلات.                                   |
| إلغاء التذكرة         | `POST /api/branches/{branchId}/tickets/{id}/cancel`            | `Tickets.Cancel`                | إلغاء التذكرة مع سبب الإلغاء.                                        |
| إعادة الغائب للانتظار | `POST /api/branches/{branchId}/tickets/{id}/return-to-waiting` | `Tickets.ReturnNoShowToWaiting` | إعادة التذكرة من `NoShow` إلى `Waiting`.                             |
| بدء تقديم الخدمة      | `POST /api/branches/{branchId}/tickets/{id}/start-service`     | `Tickets.StartService`          | نقل التذكرة من `Called` إلى `InProgress`.                            |
| إكمال الخدمة          | `POST /api/branches/{branchId}/tickets/{id}/complete-service`  | `Tickets.CompleteService`       | إنهاء الخدمة والانتقال للمرحلة التالية في المسار أو الإكمال النهائي. |
| تحويل يدوي            | `POST /api/branches/{branchId}/tickets/{id}/manual-transfer`   | `Tickets.ManualTransfer`        | تحويل التذكرة لخدمة أخرى مع تسجيل السبب.                             |
| أرشيف التذاكر         | `GET /api/branches/{branchId}/tickets/archive`                 | `Tickets.ViewArchive`           | البحث في التذاكر المؤرشفة دون التأثير على الجداول الساخنة.           |

---

### Block 23 — Kiosk Runtime

| العملية                     | الـ Method والـ URL                                                       | الـ Permission                 | الوظيفة                                                      |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------ |
| البحث عن حجز في الكشك       | `POST /api/branches/{branchId}/kiosk/reservations/search`                 | `Reservations.View`            | البحث عن الحجوزات السابقة للعميل باستخدام مدخل واحد أو أكثر. |
| تحويل الحجز لتذكرة في الكشك | `POST /api/branches/{branchId}/kiosk/reservations/{reservationId}/ticket` | `Reservations.ConvertToTicket` | إصدار تذكرة فورية لحجز تم العثور عليه واختياره.              |
| إصدار تذكرة مباشرة في الكشك | `POST /api/branches/{branchId}/kiosk/tickets`                             | `Tickets.Create`               | إنشاء تذكرة فورية لعميل مباشر دون حجز وسيط.                  |

---

### Block 24 — Kiosk Service Discovery

- `GET /api/branches/{branchId}/ticket-issuable-services`
- **Authorization**: `AllowAnonymous`
- **الوظيفة**: جلب هوية الفرع وألوانه وشجرة الخدمات المتاحة للإصدار حالياً مع قيود الـCustom Inputs وحالة `hasReservation`.

---

### Block 25 — Public Display Runtime

- `GET /api/branches/{branchId}/display-runtime-configuration`: استرجاع شكل الشاشات والرسائل والساعة لشاشات التلفاز العامة بدون تسجيل دخول.
- `GET /api/branches/{branchId}/display-runtime-playlist`: استرجاع قائمة تشغيل الفيديوهات النشطة للشاشات العامة.
- **Authorization**: `AllowAnonymous`.

---

### Block 26 — Globalization Review

- مركز المراجعة الموحد لطلبات التعميم للخدمات والشرائح المرفوعة من الفروع بواسطة الـ `TechnicalAdmin`.

---

### Block 27 — API Areas غير موجود لها Endpoint حاليًا

المفاهيم التالية **لا تملك Endpoints معتمدة في النسخة الحالية** ولا يجب اختراع Endpoints لها:

- GlobalConfiguration CRUD
- Logging CRUD
- Map
- Audit Management
- Data Synchronization APIs
- WindowService Management
- Calling Algorithm
- Operator Runtime

---

# 3. المواصفات التفصيلية لتدفقات الجيرا

## Jira: [FE][Kiosk] Implement Customer Ticket Issuance Flow

### End-to-End Workflow Map

```text
Open Kiosk
    │
    ▼
Load Branch Branding + Services Tree (GET /api/branches/{branchId}/ticket-issuable-services)
    │
    ▼
Language Selection (إذا كانت showLanguagePage = true)
    │
    ▼
Navigate Service Tree → Select Leaf Service (children.length === 0 && isTicketIssuable === true)
    │
    ▼
هل الخدمة تدعم الحجز المسبق؟ (hasReservation)
    ├─────────────────────────────────────────────┐
    ▼ (hasReservation = true)                     ▼ (hasReservation = false)
Choose Flow Screen                             Direct Ticket Flow Only
[ لدي حجز مسبق ]  [ تذكرة جديدة ]                    │
    │                   │                         │
    ▼                   └────────────┬────────────┘
Flow A: Previous Reservation         │
    │                                ▼
Determine Lookup Mode           Flow B: Direct Ticket
├─ Service with CustomInputs    ├─ Service with CustomInputs
│  └─ Show inputs (Min 1 field) │  └─ Show inputs (Enforce ALL required)
└─ Service without Inputs       └─ Service without Inputs
   └─ Show Keypad / Field          └─ Show Keypad / Field (Required)
    │                                │
    ▼                                ▼
Search API (POST .../search)     Direct Ticket API (POST .../tickets)
    │                                │
    ▼                                │
Reservation Results List             │
    │                                │
Select Specific Reservation          │
    │                                │
Convert API (POST .../ticket)        │
    │                                │
    └────────────────┬───────────────┘
                     ▼
           Ticket Details Response (Status: Waiting)
                     │
                     ▼
             Print Ticket Slip
                     │
                     ▼
            Reset Flow to Initial Screen
```

---

### قواعد البحث عن حجز مسبق (Flow A)

1. **طريقة البحث المعتمدة (Lookup Mode)**:
   - **الخدمة تملك Custom Inputs**:
     - يتم البحث عبر الحقول المخصصة (`customInputs: [{ serviceCustomInputId, value }]`).
     - **قاعدة ذهبية**: لا يُشترط ملء جميع الحقول الإلزامية للبحث؛ يكفي إدخال **حقل واحد فقط على الأقل** (Minimum = 1 input).
     - ممنوع إرسال حقل `field` عند وجود `customInputs` (يجب أن يكون `field: null`).
     - إذا تم إدخال أكثر من حقل، يقوم الباك إند بالبحث بشرط `AND`.
   - **الخدمة بدون Custom Inputs**:
     - يتم البحث عبر حقل الـ `field` العام (Keypad / Numeric Field).
     - يجب إرسال قيمة `field` وتمرير `customInputs: []`.

2. **عرض النتائج والاختيار**:
   - النتائج تعود كـ `List<Reservation>` وليس حجزاً وحيداً.
   - **ممنوع على الواجهة اختيار أول حجز تلقائياً** في حال وجود أكثر من حجز لنفس الرقم؛ يجب أن يقوم العميل بالنقر واختيار موعده يدوياً.
   - إذا كانت النتيجة فارغة (`[]`) تظهر رسالة: `"لم يتم العثور على أي حجز مطابق"` مع زر `"تعديل بيانات البحث"` و`"رجوع"`.

3. **التحويل إلى تذكرة (Conversion)**:
   - استدعاء `POST /api/branches/{branchId}/kiosk/reservations/{reservationId}/ticket`.
   - لا يحتوي الطلب على Request Body.
   - يعود الاستجابة ببيانات التذكرة المكتملة `TicketDetailsResponse`.

---

### قواعد إصدار تذكرة مباشرة (Flow B)

1. **التحقق الصارم من المدخلات**:
   - لا يتم إنشاء حجز مسبق، بل يتم استدعاء `POST /api/branches/{branchId}/kiosk/tickets` مباشرة.
   - **الخدمة تملك Custom Inputs**:
     - **يجب إدخال جميع الحقول الإلزامية** (`isRequired: true`).
     - تُمنع العملية محلياً ويتم تظليل الحقول الناقصة إذا لم يملأها العميل بالكامل.
     - يتم إرسال `field: null` و `customInputs: [{ serviceCustomInputId, value }]`.
   - **الخدمة بدون Custom Inputs**:
     - حقل `field` إلزامي ويتم إرساله مع `customInputs: []`.

2. **منع التكرار (Double Submit & Retries)**:
   - يتم تعطيل أزرار الإرسال فور الضغط وعرض حالة التحميل (`جاري إصدار التذكرة...`).
   - **ممنوع إعادة المحاولة الآلية (Blind Auto-Retry) عند انتهاء المهلة (Timeout)** لتجنب تكرار طباعة تذكرتين لنفس العميل في حالة نجاح الباك إند وفقدان الرد الشبكي.

---

### إدارة الأخطاء ورسائل البيزنس (Problem Details)

الواجهة تعرض الرسائل المترجمة القادمة من السيرفر مباشرة وتتعامل مع الحالات التالية:

- `ServiceUnavailable`: إشعار العميل وإعادته لاختيار خدمة أخرى مع تحديث قائمة الخدمات.
- `QuotaExceeded`: تجاوز الكوتة المخصصة للشريحة اليوم.
- `NumberRangeExhausted`: نفاد أرقام التذاكر المتاحة لليوم.
- `AlreadyConverted`: الحجز تم تحويله مسبقاً إلى تذكرة.
- `AtLeastOneCustomInputRequired`: لم يتم إدخال أي بيان للبحث.
- `FieldNotAllowed` / `CustomInputsNotAllowed`: تضارب إرسال `field` مع `customInputs`.

---

# 4. القاموس الشامل وقواعد البيانات المشتركة

## حالات التذاكر (Ticket Status Lifecycle)

```text
Waiting (في الانتظار)
   │
   ▼
Called (تم النداء على الشباك)
   │
   ├──────────────────────────────┐
   ▼                              ▼
InProgress (جاري تقديم الخدمة)    NoShow (لم يحضر)
   │                              │
   ├───────────────┐              ▼
   ▼               ▼          Waiting (عند الإرجاع)
Completed      Cancelled
(اكتملت)       (ملغاة)
```

| الحالة       | المعنى والوصف                                         |
| ------------ | ----------------------------------------------------- |
| `Waiting`    | التذكرة في الطابور بانتظار استدعائها للشباك.          |
| `Called`     | الموظف قام بالنداء على التذكرة وتظهر على شاشة العرض.  |
| `InProgress` | العميل موجود على الشباك والخدمة جارية حالياً.         |
| `NoShow`     | تم النداء على العميل ولم يحضر إلى الشباك.             |
| `Completed`  | اكتملت الخدمة بنجاح وانتهت رحلة التذكرة.              |
| `Cancelled`  | تم إلغاء التذكرة لسبب إداري أو بناءً على رغبة العميل. |

---

## حالات الحجوزات المسبقة (Reservation Status Lifecycle)

| الحالة              | المعنى والوصف                                      |
| ------------------- | -------------------------------------------------- |
| `Active`            | الحجز ساري ومؤكد ومتاح للاستخدام في الموعد المحدد. |
| `ConvertedToTicket` | تم تحويل الحجز بنجاح إلى تذكرة انتظار داخل الفرع.  |
| `Cancelled`         | الحجز ملغى من قبل العميل أو الإدارة.               |
| `Expired`           | انتهت صلاحية موعد الحجز دون الحضور للفرع.          |
| `NoShow`            | مر موعد الحجز بالكامل دون تحويله إلى تذكرة.        |

---

## أنواع المدخلات المخصصة والقيود (Custom Input Specifications)

الـ Enum المعتمد في الـ API:

- `String = 1` (في الـ JSON تأتي `"type": "String"`)
- `Integer = 2` (في الـ JSON تأتي `"type": "Integer"`)

### القيود المدعومة:

- **حقول النصوص (`String`)**:
  - `minLength`: الحد الأدنى لعدد الحروف.
  - `maxLength`: الحد الأقصى لعدد الحروف.
  - `startWith`: بادئة إلزامية (مثل `01` لأرقام الهاتف المصرية).
- **حقول الأرقام (`Integer`)**:
  - `minValue`: الحد الأدنى للقيمة العددية.
  - `maxValue`: الحد الأقصى للقيمة العددية.

---

## التزامن المتفائل (Optimistic Concurrency & RowVersion)

- الـ `RowVersion` عبارة عن سلسلة نصية Base64 مشفرة (Opaque String).
- تحتفظ بها الواجهة وترسلها في عمليات التعديل (`PUT`) والإلغاء (`POST /cancel`) كشرط تماسك.
- عند حدوث تضارب في التعديل (`409 ConcurrencyConflict`)، تقوم الواجهة بإعادة جلب أحدث نسخة من الكيان وتنبيه المستخدم.

---

## اللغات والاتجاهات (Localization & Directionality)

- النظام يدعم لغتين رسميتين:
  - **العربية (`ar`)**: اتجاه RTL.
  - **الإنجليزية (`en`)**: اتجاه LTR.
- كل استدعاء API يرسل هيدر `Accept-Language` المناسب لضمان استقبال نصوص الأخطاء والرسائل من الباك إند باللغة المختارة من قبل العميل.
