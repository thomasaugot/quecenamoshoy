import js from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

// ESLint, not the template's oxlint: the purity rules this codebase depends on (impure render,
// setState in effect, React Compiler bail-outs) only exist in eslint-plugin-react-hooks.
export default defineConfig([
  globalIgnores(["dist", "dev-dist", "supabase/functions"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    // House convention: a context file exports the Context next to its Provider
    // (vite/04-CLIENT_SERVER). Cost: editing one triggers a full reload instead of HMR.
    files: ["src/contexts/**/*.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
])
