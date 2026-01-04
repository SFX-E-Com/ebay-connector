import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      // Allow unused vars with underscore prefix (warn for now, fix later)
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      // Disable base rule in favor of TypeScript version
      "no-unused-vars": "off",
      // Allow any types (project preference)
      "@typescript-eslint/no-explicit-any": "off",
      // Allow require imports (for Firebase Admin)
      "@typescript-eslint/no-require-imports": "off",
      // Allow setState in useEffect (common pattern for form initialization)
      "react-hooks/set-state-in-effect": "off",
      // Allow useless catch (sometimes useful for debugging)
      "no-useless-catch": "off",
      // Allow lexical declarations in case blocks
      "no-case-declarations": "off",
      // Warnings instead of errors for certain rules
      "prefer-const": "warn",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
      "scripts/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "e2e/**",
    ],
  }
);
