import { json } from '@sveltejs/kit';

const BASE_URL = 'https://rotaractlilongwe.com';

const staticPages = [
  { url: '/', priority: 1.0, changefreq: 'weekly' },
  { url: '/about', priority: 0.9, changefreq: 'monthly' },
  { url: '/about/constitution', priority: 0.7, changefreq: 'yearly' },
  { url: '/about/reports', priority: 0.8, changefreq: 'monthly' },
  { url: '/about/11th-induction', priority: 0.7, changefreq: 'yearly' },
  { url: '/projects', priority: 0.9, changefreq: 'weekly' },
  { url: '/join', priority: 0.8, changefreq: 'monthly' },
  { url: '/donate', priority: 0.8, changefreq: 'monthly' },
  { url: '/partnerships', priority: 0.7, changefreq: 'monthly' },
  { url: '/endpolio', priority: 0.6, changefreq: 'monthly' },
  { url: '/endpolio/D9210-endpolionow-tracker', priority: 0.4, changefreq: 'monthly' },
];

export async function GET() {
  const lastmod = new Date().toISOString().split('T')[0];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticPages.map(page => `
  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}