import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import JobsClient from './JobsClient';

export default async function JobsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const role = session.user.role;
  const userId = session.user.id;
  const where = role === 'TECHNICIAN' ? { assignedToId: userId } : {};

  const [jobs, customers, vehicles, technicians] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, vehicle: true, assignedTo: true, invoice: { select: { id: true } } },
    }),
    role !== 'TECHNICIAN' ? prisma.customer.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }) : Promise.resolve([]),
    role !== 'TECHNICIAN' ? prisma.vehicle.findMany({ select: { id: true, make: true, model: true, year: true, regNumber: true, customerId: true } }) : Promise.resolve([]),
    prisma.user.findMany({ where: { role: 'TECHNICIAN' }, select: { id: true, name: true } }),
  ]);

  return <JobsClient initialJobs={jobs} customers={customers} vehicles={vehicles} technicians={technicians} userRole={role} userId={userId} />;
}
