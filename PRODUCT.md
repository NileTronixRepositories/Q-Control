# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Technical Administrator (`TechnicalAdmin` / `BranchAdmin`)**: Manages physical branch infrastructure—waiting areas, counter windows, self-service ticketing kiosks, central display screens, branch branding, service catalog assignments, and operating schedules.
2. **Organization Administrator (`OrganizationAdmin`)**: Oversees organization-wide global settings, ticket calling parameters, no-show timeouts, audio announcement voice synthesized/chime rules, and custom ticket lifecycle status definitions.
3. **Self-Service Kiosk Users / Customers / Patients (`Service Kiosk`)**: Guides customers through multi-tier service selection, priority segment categorization, queue ticket generation, dynamic QR payload encoding, and ticket printing.

## Product Purpose

Q-SYSTEM (NileTronix Q-Control) is an enterprise-grade, high-performance Queue & Flow Management Web Application. It controls customer and patient journeys, service catalog hierarchies, physical counter windows, queue kiosks, audio-visual announcement systems, and branch-level operational rules.

## Positioning

A unified, real-time, multi-branch queue orchestration and audio-visual calling platform designed specifically for healthcare facilities and high-throughput service centers, powered by NileTronix technology.

## Operating Context

Hospitals, medical clinics, service branches, and waiting areas. Staff operate counter windows, administrators monitor live queue analytics and system configurations, and patients interact with touch kiosks and counter display screens.

## Capabilities and Constraints

- **Security & Roles**: Multi-role Bearer JWT session management (`TechnicalAdmin`, `OrganizationAdmin`, `BranchAdmin`), forced initial password change, role-based route guards.
- **Queue & Flow Control**: Dynamic service cascade selectors, priority segment categorization, ticket status lifecycle, no-show timeouts, and multi-tier queue rules.
- **Audio-Visual Announcements**: Real-time counter display sync, voice synthesis, chime audio calling rules, and display screen layouts.
- **Multi-Branch Operations**: Centralized branch service schedules, globalization requests, and localized branch overrides.
- **Internationalization**: Full bilingual support (Arabic RTL & English LTR).

## Brand Commitments

- **Primary Identities**: Q-Control System (Hospital Central Management) & NileTronix ("Powered & Developed by NileTronix").
- **Visual Identity**: Deep Slate (`#0f2a3a`), Nile Cyan/Teal (`#009bb6`, `#008fa8`), Emerald Accent (`#10b981`), Glassmorphism, and clean modern typography.
- **Assets**: `/images/Tab-logo.png`, `/images/nile.png`, `/images/niletronix-animated.svg`.

## Evidence on Hand

- `PROJECT_DOCUMENTATION.md`: Comprehensive technical architecture, domain rules, state management, and route trees.
- `src/app/shared/styles`: Foundation design system CSS tokens and theme files (`niletronix-admin-theme.css`, `foundation.css`, `design-tokens.css`).
- High-resolution logos in `public/images/`.

## Product Principles

1. **Clear Guidance at First Glance**: Queue state, ticket numbers, and counter directions must be instantly readable from a distance and accessible to all users.
2. **Resilient Real-Time Operations**: Counter window operations and voice announcements must execute without latency or stutter.
3. **Enterprise Scalability with Localized Control**: Global organization rules apply seamlessly while allowing specific branch schedule overrides.
4. **Impeccable & Premium Visual Identity**: High-contrast, polished glassmorphism, responsive cards, and clean typography that reflect precision engineering.

## Accessibility & Inclusion

- Full support for Arabic (RTL) and English (LTR).
- High contrast ratios for outdoor/indoor display screens and touchscreen kiosks.
- Accessible ARIA labels and touch target sizes (minimum 48px for kiosk buttons).
