import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import fs from "fs";
import path from "path";

// Tylko serwer deweloperski: adres bez rozszerzenia (np. /gree/klimatyzatory-gree)
// serwuje public/gree/klimatyzatory-gree.html, tak jak robi to .htaccess na produkcji.
const publicHtmlWithoutExtension = {
  name: "public-html-without-extension",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = (req.url || "").split("?")[0];
      if (url && !url.endsWith(".html") && !fs.existsSync(path.join("public", url)) && fs.existsSync(path.join("public", url + ".html"))) {
        req.url = url + ".html";
      }
      next();
    });
  },
};

export default defineConfig({
  site: "https://montazklimatyzacjiwarszawa.pl/",
  build: {
    format: "file",
  },
  integrations: [
    mdx(),
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [publicHtmlWithoutExtension],
    resolve: {
      alias: {
        "@data": path.resolve("./src/data"),
      },
    },
  },
});