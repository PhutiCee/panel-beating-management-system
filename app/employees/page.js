import prisma from "@/lib/db";
import EmployeesClient from "./EmployeesClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          jobs: true,
        },
      },
    },
  });

  return <EmployeesClient initialUsers={users} />;
}
