import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import {
  listVendors,
  getVendorStats,
  getVendorByCode,
  createVendor,
  updateVendor,
  deleteVendor,
} from "@/lib/data";

export const dynamic = "force-dynamic";

function genCode(): string {
  return "V" + Math.floor(10000 + Math.random() * 90000).toString();
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const vendors = await listVendors();
  const withStats = await Promise.all(
    vendors.map(async (v) => {
      const { password_hash, ...safe } = v;
      return { ...safe, stats: await getVendorStats(v.code) };
    })
  );
  return NextResponse.json({ vendors: withStats });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const password = String(body.password || "");
  let code = String(body.code || "").trim().toUpperCase();

  if (!name || !password) {
    return NextResponse.json(
      { error: "Nombre y contraseña son obligatorios" },
      { status: 400 }
    );
  }
  if (!code) code = genCode();
  code = code.replace(/[^A-Z0-9_-]/g, "");

  const existing = await getVendorByCode(code);
  if (existing) {
    return NextResponse.json(
      { error: "Ese código ya está en uso" },
      { status: 409 }
    );
  }

  const vendor = await createVendor(name, code, hashPassword(password));
  const { password_hash, ...safe } = vendor;
  return NextResponse.json({ ok: true, vendor: safe });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const fields: {
    name?: string;
    code?: string;
    active?: boolean;
    password_hash?: string;
  } = {};
  if (body.name !== undefined) fields.name = String(body.name).trim();
  if (body.active !== undefined) fields.active = Boolean(body.active);
  if (body.password) fields.password_hash = hashPassword(String(body.password));
  if (body.code !== undefined) {
    const c = String(body.code).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (c) fields.code = c;
  }

  await updateVendor(id, fields);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  await deleteVendor(id);
  return NextResponse.json({ ok: true });
}
