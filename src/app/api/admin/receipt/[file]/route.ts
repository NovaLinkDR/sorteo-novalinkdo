import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAdmin, unauthorized } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  if (!isAdmin(req)) return unauthorized();
  const { file } = await params;
  if (!/^[A-Za-z0-9._-]+$/.test(file)) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }
  const dir =
    process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
  const full = path.join(dir, file);
  if (!full.startsWith(dir) || !fs.existsSync(full)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  const buf = fs.readFileSync(full);
  const ext = path.extname(file).toLowerCase();
  const type =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
      ? "image/webp"
      : ext === ".pdf"
      ? "application/pdf"
      : "application/octet-stream";
  return new NextResponse(buf, {
    headers: { "Content-Type": type, "Cache-Control": "no-store" },
  });
}
