import { matchB2BHost } from "@/lib/b2b/tenants"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const tenant = matchB2BHost(request.headers.get("host"))

  if (tenant) {
    if (pathname.startsWith(`/b2b/${tenant.id}`)) {
      return NextResponse.next()
    }
    if (pathname === "/help") {
      return NextResponse.rewrite(new URL(`/b2b/${tenant.id}/help`, request.url))
    }
    return NextResponse.rewrite(new URL(`/b2b/${tenant.id}`, request.url))
  }

  if (pathname === "/b2b" || pathname.startsWith("/b2b/")) {
    const host = request.headers.get("host")?.split(":")[0] ?? ""
    const local = host === "localhost" || host === "127.0.0.1"
    if (!local) {
      return NextResponse.rewrite(new URL("/_not-found", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\..*).*)"],
}
