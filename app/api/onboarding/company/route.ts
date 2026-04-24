import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  const { name, description } = await request.json();
  if (!name || !description) {
    return NextResponse.json({ error: 'name and description required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_companies')
    .upsert({
      id: user.id,
      company_name: name,
      company_description: description,
      onboarded_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}