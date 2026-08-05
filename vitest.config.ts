import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  test: {
    environment: "node",
    exclude: [
      "e2e/**",
      "**/e2e/**",
      "node_modules/**",
      ".next/**",
      "**/.next/**",
      "integration/**",
    ],
    coverage: { reporter: ["text"] },
  },
  resolve: { alias: { "@": path.resolve(root, ".") } },
});
