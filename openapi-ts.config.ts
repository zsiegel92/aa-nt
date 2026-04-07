import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "openapi.json",
  output: "src/api/client",
  plugins: [
    "@hey-api/sdk",
    "zod",
    {
      name: "@hey-api/sdk",
      validator: true,
    },
    {
      name: "@tanstack/react-query",
      queryOptions: true,
      mutationOptions: true,
      queryKeys: true,
    },
  ],
});
