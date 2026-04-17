"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomersClient({ initialCustomers }) {
  const [customers, setCustomers] = useState(initialCustomers || []);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await res.json();
    setLoading(false);
    if (res.ok) {
      setCustomers([payload, ...customers]);
      setForm({ name: "", email: "", phone: "", address: "" });
    } else {
      setError(payload.error || "Failed to save customer.");
    }
  };

  const removeCustomer = async (id) => {
    setError("");
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    const payload = await res.json();

    if (!res.ok) {
      setError(payload.error || "Failed to delete customer.");
      return;
    }

    setCustomers(customers.filter((customer) => customer.id !== id));
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-lg border-zinc-200 dark:border-zinc-800">
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        {error ? (
          <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}
        <button disabled={loading} className="sm:col-span-2 px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black">
          {loading ? "Saving..." : "Add Customer"}
        </button>
      </form>
      <div className="grid gap-3">
        <AnimatePresence>
          {customers.map((c) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-zinc-500">{c.email || "No email"} · {c.phone || "No phone"}</div>
                <div className="text-sm text-zinc-500">{c.address || "No address"}</div>
              </div>
              <button
                type="button"
                onClick={() => removeCustomer(c.id)}
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
