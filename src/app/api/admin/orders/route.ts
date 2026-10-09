import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/api-auth";
import { listOrders, getOrderTickets, Order } from "@/lib/data";

export const dynamic = "force-dynamic";

function stripReceipt(o: Order) {
  const { receipt_data, ...rest } = o;
  return rest;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const rifaId = req.nextUrl.searchParams.get("rifaId");
  const status = req.nextUrl.searchParams.get("status");

  let orders = rifaId ? await listOrders(Number(rifaId)) : await listOrders();
  if (status) orders = orders.filter((o) => o.status === status);

  const withTickets = await Promise.all(
    orders.map(async (o) => ({
      ...stripReceipt(o),
      tickets: (await getOrderTickets(o.id)).map((t) => t.number),
    }))
  );

  return NextResponse.json({ orders: withTickets });
}
