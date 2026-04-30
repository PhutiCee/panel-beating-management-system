import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const globalForPrisma = globalThis;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Users
  const adminPass = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12);
  const recPass = await bcrypt.hash(process.env.SEED_RECEPTION_PASSWORD, 12);
  const techPass = await bcrypt.hash(process.env.SEED_TECH_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mangena.co.za' },
    update: {},
    create: { name: 'Thabo Mangena', email: 'admin@mangena.co.za', phone: '015 123 4567', password: adminPass, role: 'ADMIN' },
  });

  const reception = await prisma.user.upsert({
    where: { email: 'reception@mangena.co.za' },
    update: {},
    create: { name: 'Lerato Dlamini', email: 'reception@mangena.co.za', phone: '071 234 5678', password: recPass, role: 'RECEPTION' },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@mangena.co.za' },
    update: {},
    create: { name: 'Sipho Zulu', email: 'tech@mangena.co.za', phone: '082 345 6789', password: techPass, role: 'TECHNICIAN' },
  });

  console.log('✓ Users created');

  // Customers
  const customer1 = await prisma.customer.upsert({
    where: { email: 'john.mokoena@email.com' },
    update: {},
    create: { name: 'John Mokoena', email: 'john.mokoena@email.com', phone: '083 456 7890', address: '45 Landdros Mare St, Polokwane' },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'sarah.ndlovu@email.com' },
    update: {},
    create: { name: 'Sarah Ndlovu', email: 'sarah.ndlovu@email.com', phone: '072 567 8901', address: '12 Grobler St, Mokopane' },
  });

  console.log('✓ Customers created');

  // Vehicles
  let vehicle1 = await prisma.vehicle.findFirst({ where: { regNumber: 'LP 12 34 GP' } });
  if (!vehicle1) {
    vehicle1 = await prisma.vehicle.create({
      data: { make: 'Toyota', model: 'Hilux', year: 2021, regNumber: 'LP 12 34 GP', colour: 'White', customerId: customer1.id },
    });
  }

  let vehicle2 = await prisma.vehicle.findFirst({ where: { regNumber: 'LP 56 78 GP' } });
  if (!vehicle2) {
    vehicle2 = await prisma.vehicle.create({
      data: { make: 'Volkswagen', model: 'Polo', year: 2019, regNumber: 'LP 56 78 GP', colour: 'Silver', customerId: customer2.id },
    });
  }

  console.log('✓ Vehicles created');

  // Jobs
  let job1 = await prisma.job.findFirst({ where: { title: 'Front bumper repair and respray' } });
  if (!job1) {
    job1 = await prisma.job.create({
      data: {
        title: 'Front bumper repair and respray',
        description: 'Minor collision damage to front bumper. Requires panel beating, filler and full respray.',
        status: 'COMPLETED',
        customerId: customer1.id,
        vehicleId: vehicle1.id,
        assignedToId: tech.id,
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-11-05'),
      },
    });
  }

  let job2 = await prisma.job.findFirst({ where: { title: 'Right door dent removal' } });
  if (!job2) {
    job2 = await prisma.job.create({
      data: {
        title: 'Right door dent removal',
        description: 'Parking lot dent on right rear door. PDR method where possible.',
        status: 'IN_PROGRESS',
        customerId: customer2.id,
        vehicleId: vehicle2.id,
        assignedToId: tech.id,
        startDate: new Date(),
      },
    });
  }

  console.log('✓ Jobs created');

  // Sample invoice for completed job
  const existingInv = await prisma.invoice.findFirst({ where: { jobId: job1.id } });
  if (!existingInv) {
    const count = await prisma.invoice.count();
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
        jobId: job1.id,
        labourCost: 2500,
        vatRate: 15,
        notes: 'Payment due within 30 days. EFT to Mangena Panel Beater — FNB Account 12345678.',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems: {
          create: [
            { description: 'Bumper primer & base coat', quantity: 1, unitPrice: 850 },
            { description: 'Clear coat & polish', quantity: 1, unitPrice: 650 },
            { description: 'Plastic filler & sanding', quantity: 2, unitPrice: 300 },
          ],
        },
      },
    });
    // Update job status
    await prisma.job.update({ where: { id: job1.id }, data: { status: 'INVOICED' } });
  }

  console.log('✓ Sample invoice created');
  console.log('\n✅ Seed complete!');
  console.log('\nLogin credentials:');
  console.log('  Admin:       admin@mangena.co.za     / admin123');
  console.log('  Reception:   reception@mangena.co.za / reception123');
  console.log('  Technician:  tech@mangena.co.za      / tech123');
}

// main().catch(console.error).finally(() => prisma.$disconnect());
main().catch((e) => {
  console.error(e);
  process.exit(1);
})
  .finally(async () => {
    await prisma.$disconnect();
  });
