import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { page, posts } from '~/lib/content';
import { SITE } from '~/site.config';

/** /rss.xml: every published post, newest first. Linked from the head of every page and from /writing. */
export async function GET(context: APIContext) {
  const writing = await page('writing');
  const items = (await posts()).map((post) => ({
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    link: `/writing/${post.id}`,
    categories: post.data.tags,
  }));

  return rss({
    title: `Writing by ${SITE.shortName}`,
    description: writing.data.description,
    site: context.site ?? SITE.url,
    items,
    // Routes have no trailing slash (trailingSlash: 'never').
    trailingSlash: false,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>en-in</language><atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml"/>`,
  });
}
