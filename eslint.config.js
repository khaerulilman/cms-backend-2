import js from "@eslint/js";
import globals from "globals";
import importPlugin from "eslint-plugin-import";

export default [
  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "build/**",
      "prisma/migrations/**",
      "*.config.js",
      "vitest.config.js",
      "prisma.config.ts",
      "postman/**",
    ],
  },

  // Base configuration for all JS files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,

      // Best Practices
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "warn",
      "no-duplicate-imports": "error",

      // Code Style
      indent: ["error", 2, { SwitchCase: 1 }],
      quotes: ["error", "single", { avoidEscape: true }],
      semi: ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      "space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always",
        },
      ],
      "arrow-spacing": "error",
      "keyword-spacing": "error",
      "space-infix-ops": "error",
      "eol-last": ["error", "always"],
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "no-trailing-spaces": "error",

      // Import Rules
      "import/no-unresolved": "off", // Disable for Node.js native modules
      "import/extensions": ["error", "ignorePackages"],
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  // Test files configuration
  {
    files: ["**/*.test.js", "**/__tests__/**/*.js", "**/tests/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
        test: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },
];
