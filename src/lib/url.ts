import { SITE } from '~/site.config';

/** Normalises a build-time pathname (which may end in .html or /index) to the public route. */
export function routePath(pathname: string): string {
  let path = pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
  if (path.length > 1) path = path.replace(/\/$/, '');
  return path || '/';
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString().replace(/\/$/, path === '/' ? '' : '');
}

export function canonicalFor(pathname: string): string {
  const path = routePath(pathname);
  return path === '/' ? SITE.url : `${SITE.url}${path}`;
}

/** Open Graph image route for a page path: /og/home.png, /og/work/txtudio.png */
export function ogImageFor(pathname: string): string {
  const path = routePath(pathname);
  const slug = path === '/' ? 'home' : path.slice(1);
  return `${SITE.url}/og/${slug}.png`;
}
