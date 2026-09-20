# Compio

Compio ("Comp I/O") is a free, browser-based image editing and compositing app, inspired by the UX of apps like Photoshop and Affinity Photo. It runs entirely client-side — no backend — and stores compositions as portable JSON (`.compio.json`) that can be uploaded/downloaded in the browser.

## Stack

TypeScript, React, Vite, Tailwind CSS, Radix UI, i18next, Turborepo, ESLint, Prettier, Husky, [event-hive](https://www.npmjs.com/package/event-hive) for inter-domain pub/sub.

## Architecture

Compio follows DDD-flavored modular boundaries. Each domain module has a solution-agnostic interface package with zero UI-framework dependency; React/Radix/Vite only appear at the edges (`apps/compio`, `packages/ui-kit`).

```
apps/
  compio/                 React+Vite UI shell — thin: composes packages, owns no domain logic

packages/
  domain-composition/     Composition/Layer/Matrix2D/MaskChannel model + JSON (de)serialization. Zero deps.
  domain-plugin-api/      Plugin/PluginManifest contracts (category, input/output type, UI trigger descriptors)
  domain-events/          event-hive-based typed events + one constrained EventHive per domain (composition/render/plugins)
  renderer-core/          Canvas2D compositor: layer tree -> pixels, rAF-throttled render scheduler
  plugin-registry/        register/query plugins by category; bootstraps built-in plugin sets
  plugins-tools-core/     Built-in tools: Move, Scale, Rotate, Geometric Selection, Brush, Eraser, Text
  plugins-effects-core/   Built-in effects: Brightness/Contrast
  export-core/            PNG export, .compio.json export/import, browser PNG raster codec
  ui-kit/                 Abstract UI primitives (Button, Panel, Dialog, MenuBar, Slider, ColorPicker, Toolbar) + SVG icons
  i18n/                   i18next setup, English-only resource bundle
  config-typescript/      Shared tsconfig presets
  config-eslint/          Shared eslint flat-config presets
```

**Dependency direction** (enforced by `.dependency-cruiser.cjs`): `domain-composition` is a leaf; `domain-plugin-api` and `domain-events` may only depend on domain packages; `renderer-core` and `plugins-tools-core`/`plugins-effects-core` never import each other, the registry, or the app — they talk to the rest of the system only by dispatching events on `domain-events`' shared `EventHive` instances. `ui-kit` never imports domain/plugin packages, keeping it purely presentational and swappable (mid-term goal: replace React/Radix with web components without touching domain code).

**Inter-domain communication**: `domain-events` wraps `event-hive`, exposing one `EventHive` singleton per domain (`compositionEventHive`, `renderEventHive`, `pluginEventHive`), each constrained to its own set of event types. Consumers — React and non-React alike — subscribe with plain `addListener`/`dispatchEvent` rather than `event-hive`'s React hooks, because those hooks create a _new_ hive per component mount; using them here would silently split the app into disconnected event buses. See the comment in `packages/domain-events/src/hives.ts`.

**Internal package resolution**: packages are consumed via TypeScript path aliases straight to `src` (see `tsconfig.base.json`), not via built `dist` output — so `lint`/`typecheck`/`test`/`dev` never require a prior `build` of dependency packages. Each package still ships a `build` script (plain `tsc`) for completeness/future standalone publishing.

**Folder shape**: `apps/compio/src/features/*` and `src/app/` follow a self-repeating "bulletproof" shape — each component/hook gets its own `components/`/`hooks/`/`utils/` subfolders (only the ones it actually needs) plus an `index.ts` barrel, so a module can be moved with minimal impact elsewhere; worked example in `prompt/code-structure.md`.

## Plugin architecture

Tools, effects, filters, and export formats are plugins: `{ manifest: { name, category, inputType, outputType, uiComponents }, execute(input, params, ctx) }`. `execute` is a pure function — interaction state (drag deltas, stroke points) lives in the UI layer, not the plugin. Plugins register with `plugin-registry` at startup (`bootstrapCorePlugins`); UI (toolbar, menus) builds itself from `getPluginsByCategory()` and reacts to `PluginRegisteredEvent`, so it's never a hardcoded list.

Selecting Move, Scale, or Rotate shows a single interactive bounding box (`apps/compio/src/features/canvas/TransformBoundingBox.tsx`) over the selected layer: drag inside it to move, a corner to scale (proportional, anchored at the opposite corner), or the top handle to rotate (anchored at the box center). All three only ever call `moveTool`/`scaleTool`/`rotateTool.execute()` and write the result to `layer.transform` — pixels are never touched, so transforms are non-destructive by construction; there's no separate "destructive" mode to opt out of.

## GUI

- Light/dark mode follows the OS (`prefers-color-scheme` via Tailwind `darkMode: "media"`), no manual toggle in v1.
- Palette: Tailwind's default grayscale + one signature accent (`accent-*`, blue `#3b82f6`). Alternate accent suggestions: teal `#0d9488`, violet `#7c3aed` — swap in `packages/ui-kit/tailwind-preset.cjs`.
- Icons are inline SVG (`packages/ui-kit/src/icons`), not a font/sprite sheet. Any icon id with no dedicated glyph falls back to a visible placeholder and a console warning (`getIcon`) rather than rendering blank.
- The command menu is docked at the top, like a desktop app. A more modern alternative worth considering later: a command palette (⌘K-style fuzzy search) _in addition to_ the docked menu, rather than instead of it — desktop-app users still expect the menu bar.

## Roadmap (out of scope for this pass)

- Tools: Freeform selection, Polygon Freeform selection, Magic Wand selection, Cloning Stamp
- Export: PSD, TIFF (layered file formats) — stubbed in `export-core`'s `unsupportedFormats.ts`
- Saved selection channels (selections currently live only as transient in-memory state, not persisted on the Composition or in `.compio.json`)
- Non-uniform (per-axis) or Alt/Option-modifier center-anchored scaling from the bounding box — corner handles currently always scale proportionally from the opposite corner
- Layer grouping beyond the basic case (group transforms compose correctly at render time; no group UI yet)
- Web Components port (React/Radix removal) — `ui-kit`'s component boundary is designed for this but not yet executed
- Naming audit: pure computation helpers should read as a query (`getBlendChannel`), not an imperative action (`blendChannel`) — applied at point of edit so far, not swept across the whole codebase
- Layer hit-testing (click-to-select, `renderer-core/src/hitTestLayer.ts`) is pixel-opacity-only; make the mode swappable (bounding-box vs. pixel-opacity) instead of hardcoding one
- Text/group layer hit-testing falls back to bounds-only (no pre-rasterized pixels to sample) — documented gap, not pixel-perfect for those two kinds
- Brush radius/hardness/opacity are interpreted directly in the selected layer's local space (`CanvasViewport.tsx#applyStroke` only inverse-transforms the stroke _points_, not the settings), so a scaled layer visibly changes the on-screen stamp size even though the user didn't touch the Radius slider — flagged as not the intended behavior. Fixing it properly likely means deciding how "composite layers" (nested/Smart-Object-style sub-compositions with their own coordinate space, as in Photoshop/Affinity) should work in general, not just patching the brush — deliberately deferred pending that design, not an immediate fix
- Selection sampling under a layer transform is now anti-aliased (`mask-channel.ts#createMaskSampler`'s non-identity branch averages a 4x4 sub-pixel grid instead of one nearest-neighbor point). Masks are still hard-edged fills at creation time (`rasterize-shape.ts`), so an untransformed selection's own boundary (e.g. a rotated/elliptical shape with no layer transform) is unaffected — fixing that would need supersampling or analytic coverage in the rasterizer itself, a separate follow-up

### Interaction performance

Sequenced so each step only lands once profiling on real content would justify it (see `packages/renderer-core/src/renderComposition.ts`'s own comment: Canvas2D is fine "until profiling on real compositions shows it's the bottleneck").

- ✅ **Raster surface memoization** (`renderComposition.ts`) — a `WeakMap<RasterImageSource, CanvasLikeResult>` keyed by `layer.image` identity skips re-decoding pixels (`putImageData`) when only `layer.transform` changes, e.g. every frame of a pure move/scale/rotate drag. Masked layers still copy the cached raw surface once per render before compositing the mask (`drawImage`, cheap) — only the unmasked case is fully free.
- ✅ **rAF-coalesced pointer handling**, `TransformBoundingBox.tsx` only — `coalesceToAnimationFrame` (`renderer-core`) + the `useCoalescedCallback` React wrapper (`apps/compio/src/app/useCoalescedCallback.ts`) collapse a burst of `pointermove`-driven matrix recomputation to one call per frame, mirroring what `createRenderScheduler` already does for the actual redraw.
- ⏳ **Same coalescing for `CanvasViewport.tsx`'s paint-stroke and selection-marquee handlers** — not yet wired in. Those handlers read `event.currentTarget` directly (the canvas element); React nulls `currentTarget` once the synchronous dispatch that delivered the event completes, so deferring the callback via rAF needs the element read from `canvasRef.current` instead (a stable ref already held in that component) before it's safe. `TransformBoundingBox` didn't have this problem — it already reads `svgRef.current`, never `event.currentTarget`.
- ⏳ **Low-res proxy layers during active transform drags** (large raster layers only, e.g. >1–2 megapixels) — gated on profiling a real interactive drag with the two items above in place; not implemented. Most complex of the three and the most likely to introduce visible glitches (proxy-resolution aliasing at drag end), so it stays last.

## Development

```bash
pnpm install
pnpm dev          # apps/compio dev server
pnpm build        # build all packages + the app
pnpm lint
pnpm typecheck
pnpm test
```

Pre-commit hook (Husky + lint-staged) runs eslint --fix and prettier --write on staged files.
