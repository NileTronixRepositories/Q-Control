---
name: Q-SYSTEM Design System
description: Official design tokens and UI guidelines for NileTronix Q-Control Queue Management System
colors:
  primary: "#009bb6"
  primary-dark: "#006c82"
  primary-deep: "#054153"
  primary-soft: "#f0f9ff"
  accent-emerald: "#10b981"
  accent-emerald-soft: "#ecfdf5"
  navy-slate: "#0f2a3a"
  dark-bg: "#091824"
  neutral-bg: "#f8fafc"
  surface-white: "#ffffff"
  text-heading: "#0f2a3a"
  text-body: "#334155"
  text-muted: "#64748b"
  border-light: "#e2e8f0"
  border-glow: "rgba(0, 155, 182, 0.3)"
typography:
  display:
    fontFamily: "Inter, Roboto, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 900
    lineHeight: 1.25
  headline:
    fontFamily: "Inter, Roboto, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.35
  body:
    fontFamily: "Inter, Roboto, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "100px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
---

# Q-SYSTEM Design System

## Overview

The design system for **Q-SYSTEM (NileTronix Q-Control)** combines high-precision medical/enterprise utility with state-of-the-art visual craftsmanship. It reflects reliability, speed, and real-time clarity through vibrant cyan/teal accents, deep slate containers, glassmorphism, and crystal-clear typography.

## Colors

- **Primary Brand (Nile Cyan/Teal):** `#009bb6` - Used for key action buttons, active tab indicators, and primary brand badges.
- **Deep Navy & Slate:** `#0f2a3a` & `#091824` - Used for dark theme shells, sidebars, and high-level headings.
- **Emerald Status Accent:** `#10b981` & `#ecfdf5` - Used for live queue indicators, active system badges, and success toasts.
- **Glass Surfaces:** `rgba(255, 255, 255, 0.95)` with `backdrop-filter: blur(16px)` and subtle `1px solid rgba(255,255,255,0.4)` borders.

## Typography

- **Font Family:** `Inter`, `Roboto`, `Cairo` (for Arabic RTL), system-ui.
- **Directional Support:** Native RTL (`dir="rtl"`) for Arabic and LTR (`dir="ltr"`) for English.
- **Weight Scales:**
  - Headings: 800-900 (Bold & Extra-Bold).
  - Labels & Chips: 700-800.
  - Body Text: 500-600.

## Layout

- **Grid Systems:** 2-column split layouts for showcases, 12-column grids for dashboards, and responsive single-column layouts for mobile devices.
- **Spacing Rhythm:** Standard 8px scale (`8px`, `16px`, `24px`, `32px`).

## Elevation & Depth

- **Cards & Modals:** `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255,255,255,0.1)`.
- **Hover Transitions:** `transform: translateY(-2px)` to `translateY(-4px)` with smooth cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`).

## Shapes

- **Inputs & Control Shells:** `rounded: 12px` (`0.75rem`).
- **Cards & Panels:** `rounded: 16px` to `24px`.
- **Badges & Status Chips:** `rounded: 100px` (Full Pill).

## Components

- **Inputs (`.input-shell`):** High-contrast border (`1.5px solid #cbd5e1`), colored icon prefix, glowing focus ring (`0 0 0 4px rgba(0, 155, 182, 0.16)`).
- **Buttons (`.submit-button`):** Vibrant linear gradient (`#009bb6` to `#054153`), bold text, hover elevation shimmer.
- **Status Pills (`.system-status-pill`):** Soft green background with animated pulsing status dot (`pulseDot`).

## Do's and Don'ts

### Do
- Maintain high contrast ratios for touchscreen kiosks and counter displays.
- Use explicit icons for interactive buttons and form status feedback.
- Keep RTL and LTR support fully aligned.

### Don't
- Use generic plain colors (plain gray or default browser inputs).
- Hardcode static pixel offsets for dynamic layouts.
- Swallow error states or hide system status indicators.
