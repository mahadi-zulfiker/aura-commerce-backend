export type PaginationOptions = {
  page?: number;
  limit?: number;
  maxLimit?: number;
};

export function parsePagination(
  pageRaw?: string | number,
  limitRaw?: string | number,
  options: PaginationOptions = {},
) {
  const fallbackPage = options.page ?? 1;
  const fallbackLimit = options.limit ?? 10;
  const maxLimit = options.maxLimit ?? 100;

  const pageParsed = Number(pageRaw);
  const limitParsed = Number(limitRaw);

  const page =
    Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : fallbackPage;
  const limit =
    Number.isFinite(limitParsed) && limitParsed > 0
      ? Math.min(limitParsed, maxLimit)
      : fallbackLimit;

  return { page, limit };
}
