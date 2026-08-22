import { randomBytes } from "node:crypto";

import PDFDocument from "pdfkit";

import type { LandSearchResult } from "./land.types.js";

const colors = {
  forest: "#064e3b",
  emerald: "#047857",
  stone: "#44403c",
  muted: "#78716c",
  border: "#d6d3d1",
  surface: "#f5f5f4",
  white: "#ffffff",
};

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null): string {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function formatKes(value: string): string {
  const [integer = "0", fraction = "00"] = value.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `KSh ${grouped}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

function reportReference(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `LMP-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function safeReportFilename(titleDeedNumber: string): string {
  const safeTitleNumber = titleDeedNumber
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `land-search-${safeTitleNumber || "title-deed"}.pdf`;
}

function sectionTitle(document: PDFKit.PDFDocument, title: string): void {
  if (document.y > 690) document.addPage();
  document
    .moveDown(0.8)
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(colors.forest)
    .text(title.toUpperCase(), { characterSpacing: 1.2 });
  document.moveDown(0.35);
  document
    .moveTo(54, document.y)
    .lineTo(558, document.y)
    .strokeColor(colors.border)
    .lineWidth(0.7)
    .stroke();
  document.moveDown(0.65);
}

function keyValue(
  document: PDFKit.PDFDocument,
  label: string,
  value: string,
): void {
  const startY = document.y;
  document
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(colors.muted)
    .text(label, 54, startY, { width: 145 });
  document
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(colors.stone)
    .text(value, 205, startY, { width: 353 });
  document.y = Math.max(document.y, startY + 17);
}

function addFooter(document: PDFKit.PDFDocument): void {
  const range = document.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    document.switchToPage(index);
    document
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(colors.muted)
      .text(
        `Land Management Platform  |  Page ${index + 1} of ${range.count}`,
        54,
        772,
        { width: 504, align: "center", lineBreak: false },
      );
  }
}

export async function createLandSearchReport(
  result: LandSearchResult,
): Promise<{ buffer: Buffer; reference: string; filename: string }> {
  const reference = reportReference();
  const document = new PDFDocument({
    size: "A4",
    margins: { top: 48, right: 54, bottom: 58, left: 54 },
    bufferPages: true,
    compress: false,
    info: {
      Title: `Land Search Report - ${result.titleDeed.titleDeedNumber}`,
      Author: "Land Management Platform",
      Subject: "Synthetic development-data land search report",
    },
  });
  const chunks: Buffer[] = [];
  document.on("data", (chunk: Buffer) => chunks.push(chunk));

  const finished = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });

  document.rect(0, 0, 612, 116).fill(colors.forest);
  document
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#a7f3d0")
    .text("LAND MANAGEMENT PLATFORM", 54, 43, { characterSpacing: 1.2 });
  document
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor(colors.white)
    .text("Land Search Report", 54, 63);
  document.y = 139;
  keyValue(document, "Report reference", reference);
  keyValue(document, "Generated", formatDateTime(result.searchedAt));

  sectionTitle(document, "Property summary");
  keyValue(document, "Title deed number", result.titleDeed.titleDeedNumber);
  keyValue(document, "Current owner", result.titleDeed.ownerName);
  keyValue(document, "Location", result.titleDeed.location);
  keyValue(document, "Parcel size", `${result.titleDeed.size} (unit not specified)`);
  keyValue(
    document,
    "Availability",
    humanize(result.titleDeed.availabilityStatus),
  );
  keyValue(document, "Estimated land rate", formatKes(result.titleDeed.landRate));

  sectionTitle(document, "Zoning");
  if (result.zoning) {
    keyValue(document, "Classification", humanize(result.zoning.zoneType));
    keyValue(document, "Notes", result.zoning.notes ?? "Not recorded");
    keyValue(
      document,
      "Restrictions",
      result.zoning.restrictions ?? "Not recorded",
    );
  } else {
    document
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(colors.stone)
      .text("No zoning record is present in the current dataset.");
  }

  sectionTitle(document, "Loans and liens");
  if (result.loansLiens.length === 0) {
    document
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(colors.stone)
      .text("No loan or lien records are present in the current dataset.");
  } else {
    for (const record of result.loansLiens) {
      if (document.y > 710) document.addPage();
      document
        .roundedRect(54, document.y, 504, 67, 3)
        .fillAndStroke(colors.surface, colors.border);
      const blockY = document.y + 10;
      document
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(colors.stone)
        .text(`${humanize(record.type)} - ${record.lender}`, 66, blockY, {
          width: 330,
        });
      document
        .font("Helvetica-Bold")
        .fillColor(colors.emerald)
        .text(humanize(record.status), 420, blockY, {
          width: 124,
          align: "right",
        });
      document
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(colors.muted)
        .text(
          `${formatKes(record.amount)}  |  Due: ${formatDate(record.dueDate)}`,
          66,
          blockY + 20,
          { width: 478 },
        );
      document.text(record.notes ?? "No notes recorded.", 66, blockY + 38, {
        width: 478,
      });
      document.y = blockY + 66;
    }
  }

  sectionTitle(document, "Ownership history - newest first");
  if (result.ownershipHistory.length === 0) {
    document
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(colors.stone)
      .text("No ownership-history records are present in the current dataset.");
  } else {
    for (const record of result.ownershipHistory) {
      if (document.y > 725) document.addPage();
      const entryY = document.y;
      document.circle(60, entryY + 5, 3).fill(colors.emerald);
      document
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(colors.stone)
        .text(record.ownerName, 76, entryY, { width: 300 });
      document
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(colors.muted)
        .text(formatDate(record.transferDate), 390, entryY, {
          width: 168,
          align: "right",
        });
      document.text(record.notes ?? "No notes recorded.", 76, entryY + 17, {
        width: 468,
      });
      document.y = entryY + 42;
    }
  }

  sectionTitle(document, "Important notice");
  document
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(colors.stone)
    .text(
      "This MVP uses seeded development data. This report is not an official government registry certificate. Official verification should be completed through the appropriate authoritative land-registry process.",
      { lineGap: 2 },
    );

  addFooter(document);
  document.end();

  return {
    buffer: await finished,
    reference,
    filename: safeReportFilename(result.titleDeed.titleDeedNumber),
  };
}
