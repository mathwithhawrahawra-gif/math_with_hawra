---
name: Math With Hawra component inventory
description: Source-backed inventory used to extract the first design-system component families.
---

# Math With Hawra component inventory

This inventory is extracted from the existing application rather than from a
generic component catalogue. The application is an Arabic RTL educational quiz
product with two related journeys: teacher management and student activity
completion.

## Source evidence

- `artifacts/math-hawra/src/index.css` defines the design language: Tajawal,
  pink-to-yellow gradient background, `glass-card`, pink borders, and a 1rem
  base radius.
- `artifacts/math-hawra/src/App.tsx` contains the current reusable visual
  patterns: action buttons, form controls, status messages, quiz cards,
  submission results, and the student answer modal.

## First source-backed component families

| Family | Source pattern | Design-system direction |
| --- | --- | --- |
| Button | Rounded-full pink teacher actions and yellow student actions | Preserve pill shape, bold Tajawal labels, clear success/danger states |
| Card | `glass-card` with translucent white, blur, shadow, and pink border | Use generous padding, 2xl radius, and low-contrast glass surfaces |
| Input | 2px pink/yellow borders, rounded-xl controls, centered activity code | Keep a 48px touch target and a visible pink focus ring |
| Badge | Compact completion, pending, success, and error labels | Use rounded-full labels with semantic color pairs |
| Dialog | Student solution detail modal with fixed header/footer and scrolling body | Use a soft scrim, rounded surface, and mobile-safe bounded scrolling |
| Results list | RTL student result rows with selection, score, status, and solution action | Use stacked cards on narrow screens so the name and score remain readable without horizontal scrolling |

## Deliberately deferred

The quiz progress treatment is documented as a later source pattern. It should
inherit these tokens rather than introduce independent colors or geometry.

## Directional rules

- Keep all text and interactions RTL-first; use `dir="ltr"` only for activity
  codes, numeric scores, and timer values.
- Use pink for teacher-led primary actions and yellow for student-facing
  actions or progress.
- Treat success as green and destructive/error as red; never communicate state
  with color alone.
- Prefer the glass-card surface for grouped educational content, but keep
  dialogs and dense tables opaque enough to remain legible.
- On small screens, show dense result data as stacked cards rather than a
  horizontally scrolling table; keep selection and the solution action close
  to the student's name.