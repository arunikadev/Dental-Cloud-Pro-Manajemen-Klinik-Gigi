import { NextRequest, NextResponse } from "next/server";

// ─── Konfigurasi RBAC ────────────────────────────────────────────────────────
// Key = prefix route, Value = role yang diizinkan
const ROLE_ROUTES: Record<string, string[]> = {
  "/medical-records": ["admin", "doctor"],
  "/inventory":       ["admin", "doctor"],
  "/billing":         ["admin", "cashier"],
  "/users":           ["admin"],
};

// Route yang bebas diakses siapa saja (tanpa login)
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

// ─── Middleware ───────────────────────────────────────────────────────────────
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Biarkan asset & API Next.js lewat
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const role = req.cookies.get("user_role")?.value ?? null;
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // 1. Sudah login & buka halaman auth (/login, /register) → redirect ke /dashboard
  if (role && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 2. Cek RBAC hanya jika cookie role sudah ada
  //    Jika cookie belum ada, biarkan lewat — client-side (role-context) yang handle
  if (role) {
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        // Role tidak punya akses → redirect ke dashboard
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

// Terapkan middleware ke semua route kecuali static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
