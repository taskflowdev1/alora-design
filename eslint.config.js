import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "output", "node_modules", ".vercel"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      eqeqeq: ["error", "smart"],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  { files: ["src/**/*.{ts,tsx}"], rules: { "no-console": ["warn", { allow: ["warn", "error"] }] } },
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: { ...globals.node, ...globals.browser } }, rules: { "no-empty": ["error", { allowEmptyCatch: true }], eqeqeq: ["error", "smart"] } },
);
