import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// The deployed commit, so push-to-live can be measured from outside.
const commit = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    { name: "build-meta", transformIndexHtml: (html) => html.replace("</head>", `  <meta name="build" content="${commit}" />\n  </head>`) },
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: Number(process.env.PORT) || 5190, strictPort: true },
  build: { chunkSizeWarningLimit: 900 },
  preview: { port: Number(process.env.PORT) || 5191, strictPort: true },
});
