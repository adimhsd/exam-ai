---
name: Academic Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2fe'
  surface-container: '#ededf9'
  surface-container-high: '#e8e7f3'
  surface-container-highest: '#e2e1ed'
  on-surface: '#1a1b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#7f2500'
  on-tertiary: '#ffffff'
  tertiary-container: '#a73400'
  on-tertiary-container: '#ffc9b7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59c'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#832700'
  background: '#faf8ff'
  on-background: '#1a1b23'
  surface-variant: '#e2e1ed'
  status-queued: '#64748B'
  status-processing: '#F59E0B'
  status-completed: '#10B981'
  status-failed: '#EF4444'
  ai-confidence-high: '#059669'
  ai-confidence-low: '#DC2626'
  surface-muted: '#F8FAFC'
  border-subtle: '#E2E8F0'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  sidebar-width: 260px
  review-panel-gap: 2px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system embodies a **Corporate / Modern** aesthetic with a specific focus on **Academic Precision**. It is designed to evoke a sense of authority, objectivity, and technological sophistication, crucial for an AI-driven grading platform. The interface must feel like a high-performance tool—reliable enough for institutional use but modern enough to reflect the cutting-edge nature of Multimodal Vision LLMs.

The target audience consists of educators and academic administrators who require clarity over decoration. Consequently, the design prioritizes a **Minimalist** approach with a structured information hierarchy. The emotional response should be one of "trust through transparency," achieved via clean data visualizations and a logical, split-screen review experience that bridges the gap between physical handwriting and digital assessment.

## Colors

The palette is anchored by **Professional Blue (#1D4ED8)**, symbolizing institutional stability and intelligence. The primary color is used strategically for interactive elements, progress indicators, and primary branding, ensuring it does not overwhelm the content-heavy nature of the platform.

**White (#FFFFFF)** and **Surface-Muted (#F8FAFC)** serve as the canvas, providing the necessary whitespace for data-intensive tables and side-by-side OCR reviews. A semantic set of named colors is introduced to handle the complex states of the AI processing pipeline:
- **Status Colors:** Neutral slates for queuing, amber for active processing, and emerald for completion.
- **Confidence Markers:** Specific tints are used to flag AI grading confidence scores, allowing lecturers to quickly identify submissions that require manual intervention.
- **Borders:** A strictly defined scale of grays (Slate 200-300) is used to define the "split-screen" layout without adding visual noise.

## Typography

The typography strategy balances modern professionalism with technical utility. 

**Hanken Grotesk** is chosen for headlines to provide a sharp, contemporary edge that feels "tech-forward" and distinct from standard corporate fonts. Its geometric clarity ensures that dashboard headers remain legible at any scale.

**Inter** is the workhorse for all body content, selected for its exceptional readability in data-heavy environments. It handles dense tables and long-form AI feedback with neutral efficiency.

**JetBrains Mono** is utilized for metadata, confidence scores, and raw OCR outputs. This monospaced choice clearly differentiates "machine-generated" content from "human-authored" labels, providing a visual cue for the user during the review process.

## Layout & Spacing

This design system employs a **Fixed Grid** philosophy for the main dashboard to maintain structural integrity during data analysis, while the **Split-Screen Review** utilizes a 50/50 fluid split.

1.  **Main Grid:** A 12-column grid with a 1440px max-width ensures that large data tables have sufficient room to breathe.
2.  **The Review Layout:** A specialized view where the left panel displays the high-resolution scan (PNG) and the right panel displays the editable OCR/Grading results. These panels are separated by a 2px high-contrast divider to maximize screen real estate.
3.  **Responsive Behavior:** 
    *   **Desktop:** Sidebar is persistent; tables use horizontal scroll for overflowing columns.
    *   **Tablet:** Sidebar collapses into a hamburger menu; split-screen switches to a vertical stack if width drops below 1024px.
    *   **Mobile:** Margins tighten to 16px; complex tables are replaced by "Summary Cards" to maintain usability on small screens.

## Elevation & Depth

To maintain a "Professional & Tech-forward" feel, this design system avoids heavy drop shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

Depth is communicated through background color shifts rather than physical height. The primary dashboard background uses `surface-muted`, while active cards and data containers use `white`. This creates a "layered sheet" effect. 

Where elevation is necessary (e.g., modals or dropdown menus), use a single, highly diffused **Ambient Shadow**: `0 4px 20px -2px rgba(29, 78, 216, 0.08)`. The slight blue tint in the shadow maintains brand consistency even in the depth model. Borders should be used to define structural boundaries (like the 50/50 split view) using a 1px solid stroke in `border-subtle`.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding provides a modern, "Shadcn-like" appearance that feels precise and engineered. Sharp corners are avoided to prevent the UI from feeling dated, but extreme roundness is also avoided to maintain a serious academic tone.

*   **Inputs & Buttons:** Use the standard `rounded` (4px) base.
*   **Cards & Modals:** Use `rounded-lg` (8px) to provide a soft container for grouped information.
*   **Status Badges:** Use `rounded-full` (pill) only for status indicators (e.g., "Completed", "Failed") to make them instantly recognizable as distinct UI objects.

## Components

### Buttons & Controls
Buttons use a solid fill for primary actions (`Professional Blue` with white text) and a ghost/outline style for secondary actions. The "Review Score" buttons should use subtle hover states to indicate interactability without distracting from the document text.

### Data Tables (TanStack Table style)
Tables are the heart of the system. They must feature:
- Sticky headers for long student lists.
- Inline status chips with the named status colors.
- "Confidence Meters": Small horizontal progress bars within a cell to visualize the AI's confidence score.

### Split-Screen Reviewer
The most critical component. It should feature a toolbar for zooming the PDF scan on the left and a structured form on the right. Each question result is contained in a "Grading Card" with an editable score input and a text area for feedback.

### Input Fields
Fields use a 1px `border-subtle` and transition to a 2px `primary_color` border on focus. Use JetBrains Mono for "Raw OCR" text areas to signify that the content is a machine-extracted string.

### Progress Monitor
For the Celery queue, use a persistent "Batch Progress" bar at the top of the queue page, showing a live count of processed vs. pending documents.