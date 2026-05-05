import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'TECHNICIAN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { job: { include: { customer: true, vehicle: true } }, lineItems: true },
  });
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'TECHNICIAN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // If just updating status (paid/void)
  if (body.status && Object.keys(body).length === 1) {
    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: body.status },
      include: { job: { include: { customer: true, vehicle: true } }, lineItems: true },
    });
    // If paid, close the job
    if (body.status === 'PAID') {
      await prisma.job.update({ where: { id: existing.jobId }, data: { status: 'CLOSED' } });
    }
    return NextResponse.json(updated);
  }

  // Full edit (only DRAFT invoices)
  if (existing.status !== 'DRAFT') return NextResponse.json({ error: 'Can only edit DRAFT invoices' }, { status: 400 });

  // Delete old line items and recreate
  await prisma.invoiceLine.deleteMany({ where: { invoiceId: id } });

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      labourCost: body.labourCost ?? existing.labourCost,
      vatRate: body.vatRate ?? existing.vatRate,
      notes: body.notes ?? existing.notes,
      dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
      lineItems: {
        create: (body.lineItems || []).map(l => ({
          description: l.description,
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
        })),
      },
    },
    include: { job: { include: { customer: true, vehicle: true } }, lineItems: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
