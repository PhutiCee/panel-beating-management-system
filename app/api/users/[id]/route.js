import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { handleApiError, asOptionalString, requireString } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageUsers);

  if (access.error) {
    return access.error;
  }

  try {
    const data = await request.json();
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: requireString(data.name, "Name"),
        email: requireString(data.email, "Email"),
        phone: asOptionalString(data.phone),
        role: data.role || "RECEPTION",
      },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageUsers);

  if (access.error) {
    return access.error;
  }

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
