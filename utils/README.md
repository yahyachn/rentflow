# utils/

`lib/utils.ts` holds the small, cross-cutting helpers (`cn`, `formatCurrency`,
`formatDate`, `slugify`, `initials`) used everywhere. This folder is for
larger, standalone utility *modules* that don't belong in that grab-bag file
and aren't tied to a specific feature — CSV/PDF export helpers, WhatsApp
message formatting, date-range/availability math for the booking calendar —
added as those features land in Phases 3–5.
