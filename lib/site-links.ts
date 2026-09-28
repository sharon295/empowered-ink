// Links used by the submission form's header and footer (the directory itself
// is embedded in the magazine page, which has its own header and footer).
// TODO(owner): replace the PLACEHOLDER URLs with the real magazine pages.

export const MAGAZINE_HOME = "https://possiblewomanmagazine.com";

// Where readers go "back to the directory": the magazine page that embeds it.
export const DIRECTORY_PAGE_URL =
  process.env.NEXT_PUBLIC_DIRECTORY_PAGE_URL || "https://possiblewomanmagazine.com/empowered-ink"; // PLACEHOLDER

export const FOOTER_LINKS = [
  { label: "The Magazine", href: "https://possiblewomanmagazine.com" },
  { label: "Empowered Ink", href: DIRECTORY_PAGE_URL },
  { label: "HERstory Unveiled", href: "https://possiblewomanmagazine.com/herstory-unveiled" }, // PLACEHOLDER
  { label: "Possible Woman", href: "https://possible-woman.com" },
  { label: "Terms", href: "https://possiblewomanmagazine.com/terms" },
  { label: "Privacy Policy", href: "https://possiblewomanmagazine.com/privacy" },
];
