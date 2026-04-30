import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const explicitNext = searchParams.get('next');

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  // we'll decide the destination after we know whether the user
  // has finished onboarding. start with a placeholder; we override
  // before returning. cookies still need a response object now so
  // they can be attached during exchangeCodeForSession.
  const response = NextResponse.redirect(`${origin}/chat`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.headers
            .get('cookie')
            ?.split(';')
            .map((c) => {
              const [name, ...rest] = c.trim().split('=');
              return { name, value: rest.join('=') };
            }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[callback] exchange error:', error);
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(error.message)}`
    );
  }

  // if the caller passed an explicit ?next=, honor it. otherwise
  // route returning users (onboarded_at IS NOT NULL) to /chat and
  // brand-new users to /onboarding.
  let destination = explicitNext;
  if (!destination) {
    const userId = sessionData.user?.id;
    destination = '/onboarding';
    if (userId) {
      const { data: company } = await supabase
        .from('user_companies')
        .select('onboarded_at')
        .eq('id', userId)
        .maybeSingle();
      if (company?.onboarded_at) {
        destination = '/chat';
      }
    }
  }

  // rebuild the redirect with the resolved destination, carrying
  // the cookies we already set on `response`.
  const finalResponse = NextResponse.redirect(`${origin}${destination}`);
  response.cookies.getAll().forEach((c) => {
    finalResponse.cookies.set(c.name, c.value, c);
  });
  return finalResponse;
}