# Technical Architecture, Logic & System Documentation
## Q-SYSTEM (NileTronix Q-Control Queue Management System)

---

## 1. Executive Summary & System Purpose

**Q-SYSTEM** (NileTronix Q-Control) is an enterprise-grade, high-performance Queue & Flow Management Web Application built with **Angular 21**. It controls customer journeys, service catalog hierarchies, physical counter windows, queue kiosks, audio-visual announcement systems, and branch-level operational rules.

The system serves three primary user personas:
1. **Technical Administrator (`TechnicalAdmin` / `BranchAdmin`)**: Manages physical infrastructure across branches—including waiting areas, counter windows, self-service terminals/kiosks, central display screens, branch branding, service catalog assignments, and operating schedules.
2. **Organization Administrator (`OrganizationAdmin`)**: Oversees organization-wide global settings, ticket calling parameters, no-show timeouts, audio announcement voice synthesized/chime rules, and custom ticket lifecycle status definitions.
3. **Self-Service Kiosk (`Service Kiosk`)**: High-speed, touchscreen-optimized ticketing kiosk interface that guides customers through multi-tier service selection, priority segment categorization, queue ticket generation, dynamic QR payload encoding, and printing hints.

---

## 2. Technology Stack & Architectural Overview

### A. Core Stack Specifications
- **Framework**: Angular v21.1.0 (Standalone Components architecture, no legacy `NgModules`).
- **Language**: TypeScript 5.9.2.
- **State Management Engine**: Native Angular Signals (`signal`, `computed`, `asReadonly`, Signal Stores).
- **Asynchronous Operations**: RxJS 7.8.0 integrated seamlessly with Signals via `toSignal` or RxJS streams converted directly into Signal updates.
- **Styling & UI System**: Custom NileTronix CSS Design System (`niletronix-admin-theme.css`, `foundation.css`, `ui-refresh.css`, `dialog-system.css`) integrated with Bootstrap 5.3.8 and Tailwind CSS 4.3.2.
- **Testing Framework**: Vitest 4.0.8 & JSDOM 27.1.0.
- **HTTP Client & API Integration**: Angular `HttpClient` coupled with functional `HttpInterceptor` pipeline for Bearer authorization, language header propagation, and error handling.

### B. Workspace Directory Architecture (`src/app`)
```
src/app/
├── app.config.ts                   # Application providers (Router, HttpClient, Interceptors)
├── app.routes.ts                   # Main route tree with lazy loading & guards
├── features/                       # Modular feature domain implementations
│   ├── auth/                       # Authentication, JWT handling, forced initial password
│   ├── technical-admin/            # Branch, Window, Terminal, Display, Waiting Area admin
│   ├── service-management/         # Central tree, Branch services, Workflows, Schedules, Globalization
│   ├── segment-management/         # Priority segments, globalization requests
│   ├── organization/               # Global configs, Ticket calling, Audio announcement, Ticket statuses
│   ├── branch-admins/              # Branch admin user management
│   └── service-request/            # Kiosk ticketing user experience
├── shared/                         # Shared cross-cutting components & stores
│   ├── components/                 # Page heroes, mobile cards, breadcrumbs, loading states
│   ├── layouts/                    # App Shell layout, navigation rails, overlays
│   ├── models/                     # Shared interfaces (Navigation, Language, Breadcrumbs)
│   ├── store/                      # Global AppLanguageStore
│   └── styles/                     # Core CSS design tokens, normalization, theme files
└── environments/                   # Production & Development environment configs
```

---

## 3. Security, Authentication & Identity Engine

### A. Session Management (`AuthSessionService`)
- **Supported User Roles**: `TechnicalAdmin`, `OrganizationAdmin`, `BranchAdmin`.
- **Token Persistence**: JWT session objects (`AuthenticatedSession`) are stored in `localStorage` when "Remember Me" is enabled, or `sessionStorage` for transient sessions.
- **Self-Healing Expiration Check**: On every call to `activeSession()`, the service decodes the JWT `exp` timestamp. If expired, `clearSession()` is triggered automatically, wiping storage and redirecting to `/auth/login`.
- **Forced Initial Password Change (`firstLoginFlag`)**:
  - When a user logs in with `firstLoginFlag: true` or JWT claim `password_change_required: true`:
    1. Route guards (`adminConsoleAccessGuard`, `organizationAccessGuard`) intercept navigation and force redirection to `/auth/change-initial-password`.
    2. The `authHttpInterceptor` blocks all operational backend API requests and emulates a local HTTP `403 Forbidden` error with detail `"First login password change is required"`.

### B. JWT Claim & Permission Parsing (`auth-permissions.util.ts`)
- **Base64Url Decoding**: Normalizes URL-safe base64 strings (`-` to `+`, `_` to `/`, calculates missing `=` padding).
- **Claim Extraction**: Recursively scans JWT payload up to 4 levels deep across candidate keys (`permissions`, `permission`, `branchAdminsPermissions`, `servicesPermissions`, `windowsPermissions`, `terminalsPermissions`, `displaysPermissions`, `scope`, `scp`).
- **Permission Check**: Function `hasAnyJwtPermission(token, requiredPermissions)` matches required route permissions against the extracted `ReadonlySet<string>`.

### C. Guard Decision Matrix

| Guard Name | File Location | Purpose & Decision Logic |
| :--- | :--- | :--- |
| `adminConsoleAccessGuard` | `auth-access.guard.ts` | Validates active session and enforces userType `TechnicalAdmin` or `BranchAdmin`. Redirects to `/auth/change-initial-password` if `firstLoginFlag` is set. |
| `organizationAccessGuard` | `auth-access.guard.ts` | Enforces active session and userType `OrganizationAdmin`. Redirects if `firstLoginFlag` is active. |
| `adminPermissionGuard` | `admin-permission.guard.ts` | Evaluates route `data.requiredAnyPermissions` against user's JWT permissions using `hasAnyJwtPermission()`. |
| `technicalAdminBranchContextGuard` | `technical-admin-branch-context.guard.ts` | Ensures an active branch context is selected in `TechnicalAdminBranchContextStore` before allowing access to branch-dependent pages (Windows, Waiting Areas, Terminals, Displays). Redirects to `/admin/branch-editor` if no branch is selected. |
| `serviceSchedulePendingChangesGuard` | `service-schedule-pending-changes.guard.ts` | Implements `CanDeactivateFn`. Intercepts navigation if the service schedule editor has unsaved changes (`isDirty`), prompting user confirmation. |

### D. Functional Interceptor (`authHttpInterceptor`)
- Injects `Authorization: Bearer <token>` into outgoing requests.
- Automatically appends `Accept-Language: ar` or `Accept-Language: en` based on `AppLanguageStore.language()`.
- Short-circuits non-login requests if `firstLoginFlag` is active.

---

## 4. Technical Admin Console (`/admin`)

### A. Branch Management & Optimistic Concurrency Control
- **Endpoints**: Managed via `BranchManagementApiService` pointing to `api/branches`.
- **Operations**: Paginated listing (`getBranches`), detail retrieval (`getBranchDetails`), creation (`createBranch`), updates (`updateBranch`), deactivation (`deactivateBranch`), reactivation (`reactivateBranch`), and permanent deletion (`permanentlyDeleteBranch`).
- **Optimistic Concurrency Control**: Deactivation, reactivation, and permanent deletion operations require a `rowVersion` token passed via the HTTP `If-Match` header. If a conflicting update occurred on the backend, the request fails safely.

### B. Active Branch Context Store (`TechnicalAdminBranchContextStore`)
- Provides a sticky active branch context across sub-features (Windows, Terminals, Displays, Waiting Areas).
- **Race Condition Prevention**: Employs a monotonic `requestId` counter. When `activate(branchId)` is called asynchronously:
  ```typescript
  const requestId = ++this.requestId;
  this.branchApi.getBranchDetails(branchId).subscribe({
    next: (details) => {
      if (requestId !== this.requestId || this.selectedBranchId() !== branchId) return; // Stale request discarded
      this.selectBranch({ ...details });
    }
  });
  ```

### C. Waiting Areas Management (`/admin/waiting-areas`)
- Manages waiting room capacity, floor positioning, and queue counter assignments per branch via `WaitingAreaApiService` (`api/branches/{branchId}/waiting-areas`).

### D. Counter Windows Management (`/admin/windows`)
- Configures physical service counters (`WindowManagementApiService` at `api/branches/{branchId}/windows`).
- Maps available leaf services to specific windows, toggles operational status, and assigns staff credentials.

### E. Kiosk Terminals Management (`/admin/terminals`)
- Registers physical kiosk terminals and touchscreens (`TerminalManagementApiService` at `api/branches/{branchId}/terminals`).
- Controls hardware integration properties (thermal printer status, touchscreen mode, kiosk authorization keys).

### F. Central & Counter Displays (`/admin/displays`)
- Configures display screens (`DisplayManagementApiService` at `api/branches/{branchId}/displays`).
- Links main overview screens or counter-specific displays to counter windows (`DisplayWindows.Assign` / `Unassign`).

### G. Branch Branding (`/admin/branch-branding`)
- Customizes branch-specific visual themes (`BranchBrandingApiService` at `api/branches/{branchId}/branding`).
- Manages custom logos, primary/secondary brand colors, and background media assets.

---

## 5. Service Catalog & Service Management (`/admin/services`)

### A. Central Service Tree Hierarchy
The service catalog (`ServiceManagementApiService`) maintains a 3-tier tree structure:
1. **Root Categories**: High-level domains (e.g., Medical, Administrative, Financial).
2. **Sub-Services**: Departmental groupings (e.g., Cardiology, Outpatient, Cashier).
3. **Leaf Services**: Actionable services that can be assigned to branches, scheduled, and booked on kiosks.

### B. Branch Service Assignment Lifecycle
- Services in the central catalog must be explicitly assigned to branches using `AssignBranchServicesDialog`.
- Branch administrators can override local service names, display ordering, and expected service duration without altering the central catalog template.
- Managed via `BranchServicesApiService` (`api/branches/{branchId}/services`).

### C. Service Workflows (`/workflows`)
- Defines step-by-step ticket routing pathways (`ServiceWorkflowApiService`).
- Specifies initial counter assignment, transfer sequences between departments, escalation criteria, and priority handling.

### D. Operating Schedules & Slot Sorting (`/schedules`)
- Configures service availability per day of week (`Sunday` through `Saturday`).
- **Time Slot Normalization & Sorting**: Slots are parsed and automatically sorted chronologically via `compareTimeSlots`:
  ```typescript
  private compareTimeSlots(first: ServiceScheduleTimeSlot, second: ServiceScheduleTimeSlot): number {
    const startCompare = first.startTime.localeCompare(second.startTime);
    return startCompare === 0 ? first.endTime.localeCompare(second.endTime) : startCompare;
  }
  ```
- Supports mandatory slot code verification (`isSlotCodeRequired`).

### E. Service Globalization Requests
- Allows branch-scoped services to be submitted for central catalog inclusion (`ServiceGlobalizationApiService`).
- Central administrators review, approve, or reject globalization requests via `ServiceGlobalizationStore`.

---

## 6. Segment Management & Priority Allocation (`/admin/segments`)

- **Purpose**: Categorizes customers into priority tiers (e.g., VIP, Elderly, General Public, Corporate Account).
- **Priority Multipliers**: Assigns weight factors (`priorityMultiplier` / `priorityWeight`) that re-order tickets dynamically in queue calling algorithms.
- **Global vs. Branch Segments**: Supports system-wide segments managed centrally or branch-specific segments with approval workflows (`leaf-service-segments-drawer.component.ts`).

---

## 7. Organization & Audio Announcement Configuration (`/organization`)

Managed centrally via `OrganizationStore` Signal Store:

### A. Global Configurations
- Organization name, logo asset path, timezone (default `Africa/Cairo`), default system language (`Arabic` / `English`).

### B. Ticket Calling Rules
- **No-Show Timeout (`noShowSeconds`)**: Delay before a non-responsive ticket is marked as No-Show.
- **Ticket Lookup Limit (`ticketLookupCount`)**: Max lookahead depth in queue calling buffers.
- **Priority Calling Toggle**: Enables or disables priority weight calculation.

### C. Audio Announcement System
- **Voice Language**: Arabic / English text-to-speech synthesized audio.
- **Chime / Starting Tone**: Customizable chime audio (e.g., `Tone 1`).
- **Phrasing Rules**: Configures prefix phrasing (Customer Type, Ticket Number, Target Window) and toggle for appending number words (`appendNumberWord`).

### D. Ticket Status Lifecycle
- Manages ticket status definitions (Pending, Called, Serving, Completed, No-Show, Cancelled).
- Auto-generates unique status IDs via `createNextTicketStatusId()`.

---

## 8. Kiosk Self-Service Ticketing Engine (`/service-request`)

Touchscreen ticketing kiosk application designed for customer self-service:

```
[ Step 1: Select Service Type ] ──> [ Step 2: Select Department ] ──> [ Step 3: Select Sub-Specialty ] ──> [ Step 4: Ticket Generated ]
```

### A. Kiosk State Machine (`ServiceRequestStore`)
- Controls step navigation (`ServiceRequestStep.ServiceType`, `Specialty`, `SubSpecialty`, `Ticket`).
- Evaluates `currentStep` dynamically based on active selection signals.
- Computes `stepItems` for step indicators with completion status ('completed' | 'active' | 'pending').

### B. Ticket Generation Algorithm (`TicketGeneratorService`)
1. **Sequential Ticket Numbering (`createTicketNumber`)**:
   - Formats ticket number with service prefix + 3-digit sequence (e.g., `A001`, `A002`).
   - Sequence automatically wraps around at `999` back to `001`.
2. **Estimated Waiting Time Calculation**:
   $$\text{Total Wait} = \text{ServiceType Wait} + \text{Specialty Wait} + \text{SubSpecialty Wait}$$
3. **Counter Hint Resolution (`resolveCounterHint`)**:
   - Evaluates service code:
     - `emergency` $\rightarrow$ "Emergency lane" / "مسار الطوارئ"
     - `laboratory` $\rightarrow$ "Laboratory area" / "منطقة المعمل"
     - `radiology-service` $\rightarrow$ "Radiology area" / "منطقة الأشعة"
     - Default $\rightarrow$ "Reception area" / "منطقة الاستقبال"
4. **Dynamic QR Payload Encoding**:
   - Generates JSON payload string containing `ticketNumber`, `serviceType`, `specialty`, `subSpecialty`, and ISO timestamp for barcode scanners.

---

## 9. Internationalization & Responsive UI Architecture

### A. Language Store (`AppLanguageStore`)
- Language Signal (`ar` | `en`) backed by `localStorage` persistence under key `q-system.language`.
- Computed `direction` signal (`rtl` for Arabic, `ltr` for English).

### B. Responsive App Shell (`AppShellComponent`)
- **Breakpoint Monitoring (`checkBreakpoint`)**:
  - `mobile`: width $\le 767.98\text{px}$. Swaps sidebar mode to mobile overlay.
  - `contextOverlay`: width $< 1200\text{px}$. Converts branch contextual sidebar into an off-canvas overlay.
- **Body Scroll Locking**:
  - When mobile navigation or context overlay opens, sets `document.body.style.overflow = 'hidden'` to prevent background page scrolling. Restores previous overflow on close.
- **Keyboard & Focus Handling**:
  - Listens to `document:keydown.escape` to close active overlays.
  - Uses microtasks (`queueMicrotask`) for screen-reader and keyboard focus traps.

---

## 10. Handover & Current Project Hold Status

- **Code Base Integrity**: 100% clean build, zero TypeScript or Angular compiler errors.
- **Local Dev Server**: Configured and running via `ng serve` on `http://localhost:4200/`.
- **Backend API Integration Endpoint**: Configured in `src/environments/environment.ts`:
  ```typescript
  export const environment = {
    production: true,
    apiBaseUrl: 'http://192.168.1.7:8040/',
  } as const;
  ```
- **Hold Status**: All source code files remain completely untouched as requested. This document serves as the canonical technical logic reference for future development resumption.
