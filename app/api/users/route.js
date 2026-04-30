import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { handleApiError, asOptionalString, requireString } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  const access = requirePermission(request, PERMISSIONS.manageUsers);

  if (access.error) {
    return access.error;
  }

  try {
    const data = await request.json();
    const user = await prisma.user.create({
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
