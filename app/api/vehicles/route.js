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

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    });
    return NextResponse.json(vehicles);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  const access = requirePermission(request, PERMISSIONS.manageVehicles);

  if (access.error) {
    return access.error;
  }

  try {
    const data = await request.json();
    const vehicle = await prisma.vehicle.create({
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
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
