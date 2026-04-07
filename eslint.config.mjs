import nextVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    ignores: [".next/**", ".venv/**", "node_modules/**", "src/api/client/**"],
  },
  ...nextVitals,
];

export default config;
