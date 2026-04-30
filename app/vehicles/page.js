import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import VehiclesClient from './VehiclesClient';

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if (session.user.role === 'TECHNICIAN') redirect('/jobs');

  const [vehicles, customers] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true, _count: { select: { jobs: true } } },
    }),
    prisma.customer.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return <VehiclesClient initialVehicles={vehicles} customers={customers} userRole={session.user.role} />;
}
