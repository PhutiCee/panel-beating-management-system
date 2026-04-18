"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ROLES = ["ADMIN", "RECEPTION", "TECHNICIAN"];

export default function EmployeesClient({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers || []);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "TECHNICIAN",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || "Failed to save employee.");
      return;
    }

    setUsers([payload, ...users]);
    setForm({
      name: "",
      email: "",
      phone: "",
      role: "TECHNICIAN",
    });
  };

  const removeUser = async (id) => {
    setError("");
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Failed to delete employee.");
      return;
    }

    setUsers(users.filter((user) => user.id !== id));
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="text-sm text-zinc-500">
          Manage staff records and assign responsibilities by role.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-2 dark:border-zinc-800"
      >
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Full name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Email address"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Phone number"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <select
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value })}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        {error ? (
          <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <button className="sm:col-span-2 rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black" disabled={loading}>
          {loading ? "Saving..." : "Add Employee"}
        </button>
      </form>

      <div className="grid gap-3">
        <AnimatePresence>
          {users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
            >
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-zinc-500">
                  {user.email} {user.phone ? `· ${user.phone}` : ""}
                </div>
                <div className="text-sm text-zinc-500">
                  {user.role} · {user._count?.jobs || 0} assigned jobs
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                Delete
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
