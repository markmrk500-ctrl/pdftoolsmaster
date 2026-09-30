import fs from "fs";
import path from "path";
import type { Plugin } from "vite";

const SITE = "https://www.masterpdftools.com";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pick = (src: string, prop: string): string | undefined => {
  const m =
    src.match(new RegExp(`\\b${prop}=\\s*"([^"]+)"`)) ||
    src.match(new RegExp(`\\b${prop}=\\{\\s*"([^"]+)"\\s*\\}`)) ||
    src.match(new RegExp(`\\b${prop}=\\{\\s*\`([^\`$]+)\`\\s*\\}`));
  return m?.[1];
};

const humanize = (route: string) =>
  route
    .replace(/^\//, "")
    .split("-")
    .map((w) => (w === "pdf" ? "PDF" : w === "ai" ? "AI" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

/**
 * After build, writes dist/<route>/index.html for every sitemap route with that
 * page's own title, description, canonical, H1, intro and crawlable links, so
 * crawlers see real content without executing JavaScript.
 */
export function staticPages(): Plugin {
  let outDir = "dist";
  let root = process.cwd();
  return {
    name: "static-pages",
    apply: "build",
    configResolved(c) {
      root = c.root;
      outDir = path.resolve(c.root, c.build.outDir);
    },
    closeBundle() {
      const sitemap = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
      const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
        m[1].replace(SITE, "") || "/"
      );
      const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
      const imports = new Map<string, string>();
      for (const m of app.matchAll(/import\s+(\w+)\s+from\s+"\.\/pages\/([^"]+)"/g))
        imports.set(m[1], m[2]);
      const routeFile = new Map<string, string>();
      for (const m of app.matchAll(/path="([^"]+)"\s+element=\{<(\w+)/g)) {
        const f = imports.get(m[2]);
        if (f) routeFile.set(m[1], f);
      }

      const pages = routes.map((route) => {
        let title: string | undefined, description: string | undefined, h1: string | undefined, intro: string | undefined;
        const f = routeFile.get(route);
        if (f) {
          let p = path.join(root, "src/pages", f);
          if (!fs.existsSync(p)) p = [".tsx", ".ts"].map((e) => p + e).find(fs.existsSync) ?? p;
          if (fs.existsSync(p)) {
            const src = fs.readFileSync(p, "utf8");
            title = pick(src, "title");
            description = pick(src, "description");
            h1 = pick(src, "h1") || src.match(/<h1[^>]*>\s*([^<{]+?)\s*</)?.[1];
            intro = pick(src, "intro");
          }
        }
        const name = route === "/" ? "Master PDF Tools" : humanize(route);
        return { route, name, title, description, h1: h1 || name, intro: intro || description };
      });

      const template = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
      const nav = pages
        .filter((p) => p.route !== "/")
        .map((p) => `<li><a href="${p.route}">${esc(p.name)}</a></li>`)
        .join("");

      for (const p of pages) {
        const url = SITE + (p.route === "/" ? "/" : p.route);
        let html = template;
        if (p.title) {
          html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)}</title>`);
        }
        if (p.description) {
          html = html.replace(
            /<meta name="description" content="[^"]*"\s*\/?>/,
            `<meta name="description" content="${esc(p.description)}" />`
          );
        }
        html = html.replace(
          "</head>",
          `<link rel="canonical" href="${url}" />\n<meta property="og:url" content="${url}" />\n` +
            (p.title ? `<meta property="og:title" content="${esc(p.title)}" />\n` : "") +
            (p.description ? `<meta property="og:description" content="${esc(p.description)}" />\n` : "") +
            "</head>"
        );
        const body =
          `<main><h1>${esc(p.h1)}</h1>` +
          (p.intro ? `<p>${esc(p.intro)}</p>` : "") +
          `<nav aria-label="All PDF tools"><h2>All PDF tools</h2><ul><li><a href="/">Home</a></li>${nav}</ul></nav></main>`;
        html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
        const dest = p.route === "/" ? path.join(outDir, "index.html") : path.join(outDir, p.route.slice(1), "index.html");
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, html);
      }
      console.log(`[static-pages] wrote ${pages.length} crawlable pages`);
    },
  };
}
