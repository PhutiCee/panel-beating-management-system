"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VehiclesClient({ initialVehicles, customers }) {
  const [vehicles, setVehicles] = useState(initialVehicles || []);
  const [form, setForm] = useState({ make: "", model: "", year: "", regNumber: "", vin: "", customerId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      year: form.year ? parseInt(form.year, 10) : null,
    };
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const created = await res.json();
    setLoading(false);
    if (res.ok) {
      setVehicles([created, ...vehicles]);
      setForm({ make: "", model: "", year: "", regNumber: "", vin: "", customerId: "" });
    } else {
      setError(created.error || "Failed to save vehicle.");
    }
  };

  const removeVehicle = async (id) => {
    setError("");
    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    const payload = await res.json();

    if (!res.ok) {
      setError(payload.error || "Failed to delete vehicle.");
      return;
    }

    setVehicles(vehicles.filter((vehicle) => vehicle.id !== id));
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Vehicles</h1>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border rounded-lg border-zinc-200 dark:border-zinc-800">
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required />
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
        <input type="number" className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="Registration Number" value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} />
        <input className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" placeholder="VIN" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
        <select className="border px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {error ? (
          <div className="sm:col-span-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}
        <button disabled={loading} className="sm:col-span-3 px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black">
          {loading ? "Saving..." : "Add Vehicle"}
        </button>
      </form>
      <div className="grid gap-3">
        <AnimatePresence>
          {vehicles.map((v) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              <div>
                <div className="font-medium">{v.make} {v.model} {v.year || ""}</div>
                <div className="text-sm text-zinc-500">{v.regNumber || "No reg"} · {v.vin || "No VIN"}</div>
                <div className="text-sm text-zinc-500">Owner: {v.customer?.name || v.customerId}</div>
              </div>
              <button
                type="button"
                onClick={() => removeVehicle(v.id)}
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
