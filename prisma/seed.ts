import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function lastDayOf(year: number, month1to12: number): Date {
  return new Date(Date.UTC(year, month1to12, 0, 23, 59, 59));
}

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
    featuredUntil: lastDayOf(2026, 8),
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
    featuredUntil: lastDayOf(2026, 8),
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
    featuredUntil: lastDayOf(2026, 8),
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
    featuredUntil: lastDayOf(2026, 7),
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
];

async function main() {
  await prisma.book.deleteMany();
  let i = 0;
  for (const b of books) {
    i++;
    await prisma.book.create({
      data: {
        title: b.title,
        author: b.author,
        email: "email" in b && b.email ? b.email : `author${i}@example.com`,
        phone: "phone" in b && b.phone ? b.phone : `555-010-${String(i).padStart(4, "0")}`,
        description: "description" in b ? b.description : null,
        coverImageUrl: null,
        purchaseLink: "purchaseLink" in b && b.purchaseLink ? b.purchaseLink : `https://example.com/books/${b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        primaryCategory: b.primaryCategory,
        secondaryCategories: JSON.stringify(b.secondaryCategories ?? []),
        otherCategoryLabel: "otherCategoryLabel" in b ? b.otherCategoryLabel ?? null : null,
        isFeatured: "isFeatured" in b ? !!b.isFeatured : false,
        featuredUntil: "featuredUntil" in b ? b.featuredUntil ?? null : null,
        categoryAddonPaid: "categoryAddonPaid" in b ? !!b.categoryAddonPaid : false,
        status: "status" in b && b.status ? b.status : "approved",
      },
    });
  }
  console.log(`Seeded ${books.length} books.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
