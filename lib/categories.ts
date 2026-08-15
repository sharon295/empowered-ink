export const CATEGORIES = [
  "Business & Entrepreneurship",
  "Leadership",
  "Personal Development",
  "Mindset & Motivation",
  "Women's Empowerment",
  "Faith & Spirituality",
  "Health & Wellness",
  "Finance & Wealth",
  "Relationships & Family",
  "Children & Young Adult",
  "Memoir & Inspirational",
  "Fiction",
  "Poetry",
  "Lifestyle",
  "Social Impact",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const FEATURED_PRICE_CENTS = 7500;
export const CATEGORY_ADDON_PRICE_CENTS = 3500;

export function lastDayOfCurrentMonth(from: Date = new Date()): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0, 23, 59, 59));
}
