import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

// Allowed tables that can be mutated through this route
const ALLOWED_TABLES = [
  'gwr_expenses',
  'gwr_suppliers',
  'gwr_revenue',
  'gwr_revenue_lines',
  'gwr_food_usage',
  'gwr_drinks_usage',
  'gwr_wr_revenue',
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];
type Action = 'insert' | 'update' | 'delete';

interface MutationRequest {
  action: Action;
  table: AllowedTable;
  data?: Record<string, unknown>;
  match?: Record<string, unknown>; // e.g. { expense_id: '...' } for update/delete
}

export async function POST(request: NextRequest) {
  // 1. Verify the caller is authenticated
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Check the user has an active role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', session.user.id)
    .single();

  if (!profile || !profile.is_active || !['admin', 'manager', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Parse and validate request body
  let body: MutationRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, table, data, match } = body;

  if (!action || !table) {
    return NextResponse.json({ error: 'Missing required fields: action, table' }, { status: 400 });
  }

  if (!['insert', 'update', 'delete'].includes(action)) {
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  }

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: `Table not allowed: ${table}` }, { status: 400 });
  }

  if (action === 'insert' && !data) {
    return NextResponse.json({ error: 'Insert requires data' }, { status: 400 });
  }

  if ((action === 'update' || action === 'delete') && !match) {
    return NextResponse.json({ error: `${action} requires match criteria` }, { status: 400 });
  }

  // 4. Create service role client (bypasses RLS)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // 5. Execute the mutation
    if (action === 'insert') {
      const { data: result, error } = await adminClient
        .from(table)
        .insert(data!)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: result });
    }

    if (action === 'update') {
      let query = adminClient.from(table).update(data!);
      // Apply all match conditions
      for (const [key, value] of Object.entries(match!)) {
        query = query.eq(key, value as string | number);
      }
      const { data: result, error } = await query.select().single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ data: result });
    }

    if (action === 'delete') {
      let query = adminClient.from(table).delete({ count: 'exact' });
      for (const [key, value] of Object.entries(match!)) {
        query = query.eq(key, value as string | number);
      }
      const { error, count } = await query;

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (count === 0) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      return NextResponse.json({ deleted: count });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
