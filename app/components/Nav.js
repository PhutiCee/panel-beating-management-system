"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const linkClass = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      pathname === path ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
    }`;
  return (
    <nav className="flex items-center gap-2">
      <Link href="/" className={linkClass("/")}>
        Dashboard
      </Link>
      <Link href="/customers" className={linkClass("/customers")}>
        Customers
      </Link>
      <Link href="/jobs" className={linkClass("/jobs")}>
        Jobs
      </Link>
      <Link href="/vehicles" className={linkClass("/vehicles")}>
        Vehicles
      </Link>
    </nav>
  );
}
