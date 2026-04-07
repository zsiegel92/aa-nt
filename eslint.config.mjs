import nextVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [".next/**", ".venv/**", "node_modules/**", "src/api/client/**"],
  },
  ...nextVitals,
];
