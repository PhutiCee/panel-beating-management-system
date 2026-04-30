import prisma from "@/lib/db";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const [jobs, invoices] = await Promise.all([
    prisma.job.findMany({
      where: { invoice: { is: null } },
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        vehicle: true,
      },
    }),
    prisma.invoice.findMany({
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
    }),
  ]);

  return <BillingClient availableJobs={jobs} initialInvoices={invoices} />;
}
