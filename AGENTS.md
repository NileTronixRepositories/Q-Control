# AcademyOps Workspace Development Rules & Architectural Standards

All development, modifications, and feature integrations in this workspace MUST adhere to:

1. **AcademyOps Integration Standards** (Phase 0 API Contract)
2. **Angular Enterprise Architecture Master Guide** ([angular_architecture_best_practices_prompt.md](file:///c:/Users/win10/Music/ACADEMY/angular_architecture_best_practices_prompt.md))
3. Detailed specifications in [.agents/rules/academyops-architecture-rules.md](file:///c:/Users/win10/Music/ACADEMY/.agents/rules/academyops-architecture-rules.md)

---

## 1. Golden Architecture Rules

- **Angular 21+ Modern Standalone**: Standalone components, standalone routes, Signals (`signal`, `computed`, `linkedSignal`), `inject()`, modern control flow (`@if`, `@for`, `@switch`). No `NgModule`.
- **Feature Isolation (Delete-a-Module Principle)**:
  - `src/app/core/`: Infrastructure only (Auth, Guards, Interceptors, Localization, Centralized Error Handling).
  - `src/app/shared/`: Generic reusable UI primitives (Pagination, Modals, Empty/Loading/Error states, Status badges). No business logic.
  - `src/app/layout/`: Shell, Header, Sidebar, Navigation.
  - `src/app/features/`: Isolated feature modules (`auth`, `organizations`, `branches`, `organization-users`, `staff`).
- **No Cross-Feature Coupling**: Features must never import internal components/services directly from other features.
- **CSS & Responsive Architecture**:
  - Use **Bootstrap responsive grid** (`row`, `col-*`, `d-*`, `container-fluid`) for responsive layout structure across components.
  - Solid-color enterprise design tokens. Clean, human-crafted aesthetics. **Never stack new CSS on top of old CSS**—always edit or replace existing styles.
  - **No AI Clichés & No Informal Emojis**: Strictly avoid emojis (e.g., 👋, 🚀, ✨) and generic AI-styled gradients. Ensure harmonious color palettes between form surfaces, sidebars, and visual showcases.

---

## 2. AcademyOps Phase 0 Integration Rules

- **Base API**: `/api/v1`
- **Global Interceptor**:
  - `Authorization: Bearer {accessToken}`
  - `Accept-Language: ar` / `Accept-Language: en`
- **ProblemDetails & Error.Code**:
  - Centralized HTTP error handling (401, 403, 404, 409, 422, 429, 500, 503).
  - Programmatic decisions **MUST** inspect `error.code` (e.g., `Organization.ConcurrencyConflict`, `Auth.Login.InvalidCredentials`, `Organization.LastActiveOwner`).
  - **Never** branch on localized `error.message`.
- **Authentication & First Login**:
  - First-login token (`passwordChangeRequired === true`) must redirect strictly to `/auth/change-initial-password` and block all application routes.
  - On password change success, replace entire auth state with the new `LoginResponse`.
  - Context routing: `organizationId === null` & `PlatformSuperAdmin` $\rightarrow$ Platform, else $\rightarrow$ Organization Dashboard.
- **Permissions**:
  - Action buttons and route guards are controlled by `permissions[]`. Backend remains the real security authority.
- **RowVersion Concurrency**:
  - Base64 opaque string. Frontend stores and forwards unchanged. On `409 ConcurrencyConflict`, reload the latest entity.
- **Backend Branch Scope**:
  - Frontend trusts `GET /api/v1/organizations/{organizationId}/branches` and never attempts to calculate or filter branch scope itself.
- **Blocked Endpoints**:
  - Role management and direct permission assignment endpoints are marked BLOCKED until backend exposes Role/Permission catalog APIs. No hard-coded GUIDs.
