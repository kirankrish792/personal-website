/**
 * Site-wide settings. Fill the three empty values before launch:
 * pages hide the email and booking buttons while they are empty,
 * and the analytics beacon is only added when a token is set.
 */
export const SITE = {
  url: 'https://kirankrishnakumar.com',
  name: 'Kiran Krishnakumar Subhashini',
  shortName: 'Kiran K S',
  locale: 'en-IN',
  email: '', // for example 'kiran@kirankrishnakumar.com'
  bookingUrl: '', // for example 'https://cal.com/<handle>/30min'
  cfAnalyticsToken: '', // Cloudflare Web Analytics site token
  socials: [
    { label: 'GitHub', href: 'https://github.com/kirankrish792' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kiran-ks79ks' },
  ],
} as const;

export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Work', href: '/work' },
  { label: 'Experience', href: '/experience' },
  { label: 'Writing', href: '/writing' },
  { label: 'Lab', href: '/lab' },
  { label: 'Contact', href: '/contact' },
] as const;
