import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { asOptionalString, handleApiError, requireString } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageCustomers);

  if (access.error) {
    return access.error;
  }

  try {
    const id = params.id;
    const data = await request.json();
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: requireString(data.name, "Name"),
        email: asOptionalString(data.email),
        phone: asOptionalString(data.phone),
        address: asOptionalString(data.address),
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageCustomers);

  if (access.error) {
    return access.error;
  }

  try {
    const id = params.id;
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
