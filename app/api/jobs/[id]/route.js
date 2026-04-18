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

const JOB_STATUS_ORDER = ["NEW", "QUOTED", "IN_PROGRESS", "COMPLETED", "INVOICED", "CLOSED"];

export async function PUT(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageJobs);

  if (access.error) {
    return access.error;
  }

  try {
    const id = params.id;
    const data = await request.json();
    const currentJob = await prisma.job.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!currentJob) {
      throw new Error("Job not found.");
    }

    const nextStatus = data.status || currentJob.status;

    if (
      JOB_STATUS_ORDER.indexOf(nextStatus) < JOB_STATUS_ORDER.indexOf(currentJob.status)
    ) {
      throw new Error("Job status cannot move backwards.");
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      select: { customerId: true },
    });

    if (!vehicle || vehicle.customerId !== data.customerId) {
      throw new Error("Selected vehicle does not belong to the selected customer.");
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        title: requireString(data.title, "Title"),
        description: asOptionalString(data.description),
        status: nextStatus,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        assignedToId: asOptionalString(data.assignedToId),
        startDate: asOptionalDate(data.startDate, "Start date"),
        endDate: asOptionalDate(data.endDate, "End date"),
      },
      include: { customer: true, vehicle: true, assignedTo: true, invoice: true },
    });
    return NextResponse.json(job);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageJobs);

  if (access.error) {
    return access.error;
  }

  try {
    const id = params.id;
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
