import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginImport from "eslint-plugin-import";

export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        process: "readonly",
        test: "readonly",
        expect: "readonly",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      import: pluginImport,
    },
    rules: {
      "react/prop-types": "error", // Ensure prop-types validation
      "no-unused-vars": "warn", // Warn about unused variables
      "no-undef": "error", // Error on undefined variables
      "react/react-in-jsx-scope": "off", // React 17+ does not require React in scope
    },
  },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
];