import { NextRequest, NextResponse } from "next/server";
import { verifySession, AUTH_COOKIE } from "@/lib/auth";

export function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  return verifySession(token);
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
