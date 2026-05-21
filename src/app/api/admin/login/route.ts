import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { password?: string } = {};
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const expected =
    process.env.ADMIN_PASSWORD?.trim() || "GrowwPulse2026!";
  const password = (body.password ?? "").trim();

  if (!password || password !== expected) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
