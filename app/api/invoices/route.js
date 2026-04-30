import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { handleApiError, requirePositiveDecimal } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { issuedAt: "desc" },
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

    return NextResponse.json(invoices);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  const access = requirePermission(request, PERMISSIONS.manageInvoices);

  if (access.error) {
    return access.error;
  }

  try {
    const data = await request.json();
    const invoice = await prisma.invoice.create({
      data: {
        jobId: data.jobId,
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

    await prisma.job.update({
      where: { id: data.jobId },
      data: { status: "INVOICED" },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
