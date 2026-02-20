import prisma from "@/lib/db";
import VehiclesClient from "./VehiclesClient";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const [vehicles, customers] = await Promise.all([
    prisma.vehicle.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" } }),
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return <VehiclesClient initialVehicles={vehicles} customers={customers} />;
}
