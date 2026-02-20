import prisma from "@/lib/db";
import JobsClient from "./JobsClient";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const [jobs, customers, vehicles] = await Promise.all([
    prisma.job.findMany({ include: { customer: true, vehicle: true, assignedTo: true }, orderBy: { createdAt: "desc" } }),
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return <JobsClient initialJobs={jobs} customers={customers} vehicles={vehicles} />;
}
