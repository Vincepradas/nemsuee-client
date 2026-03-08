export function usePagination<T>(rows: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { totalPages, safePage, pagedRows };
}
