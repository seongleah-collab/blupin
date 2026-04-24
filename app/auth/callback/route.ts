import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  // build the response first so we can attach cookies to it
  const response = NextResponse.redirect(`${origin}${next}`);

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[callback] exchange error:', error);
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(error.message)}`
    );
  }

  return response;
}