import {
  ZoneType,
  type PrismaClient,
} from "../../generated/prisma/client.js";

import type { SeededTitleDeedIds } from "./title-deeds.seeder.js";

const zoningRecords = [
  {
    titleDeedNumber: "SYNTH/NRB/KAS/001/2026",
    zoneType: ZoneType.RESIDENTIAL,
    notes: "Synthetic low-density residential development record.",
    restrictions: "Subject to applicable county building approvals.",
  },
  {
    titleDeedNumber: "SYNTH/KBU/RUI/002/2026",
    zoneType: ZoneType.MIXED_USE,
    notes: "Synthetic residential and neighborhood-commercial classification.",
    restrictions: "Commercial activity is limited to approved uses.",
  },
  {
    titleDeedNumber: "SYNTH/KJD/KIT/003/2026",
    zoneType: ZoneType.COMMERCIAL,
    notes: "Synthetic roadside commercial development record.",
    restrictions: null,
  },
  {
    titleDeedNumber: "SYNTH/NKR/NAI/004/2026",
    zoneType: ZoneType.AGRICULTURAL,
    notes: "Synthetic agricultural holding record.",
    restrictions: "Subdivision is subject to applicable planning approval.",
  },
  {
    titleDeedNumber: "SYNTH/MKS/ATH/005/2026",
    zoneType: ZoneType.INDUSTRIAL,
    notes: "Synthetic light-industrial development record.",
    restrictions: "Environmental and industrial-use approvals may apply.",
  },
  {
    titleDeedNumber: "SYNTH/NRB/EMB/006/2026",
    zoneType: ZoneType.OTHER,
    notes: "Synthetic special-planning-area classification.",
    restrictions: "Use requires confirmation against the applicable local plan.",
  },
  {
    titleDeedNumber: "SYNTH/KBU/LIM/007/2026",
    zoneType: ZoneType.AGRICULTURAL,
    notes: null,
    restrictions: "Agricultural land-use controls apply.",
  },
  {
    titleDeedNumber: "SYNTH/KJD/NGO/008/2026",
    zoneType: ZoneType.RESIDENTIAL,
    notes: "Synthetic medium-density residential record.",
    restrictions: null,
  },
  {
    titleDeedNumber: "SYNTH/NKR/GIL/009/2026",
    zoneType: ZoneType.COMMERCIAL,
    notes: "Synthetic highway-service commercial record.",
    restrictions: "Access arrangements require the relevant authority's approval.",
  },
  {
    titleDeedNumber: "SYNTH/MKS/MUA/010/2026",
    zoneType: ZoneType.RESIDENTIAL,
    notes: null,
    restrictions: "Development should preserve designated drainage corridors.",
  },
] as const;

export async function seedZoning(
  prisma: PrismaClient,
  titleDeedIds: SeededTitleDeedIds,
): Promise<void> {
  for (const zoning of zoningRecords) {
    const titleDeedId = titleDeedIds.get(zoning.titleDeedNumber);

    if (!titleDeedId) {
      throw new Error(`Missing seeded title deed: ${zoning.titleDeedNumber}`);
    }

    await prisma.zoningInfo.upsert({
      where: { titleDeedId },
      create: {
        titleDeedId,
        zoneType: zoning.zoneType,
        notes: zoning.notes,
        restrictions: zoning.restrictions,
      },
      update: {
        zoneType: zoning.zoneType,
        notes: zoning.notes,
        restrictions: zoning.restrictions,
      },
    });
  }
}
