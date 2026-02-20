"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomersClient({ initialCustomers }) {
  const [customers, setCustomers] = useState(initialCustomers || []);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      const created = await res.json();
      setCustomers([created, ...customers]);
      setForm({ name: "", email: "", phone: "", address: "" });
    }
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-lg border-zinc-200 dark:border-zinc-800">
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <button disabled={loading} className="sm:col-span-2 px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black">
          {loading ? "Saving..." : "Add Customer"}
        </button>
      </form>
      <div className="grid gap-3">
        <AnimatePresence>
          {customers.map((c) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-4 border rounded-lg border-zinc-200 dark:border-zinc-800">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-zinc-500">{c.email || "No email"} · {c.phone || "No phone"}</div>
              <div className="text-sm text-zinc-500">{c.address || "No address"}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
