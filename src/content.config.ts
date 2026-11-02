import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const link = z.object({ label: z.string(), href: z.string() });

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().max(70),
    description: z.string().max(170),
    h1: z.string(),
    updated: z.coerce.date().optional(),
    intro: z.string().optional(),
    // home
    roleLine: z.string().optional(),
    aka: z.string().optional(),
    ctaPrimary: link.optional(),
    ctaSecondary: link.optional(),
    companiesHeading: z.string().optional(),
    workHeading: z.string().optional(),
    writingHeading: z.string().optional(),
    closingLine: z.string().optional(),
    methodHeading: z.string().optional(),
    methodBody: z.string().optional(),
    methodLink: link.optional(),
    // about
    bio: z.string().optional(),
    photoAlt: z.string().optional(),
    // experience
    resumeLabel: z.string().optional(),
    // writing
    elsewhereHeading: z.string().optional(),
    elsewhere: z
      .array(z.object({ title: z.string(), publisher: z.string(), date: z.coerce.date(), summary: z.string(), href: z.string() }))
      .optional(),
    // lab
    pieces: z.array(z.object({ id: z.string(), title: z.string(), summary: z.string(), interaction: z.string() })).optional(),
    toolsHeading: z.string().optional(),
    tools: z
      .array(z.object({ name: z.string(), summary: z.string(), stack: z.array(z.string()), year: z.coerce.number(), repo: z.string() }))
      .optional(),
    // contact
    offers: z.array(z.object({ id: z.string(), title: z.string(), body: z.string(), links: z.array(link).optional() })).optional(),
    emailLabel: z.string().optional(),
    bookingLabel: z.string().optional(),
    location: z.string().optional(),
    timezone: z.string().optional(),
    profilesHeading: z.string().optional(),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/work' }),
  schema: z.object({
    title: z.string().max(70),
    h1: z.string(),
    description: z.string().max(170),
    summary: z.string(),
    kind: z.enum(['company', 'project']),
    year: z.coerce.number(),
    yearEnd: z.coerce.number().nullable().optional(),
    role: z.string(),
    stack: z.array(z.string()).default([]),
    outcome: z.string().optional(),
    order: z.coerce.number(),
    links: z.array(link).default([]),
    repo: z.string().optional(),
    credits: z.string().optional(),
    needsConfirmation: z.array(z.string()).default([]),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/writing' }),
  schema: z.object({
    title: z.string().max(60),
    description: z.string().max(170),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    pillar: z.enum(['founder', 'engineering', 'product']),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    relatedWork: z.string().optional(),
    draft: z.boolean().default(false),
    needsConfirmation: z.array(z.string()).default([]),
  }),
});

export const collections = { pages, work, writing };
