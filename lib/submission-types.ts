// The three shareable author form links, like the member directory's
// /join?tier=… links:
//   /book-feature-submission-form?type=featured
//   /book-feature-submission-form?type=new
//   /book-feature-submission-form?type=list
// The type is saved on the submission as a suggestion; the owner still
// approves every book and can place it anywhere.

export const SUBMISSION_TYPES = {
  featured: {
    requested: "featured",
    heading: "Featured Author Submission",
    intro: "Send us your book to be featured in Empowered Ink.",
    adminLabel: "Featured",
  },
  new: {
    requested: "new_on_shelf",
    heading: "Book of the Month Submission",
    intro: "Send us your book for New on the Shelf in Empowered Ink.",
    adminLabel: "New on the Shelf",
  },
  list: {
    requested: "list",
    heading: "Add Your Book to Empowered Ink",
    intro: "Send us your book for the Empowered Ink collection.",
    adminLabel: "A–Z list",
  },
} as const;

export type SubmissionType = keyof typeof SUBMISSION_TYPES;
export type RequestedPlacement = (typeof SUBMISSION_TYPES)[SubmissionType]["requested"];

export function submissionTypeOf(value: unknown): SubmissionType | null {
  return typeof value === "string" && value in SUBMISSION_TYPES ? (value as SubmissionType) : null;
}

export function requestedLabel(requested: string | null): string | null {
  const match = Object.values(SUBMISSION_TYPES).find((t) => t.requested === requested);
  return match?.adminLabel ?? null;
}
