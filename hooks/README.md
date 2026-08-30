# hooks/

Shared React hooks used across features (e.g. `useDebouncedValue`,
`useMediaQuery`, a future `useReservationForm`). Empty in Phase 1 — the
Phase 1 UI didn't need a custom hook yet (theme state comes from
`next-themes`, form state from `react-hook-form`). Add hooks here once a
piece of stateful logic is reused by more than one component.
