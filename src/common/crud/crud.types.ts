export type SortDir = 1 | -1;
export type SortOrder = 'asc' | 'desc';

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    sortBy?: string;
    sortOrder?: SortOrder;
    query?: string;
  };
};

export type CrudListQuery = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: SortOrder;
  query?: string;
};

export type CrudFindAllQuery = CrudListQuery & Record<string, unknown>;
