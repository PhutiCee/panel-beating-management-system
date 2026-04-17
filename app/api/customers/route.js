import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { asOptionalString, handleApiError, requireString } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: { vehicles: true, jobs: true },
    });
    return NextResponse.json(customers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  const access = requirePermission(request, PERMISSIONS.manageCustomers);

  if (access.error) {
    return access.error;
  }

  try {
    const data = await request.json();
    const customer = await prisma.customer.create({
      data: {
        name: requireString(data.name, "Name"),
        email: asOptionalString(data.email),
        phone: asOptionalString(data.phone),
        address: asOptionalString(data.address),
      },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
