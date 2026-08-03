const HEADER_RE =
  /Account Statement for (\S+)\s*\([^)]*\)\s*since\s*(\d{1,2}\/\d{1,2}\/\d{2})\s*through\s*(\d{1,2}\/\d{1,2}\/\d{2})/;

export interface StatementHeader {
  accountMask: string;
  periodStart: string; // as printed, M/D/YY
  periodEnd: string;
}

/** Parses the statement's first line, e.g.
 * "Account Statement for *****237SCHW (Individual) since 7/27/26 through 7/27/26" */
export function parseStatementHeader(text: string): StatementHeader | null {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const match = HEADER_RE.exec(firstLine);
  if (!match) return null;
  const [, accountMask, periodStart, periodEnd] = match;
  return { accountMask, periodStart, periodEnd };
}
