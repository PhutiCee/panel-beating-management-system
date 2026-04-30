import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });

  return <UsersClient initialUsers={users} />;
}
