import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'TECHNICIAN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const invoices = await prisma.invoice.findMany({
    orderBy: { issuedAt: 'desc' },
    include: { job: { include: { customer: true, vehicle: true } }, lineItems: true },
  });
  return NextResponse.json(invoices);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'TECHNICIAN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { jobId, lineItems, labourCost, vatRate, notes, dueDate } = await req.json();

  // Check job exists and doesn't already have an invoice
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { invoice: true } });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (job.invoice) return NextResponse.json({ error: 'This job already has an invoice' }, { status: 409 });

  // Generate invoice number
  const year = new Date().getFullYear();
  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
    orderBy: { invoiceNumber: 'desc' },
  });
  const nextNum = lastInvoice
    ? parseInt(lastInvoice.invoiceNumber.split('-')[2], 10) + 1
    : 1;
  const invoiceNumber = `INV-${year}-${String(nextNum).padStart(4, '0')}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      jobId,
      labourCost: labourCost || 0,
      vatRate: vatRate || 15,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      lineItems: {
        create: (lineItems || []).map(l => ({
          description: l.description,
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
        })),
      },
    },
    include: { job: { include: { customer: true, vehicle: true } }, lineItems: true },
  });

  // Update job status to INVOICED
  await prisma.job.update({ where: { id: jobId }, data: { status: 'INVOICED' } });

  return NextResponse.json(invoice, { status: 201 });
}
