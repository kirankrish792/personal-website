/** Dated milestones for the year strip on the Experience page. Every line comes from the verified facts (docs spec, section 3). */
export interface Milestone {
  /** Two-digit year, shown as ’19 and read as 2019. */
  year: string;
  title: string;
  label: string;
}

export const MILESTONES: Milestone[] = [
  { year: '19', title: 'Started engineering', label: 'College of Engineering Vadakara' },
  { year: '20', title: 'Founded a student chapter', label: 'IEEE Computer Society' },
  { year: '22', title: 'Built IoT systems', label: 'Hardware meets the web' },
  { year: '23', title: 'Graduated and won a hackathon', label: 'Graduation' },
  { year: '24', title: 'Co-founded Lofritex', label: 'Lofritex IT Solutions' },
  { year: '25', title: 'Founded Txtudio', label: 'Txtudio Coretech' },
  { year: '26', title: 'Building from the coast', label: 'Kozhikode, today' },
];
