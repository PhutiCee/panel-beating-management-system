import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'TECHNICIAN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true, _count: { select: { jobs: true } } },
  });
  return NextResponse.json(vehicles);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'TECHNICIAN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const data = await request.json();
  const vehicle = await prisma.vehicle.create({
    data: {
      vin: data.vin || null,
      make: data.make,
      model: data.model,
      year: data.year || null,
      regNumber: data.regNumber || null,
      colour: data.colour || null,
      customerId: data.customerId,
    },
    include: { customer: true, _count: { select: { jobs: true } } },
  });
  return NextResponse.json(vehicle, { status: 201 });
}
