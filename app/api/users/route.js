import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

async function requireAdmin(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
    return NextResponse.json(users);
}

export async function POST(request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const data = await request.json();
    const hashed = await bcrypt.hash(data.password || 'changeme123', 10);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            role: data.role || 'RECEPTION',
            password: hashed,
        },
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
}