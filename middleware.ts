import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (path.startsWith("/merchant")) {
    if (!user) return NextResponse.redirect(new URL("/login?next=/merchant", request.url))
    const { data: profile } = await supabase.from("profile").select("role").eq("id", user.id).single()
    if (profile?.role !== "merchant") return NextResponse.redirect(new URL("/", request.url))
  }
  if ((path.startsWith("/reserve") || path.startsWith("/reservations")) && !user) {
    return NextResponse.redirect(new URL(`/login?next=${path}`, request.url))
  }
  return response
}

export const config = { matcher: ["/merchant/:path*", "/reserve/:path*", "/reservations/:path*"] }
