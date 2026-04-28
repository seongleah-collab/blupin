import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'not authenticated' }), { status: 401 });
  }

  const [convoRes, messagesRes] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('conversation_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ]);

  if (convoRes.error) {
    return new Response(JSON.stringify({ error: convoRes.error.message }), { status: 404 });
  }
  if (messagesRes.error) {
    return new Response(JSON.stringify({ error: messagesRes.error.message }), { status: 500 });
  }

  return Response.json({
    conversation: convoRes.data,
    messages: messagesRes.data ?? [],
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'not authenticated' }), { status: 401 });
  }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return Response.json({ ok: true });
}
