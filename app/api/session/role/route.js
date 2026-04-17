import { NextResponse } from "next/server";
import { getRequestRole, normalizeRole, setRoleCookie } from "@/lib/auth";

export async function GET(request) {
  return NextResponse.json({ role: getRequestRole(request) });
}

export async function POST(request) {
  const body = await request.json();
  const response = NextResponse.json({ role: normalizeRole(body.role) });
  return setRoleCookie(response, body.role);
}
