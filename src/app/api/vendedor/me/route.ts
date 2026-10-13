import { NextRequest, NextResponse } from "next/server";
import { getVendorCode } from "@/lib/api-auth";
import { getVendorByCode } from "@/lib/data";

export async function GET(req: NextRequest) {
  const code = getVendorCode(req);
  if (!code) {
    return NextResponse.json({ authenticated: false });
  }
  const vendor = await getVendorByCode(code);
  if (!vendor || !vendor.active) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    vendor: { name: vendor.name, code: vendor.code },
  });
}
