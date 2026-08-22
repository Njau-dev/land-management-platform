import type {
  AvailabilityStatus,
  LoanLienStatus,
  LoanLienType,
  ZoneType,
} from "../../../generated/prisma/client.js";

export interface LandTitleDeedDto {
  titleDeedNumber: string;
  ownerName: string;
  location: string;
  size: string;
  availabilityStatus: AvailabilityStatus;
  landRate: string;
}

export interface LandZoningDto {
  zoneType: ZoneType;
  notes: string | null;
  restrictions: string | null;
}

export interface LandLoanLienDto {
  type: LoanLienType;
  lender: string;
  amount: string;
  status: LoanLienStatus;
  dueDate: string | null;
  notes: string | null;
}

export interface LandOwnershipHistoryDto {
  ownerName: string;
  transferDate: string;
  notes: string | null;
}

export interface LandSearchResult {
  titleDeed: LandTitleDeedDto;
  zoning: LandZoningDto | null;
  loansLiens: LandLoanLienDto[];
  ownershipHistory: LandOwnershipHistoryDto[];
  searchedAt: string;
}

export interface LandLookup {
  titleDeedId: string;
  result: LandSearchResult;
}
