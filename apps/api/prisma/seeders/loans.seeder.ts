import {
  LoanLienStatus,
  LoanLienType,
  type PrismaClient,
} from "../../generated/prisma/client.js";

import type { SeededTitleDeedIds } from "./title-deeds.seeder.js";

const loanLienRecords = [
  {
    id: "seed-loan-lien-001",
    titleDeedNumber: "SYNTH/NRB/KAS/001/2026",
    type: LoanLienType.LOAN,
    lender: "KCB Bank Kenya Plc",
    amount: "450000.00",
    status: LoanLienStatus.ACTIVE,
    dueDate: new Date("2028-06-30T00:00:00.000Z"),
    notes: "Synthetic development loan record.",
  },
  {
    id: "seed-loan-lien-002",
    titleDeedNumber: "SYNTH/KBU/RUI/002/2026",
    type: LoanLienType.LIEN,
    lender: "Kiambu County Government",
    amount: "85000.00",
    status: LoanLienStatus.ACTIVE,
    dueDate: new Date("2027-03-31T00:00:00.000Z"),
    notes: "Synthetic rates-related lien record.",
  },
  {
    id: "seed-loan-lien-003",
    titleDeedNumber: "SYNTH/KJD/KIT/003/2026",
    type: LoanLienType.LOAN,
    lender: "Equity Bank Kenya Limited",
    amount: "1200000.00",
    status: LoanLienStatus.CLEAR,
    dueDate: null,
    notes: "Synthetic loan marked as fully cleared.",
  },
  {
    id: "seed-loan-lien-004",
    titleDeedNumber: "SYNTH/NKR/NAI/004/2026",
    type: LoanLienType.LOAN,
    lender: "Co-operative Bank of Kenya",
    amount: "700000.00",
    status: LoanLienStatus.OVERDUE,
    dueDate: new Date("2025-11-30T00:00:00.000Z"),
    notes: "Synthetic overdue agricultural loan record.",
  },
  {
    id: "seed-loan-lien-005",
    titleDeedNumber: "SYNTH/MKS/ATH/005/2026",
    type: LoanLienType.LIEN,
    lender: "Kenya Industrial Estates",
    amount: "350000.00",
    status: LoanLienStatus.ACTIVE,
    dueDate: new Date("2028-01-15T00:00:00.000Z"),
    notes: "Synthetic industrial financing lien.",
  },
  {
    id: "seed-loan-lien-006",
    titleDeedNumber: "SYNTH/NRB/EMB/006/2026",
    type: LoanLienType.LIEN,
    lender: "Nairobi City County",
    amount: "120000.00",
    status: LoanLienStatus.OVERDUE,
    dueDate: new Date("2025-06-30T00:00:00.000Z"),
    notes: "Synthetic overdue county charge.",
  },
] as const;

export async function seedLoansLiens(
  prisma: PrismaClient,
  titleDeedIds: SeededTitleDeedIds,
): Promise<void> {
  for (const loanLien of loanLienRecords) {
    const titleDeedId = titleDeedIds.get(loanLien.titleDeedNumber);

    if (!titleDeedId) {
      throw new Error(`Missing seeded title deed: ${loanLien.titleDeedNumber}`);
    }

    const data = {
      titleDeedId,
      type: loanLien.type,
      lender: loanLien.lender,
      amount: loanLien.amount,
      status: loanLien.status,
      dueDate: loanLien.dueDate,
      notes: loanLien.notes,
    };

    await prisma.loanLien.upsert({
      where: { id: loanLien.id },
      create: { id: loanLien.id, ...data },
      update: data,
    });
  }
}
