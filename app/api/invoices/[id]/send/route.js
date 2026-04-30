import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'TECHNICIAN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { job: { include: { customer: true, vehicle: true } }, lineItems: true },
  });
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (invoice.status !== 'DRAFT') return NextResponse.json({ error: 'Invoice is not in DRAFT status' }, { status: 400 });

  const customerEmail = invoice.job?.customer?.email;

  // === EMAIL SIMULATION ===
  // In production, integrate with an email service (e.g. SendGrid, Nodemailer, Resend).
  // For now, we log the email details to console and mark as sent.
  const linesTotal = invoice.lineItems.reduce((s, l) => s + (Number(l.quantity) * Number(l.unitPrice)), 0);
  const subtotal = linesTotal + Number(invoice.labourCost);
  const vatAmt = subtotal * (Number(invoice.vatRate) / 100);
  const grand = subtotal + vatAmt;

  console.log('=== INVOICE EMAIL SIMULATION ===');
  console.log(`TO: ${customerEmail || 'No email on file'}`);
  console.log(`SUBJECT: Invoice ${invoice.invoiceNumber} — Mangena Panel Beater`);
  console.log(`AMOUNT: R ${grand.toFixed(2)}`);
  console.log(`VEHICLE: ${invoice.job?.vehicle?.make} ${invoice.job?.vehicle?.model} (${invoice.job?.vehicle?.regNumber})`);
  console.log('================================');

  // Mark as SENT
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: 'SENT', sentAt: new Date() },
    include: { job: { include: { customer: true, vehicle: true } }, lineItems: true },
  });

  return NextResponse.json(updated);
}
