import { readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve, join, sep } from "node:path";

const outputDir = resolve("dist-single");
const bundleDir = join(outputDir, ".bundle");
const htmlPath = join(bundleDir, "index.html");
const outputPath = join(outputDir, "Game-Summary.html");

function bundledFile(url) {
  const file = resolve(bundleDir, url.replace(/^\.\//, ""));
  if (!file.startsWith(bundleDir + sep)) {
    throw new Error(`Unexpected asset path: ${url}`);
  }
  return readFileSync(file, "utf8");
}

let html = readFileSync(htmlPath, "utf8");
const script = html.match(/<script type="module" crossorigin src="([^"]+\.js)"><\/script>/);
const stylesheet = html.match(/<link rel="stylesheet" crossorigin href="([^"]+\.css)">/);
if (!script || !stylesheet) {
  throw new Error("Expected one JavaScript bundle and one stylesheet.");
}

html = html
  .replace(script[0], "<!-- INLINE_SCRIPT -->")
  .replace(stylesheet[0], "<!-- INLINE_STYLE -->")
  .replace(/^\s*<link rel="icon"[^>]*>\s*$/gm, "")
  .replace(/^\s*<link rel="manifest"[^>]*>\s*$/gm, "")
  .replace("Installable offline Progressive Web App.", "Offline single-file app.");

if (/<(?:script|link)\b[^>]+(?:src|href)="(?:\.\/|\/)/i.test(html)) {
  throw new Error("The output still references another local file.");
}

const js = bundledFile(script[1]).replace(/<\/script/gi, "<\\/script");
const css = bundledFile(stylesheet[1]).replace(/<\/style/gi, "<\\/style");
html = html
  .replace("<!-- INLINE_SCRIPT -->", `<script type="module">${js}</script>`)
  .replace("<!-- INLINE_STYLE -->", `<style>${css}</style>`);

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, html);
if (resolve(bundleDir).startsWith(outputDir + sep)) {
  rmSync(bundleDir, { recursive: true });
}
console.log(`Created ${outputPath}`);
