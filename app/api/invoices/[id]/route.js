import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { handleApiError, requirePositiveDecimal } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageInvoices);

  if (access.error) {
    return access.error;
  }

  try {
    const data = await request.json();
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        amount: requirePositiveDecimal(data.amount, "Invoice amount"),
        status: data.status || "DRAFT",
      },
      include: {
        job: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  const access = requirePermission(request, PERMISSIONS.manageInvoices);

  if (access.error) {
    return access.error;
  }

  try {
    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: { jobId: true },
    });

    await prisma.invoice.delete({ where: { id: params.id } });

    if (existing?.jobId) {
      await prisma.job.update({
        where: { id: existing.jobId },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
