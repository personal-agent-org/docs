import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const origin = 'https://personal-agent.org';
const root = new URL('..', import.meta.url).pathname;

const docs = (await readdir(join(root, 'docs'), { recursive: true }))
  .filter((path) => path.endsWith('.md'))
  .map((path) => `/docs/${path.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')}`);

const marketplaceSource = await readFile(join(root, 'src/services/marketplace.ts'), 'utf8');
const marketplace = [...marketplaceSource.matchAll(/slug:\s*'([^']+)'/g)].map(
  ([, slug]) => `/marketplace/${slug}`,
);

const localized = ['/', '/organizations', '/cloud-connect', '/cloud', '/marketplace'];
const urls = [
  ...localized,
  ...localized.map((path) => `/de${path === '/' ? '' : path}`),
  ...marketplace,
  ...marketplace.map((path) => `/de${path}`),
  ...docs,
];

function absolute(path) {
  const normalized = path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`;
  return `${origin}${normalized}`;
}

const body = urls.map((path) => `  <url>\n    <loc>${absolute(path)}</loc>\n  </url>`).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

await mkdir(join(root, 'public'), { recursive: true });
await writeFile(join(root, 'public/sitemap.xml'), sitemap, 'utf8');
