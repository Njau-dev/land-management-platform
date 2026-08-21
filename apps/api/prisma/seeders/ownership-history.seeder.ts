import type { PrismaClient } from "../../generated/prisma/client.js";

import type { SeededTitleDeedIds } from "./title-deeds.seeder.js";

const ownershipRecords = [
  {
    id: "seed-ownership-001",
    titleDeedNumber: "SYNTH/NRB/KAS/001/2026",
    ownerName: "Joseph Karanja",
    transferDate: new Date("2014-06-12T00:00:00.000Z"),
    notes: "Synthetic historical ownership entry.",
  },
  {
    id: "seed-ownership-002",
    titleDeedNumber: "SYNTH/NRB/KAS/001/2026",
    ownerName: "Mary Atieno",
    transferDate: new Date("2019-09-20T00:00:00.000Z"),
    notes: "Synthetic transfer predating the current seeded owner.",
  },
  {
    id: "seed-ownership-003",
    titleDeedNumber: "SYNTH/KBU/RUI/002/2026",
    ownerName: "Daniel Kariuki",
    transferDate: new Date("2018-02-15T00:00:00.000Z"),
    notes: null,
  },
  {
    id: "seed-ownership-004",
    titleDeedNumber: "SYNTH/KJD/KIT/003/2026",
    ownerName: "Esther Muthoni",
    transferDate: new Date("2012-11-08T00:00:00.000Z"),
    notes: "Synthetic historical ownership entry.",
  },
  {
    id: "seed-ownership-005",
    titleDeedNumber: "SYNTH/KJD/KIT/003/2026",
    ownerName: "Collins Ochieng",
    transferDate: new Date("2020-04-27T00:00:00.000Z"),
    notes: null,
  },
  {
    id: "seed-ownership-006",
    titleDeedNumber: "SYNTH/NKR/NAI/004/2026",
    ownerName: "Naomi Jepchirchir",
    transferDate: new Date("2016-07-01T00:00:00.000Z"),
    notes: "Synthetic family transfer entry.",
  },
  {
    id: "seed-ownership-007",
    titleDeedNumber: "SYNTH/MKS/ATH/005/2026",
    ownerName: "Michael Nzioka",
    transferDate: new Date("2011-03-18T00:00:00.000Z"),
    notes: null,
  },
  {
    id: "seed-ownership-008",
    titleDeedNumber: "SYNTH/MKS/ATH/005/2026",
    ownerName: "Beatrice Wambua",
    transferDate: new Date("2017-12-05T00:00:00.000Z"),
    notes: "Synthetic transfer predating the current seeded owner.",
  },
  {
    id: "seed-ownership-009",
    titleDeedNumber: "SYNTH/NRB/EMB/006/2026",
    ownerName: "Hassan Abdalla",
    transferDate: new Date("2015-05-22T00:00:00.000Z"),
    notes: "Synthetic historical ownership entry.",
  },
  {
    id: "seed-ownership-010",
    titleDeedNumber: "SYNTH/KJD/NGO/008/2026",
    ownerName: "Jane Waithera",
    transferDate: new Date("2010-08-10T00:00:00.000Z"),
    notes: null,
  },
  {
    id: "seed-ownership-011",
    titleDeedNumber: "SYNTH/KJD/NGO/008/2026",
    ownerName: "Eric Mbugua",
    transferDate: new Date("2018-10-19T00:00:00.000Z"),
    notes: "Synthetic transfer predating the current seeded owner.",
  },
] as const;

export async function seedOwnershipHistory(
  prisma: PrismaClient,
  titleDeedIds: SeededTitleDeedIds,
): Promise<void> {
  for (const ownership of ownershipRecords) {
    const titleDeedId = titleDeedIds.get(ownership.titleDeedNumber);

    if (!titleDeedId) {
      throw new Error(`Missing seeded title deed: ${ownership.titleDeedNumber}`);
    }

    const data = {
      titleDeedId,
      ownerName: ownership.ownerName,
      transferDate: ownership.transferDate,
      notes: ownership.notes,
    };

    await prisma.ownershipHistory.upsert({
      where: { id: ownership.id },
      create: { id: ownership.id, ...data },
      update: data,
    });
  }
}
