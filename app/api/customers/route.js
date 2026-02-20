import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { vehicles: true, jobs: true },
  });
  return NextResponse.json(customers);
}

export async function POST(request) {
  const data = await request.json();
  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
