import Papa from "papaparse";

export interface Section {
  name: string;
  header: string[];
  rows: string[][];
}

// The statement's own section labels, each on a lone row by itself. Matched
// by label text (not position) since sections vary in which are present and
// in what order across broker export versions.
const KNOWN_SECTIONS: { name: string; match: (label: string) => boolean }[] = [
  { name: "Cash Balance", match: (l) => l === "Cash Balance" },
  { name: "Futures Statements", match: (l) => l === "Futures Statements" },
  { name: "Forex Statements", match: (l) => l === "Forex Statements" },
  { name: "Crypto Statements", match: (l) => /^Crypto\b.*Statements$/i.test(l) },
  { name: "Account Order History", match: (l) => l === "Account Order History" },
  { name: "Account Trade History", match: (l) => l === "Account Trade History" },
  { name: "Profits and Losses", match: (l) => l === "Profits and Losses" },
  { name: "Account Summary", match: (l) => l === "Account Summary" },
];

function matchSectionLabel(row: string[]): string | null {
  const nonEmpty = row.map((c) => c.trim()).filter((c) => c !== "");
  if (nonEmpty.length !== 1) return null;
  for (const section of KNOWN_SECTIONS) {
    if (section.match(nonEmpty[0])) return section.name;
  }
  return null;
}

/**
 * Splits a thinkorswim/Schwab account statement export into its labeled
 * sections. Only recognizes the known section labels above -- unrelated
 * single-cell rows (a stray "Total Cash **************" footer, the leading
 * "Account Statement for ..." line) are treated as noise and dropped, not
 * mistaken for a new section.
 */
export function splitSections(text: string): Section[] {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: false });
  const rows = parsed.data;

  const sections: Section[] = [];
  let current: Section | null = null;
  let awaitingHeader = false;

  for (const row of rows) {
    const sectionName = matchSectionLabel(row);
    if (sectionName) {
      if (current) sections.push(current);
      current = { name: sectionName, header: [], rows: [] };
      awaitingHeader = true;
      continue;
    }

    const isBlank = row.every((c) => c.trim() === "");
    if (isBlank) {
      // A blank line always ends the active section. Order History's
      // continuation rows (RE #, TRG BY #, OCO #) also have exactly one
      // non-empty cell, so "single-cell row" can't be the noise signal --
      // only a blank line reliably marks a section boundary.
      if (current) sections.push(current);
      current = null;
      awaitingHeader = false;
      continue;
    }

    if (!current) continue; // stray row outside any active section

    if (awaitingHeader) {
      current.header = row;
      awaitingHeader = false;
      continue;
    }

    current.rows.push(row);
  }

  if (current) sections.push(current);
  return sections;
}

export function getSection(sections: Section[], name: string): Section | undefined {
  return sections.find((s) => s.name === name);
}
