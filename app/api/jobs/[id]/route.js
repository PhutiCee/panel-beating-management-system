import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const data = await req.json();

  // Technicians can only update status
  const updateData = session.user.role === 'TECHNICIAN'
    ? { status: data.status }
    : {
        title: data.title,
        description: data.description,
        status: data.status,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        assignedToId: data.assignedToId || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      };

  const updated = await prisma.job.update({
    where: { id },
    data: updateData,
    include: { customer: true, vehicle: true, assignedTo: true, invoice: { select: { id: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
