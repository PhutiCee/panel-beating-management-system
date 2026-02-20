"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function JobsClient({ initialJobs, customers, vehicles }) {
  const [jobs, setJobs] = useState(initialJobs || []);
  const [form, setForm] = useState({ title: "", description: "", customerId: "", vehicleId: "" });
  const [loading, setLoading] = useState(false);

  const vehiclesByCustomer = useMemo(() => {
    const map = {};
    for (const v of vehicles) {
      if (!map[v.customerId]) map[v.customerId] = [];
      map[v.customerId].push(v);
    }
    return map;
  }, [vehicles]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    setLoading(false);
    if (res.ok) {
      const created = await res.json();
      setJobs([created, ...jobs]);
      setForm({ title: "", description: "", customerId: "", vehicleId: "" });
    }
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Jobs</h1>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-lg border-zinc-200 dark:border-zinc-800">
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value, vehicleId: "" })} required>
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required disabled={!form.customerId}>
          <option value="">Select Vehicle</option>
          {(vehiclesByCustomer[form.customerId] || []).map((v) => (
            <option key={v.id} value={v.id}>{v.make} {v.model} {v.regNumber || ""}</option>
          ))}
        </select>
        <button disabled={loading} className="sm:col-span-2 px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black">
          {loading ? "Saving..." : "Add Job"}
        </button>
      </form>
      <div className="grid gap-3">
        <AnimatePresence>
          {jobs.map((j) => (
            <motion.div key={j.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-4 border rounded-lg border-zinc-200 dark:border-zinc-800">
              <div className="font-medium">{j.title}</div>
              <div className="text-sm text-zinc-500">{j.customer?.name} · {j.vehicle ? `${j.vehicle.make} ${j.vehicle.model}` : ""} · {j.status}</div>
              <div className="text-sm text-zinc-500">{j.description || "No description"}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
