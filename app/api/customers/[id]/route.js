import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'TECHNICIAN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const data = await req.json();
  const updated = await prisma.customer.update({ where: { id }, data: { name: data.name, email: data.email || null, phone: data.phone || null, address: data.address || null } });
  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
