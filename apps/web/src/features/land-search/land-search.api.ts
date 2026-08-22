import { apiBlobRequest, apiRequest } from "@/lib/api-client";

import type { LandSearchResult } from "./land-search.types";

function landPath(titleDeedNumber: string): string {
  return `/land/search/${encodeURIComponent(titleDeedNumber)}`;
}

export function searchLandRequest(
  titleDeedNumber: string,
): Promise<LandSearchResult> {
  return apiRequest<LandSearchResult>(landPath(titleDeedNumber), {
    method: "GET",
  });
}

export function downloadLandReportRequest(titleDeedNumber: string) {
  return apiBlobRequest(`${landPath(titleDeedNumber)}/report`, {
    method: "GET",
  });
}
