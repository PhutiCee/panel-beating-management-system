import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import InvoicesClient from './InvoicesClient';

export default async function InvoicesPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if (session.user.role === 'TECHNICIAN') redirect('/jobs');

  const params = await searchParams;
  const newFor = params?.newFor || null;

  const [invoices, jobs] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issuedAt: 'desc' },
      include: { job: { include: { customer: true, vehicle: true } }, lineItems: true },
    }),
    prisma.job.findMany({
      where: { invoice: null, status: { in: ['COMPLETED', 'INVOICED'] } },
      include: { customer: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // If coming from jobs page with a specific job pre-selected
  let preselectedJob = null;
  if (newFor) {
    preselectedJob = await prisma.job.findUnique({
      where: { id: newFor },
      include: { customer: true, vehicle: true },
    });
  }

  const serializeInvoice = (inv) => ({
    ...inv,
    labourCost: inv.labourCost?.toNumber?.() ?? inv.labourCost,
    vatRate: inv.vatRate?.toNumber?.() ?? inv.vatRate,
    lineItems: inv.lineItems?.map(li => ({
      ...li,
      unitPrice: li.unitPrice?.toNumber?.() ?? li.unitPrice,
    })),
  });

  return (
    <div>
      <InvoicesClient
        initialInvoices={invoices.map(serializeInvoice)}
        availableJobs={jobs}
        userRole={session.user.role}
        preselectedJob={preselectedJob}
      />
    </div>
  );
}
