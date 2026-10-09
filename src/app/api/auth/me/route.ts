import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: isAdmin(req) });
}
