import prisma from "@/lib/db";
import CustomersClient from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });
  return <CustomersClient initialCustomers={customers} />;
}
