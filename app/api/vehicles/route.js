import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
  return NextResponse.json(vehicles);
}

export async function POST(request) {
  const data = await request.json();
  const vehicle = await prisma.vehicle.create({
    data: {
      vin: data.vin || null,
      make: data.make,
      model: data.model,
      year: data.year || null,
      regNumber: data.regNumber || null,
      customerId: data.customerId,
    },
  });
  return NextResponse.json(vehicle, { status: 201 });
}
