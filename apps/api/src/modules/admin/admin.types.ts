export interface PaginationInput {
  page: number;
  limit: number;
}

export interface PaginationMeta extends PaginationInput {
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export function paginationMeta(
  pagination: PaginationInput,
  total: number,
): PaginationMeta {
  return {
    ...pagination,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
  };
}
