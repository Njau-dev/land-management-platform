import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { LandLookup } from "./land.types.js";

const landLookupSelect = {
  id: true,
  titleDeedNumber: true,
  ownerName: true,
  location: true,
  size: true,
  availabilityStatus: true,
  landRate: true,
  zoningInfo: {
    select: {
      zoneType: true,
      notes: true,
      restrictions: true,
    },
  },
  loansLiens: {
    select: {
      type: true,
      lender: true,
      amount: true,
      status: true,
      dueDate: true,
      notes: true,
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  },
  ownershipHistory: {
    select: {
      ownerName: true,
      transferDate: true,
      notes: true,
    },
    orderBy: { transferDate: "desc" },
  },
} satisfies Prisma.TitleDeedSelect;

export async function lookupLandByTitleDeedNumber(
  titleDeedNumber: string,
): Promise<LandLookup | null> {
  const titleDeed = await prisma.titleDeed.findUnique({
    where: { titleDeedNumber },
    select: landLookupSelect,
  });

  if (!titleDeed) {
    return null;
  }

  return {
    titleDeedId: titleDeed.id,
    result: {
      titleDeed: {
        titleDeedNumber: titleDeed.titleDeedNumber,
        ownerName: titleDeed.ownerName,
        location: titleDeed.location,
        size: titleDeed.size.toFixed(4),
        availabilityStatus: titleDeed.availabilityStatus,
        landRate: titleDeed.landRate.toFixed(2),
      },
      zoning: titleDeed.zoningInfo,
      loansLiens: titleDeed.loansLiens.map((record) => ({
        type: record.type,
        lender: record.lender,
        amount: record.amount.toFixed(2),
        status: record.status,
        dueDate: record.dueDate?.toISOString() ?? null,
        notes: record.notes,
      })),
      ownershipHistory: titleDeed.ownershipHistory.map((record) => ({
        ownerName: record.ownerName,
        transferDate: record.transferDate.toISOString(),
        notes: record.notes,
      })),
      searchedAt: new Date().toISOString(),
    },
  };
}

export async function recordLandSearch(input: {
  userId: string;
  titleDeedId: string | null;
  searchedTitleNumber: string;
}): Promise<void> {
  try {
    await prisma.searchLog.create({ data: input });
  } catch (error) {
    console.error("Failed to record land search", {
      userId: input.userId,
      searchedTitleNumber: input.searchedTitleNumber,
      error,
    });
  }
}
