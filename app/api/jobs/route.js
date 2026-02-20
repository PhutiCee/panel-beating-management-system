import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, vehicle: true, assignedTo: true, parts: true, invoice: true, estimate: true },
  });
  return NextResponse.json(jobs);
}

export async function POST(request) {
  const data = await request.json();
  const job = await prisma.job.create({
    data: {
      title: data.title,
      description: data.description || null,
      status: data.status || "NEW",
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      assignedToId: data.assignedToId || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: { customer: true, vehicle: true, assignedTo: true },
  });
  return NextResponse.json(job, { status: 201 });
}
