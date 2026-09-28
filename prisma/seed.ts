import { PrismaClient } from "@prisma/client";
import { currentMonthKey, endOfMonth, shiftMonth } from "../lib/month";
import { derivedFields } from "../lib/normalize.mjs";

const prisma = new PrismaClient();

// Placements are relative to the current Denver month, so the seed always
// shows every section: 3 Featured this month, 1 lapsed Featured (now in the
// A–Z list), 14 New on the Shelf (more than the 12 shown before "Show all"),
// 1 scheduled for next month (hidden), a pending and a rejected book, and
// enough A–Z books for several batches of continuous scroll.
const THIS_MONTH = currentMonthKey();
const LAST_MONTH = shiftMonth(THIS_MONTH, -1);
const NEXT_MONTH = shiftMonth(THIS_MONTH, 1);

const books = [
  {
    title: "The Cost of Staying Small",
    author: "Renita Marsh",
    email: "renita@example.com",
    phone: "555-010-0001",
    description:
      "A candid look at the invisible ceilings women build for themselves long before the market ever does. Renita traces her path from underpaid associate to agency founder, unpacking the small, quiet decisions — the emails not sent, the rates not raised — that keep ambitious women playing safe. Part memoir, part field guide for anyone ready to stop shrinking and start taking up the room they've already earned.",
    purchaseLink: "https://example.com/books/cost-of-staying-small",
    primaryCategory: "Business & Entrepreneurship",
    secondaryCategories: ["Mindset & Motivation"],
    isFeatured: true,
    month: THIS_MONTH,
    categoryAddonPaid: true,
  },
  {
    title: "Badass Blueprint",
    author: "Talia Fenwick",
    email: "talia@example.com",
    phone: "555-010-0002",
    description:
      "A no-fluff operating manual for women building a personal brand and a P&L at the same time. Talia breaks down the systems behind her seven-figure consultancy into repeatable frameworks covering positioning, pricing, and the mindset work that makes both stick. Blunt, funny, and refreshingly tactical, this is the book she wishes someone had handed her a decade ago, before she learned it all the hard, expensive way.",
    purchaseLink: "https://example.com/books/badass-blueprint",
    primaryCategory: "Business & Entrepreneurship",
    secondaryCategories: ["Leadership"],
    isFeatured: true,
    month: THIS_MONTH,
    categoryAddonPaid: true,
  },
  {
    title: "Free to Sing",
    author: "Naomi Achebe",
    email: "naomi@example.com",
    phone: "555-010-0003",
    description:
      "After twenty years performing on other people's terms, Naomi walked away from a stable career to write music that finally sounded like her. This memoir follows that leap — the financial fear, the family skepticism, and the unexpected community that formed once she stopped asking permission to take up space. A tender, honest account of what it costs, and what it gives back, to finally sing in your own voice after decades of borrowed ones.",
    purchaseLink: "https://example.com/books/free-to-sing",
    primaryCategory: "Memoir & Inspirational",
    secondaryCategories: ["Faith & Spirituality"],
    isFeatured: true,
    month: THIS_MONTH,
    categoryAddonPaid: true,
  },
  {
    title: "Rebel Girl's Guide to Marketing",
    author: "Colette Reyes",
    email: "colette@example.com",
    phone: "555-010-0004",
    description:
      "A playbook for marketing without losing yourself in the process, written by a strategist who has run campaigns for founders across a dozen industries. Colette argues that the loudest brands aren't the best ones, they're just the most consistent, and shows exactly how to build that consistency without burning out. This copy demonstrates a lapsed Featured placement automatically falling back into the standard alphabetical directory.",
    purchaseLink: "https://example.com/books/rebel-girls-guide",
    primaryCategory: "Business & Entrepreneurship",
    secondaryCategories: ["Mindset & Motivation"],
    isFeatured: true,
    month: LAST_MONTH,
    categoryAddonPaid: true,
  },
  { title: "A Force for Good", author: "Priya Kadam", primaryCategory: "Social Impact", secondaryCategories: ["Business & Entrepreneurship"] },
  { title: "The Conscious Workplace", author: "Marguerite Olsen", primaryCategory: "Leadership", secondaryCategories: ["Personal Development"] },
  { title: "Power of Awakening", author: "Sally Wurr", primaryCategory: "Faith & Spirituality", secondaryCategories: ["Personal Development"] },
  { title: "Embrace Your Inner Millionaire", author: "Monique Caradine", primaryCategory: "Finance & Wealth", secondaryCategories: [] },
  { title: "Grit, Grind, Grace & Gratitude", author: "Denise Okafor", primaryCategory: "Memoir & Inspirational", secondaryCategories: ["Women's Empowerment"] },
  { title: "Unravel & Rise", author: "Janelle Cortez", primaryCategory: "Memoir & Inspirational", secondaryCategories: ["Health & Wellness"] },
  { title: "Like a Mother", author: "Bianca Whitfield", primaryCategory: "Relationships & Family", secondaryCategories: ["Business & Entrepreneurship"] },
  { title: "The IVF Storybook", author: "Meirav Zur", primaryCategory: "Health & Wellness", secondaryCategories: ["Relationships & Family"] },
  { title: "No More Crumbs", author: "Odessa Vance", primaryCategory: "Memoir & Inspirational", secondaryCategories: ["Women's Empowerment"] },
  { title: "Made to Sell", author: "Harriet Nolan", primaryCategory: "Business & Entrepreneurship", secondaryCategories: [] },
  { title: "Be BOLD Today", author: "Leigh Burgess", primaryCategory: "Leadership", secondaryCategories: ["Mindset & Motivation"] },
  { title: "X in Provence", author: "Tani Ruiz", primaryCategory: "Fiction", secondaryCategories: [] },
  { title: "The Phoenix Tapes", author: "Nelle Jorgensen", primaryCategory: "Fiction", secondaryCategories: [] },
  { title: "Kitchen Spirits", author: "Chef Joanne Thomas", primaryCategory: "Lifestyle", secondaryCategories: ["Other"], otherCategoryLabel: "Culinary / Cookbook" },
  { title: "One Arm, But Not Unarmed", author: "Delphine Cho", primaryCategory: "Memoir & Inspirational", secondaryCategories: ["Health & Wellness"] },
  { title: "Supported", author: "Gold Coast Doulas", primaryCategory: "Relationships & Family", secondaryCategories: ["Health & Wellness"] },
  { title: "White Picket Fences", author: "Kyle Robertson", primaryCategory: "Memoir & Inspirational", secondaryCategories: [] },
  { title: "Power of Purpose", author: "Sally Wurr", primaryCategory: "Leadership", secondaryCategories: ["Personal Development"] },
  { title: "A Measure of Gratitude", author: "Renee Ichigo", primaryCategory: "Faith & Spirituality", secondaryCategories: [] },
  { title: "Your Unstoppable Journal", author: "Marisol Vance", primaryCategory: "Personal Development", secondaryCategories: ["Lifestyle"] },
  { title: "Who's Holding the Microphone", author: "Adaeze Nwosu", primaryCategory: "Leadership", secondaryCategories: ["Women's Empowerment"] },
  { title: "A Banana Slug Gets Her Name", author: "Christine Melaas", primaryCategory: "Children & Young Adult", secondaryCategories: [] },
  { title: "Giraffes in Outer Space", author: "Christine Melaas", primaryCategory: "Children & Young Adult", secondaryCategories: ["Fiction"] },
  { title: "Multi-Passionate", author: "Alejandra Pruitt", primaryCategory: "Business & Entrepreneurship", secondaryCategories: ["Personal Development"] },
  { title: "Where the Light Pools", author: "Imani Voss", primaryCategory: "Poetry", secondaryCategories: [] },
  { title: "A Pending Draft, Not Yet Reviewed", author: "Test Author", primaryCategory: "Fiction", secondaryCategories: [], status: "pending" as const },
  { title: "A Rejected Submission", author: "Test Author", primaryCategory: "Fiction", secondaryCategories: [], status: "rejected" as const },
];

// New on the Shelf this month; includes the alphabetical edge cases
// ("The Zebra" under Z, "A Book" under B, "Élan" under E).
const newThisMonth = [
  { title: "The Zebra", author: "Imogen Hart", primaryCategory: "Children & Young Adult", secondaryCategories: [] },
  { title: "A Book", author: "Pat Lindqvist", primaryCategory: "Fiction", secondaryCategories: [] },
  { title: "Élan", author: "Josiane Béland", primaryCategory: "Lifestyle", secondaryCategories: [] },
  { title: "Quiet Authority", author: "Hannah Mbeki", primaryCategory: "Leadership", secondaryCategories: [] },
  { title: "The Second Act", author: "Lorraine Fitch", primaryCategory: "Personal Development", secondaryCategories: [] },
  { title: "Money Talks Softly", author: "Dana Oyelaran", primaryCategory: "Finance & Wealth", secondaryCategories: [] },
  { title: "Roots and Wings", author: "Carmen Ibarra", primaryCategory: "Relationships & Family", secondaryCategories: [] },
  { title: "Salt & Honey", author: "Mira Castellanos", primaryCategory: "Poetry", secondaryCategories: [] },
  { title: "Brave Enough to Begin", author: "Tess Donnelly", primaryCategory: "Mindset & Motivation", secondaryCategories: [] },
  { title: "The Kindness Economy", author: "Aisha Rahman", primaryCategory: "Social Impact", secondaryCategories: [] },
  { title: "Held", author: "Ruth Adeyemi", primaryCategory: "Faith & Spirituality", secondaryCategories: [] },
  { title: "Well Within", author: "Sonia Park", primaryCategory: "Health & Wellness", secondaryCategories: [] },
  { title: "Founder, Mother, Me", author: "Leah Brandt", primaryCategory: "Business & Entrepreneurship", secondaryCategories: [] },
  { title: "Undaunted", author: "Grace Whitlock", primaryCategory: "Women's Empowerment", secondaryCategories: [] },
].map((b) => ({ ...b, month: THIS_MONTH }));

// Enough extra A–Z books for several batches of 24, plus one book scheduled
// for next month's New on the Shelf (hidden until then).
const backlistWords = [
  "Amber", "Beacon", "Canvas", "Dawn", "Ember", "Fable", "Garden", "Harbor", "Iris", "Juniper",
  "Kindred", "Lantern", "Meadow", "North", "Orchard", "Prairie", "Quill", "River", "Summit", "Tide",
  "Umber", "Vessel", "Willow", "Yarrow",
];
const backlist = [
  ...backlistWords.map((word, n) => ({
    title: `${n % 3 === 0 ? "The " : ""}${word} Notebook`,
    author: `Sample Author ${n + 1}`,
    primaryCategory: ["Personal Development", "Lifestyle", "Fiction", "Leadership"][n % 4],
    secondaryCategories: [] as string[],
  })),
  {
    title: "Coming Next Month",
    author: "Scheduled Author",
    primaryCategory: "Fiction",
    secondaryCategories: [] as string[],
    month: NEXT_MONTH,
  },
];

async function main() {
  await prisma.book.deleteMany();
  type SeedBook = {
    title: string;
    author: string;
    email?: string;
    phone?: string;
    description?: string;
    purchaseLink?: string;
    primaryCategory: string;
    secondaryCategories?: string[];
    otherCategoryLabel?: string;
    isFeatured?: boolean;
    month?: string;
    categoryAddonPaid?: boolean;
    status?: "pending" | "approved" | "rejected";
  };
  const all: SeedBook[] = [...books, ...newThisMonth, ...backlist];
  let i = 0;
  for (const b of all) {
    i++;
    const featured = "isFeatured" in b && b.isFeatured;
    const month = "month" in b && b.month ? b.month : null;
    const placement = featured ? ("featured" as const) : month ? ("new_on_shelf" as const) : null;
    const status = "status" in b && b.status ? b.status : "approved";
    const book = {
      title: b.title,
      author: b.author,
      primaryCategory: b.primaryCategory,
      secondaryCategories: JSON.stringify(b.secondaryCategories ?? []),
      categoryAddonPaid: "categoryAddonPaid" in b ? !!b.categoryAddonPaid : (b.secondaryCategories ?? []).length > 0,
      otherCategoryLabel: "otherCategoryLabel" in b ? b.otherCategoryLabel ?? null : null,
    };
    await prisma.book.create({
      data: {
        ...book,
        ...derivedFields(book),
        email: "email" in b && b.email ? b.email : `author${i}@example.com`,
        phone: "phone" in b && b.phone ? b.phone : `555-010-${String(i).padStart(4, "0")}`,
        description: "description" in b ? b.description : null,
        coverImageUrl: null,
        purchaseLink:
          "purchaseLink" in b && b.purchaseLink
            ? b.purchaseLink
            : `https://example.com/books/${b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        isFeatured: Boolean(featured),
        featuredUntil: featured && month ? endOfMonth(month) : null,
        placement,
        placementMonth: placement ? month : null,
        status,
        approvedAt: status === "approved" ? new Date() : null,
      },
    });
  }
  console.log(`Seeded ${all.length} books (featured and new placements for ${THIS_MONTH}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
