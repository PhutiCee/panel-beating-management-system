import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const where = session.user.role === 'TECHNICIAN' ? { assignedToId: session.user.id } : {};
  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { customer: true, vehicle: true, assignedTo: true, invoice: { select: { id: true } } },
  });
  return NextResponse.json(jobs);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'TECHNICIAN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const data = await request.json();
  const job = await prisma.job.create({
    data: {
      title: data.title,
      description: data.description || null,
      status: data.status || 'NEW',
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      assignedToId: data.assignedToId || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: { customer: true, vehicle: true, assignedTo: true, invoice: { select: { id: true } } },
  });
  return NextResponse.json(job, { status: 201 });
}
