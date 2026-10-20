export const CONTACT_EMAIL = "hey@shroom-mates.de";

export type NavKey =
  | "home"
  | "shop"
  | "pilze"
  | "growkits"
  | "tinkturen"
  | "gastro"
  | "ueber-uns"
  | "faq"
  | "kontakt";

export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
}

export const INSTAGRAM_URL = "https://www.instagram.com/shroom_mates_le/";
export const REPO_URL = "https://github.com/meister-eder/shroom-mates";
export const ADDRESS = {
  name: "Glasfabrik",
  street: "Franz-Flemming-Straße 25",
  city: "04179 Leipzig-Leutzsch",
} as const;

/** Main navigation in display order (Kontakt last). */
export const mainNav: NavItem[] = [
  { key: "shop", label: "Shop", href: "/shop/" },
  { key: "pilze", label: "Unsere Pilze", href: "/unsere-pilze/" },
  { key: "growkits", label: "Growkits", href: "/growkits/" },
  { key: "tinkturen", label: "Tinkturen", href: "/tinkturen/" },
  { key: "gastro", label: "Gastronomie", href: "/gastronomie/" },
  { key: "ueber-uns", label: "Über uns", href: "/ueber-uns/" },
  { key: "faq", label: "FAQ", href: "/faq/" },
  { key: "kontakt", label: "Kontakt", href: "/kontakt/" },
];

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

/** Footer link columns. `legalExtended` adds AGB / Widerruf / Gewährleistung. */
export function footerColumns(legalExtended = false): FooterColumn[] {
  const legal: FooterColumn["links"] = [
    { label: "Impressum", href: "/impressum/" },
    { label: "Datenschutz", href: "/datenschutz/" },
  ];
  if (legalExtended) {
    legal.push(
      { label: "AGB", href: "/agb/" },
      { label: "Widerruf", href: "/widerruf/" },
      { label: "Gewährleistung", href: "/gewaehrleistung/" },
    );
  }
  return [
    {
      title: "Seiten",
      links: [
        { label: "Shop", href: "/shop/" },
        { label: "Unsere Pilze", href: "/unsere-pilze/" },
        { label: "Growkits", href: "/growkits/" },
        { label: "Tinkturen", href: "/tinkturen/" },
        { label: "Gastronomie", href: "/gastronomie/" },
      ],
    },
    {
      title: "Mehr",
      links: [
        { label: "Über uns", href: "/ueber-uns/" },
        { label: "FAQ", href: "/faq/" },
        ...legal,
      ],
    },
  ];
}
