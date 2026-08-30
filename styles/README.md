# styles/

Tailwind v4 is CSS-first — theme tokens, dark mode, and the brand palette
all live in `app/globals.css` (see the `@theme inline` block), so there's
no separate `tailwind.config.ts` or global stylesheet to put here yet.
Reserved for any non-Tailwind CSS a future integration needs (e.g. a
vendored stylesheet for FullCalendar in Phase 3, print styles for the PDF
invoice generator in Phase 5).
