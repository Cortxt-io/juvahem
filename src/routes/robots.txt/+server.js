export const prerender = true;

export function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: https://juvahem.se/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
