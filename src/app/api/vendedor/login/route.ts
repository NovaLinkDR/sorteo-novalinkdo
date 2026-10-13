import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, signVendorSession, VENDOR_COOKIE } from "@/lib/auth";
import { getVendorByCode } from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim().toUpperCase();
  const password = String(body.password || "");

  const vendor = await getVendorByCode(code);
  if (!vendor || !verifyPassword(password, vendor.password_hash)) {
    return NextResponse.json(
      { error: "Código o contraseña incorrectos" },
      { status: 401 }
    );
  }
  if (!vendor.active) {
    return NextResponse.json(
      { error: "Este vendedor está inactivo" },
      { status: 403 }
    );
  }

  const res = NextResponse.json({ ok: true, vendor: { name: vendor.name, code: vendor.code } });
  res.cookies.set(VENDOR_COOKIE, signVendorSession(vendor.code), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
