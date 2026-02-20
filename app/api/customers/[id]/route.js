import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const id = params.id;
  const data = await request.json();
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  });
  return NextResponse.json(customer);
}

export async function DELETE(request, { params }) {
  const id = params.id;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
