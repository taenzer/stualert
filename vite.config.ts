import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  root: "web",
  // build: {
  //   outDir: path.resolve(__dirname, "dist/public"),
  //   emptyOutDir: true,
  //   rollupOptions: {
  //     input: path.resolve(__dirname, "index.html"),
  //   },
  // },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
