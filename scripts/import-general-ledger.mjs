/**
 * One-time import: OdooCsvFiles/general_ledger.csv → Supabase gwr_general_ledger
 *
 * Usage:  node scripts/import-general-ledger.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '..', 'OdooCsvFiles', 'general_ledger.csv');

const sb = createClient(
  'https://jexxgrtbflintytzjkyu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHhncnRiZmxpbnR5dHpqa3l1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA3NzMwNCwiZXhwIjoyMDg2NjUzMzA0fQ.vVL4GzZzPYXofsgR_Ttpj9MHsbJpwkrQ-YMAtRbvBAw'
);

// ── CSV parser that handles quoted fields with commas ──
function parseCSV(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  // Skip BOM if present
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  while (i < len) {
    const fields = [];
    while (i < len) {
      if (text[i] === '"') {
        // Quoted field
        i++; // skip opening quote
        let value = '';
        while (i < len) {
          if (text[i] === '"') {
            if (i + 1 < len && text[i + 1] === '"') {
              value += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            value += text[i];
            i++;
          }
        }
        fields.push(value);
      } else {
        // Unquoted field
        let value = '';
        while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          value += text[i];
          i++;
        }
        fields.push(value);
      }

      if (i < len && text[i] === ',') {
        i++; // skip comma, continue to next field
      } else {
        break; // end of line or end of file
      }
    }

    // Skip line endings
    if (i < len && text[i] === '\r') i++;
    if (i < len && text[i] === '\n') i++;

    if (fields.length > 1 || (fields.length === 1 && fields[0] !== '')) {
      rows.push(fields);
    }
  }
  return rows;
}

async function main() {
  console.log('Reading CSV...');
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(raw);

  // First row is header
  const header = rows[0];
  console.log(`Header: ${header.join(', ')}`);
  console.log(`Total rows (incl. header): ${rows.length}`);

  // Map column indices
  const col = {};
  header.forEach((h, idx) => { col[h.trim()] = idx; });

  const records = [];
  let skipped = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const accountId = row[col['account_id']]?.trim();

    // Skip grouping rows (empty account_id)
    if (!accountId) {
      skipped++;
      continue;
    }

    const dateVal = row[col['date']]?.trim();
    // Skip rows with invalid dates
    if (!dateVal || !/^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
      skipped++;
      continue;
    }

    const partnerId = row[col['partner_id']]?.trim();

    records.push({
      entry_id: parseInt(row[col['entry_id']], 10),
      move_id: parseInt(row[col['move_id']], 10),
      move_number: row[col['move_number']]?.trim() || '',
      date: dateVal,
      account_id: parseInt(accountId, 10),
      account_name: row[col['account_name']]?.trim() || '',
      partner_id: partnerId ? parseInt(partnerId, 10) : null,
      partner_name: row[col['partner_name']]?.trim() || null,
      description: row[col['description']]?.trim() || null,
      reference: row[col['reference']]?.trim() || null,
      journal: row[col['journal']]?.trim() || 'Unknown',
      debit: parseFloat(row[col['debit']]) || 0,
      credit: parseFloat(row[col['credit']]) || 0,
      balance: parseFloat(row[col['balance']]) || 0,
    });
  }

  console.log(`Valid records: ${records.length}`);
  console.log(`Skipped rows:  ${skipped}`);

  // Truncate existing data for clean re-import
  console.log('\nTruncating gwr_general_ledger...');
  const { error: truncErr } = await sb.from('gwr_general_ledger').delete().gte('id', 0);
  if (truncErr) {
    console.error('Truncate failed:', truncErr.message);
    process.exit(1);
  }

  // Bulk insert in batches
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await sb.from('gwr_general_ledger').insert(batch);
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted} / ${records.length}`);
  }

  console.log(`\nDone! ${inserted} rows imported into gwr_general_ledger.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
