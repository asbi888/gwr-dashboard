/**
 * Hardcoded supplier master list with standard names and aliases.
 * When a user types an alias, the autocomplete resolves it to the standard name.
 *
 * Source: GWR Master Data (Excel) — 3 suppliers as of Feb 2026.
 * To add new suppliers, simply add entries to SUPPLIER_MASTER below.
 */

export interface SupplierEntry {
  standardName: string;
  aliases: string[];
}

export const SUPPLIER_MASTER: SupplierEntry[] = [
  {
    standardName: 'Phoenix Beverages Limited',
    aliases: ['Phoenix', 'Phenix', 'Phoenix Bev'],
  },
  {
    standardName: 'Les Caves Du Roi Ltd',
    aliases: ['Les Caves', 'Lescave', 'Caves Du Roi'],
  },
  {
    standardName: 'K. Nepaulsing & Co Ltd',
    aliases: ['K Nepaulsing', 'Nepaul', 'Nepal', 'K. Nepaulsing', 'Nepaulsing'],
  },
];

/**
 * Build a flat list of all known supplier standard names.
 */
export function getStandardSupplierNames(): string[] {
  return SUPPLIER_MASTER.map((s) => s.standardName);
}

/**
 * Given user input, find matching suppliers (by standard name or alias).
 * Returns items with { display, standardName } so the autocomplete can
 * show what the user typed/matched while resolving to the standard name.
 */
export interface SupplierMatch {
  /** Text shown in the dropdown */
  display: string;
  /** The standardised name that will be saved */
  standardName: string;
}

export function findSupplierMatches(
  query: string,
  historicalNames: string[],
): SupplierMatch[] {
  const q = query.toLowerCase().trim();
  const seen = new Set<string>();
  const results: SupplierMatch[] = [];

  // 1. Match from master list (standard names + aliases)
  for (const entry of SUPPLIER_MASTER) {
    const stdLower = entry.standardName.toLowerCase();
    const nameMatches = !q || stdLower.includes(q);
    const aliasMatch = entry.aliases.find((a) => a.toLowerCase().includes(q));

    if (nameMatches || aliasMatch) {
      const display = aliasMatch && !nameMatches
        ? `${entry.standardName}  (${aliasMatch})`
        : entry.standardName;
      if (!seen.has(entry.standardName)) {
        results.push({ display, standardName: entry.standardName });
        seen.add(entry.standardName);
      }
    }
  }

  // 2. Match from historical names (already in DB) that aren't in the master list
  for (const name of historicalNames) {
    if (!name || seen.has(name)) continue;
    if (!q || name.toLowerCase().includes(q)) {
      results.push({ display: name, standardName: name });
      seen.add(name);
    }
  }

  return results;
}

/**
 * Try to resolve a typed name to its standard form.
 * If the user typed an alias (exact match, case-insensitive), resolve it.
 * Otherwise return the name as-is (allows free-text for new suppliers).
 */
export function resolveSupplierName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  for (const entry of SUPPLIER_MASTER) {
    // Exact match on standard name
    if (entry.standardName.toLowerCase() === lower) return entry.standardName;
    // Exact match on an alias
    for (const alias of entry.aliases) {
      if (alias.toLowerCase() === lower) return entry.standardName;
    }
  }

  // No match — return as typed (new supplier)
  return trimmed;
}
