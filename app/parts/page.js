import prisma from "@/lib/db";
import PartsClient from "./PartsClient";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const parts = await prisma.part.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  return <PartsClient initialParts={parts} />;
}
