import { parseMoney } from "./sanitize";
import type { Section } from "./split";

/**
 * "Account Summary" is just label,value pairs with no real header row --
 * the first pair (typically "Net Liquidating Value") lands in
 * `section.header` instead of `section.rows` since splitSections()
 * generically treats the row right after a section label as a header. Both
 * have to be searched here.
 */
export function parseNetLiquidatingValue(section: Section): number | null {
  const allRows = [section.header, ...section.rows];
  for (const row of allRows) {
    if (row[0]?.trim() === "Net Liquidating Value") {
      return parseMoney(row[1]);
    }
  }
  return null;
}
