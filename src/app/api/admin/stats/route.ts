import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/api-auth";
import { listRifas, getRifaStats, listOrders } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const rifas = listRifas(false);
  const total = {
    revenueCents: 0,
    revenueConfirmedCents: 0,
    ticketsSold: 0,
    ordersCount: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
  };

  const rifaRows = rifas.map((r) => {
    const s = getRifaStats(r.id);
    total.revenueCents += s.revenueCents;
    total.revenueConfirmedCents += s.revenueConfirmedCents;
    total.ticketsSold += s.ticketsSold;
    total.ordersCount += s.ordersCount;
    total.pendingOrders += s.pendingOrders;
    total.confirmedOrders += s.confirmedOrders;
    return { ...r, stats: s };
  });

  const recentOrders = listOrders().slice(0, 10);

  return NextResponse.json({ rifas: rifaRows, total, recentOrders });
}
