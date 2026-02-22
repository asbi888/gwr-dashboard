#!/usr/bin/env python3
"""
Extract General Ledger from Odoo v19
Raw GL data for P&L, Balance Sheet analysis in Power BI
Saves to: OdooCsvFiles/general_ledger.csv
"""
import xmlrpc.client
import csv
import os
import getpass

# Your GWR demo credentials
URL = 'https://guttywaverunner.odoo.com'
DB = 'guttywaverunner'
USERNAME = 'guttywaverunnerltd@gmail.com'

# Output folder
OUTPUT_FOLDER = r'C:\Users\lab\Desktop\GWR-ETL\GWR-WebAPP\gwr-dashboard\OdooCsvFiles'
OUTPUT_FILE = os.path.join(OUTPUT_FOLDER, 'general_ledger.csv')
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

print("=" * 60)
print("GENERAL LEDGER EXTRACTION")
print("=" * 60)
print()
print(f"Output: {OUTPUT_FILE}")
print()
print("This extracts ALL journal entries for:")
print("  - P&L analysis in Power BI")
print("  - Balance Sheet")
print("  - Custom financial reports")
print()

PASSWORD = getpass.getpass(f"Enter password for {USERNAME}: ")
print()

try:
    # Connect
    print("Step 1/3: Connecting to Odoo...")
    common = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/common')
    uid = common.authenticate(DB, USERNAME, PASSWORD, {})

    if not uid:
        print("Authentication failed!")
        input("Press Enter to exit...")
        exit(1)

    print(f"Connected (User ID: {uid})")
    print()

    # Extract journal entries with pagination (no hard limit)
    print("Step 2/3: Extracting journal entries...")
    models = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/object')

    # Get posted entries only
    domain = [('parent_state', '=', 'posted')]

    fields = [
        'move_id',
        'date',
        'account_id',
        'partner_id',
        'name',               # Description
        'ref',                # Reference
        'debit',
        'credit',
        'balance',
        'journal_id',
        'company_id',
    ]

    # First get total count
    total_count = models.execute_kw(
        DB, uid, PASSWORD,
        'account.move.line', 'search_count',
        [domain]
    )
    print(f"   Total posted journal entries: {total_count}")

    # Fetch ALL entries in batches (no limit cap)
    BATCH_SIZE = 5000
    entries = []
    offset = 0

    while offset < total_count:
        batch = models.execute_kw(
            DB, uid, PASSWORD,
            'account.move.line', 'search_read',
            [domain],
            {'fields': fields, 'limit': BATCH_SIZE, 'offset': offset, 'order': 'date asc'}
        )
        entries.extend(batch)
        offset += len(batch)
        print(f"   Fetched {len(entries)} / {total_count} entries...")

        # Safety: if batch returned 0 rows, stop
        if len(batch) == 0:
            break

    print(f"Found {len(entries)} journal entries")
    print()

    if not entries:
        print("No journal entries found!")
        input("Press Enter to exit...")
        exit(0)

    # Show sample
    print("Sample entry:")
    sample = entries[0]
    account = sample.get('account_id', ['', 'N/A'])
    print(f"  Date: {sample.get('date')}")
    print(f"  Account: {account[1] if isinstance(account, list) else 'N/A'}")
    print(f"  Debit: {sample.get('debit')}")
    print(f"  Credit: {sample.get('credit')}")
    print()

    # Prepare CSV data
    print("Step 3/3: Preparing data for CSV...")

    csv_data = []
    for entry in entries:
        # Handle many2one fields
        move_id = entry.get('move_id', [None, ''])
        move_number = move_id[1] if isinstance(move_id, list) else ''
        move_id_num = move_id[0] if isinstance(move_id, list) else None

        account_id = entry.get('account_id', [None, ''])
        account_name = account_id[1] if isinstance(account_id, list) else ''
        account_id_num = account_id[0] if isinstance(account_id, list) else None

        partner_id = entry.get('partner_id', [None, ''])
        partner_name = partner_id[1] if isinstance(partner_id, list) else ''
        partner_id_num = partner_id[0] if isinstance(partner_id, list) else None

        journal_id = entry.get('journal_id', [None, ''])
        journal_name = journal_id[1] if isinstance(journal_id, list) else ''

        csv_data.append({
            'entry_id': entry.get('id'),
            'move_id': move_id_num,
            'move_number': move_number,
            'date': entry.get('date', ''),
            'account_id': account_id_num,
            'account_name': account_name,
            'partner_id': partner_id_num,
            'partner_name': partner_name,
            'description': entry.get('name', ''),
            'reference': entry.get('ref', ''),
            'journal': journal_name,
            'debit': entry.get('debit', 0),
            'credit': entry.get('credit', 0),
            'balance': entry.get('balance', 0)
        })

    print(f"Prepared {len(csv_data)} rows")
    print()

    # Write CSV
    print("Writing CSV file...")

    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'entry_id', 'move_id', 'move_number', 'date',
            'account_id', 'account_name',
            'partner_id', 'partner_name',
            'description', 'reference', 'journal',
            'debit', 'credit', 'balance'
        ]

        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(csv_data)

    # Summary
    if os.path.exists(OUTPUT_FILE):
        file_size = os.path.getsize(OUTPUT_FILE)

        # Calculate stats
        total_debit = sum(row['debit'] for row in csv_data)
        total_credit = sum(row['credit'] for row in csv_data)

        # Date range
        dates = [row['date'] for row in csv_data if row['date']]
        min_date = min(dates) if dates else 'N/A'
        max_date = max(dates) if dates else 'N/A'

        # Unique accounts
        unique_accounts = set(row['account_id'] for row in csv_data if row['account_id'])

        print(f"CSV file created successfully!")
        print()
        print("=" * 60)
        print("SUCCESS!")
        print("=" * 60)
        print()
        print(f"Location: {OUTPUT_FILE}")
        print(f"File size: {file_size:,} bytes")
        print()
        print("Statistics:")
        print(f"   Total entries: {len(csv_data)}")
        print(f"   Date range: {min_date} to {max_date}")
        print(f"   Unique accounts: {len(unique_accounts)}")
        print(f"   Total debits: {total_debit:,.2f}")
        print(f"   Total credits: {total_credit:,.2f}")
        print(f"   Difference: {abs(total_debit - total_credit):,.2f}")
        print()
        print("Next step: run the import script:")
        print(f"   node scripts/import-general-ledger.mjs")
        print()

except Exception as e:
    print()
    print("=" * 60)
    print("ERROR OCCURRED")
    print("=" * 60)
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()

print()
input("Press Enter to close...")
