import {
  AvailabilityStatus,
  type PrismaClient,
} from "../../generated/prisma/client.js";

const titleDeeds = [
  {
    titleDeedNumber: "SYNTH/NRB/KAS/001/2026",
    ownerName: "Amina Wanjiku",
    location: "Kasarani, Nairobi",
    size: "0.1250",
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    landRate: "8500000.00",
  },
  {
    titleDeedNumber: "SYNTH/KBU/RUI/002/2026",
    ownerName: "Brian Mwangi",
    location: "Ruiru, Kiambu",
    size: "0.2500",
    availabilityStatus: AvailabilityStatus.UNDER_TRANSACTION,
    landRate: "6200000.00",
  },
  {
    titleDeedNumber: "SYNTH/KJD/KIT/003/2026",
    ownerName: "Faith Njeri",
    location: "Kitengela, Kajiado",
    size: "0.5000",
    availabilityStatus: AvailabilityStatus.SOLD,
    landRate: "4800000.00",
  },
  {
    titleDeedNumber: "SYNTH/NKR/NAI/004/2026",
    ownerName: "David Kiptoo",
    location: "Naivasha, Nakuru",
    size: "2.7500",
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    landRate: "1800000.00",
  },
  {
    titleDeedNumber: "SYNTH/MKS/ATH/005/2026",
    ownerName: "Grace Mutua",
    location: "Athi River, Machakos",
    size: "1.2000",
    availabilityStatus: AvailabilityStatus.UNDER_TRANSACTION,
    landRate: "3500000.00",
  },
  {
    titleDeedNumber: "SYNTH/NRB/EMB/006/2026",
    ownerName: "John Otieno",
    location: "Embakasi, Nairobi",
    size: "0.0800",
    availabilityStatus: AvailabilityStatus.SOLD,
    landRate: "12000000.00",
  },
  {
    titleDeedNumber: "SYNTH/KBU/LIM/007/2026",
    ownerName: "Lucy Nyambura",
    location: "Limuru, Kiambu",
    size: "3.5000",
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    landRate: "1400000.00",
  },
  {
    titleDeedNumber: "SYNTH/KJD/NGO/008/2026",
    ownerName: "Peter Kamau",
    location: "Ngong, Kajiado",
    size: "0.3750",
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    landRate: "5500000.00",
  },
  {
    titleDeedNumber: "SYNTH/NKR/GIL/009/2026",
    ownerName: "Ruth Chebet",
    location: "Gilgil, Nakuru",
    size: "5.0000",
    availabilityStatus: AvailabilityStatus.SOLD,
    landRate: "950000.00",
  },
  {
    titleDeedNumber: "SYNTH/MKS/MUA/010/2026",
    ownerName: "Samuel Musyoka",
    location: "Mua Hills, Machakos",
    size: "0.7500",
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    landRate: "2600000.00",
  },
] as const;

export type SeededTitleDeedIds = ReadonlyMap<string, string>;

export async function seedTitleDeeds(
  prisma: PrismaClient,
): Promise<SeededTitleDeedIds> {
  const titleDeedIds = new Map<string, string>();

  for (const titleDeed of titleDeeds) {
    const result = await prisma.titleDeed.upsert({
      where: { titleDeedNumber: titleDeed.titleDeedNumber },
      create: titleDeed,
      update: {
        ownerName: titleDeed.ownerName,
        location: titleDeed.location,
        size: titleDeed.size,
        availabilityStatus: titleDeed.availabilityStatus,
        landRate: titleDeed.landRate,
      },
      select: { id: true },
    });

    titleDeedIds.set(titleDeed.titleDeedNumber, result.id);
  }

  return titleDeedIds;
}
