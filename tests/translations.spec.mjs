// Checks that every English doc has a French translation that stays
// structurally in sync: same id/position, same heading anchors, same links,
// same images, same code blocks (commands must never be translated).
import {test, expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const EN = 'docs';
const FR = 'i18n/fr/docusaurus-plugin-content-docs/current';

function listMd(dir) {
  return fs.readdirSync(dir, {recursive: true})
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => f.split(path.sep).join('/'));
}

function parse(file) {
  const text = fs.readFileSync(file, 'utf8');
  const fm = (text.match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
  const field = (k) => (fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [, null])[1];
  const codeBlocks = [...text.matchAll(/^[ \t]*```[^\n]*\n([\s\S]*?)^[ \t]*```/gm)].map((m) => m[1]);
  const prose = text.replace(/^[ \t]*```[\s\S]*?^[ \t]*```/gm, '');
  // comment lines inside code may be translated; compare the rest
  const stripComments = (c) => c.split('\n')
    .filter((l) => !/^\s*(#(?!!|SBATCH)|\/\/)/.test(l))
    .map((l) => l.replace(/\s+#\s.*$/, '').trimEnd())
    .join('\n');
  return {
    id: field('id'),
    position: field('sidebar_position'),
    headingIds: [...prose.matchAll(/^#{1,6} .*\{#([^}]+)\}\s*$/gm)].map((m) => m[1]),
    links: [...prose.matchAll(/(?<!!)\]\(([^)\s]+)\)/g)].map((m) => m[1]).sort(),
    images: [...prose.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]).sort(),
    code: codeBlocks.map(stripComments),
  };
}

const enFiles = listMd(EN);

for (const rel of enFiles) {
  test.describe(`translation of ${rel}`, () => {
    const frPath = path.join(FR, rel);

    test('French file exists', () => {
      expect(fs.existsSync(frPath), `missing ${frPath}`).toBe(true);
    });

    test('structure matches English', () => {
      test.skip(!fs.existsSync(frPath));
      const en = parse(path.join(EN, rel));
      const fr = parse(frPath);
      expect(fr.id, 'id').toBe(en.id);
      expect(fr.position, 'sidebar_position').toBe(en.position);
      expect(fr.headingIds, 'heading anchors').toEqual(en.headingIds);
      expect(fr.links, 'link targets').toEqual(en.links);
      expect(fr.images, 'images').toEqual(en.images);
      expect(fr.code.length, 'number of code blocks').toBe(en.code.length);
      for (let i = 0; i < en.code.length; i++) {
        expect(fr.code[i], `code block #${i + 1} (commands must not be translated)`).toBe(en.code[i]);
      }
    });
  });
}
