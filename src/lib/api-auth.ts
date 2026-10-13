import { NextRequest, NextResponse } from "next/server";
import {
  verifySession,
  verifyVendorSession,
  AUTH_COOKIE,
  VENDOR_COOKIE,
} from "@/lib/auth";

export function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  return verifySession(token);
}

export function getVendorCode(req: NextRequest): string | null {
  const token = req.cookies.get(VENDOR_COOKIE)?.value;
  return verifyVendorSession(token);
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
