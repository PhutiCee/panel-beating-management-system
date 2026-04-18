import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import {
  asOptionalDate,
  asOptionalString,
  handleApiError,
  requireString,
} from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        vehicle: true,
        assignedTo: true,
        parts: true,
        invoice: { include: { payments: true } },
        estimate: true,
      },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  const access = requirePermission(request, PERMISSIONS.manageJobs);

  if (access.error) {
    return access.error;
  }

  try {
    const data = await request.json();
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      select: { customerId: true },
    });

    if (!vehicle || vehicle.customerId !== data.customerId) {
      throw new Error("Selected vehicle does not belong to the selected customer.");
    }

    const job = await prisma.job.create({
      data: {
        title: requireString(data.title, "Title"),
        description: asOptionalString(data.description),
        status: data.status || "NEW",
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        assignedToId: asOptionalString(data.assignedToId),
        startDate: asOptionalDate(data.startDate, "Start date"),
        endDate: asOptionalDate(data.endDate, "End date"),
      },
      include: { customer: true, vehicle: true, assignedTo: true, invoice: true },
    });
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
