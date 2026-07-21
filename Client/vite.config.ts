import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/bundle.manifests.ts",
      formats: ["es"],
      fileName: "netlify-dashboard",
    },
    outDir: "../wwwroot/App_Plugins/NetlifyDashboard",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // Umbraco provides these at runtime; never bundle them.
      external: [/^@umbraco/],
    },
  },
});
