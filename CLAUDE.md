# Compio — Conventions

Browser-only, client-side image editor, DDD-flavored Turborepo. See `README.md` for stack/packages/architecture. Follow this file unprompted; deviations get a comment at the deviation site, not a note here.

When editing this file: use whatever degree of brevity and precision is most useful to yourself when reading it back later — not a fixed style.

## Philosophy

- **Domain packages are solution-agnostic.** `domain-composition`, `domain-plugin-api`, `domain-events`: no React/Radix/Vite/DOM. `renderer-core`/`export-core` are the only DOM exceptions (Canvas2D need) — say so in-file. Enforced by `.dependency-cruiser.cjs`; a forbidden edge means wrong package, not a rule exception.
- **Plugins are pure.** `{ manifest, execute(input, params, ctx) }`. No DOM, no events, no state between calls. Interaction/undo state lives in the UI layer, never in a plugin.
- **Non-destructive by default.** Transforms = matrix on `layer.transform`, never baked. Pixel-rewriting ops (paint, effect apply) only on explicit user action, never as a side effect of a preview. Before making something destructive: is there a non-destructive representation instead (param, mask, matrix)?
- **Cross-domain = `domain-events`, not direct reach-in.** Direct import only when the dependency graph allows it (e.g. `plugin-registry` → `domain-plugin-api`). Otherwise: dispatch/listen via the `domain-events` hives. Never a shared mutable singleton outside them.
- **Packages consumed via source, not `dist`.** TS path aliases (`tsconfig.base.json`) → `packages/*/src`. `dev`/`test`/`typecheck`/`lint` must never require `pnpm build` first — that's a wiring bug, not a missing step.
- **No magic numbers/strings.** Constants/enums even for "obvious" values (`MASK_OPAQUE`, not `255`). Applies to repeated CSS/pixel values too.
- **Comments = WHY only.** Never restate what the code says. Write one only for a non-obvious constraint/workaround/decision someone would otherwise "clean up."

## Code style

- **No 1–2 char identifiers**, including callback params (`.map((trigger) => …)` not `.map((t) => …)`). Only exception: `i`/`j` in a justified classic `for` (see below).
- **Iterate; `TypedArray` has `.map`/`.forEach`/`.entries()` too.** Transforming an existing (typed) array, incl. pairwise via index → `TypedArray.from(source, (value, index) => …)` or `.forEach`. Never a classic `for` for this (see `blendBySelection.ts`, `renderComposition.ts#applyMask`, `brightnessContrastEffect.ts`, `MaskChannel.ts#combineMasks`).
  Classic `for` reserved for: computed numeric range, no backing array, hot/high-frequency (brush stamp bbox) — where `Array.from({length})` would allocate every call. Narrow case, comment why (see `paintBrush.ts`). "It's per-pixel" ≠ reason if the pixels are already in an array.
- **Options object over param list** once >2 params: `move({ delta, pivot })` not `move(delta, pivot)`. Exception: positional 2-arg conventional pairs (`(a, b)` comparators, `(event, element)`).
- **Early return over nesting.** Guard clauses first, happy path unindented.
- **Blank line between logical phases** of a function (read input / compute / return). Not between unrelated one-liners that are already obviously separate.
- **No inline arrow functions as JSX props.** Define a named handler in the component body and pass it by reference — keeps the render tree scannable and gives the handler a name that documents intent. Exceptions: trivial passthroughs that are already just a reference (`onClick={onClose}`), and `.map()` row closures that need that iteration's item (`onChange={(value) => handleOpacityChange(layer.id, value)}`) — there's no item to close over until inside the map, so the closure itself is the handler.
- **Destructure a props/state object once, at the top of the function — don't mix with dot-access in the same file.** If a component reads more than one field off `editor`/`props`, destructure all of what it uses there; don't call `editor.foo()` in one place and `const { foo } = editor` in another.
- **Filenames are kebab-case, repo-wide** (`app-toolbar.tsx`, `use-editor-state.ts`) — identifiers inside stay PascalCase for components/classes, camelCase for functions/consts (`app-toolbar.tsx` exports `AppToolbar`).
- **`apps/compio/src/features/*` folder shape**: self-repeating "bulletproof style" so things move with minimal impact — see `prompt/code-structure.md` for the worked example. Each feature is `components/<component-name>/` (one dir per top-level component, named for the component, not the feature) containing that component's own `components/` (sub-components), `hooks/`, `utils/` — only the subfolders it actually needs, never stubs — plus the component file and an `index.ts` barrel. Only create an `api/` folder for a feature that actually calls out to something (none do today — this app has no backend). The feature root's `index.ts` re-exports only what `App.tsx` needs; app-shell code (`App.tsx` and siblings) imports the feature root, never reaches into `components/` directly.

## Where to look

- `README.md` — stack, package map, dependency rules, roadmap.
- `prompt/code-structure.md` — the `apps/compio/src/features/*` folder-shape example referenced above.
- `.dependency-cruiser.cjs` — package boundaries as executable rules.
- `packages/config-eslint`, `packages/config-typescript` — shared presets every package extends.
