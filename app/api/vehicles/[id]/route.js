import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const id = params.id;
  const data = await request.json();
  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      vin: data.vin || null,
      make: data.make,
      model: data.model,
      year: data.year || null,
      regNumber: data.regNumber || null,
      customerId: data.customerId,
    },
  });
  return NextResponse.json(vehicle);
}

export async function DELETE(request, { params }) {
  const id = params.id;
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
