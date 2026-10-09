import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/api-auth";
import { listOrders, getOrderTickets } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const rifaId = req.nextUrl.searchParams.get("rifaId");
  const status = req.nextUrl.searchParams.get("status");

  let orders = rifaId ? listOrders(Number(rifaId)) : listOrders();
  if (status) orders = orders.filter((o) => o.status === status);

  const withTickets = orders.map((o) => ({
    ...o,
    tickets: getOrderTickets(o.id).map((t) => t.number),
  }));

  return NextResponse.json({ orders: withTickets });
}
