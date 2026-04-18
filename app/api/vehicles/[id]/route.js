import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import {
  asOptionalInt,
  asOptionalString,
  handleApiError,
  requireString,
} from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageVehicles);

  if (access.error) {
    return access.error;
  }

  try {
    const id = params.id;
    const data = await request.json();
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        vin: asOptionalString(data.vin),
        make: requireString(data.make, "Make"),
        model: requireString(data.model, "Model"),
        year: asOptionalInt(data.year, "Year"),
        regNumber: asOptionalString(data.regNumber),
        customerId: data.customerId,
      },
      include: { customer: true },
    });
    return NextResponse.json(vehicle);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageVehicles);

  if (access.error) {
    return access.error;
  }

  try {
    const id = params.id;
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
