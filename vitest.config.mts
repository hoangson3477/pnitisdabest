import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));
const serverOnlyStub = fileURLToPath(
  new URL("./test/server-only.ts", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: {
      "@": src,
      "server-only": serverOnlyStub,
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
