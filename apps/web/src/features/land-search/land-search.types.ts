export type AvailabilityStatus = "AVAILABLE" | "SOLD" | "UNDER_TRANSACTION";
export type ZoneType =
  | "RESIDENTIAL"
  | "COMMERCIAL"
  | "INDUSTRIAL"
  | "AGRICULTURAL"
  | "MIXED_USE"
  | "OTHER";
export type LoanLienType = "LOAN" | "LIEN" | "OTHER";
export type LoanLienStatus = "CLEAR" | "ACTIVE" | "OVERDUE";

export interface LandSearchResult {
  titleDeed: {
    titleDeedNumber: string;
    ownerName: string;
    location: string;
    size: string;
    availabilityStatus: AvailabilityStatus;
    landRate: string;
  };
  zoning: {
    zoneType: ZoneType;
    notes: string | null;
    restrictions: string | null;
  } | null;
  loansLiens: Array<{
    type: LoanLienType;
    lender: string;
    amount: string;
    status: LoanLienStatus;
    dueDate: string | null;
    notes: string | null;
  }>;
  ownershipHistory: Array<{
    ownerName: string;
    transferDate: string;
    notes: string | null;
  }>;
  searchedAt: string;
}

export type LandSearchStatus = "idle" | "loading" | "success" | "error";
