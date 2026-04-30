import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import CustomersClient from './CustomersClient';

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if (session.user.role === 'TECHNICIAN') redirect('/jobs');

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { vehicles: true, jobs: true } } },
  });

  return <CustomersClient initialCustomers={customers} userRole={session.user.role} />;
}
