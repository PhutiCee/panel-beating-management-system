import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import {
  handleApiError,
  requireNonNegativeInt,
  requirePositiveDecimal,
  requireString,
} from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageParts);

  if (access.error) {
    return access.error;
  }

  try {
    const data = await request.json();
    const part = await prisma.part.update({
      where: { id: params.id },
      data: {
        name: requireString(data.name, "Part name"),
        quantityInStock: requireNonNegativeInt(data.quantityInStock, "Stock quantity"),
        unitPrice: requirePositiveDecimal(data.unitPrice, "Unit price"),
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return NextResponse.json(part);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageParts);

  if (access.error) {
    return access.error;
  }

  try {
    await prisma.part.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
