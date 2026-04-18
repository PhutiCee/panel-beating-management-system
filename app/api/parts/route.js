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

export async function GET() {
  try {
    const parts = await prisma.part.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return NextResponse.json(parts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  const access = requirePermission(request, PERMISSIONS.manageParts);

  if (access.error) {
    return access.error;
  }

  try {
    const data = await request.json();
    const part = await prisma.part.create({
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

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
