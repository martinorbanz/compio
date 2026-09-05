/**
 * Enforces DDD module boundaries. Internal packages are consumed via TS path
 * aliases (see tsconfig.base.json) pointing straight at packages/*\/src, so
 * `to.path` below matches source files, not dist output. All from/to
 * patterns are scoped to each package's `src/` so config files at the
 * package root (eslint.config.js, vitest.config.ts, tailwind-preset.cjs)
 * never trip these rules.
 */
const domainOnly = ["^packages/domain-composition/src"];
const domainAndPluginApi = [...domainOnly, "^packages/domain-plugin-api/src"];

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies break the plugin/renderer boundary contracts.",
      from: {},
      to: { circular: true },
    },
    {
      name: "domain-composition-is-a-leaf",
      severity: "error",
      comment:
        "domain-composition is the innermost domain model; it must not depend on anything else in the repo.",
      from: { path: "^packages/domain-composition/src" },
      to: { path: "^packages/(?!domain-composition/src)[^/]+/src" },
    },
    {
      name: "domain-plugin-api-only-depends-on-composition",
      severity: "error",
      from: { path: "^packages/domain-plugin-api/src" },
      to: { path: "^packages/(?!domain-plugin-api/src)[^/]+/src", pathNot: domainOnly },
    },
    {
      name: "domain-events-only-depends-on-domain-packages",
      severity: "error",
      from: { path: "^packages/domain-events/src" },
      to: { path: "^packages/(?!domain-events/src)[^/]+/src", pathNot: domainAndPluginApi },
    },
    {
      name: "plugins-tools-core-never-imports-renderer-registry-effects-or-app",
      severity: "error",
      comment:
        "Tools plugins talk to the rest of the app only via domain-events, never by direct import.",
      from: { path: "^packages/plugins-tools-core/src" },
      to: { path: "^(packages/(renderer-core|plugin-registry|plugins-effects-core)/src|apps/)" },
    },
    {
      name: "plugins-effects-core-never-imports-renderer-registry-tools-or-app",
      severity: "error",
      comment:
        "Effects plugins talk to the rest of the app only via domain-events, never by direct import.",
      from: { path: "^packages/plugins-effects-core/src" },
      to: { path: "^(packages/(renderer-core|plugin-registry|plugins-tools-core)/src|apps/)" },
    },
    {
      name: "renderer-core-never-imports-plugins-registry-or-app",
      severity: "error",
      comment:
        "renderer-core reacts to domain-events; it must stay ignorant of plugins/registry/UI.",
      from: { path: "^packages/renderer-core/src" },
      to: { path: "^(packages/(plugin-registry|plugins-(tools|effects)-core)/src|apps/)" },
    },
    {
      name: "ui-kit-is-presentation-only",
      severity: "error",
      comment: "ui-kit must stay swappable/framework-abstracted: no domain or app imports.",
      from: { path: "^packages/ui-kit/src" },
      to: {
        path: "^(packages/(domain-[^/]*|renderer-core|plugin-registry|plugins-[^/]*|export-core)/src|apps/)",
      },
    },
    {
      name: "no-app-imports-into-packages",
      severity: "error",
      comment: "Nothing under packages/ may depend on the app shell.",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    exclude: { path: "node_modules|dist|\\.turbo" },
  },
};
