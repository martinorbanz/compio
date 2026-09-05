// Shared flat eslint config for non-React packages (domain/core libs).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-magic-numbers": "off",

      // See CLAUDE.md "Code style". Exceptions are established short domain
      // terms (coordinates, RGBA channels, 2D matrix components — a-f exactly
      // matching Canvas2D's ctx.transform(a,b,c,d,e,f)/CSS matrix() convention,
      // ids) — not a loophole for generic single-letter params like `(a, b)`.
      "id-length": [
        "warn",
        {
          min: 3,
          properties: "never",
          exceptions: ["x", "y", "r", "g", "b", "a", "c", "d", "e", "f", "w", "h", "id"],
        },
      ],
      // A classic for(;;) loop needs a reason (typed-array pixel hot paths);
      // for...of and iterator methods (.map/.filter/.reduce/.forEach) don't
      // need one and stay allowed. Justify an exception with a disable comment.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "ForStatement",
          message:
            "Prefer .map/.filter/.reduce/.forEach or for...of; classic for loops need a justifying comment (see CLAUDE.md).",
        },
      ],
      "max-params": ["warn", 2],
      "max-depth": ["warn", 3],
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
);
