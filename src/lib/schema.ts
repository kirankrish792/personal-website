import person from '~/data/person.json';
import { SITE } from '~/site.config';

export const IDS = {
  person: `${SITE.url}/#person`,
  website: `${SITE.url}/#website`,
  txtudio: `${SITE.url}/#txtudio`,
  lofritex: `${SITE.url}/#lofritex`,
} as const;

export const PORTRAIT_URL = `${SITE.url}/images/kiran-krishnakumar-subhashini.jpg`;

type Node = Record<string, unknown>;

export function personNode(): Node {
  const edu = person.education?.[0];
  return {
    '@type': 'Person',
    '@id': IDS.person,
    name: person.name,
    alternateName: person.alternateName,
    url: SITE.url,
    image: PORTRAIT_URL,
    jobTitle: person.jobTitle,
    description: person.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: person.location.locality,
      addressRegion: person.location.region,
      addressCountry: 'IN',
    },
    ...(edu && {
      alumniOf: { '@type': 'CollegeOrUniversity', name: edu.institution, url: edu.url },
    }),
    worksFor: [{ '@id': IDS.txtudio }, { '@id': IDS.lofritex }],
    // Past roles are expressed as OrganizationRole with dates, so they are not read as current memberships.
    memberOf: (person.leadership ?? []).map((l) => ({
      '@type': 'OrganizationRole',
      roleName: l.role,
      ...(l.start && { startDate: l.start }),
      ...(l.end && { endDate: l.end }),
      memberOf: { '@type': 'Organization', name: l.org },
    })),
    knowsAbout: person.knowsAbout,
    sameAs: person.sameAs,
  };
}

export function organizationNodes(): Node[] {
  const place = { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Kozhikode', addressRegion: 'Kerala', addressCountry: 'IN' } };
  return [
    {
      '@type': 'Organization',
      '@id': IDS.txtudio,
      name: 'Txtudio Coretech Private Limited',
      alternateName: 'Txtudio',
      url: 'https://www.txtudio.com',
      foundingDate: '2025-10-31',
      foundingLocation: place,
      founder: { '@id': IDS.person },
    },
    {
      '@type': 'Organization',
      '@id': IDS.lofritex,
      name: 'Lofritex IT Solutions LLP',
      alternateName: 'Lofritex',
      url: 'https://lofritex.com',
      foundingDate: '2024-07-19',
      foundingLocation: place,
      founder: { '@id': IDS.person },
    },
  ];
}

export function websiteNode(): Node {
  return {
    '@type': 'WebSite',
    '@id': IDS.website,
    url: SITE.url,
    name: SITE.name,
    inLanguage: SITE.locale,
    author: { '@id': IDS.person },
    publisher: { '@id': IDS.person },
  };
}

export function breadcrumbNode(trail: { name: string; path: string }[]): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: t.path === '/' ? SITE.url : `${SITE.url}${t.path}`,
    })),
  };
}

/** The base graph every page carries: the person, both companies and the website. */
export function baseGraph(): Node[] {
  return [personNode(), ...organizationNodes(), websiteNode()];
}

export function articleNode(opts: {
  path: string;
  headline: string;
  description: string;
  published: Date;
  modified?: Date;
  type?: 'Article' | 'BlogPosting';
  about?: Record<string, unknown>[];
}): Node {
  const url = `${SITE.url}${opts.path}`;
  return {
    '@type': opts.type ?? 'Article',
    '@id': `${url}#article`,
    headline: opts.headline,
    description: opts.description,
    url,
    mainEntityOfPage: url,
    image: `${SITE.url}/og${opts.path}.png`,
    datePublished: opts.published.toISOString().slice(0, 10),
    dateModified: (opts.modified ?? opts.published).toISOString().slice(0, 10),
    inLanguage: SITE.locale,
    author: { '@id': IDS.person },
    publisher: { '@id': IDS.person },
    isPartOf: { '@id': IDS.website },
    ...(opts.about && { about: opts.about }),
  };
}

export function sourceCodeNode(opts: { name: string; repo: string; languages: string[]; description?: string }): Node {
  return {
    '@type': 'SoftwareSourceCode',
    name: opts.name,
    codeRepository: opts.repo,
    programmingLanguage: opts.languages,
    ...(opts.description && { description: opts.description }),
    author: { '@id': IDS.person },
  };
}

export function webPageNode(opts: { path: string; name: string; description: string; type?: string }): Node {
  const url = opts.path === '/' ? SITE.url : `${SITE.url}${opts.path}`;
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: opts.name,
    description: opts.description,
    inLanguage: SITE.locale,
    isPartOf: { '@id': IDS.website },
    about: { '@id': IDS.person },
  };
}
