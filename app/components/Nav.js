"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ROLES = ["ADMIN", "RECEPTION", "TECHNICIAN"];

export default function Nav() {
  const pathname = usePathname();
  const [role, setRole] = useState("ADMIN");
  const linkClass = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      pathname === path ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
    }`;

  useEffect(() => {
    async function loadRole() {
      const response = await fetch("/api/session/role");

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      setRole(payload.role || "ADMIN");
    }

    loadRole();
  }, []);

  const updateRole = async (nextRole) => {
    setRole(nextRole);

    await fetch("/api/session/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
  };

  return (
    <div className="flex flex-col items-start gap-3 lg:items-end">
      <nav className="flex flex-wrap items-center gap-2">
        <Link href="/" className={linkClass("/")}>
          Dashboard
        </Link>
        <Link href="/customers" className={linkClass("/customers")}>
          Customers
        </Link>
        <Link href="/vehicles" className={linkClass("/vehicles")}>
          Vehicles
        </Link>
        <Link href="/jobs" className={linkClass("/jobs")}>
          Jobs
        </Link>
        <Link href="/parts" className={linkClass("/parts")}>
          Parts
        </Link>
        <Link href="/billing" className={linkClass("/billing")}>
          Billing
        </Link>
        <Link href="/employees" className={linkClass("/employees")}>
          Employees
        </Link>
      </nav>
      <label className="flex items-center gap-2 text-sm text-zinc-500">
        Demo Role
        <select
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          value={role}
          onChange={(event) => updateRole(event.target.value)}
        >
          {ROLES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
