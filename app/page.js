import Link from "next/link";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

async function getCounts() {
  try {
    const [customers, vehicles, jobs] = await Promise.all([
      prisma.customer.count(),
      prisma.vehicle.count(),
      prisma.job.count(),
    ]);
    return { customers, vehicles, jobs };
  } catch {
    return { customers: 0, vehicles: 0, jobs: 0 };
  }
}

export default async function Home() {
  const counts = await getCounts();
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="text-sm text-zinc-500">Customers</div>
          <div className="text-3xl font-bold">{counts.customers}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="text-sm text-zinc-500">Vehicles</div>
          <div className="text-3xl font-bold">{counts.vehicles}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="text-sm text-zinc-500">Jobs</div>
          <div className="text-3xl font-bold">{counts.jobs}</div>
        </div>
      </div>
      <div className="flex gap-3">
        <Link href="/customers" className="px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black">
          Manage Customers
        </Link>
        <Link href="/jobs" className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700">
          Manage Jobs
        </Link>
      </div>
    </div>
  );
}
