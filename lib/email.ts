import nodemailer, { type Transporter } from "nodemailer";
import { requestedLabel } from "./submission-types";

// Same SMTP settings as the member directory app. Until they are set, emails
// are skipped (and logged), so submissions keep working without them.
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

type SubmittedBook = {
  title: string;
  author: string;
  email: string;
  phone: string;
  primaryCategory: string;
  purchaseLink: string;
  requestedPlacement: string | null;
};

// Tells the owner a book is waiting for approval. Never throws: a mail
// problem must not make the author's submission fail.
export async function sendNewSubmissionEmail(book: SubmittedBook, siteUrl: string): Promise<void> {
  const to = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  const t = getTransporter();
  const type = requestedLabel(book.requestedPlacement) ?? "General";
  const subject = `New Empowered Ink submission: ${book.title}`;
  const reviewUrl = `${siteUrl}/admin?status=pending`;
  const rows: [string, string][] = [
    ["Form", type],
    ["Title", book.title],
    ["Author", book.author],
    ["Category", book.primaryCategory],
    ["Email", book.email],
    ["Phone", book.phone],
    ["Book link", book.purchaseLink],
  ];

  if (!t || !to) {
    console.log(`[email] not sent (mail settings missing): ${subject}`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      replyTo: book.email || undefined,
      subject,
      text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nReview and approve it here: ${reviewUrl}`,
      html: `<div style="font-family:sans-serif;color:#16130f">
        <h2 style="font-family:Georgia,serif;font-weight:normal">New book submission</h2>
        <table cellpadding="4" style="border-collapse:collapse">${rows
          .map(([k, v]) => `<tr><td style="color:#57503f">${k}</td><td>${escapeHtml(v)}</td></tr>`)
          .join("")}</table>
        <p><a href="${reviewUrl}">Review and approve it in admin</a></p>
      </div>`,
    });
  } catch (err) {
    console.error("[email] failed to send submission notice", err);
  }
}
