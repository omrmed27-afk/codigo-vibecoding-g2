import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    exclude: ["node_modules", "e2e/**"],
    env: {
      NEXT_PUBLIC_API_URL: "http://localhost:8000/api",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
      include: ["lib/**", "services/**", "hooks/**"],
    },
  },
});
