// How to reach the Press Club. Edit the addresses here; a social link with an
// empty address is hidden everywhere until it is filled in.

export const CLUB_EMAIL = "pressclub@dau.ac.in";

type SocialLink = { label: string; href: string; note: string };

const SOCIAL: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/pressclubdau/", note: "@pressclubdau: photos, edition launches and event coverage" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/press-club-dau/", note: "Press Club DAU: club updates and alumni" },
];

// Only complete https links are shown, so a half-pasted address never becomes a broken link.
export function socialLinks() {
  return SOCIAL.filter((link) => {
    try {
      return new URL(link.href).protocol === "https:";
    } catch {
      return false;
    }
  });
}

// The address split at the @ so it can wrap there on a narrow phone, never mid-word.
export const CLUB_EMAIL_PARTS = CLUB_EMAIL.split("@") as [string, string];

export function mailtoClub(subject?: string) {
  return `mailto:${CLUB_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
}
