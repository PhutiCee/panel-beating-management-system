import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { handleApiError, requirePositiveDecimal } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function POST(request) {
  const access = requirePermission(request, PERMISSIONS.managePayments);

  if (access.error) {
    return access.error;
  }

  try {
    const data = await request.json();
    const payment = await prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: requirePositiveDecimal(data.amount, "Payment amount"),
        method: data.method || "EFT",
      },
    });

    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { payments: true },
    });

    if (invoice) {
      const paidTotal = invoice.payments.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );

      const nextStatus = paidTotal >= Number(invoice.amount) ? "PAID" : "SENT";

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: nextStatus },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
