#!/usr/bin/env node
/**
 * Transforme l’export Next.js (/out) en site HTML autonome :
 *   index.html, a-propos.html, … + assets/ (css, js, fonts) + images/
 * - aucun JavaScript Next/React : un seul fichier assets/js/site.js (natif)
 * - chemins relatifs : le site s’ouvre en double-cliquant sur index.html
 * - images converties en WebP
 * - .htaccess : URL propres en ligne (/a-propos → a-propos.html) et redirections
 *
 * Usage : node scripts/export-html.mjs [dossier-de-sortie]   (défaut : html)
 *         npm run export:html  → régénère le site HTML dans le dossier parent
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "out");
const DEST = path.resolve(ROOT, process.argv[2] || "html");

if (!fs.existsSync(OUT)) {
  console.error("Dossier /out introuvable : lancez d’abord `npx next build`.");
  process.exit(1);
}

const walk = (dir, filter, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, filter, acc);
    else if (filter(full)) acc.push(full);
  }
  return acc;
};
const copyDir = (from, to) => fs.cpSync(from, to, { recursive: true });

// Nettoyage ciblé : uniquement ce que ce script génère (jamais le dossier entier)
fs.mkdirSync(DEST, { recursive: true });
for (const dir of ["assets", "images", "brand", "og", "blog"]) fs.rmSync(path.join(DEST, dir), { recursive: true, force: true });
for (const f of fs.readdirSync(DEST)) if (f.endsWith(".html")) fs.rmSync(path.join(DEST, f));
fs.mkdirSync(path.join(DEST, "assets", "css"), { recursive: true });
fs.mkdirSync(path.join(DEST, "assets", "js"), { recursive: true });
fs.mkdirSync(path.join(DEST, "assets", "fonts"), { recursive: true });

/* --- Fichiers statiques --------------------------------------------------- */
for (const dir of ["brand", "og"]) copyDir(path.join(OUT, dir), path.join(DEST, dir));
for (const f of ["robots.txt", "sitemap.xml", "manifest.webmanifest"]) fs.copyFileSync(path.join(OUT, f), path.join(DEST, f));
fs.mkdirSync(path.join(DEST, "blog"), { recursive: true });
fs.copyFileSync(path.join(OUT, "blog", "rss.xml"), path.join(DEST, "blog", "rss.xml"));
fs.copyFileSync(path.join(ROOT, "scripts", "html", "site.js"), path.join(DEST, "assets", "js", "site.js"));

/* --- Images : JPEG conservés (partage, données structurées) + WebP pour l’affichage */
fs.mkdirSync(path.join(DEST, "images"), { recursive: true });
for (const f of fs.readdirSync(path.join(OUT, "images"))) {
  const src = path.join(OUT, "images", f);
  fs.copyFileSync(src, path.join(DEST, "images", f));
  if (/\.jpe?g$/i.test(f)) {
    await sharp(src).webp({ quality: 80 }).toFile(path.join(DEST, "images", f.replace(/\.jpe?g$/i, ".webp")));
  }
}

/* --- CSS + polices -------------------------------------------------------- */
const htmlFiles = walk(OUT, (f) => f.endsWith(".html") && !f.endsWith("_not-found.html"));
const cssHrefs = new Set();
for (const f of htmlFiles) {
  for (const m of fs.readFileSync(f, "utf8").matchAll(/<link rel="stylesheet" href="([^"]+\.css)"[^>]*>/g)) cssHrefs.add(m[1]);
}
let css = "";
for (const href of cssHrefs) css += fs.readFileSync(path.join(OUT, href), "utf8") + "\n";
css = css.replace(/url\((?:\.\.\/media\/|\/_next\/static\/media\/)([^)]+)\)/g, (_, file) => {
  fs.copyFileSync(path.join(OUT, "_next", "static", "media", file), path.join(DEST, "assets", "fonts", file));
  return `url(../fonts/${file})`;
});
fs.writeFileSync(path.join(DEST, "assets", "css", "style.css"), css);

/* --- Pages HTML ----------------------------------------------------------- */
const pageFile = (urlPath) => {
  const clean = urlPath.replace(/\/+$/, "");
  if (clean === "") return "index.html";
  if (/\.[a-z0-9]+$/i.test(clean)) return clean.slice(1);
  return clean.slice(1) + ".html";
};

function rewriteUrl(url, prefix) {
  if (!url.startsWith("/") || url.startsWith("//")) return url;
  const m = url.match(/^([^?#]*)(.*)$/);
  let p = m[1];
  const rest = m[2];
  if (p.startsWith("/images/")) p = p.replace(/\.jpe?g$/i, ".webp");
  const target = /^\/(images|brand|og|assets)\//.test(p) || /\.[a-z0-9]+$/i.test(p) ? p.slice(1) : pageFile(p);
  return prefix + target + rest;
}

let count = 0;
for (const file of htmlFiles) {
  const rel = path.relative(OUT, file); // ex. blog/gerer-stress-avant-competition.html
  const depth = rel.split(path.sep).length - 1;
  const isErrorPage = rel === "404.html";
  const prefix = isErrorPage ? "/" : "../".repeat(depth);

  let html = fs.readFileSync(file, "utf8");

  // JavaScript Next/React : supprimé (le contenu est déjà rendu dans le HTML)
  html = html.replace(/<script\b[^>]*\bsrc="[^"]*"[^>]*><\/script>/g, "");
  html = html.replace(/<script\b(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g, (all, body) =>
    body.trim().startsWith("document.documentElement.classList.add") ? all : "",
  );
  html = html.replace(/<link rel="preload" as="script"[^>]*\/?>/g, "");
  html = html.replace(/<link rel="modulepreload"[^>]*\/?>/g, "");

  // Feuilles de style → une seule feuille locale
  let cssInserted = false;
  html = html.replace(/<link rel="stylesheet" href="[^"]+\.css"[^>]*\/?>/g, () => {
    if (cssInserted) return "";
    cssInserted = true;
    return `<link rel="stylesheet" href="${prefix}assets/css/style.css"/>`;
  });

  // Préchargement des polices
  html = html.replace(/href="\/_next\/static\/media\/([^"]+)"/g, `href="${prefix}assets/fonts/$1"`);

  // Liens, images, masques CSS en ligne
  html = html.replace(/\b(href|src)="([^"]*)"/g, (_, attr, url) => `${attr}="${rewriteUrl(url, prefix)}"`);
  html = html.replace(/url\((\/[^)]+)\)/g, (_, url) => `url(${rewriteUrl(url, prefix)})`);

  // Marqueurs internes de React inutiles
  html = html.replace(/<!--\/?\$\??-->/g, "").replace(/<div hidden="">\s*<\/div>/g, "");

  // Script d’interactions
  html = html.replace("</body>", `<script src="${prefix}assets/js/site.js" defer></script></body>`);

  const outFile = path.join(DEST, rel);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  count++;
}

/* --- .htaccess (hébergement Apache / OVH) --------------------------------- */
fs.writeFileSync(
  path.join(DEST, ".htaccess"),
  `# URL propres : /a-propos sert a-propos.html
Options -MultiViews
RewriteEngine On

# Une seule adresse : https://www.muriel-calas.fr (HTTPS et www forcés)
RewriteCond %{SERVER_PORT} 80 [OR]
RewriteCond %{HTTP_HOST} ^muriel-calas\\.fr$ [NC]
RewriteRule ^(.*)$ https://www.muriel-calas.fr/$1 [R=301,L]

# Anciennes adresses du site précédent
RewriteRule ^accueil/?$ / [R=301,L]
RewriteRule ^(framework|project)/ - [G,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.+?)/?$ $1.html [L]

# Anciennes adresses
Redirect 301 /cgu /mentions-legales
Redirect 301 /blog.rss /blog/rss.xml

ErrorDocument 404 /404.html

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml application/xml
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
`,
);

/* --- Ménage : images du site qui ne sont plus référencées ------------------- */
function cleanUnusedImages() {
  const used = new Set();
  for (const file of walk(DEST, (f) => /\.(html|xml|webmanifest)$/.test(f))) {
    for (const m of fs.readFileSync(file, "utf8").matchAll(/images\/([A-Za-z0-9._-]+\.(?:jpe?g|webp|png))/g)) {
      used.add(m[1]);
    }
  }
  let removed = 0;
  for (const f of fs.readdirSync(path.join(DEST, "images"))) {
    if (used.has(f)) continue;
    fs.rmSync(path.join(DEST, "images", f));
    removed += 1;
  }
  return removed;
}
const unusedImages = cleanUnusedImages();

/* --- Ménage : copies laissées par la synchro iCloud (« index 2.html ») ------ */
function cleanSyncDuplicates(dir) {
  let removed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_source-nextjs" || entry.name === "node_modules") continue;
      removed += cleanSyncDuplicates(full);
      continue;
    }
    const m = entry.name.match(/^(.*) \d+(\.[A-Za-z0-9]+)$/);
    if (m && fs.existsSync(path.join(dir, m[1] + m[2]))) {
      fs.rmSync(full);
      removed += 1;
    }
  }
  return removed;
}
const duplicates = cleanSyncDuplicates(DEST);

console.log(`${count} pages HTML générées dans ${path.relative(ROOT, DEST) || "."}/`);
if (duplicates) console.log(`${duplicates} copie(s) de synchronisation supprimée(s).`);
if (unusedImages) console.log(`${unusedImages} image(s) inutilisée(s) retirée(s).`);
