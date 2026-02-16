import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Verify the caller is authenticated and is an admin
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

  // Check admin role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse request body
  const body = await request.json();
  const { email, full_name, role } = body as {
    email?: string;
    full_name?: string;
    role?: string;
  };

  if (!email || !full_name || !role) {
    return NextResponse.json({ error: 'Missing required fields: email, full_name, role' }, { status: 400 });
  }

  if (!['admin', 'manager', 'staff'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Use service role client (server-only) to invite the user
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role },
    redirectTo: `${appUrl}/auth/callback`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}
