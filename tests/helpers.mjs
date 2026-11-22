import fs from 'node:fs';
import path from 'node:path';

/** All page paths of the site, read from the build's sitemaps (EN + FR). */
export function allPaths() {
  const paths = [];
  for (const file of ['build/sitemap.xml', 'build/fr/sitemap.xml']) {
    const xml = fs.readFileSync(path.resolve(file), 'utf8');
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      paths.push(new URL(loc).pathname);
    }
  }
  return [...new Set(paths)];
}

/** Collects JS errors and failed requests on a page. */
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`);
  });
  return errors;
}
