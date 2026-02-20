import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const id = params.id;
  const data = await request.json();
  const job = await prisma.job.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      status: data.status,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      assignedToId: data.assignedToId || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: { customer: true, vehicle: true, assignedTo: true },
  });
  return NextResponse.json(job);
}

export async function DELETE(request, { params }) {
  const id = params.id;
  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
