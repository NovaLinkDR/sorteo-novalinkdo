import { NextRequest, NextResponse } from "next/server";
import { getVendorCode } from "@/lib/api-auth";
import { getVendorByCode, getVendorStats, getVendorRecentOrders } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = getVendorCode(req);
  if (!code) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const vendor = await getVendorByCode(code);
  if (!vendor) {
    return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });
  }
  const stats = await getVendorStats(code);
  const recent = await getVendorRecentOrders(code, 20);
  return NextResponse.json({
    vendor: { name: vendor.name, code: vendor.code },
    stats,
    recentOrders: recent,
    referralUrl: `https://sorteo.novalinkdo.com/rifa/rifa-10-playstation-5?ref=${code}`,
  });
}
