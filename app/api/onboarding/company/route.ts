import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('[onboarding] user:', user?.id, 'userError:', userError);

  if (!user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  const { name, description } = await request.json();
  console.log('[onboarding] payload:', { name, description });

  if (!name || !description) {
    return NextResponse.json({ error: 'name and description required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('user_companies')
    .upsert({
      id: user.id,
      company_name: name,
      company_description: description,
      onboarded_at: new Date().toISOString(),
    })
    .select();

  console.log('[onboarding] upsert result — data:', data, 'error:', error);

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data });
}