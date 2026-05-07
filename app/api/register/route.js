import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { businessName, ownerName, email, phone, password } = await req.json();

    // Basic server-side validation
    if (!ownerName?.trim()) return NextResponse.json({ error: 'Owner name is required' }, { status: 400 });
    if (/\d/.test(ownerName)) return NextResponse.json({ error: 'Name cannot contain numbers' }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    // Check for duplicate email 
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) return NextResponse.json({ error: 'An account with this email already exists. Please sign in instead.' }, { status: 409 });

    // Create ADMIN user
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        password: hashed,
        role: 'ADMIN',
      },
      select: { id: true, name: true, email: true, role: true },
    });

    console.log(`[REGISTER] New admin account created: ${user.email} — Business: ${businessName}`);
    return NextResponse.json({ ok: true, user }, { status: 201 });

  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
