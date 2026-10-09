import { NextResponse } from "next/server";
import { listRifas, getRifaStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const list = await listRifas(true);
  const rifas = await Promise.all(
    list.map(async (r) => ({ ...r, stats: await getRifaStats(r.id) }))
  );
  return NextResponse.json({ rifas });
}
