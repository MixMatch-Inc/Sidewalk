import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [...compat.extends("next/core-web-vitals", "next/typescript")];

export default config;
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".next/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["app/**/*.{ts,tsx}", "next.config.ts"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
);
