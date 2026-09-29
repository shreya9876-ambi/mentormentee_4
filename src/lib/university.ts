export const UNIVERSITY_NAME = "PCCOER";
export const UNIVERSITY_DOMAIN = "pcoer.in";
export const UNIVERSITY_TAGLINE = "Alumni–Student Connect";

const VALID_DOMAINS = ["pcoer.in", "pcooer.in", "pccoe.in", "pccoer.in"];

export function isUniversityEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  return VALID_DOMAINS.some((domain) => lower.endsWith("@" + domain));
}
