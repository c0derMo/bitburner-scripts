import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig(
  {
    ignores: [
      "node_modules",
      "dist",
      "NetscriptDefinitions.d.ts",
      "eslint.config.mts",
      "vite.config.ts",
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "no-constant-condition": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "no-useless-assignment": "off",
    },
  },
  eslintConfigPrettier,
);
