"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(Number(value || 0));
}

export default function PartsClient({ initialParts }) {
  const [parts, setParts] = useState(initialParts || []);
  const [form, setForm] = useState({
    name: "",
    quantityInStock: "",
    unitPrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || "Failed to save part.");
      return;
    }

    setParts([payload, ...parts]);
    setForm({
      name: "",
      quantityInStock: "",
      unitPrice: "",
    });
  };

  const removePart = async (id) => {
    setError("");
    const response = await fetch(`/api/parts/${id}`, { method: "DELETE" });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Failed to delete part.");
      return;
    }

    setParts(parts.filter((part) => part.id !== id));
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Parts Inventory</h1>
        <p className="text-sm text-zinc-500">
          Track spare parts, stock levels, and usage across repair jobs.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-3 dark:border-zinc-800"
      >
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Part name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Quantity in stock"
          type="number"
          min="0"
          value={form.quantityInStock}
          onChange={(event) =>
            setForm({ ...form, quantityInStock: event.target.value })
          }
          required
        />
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Unit price"
          type="number"
          min="0.01"
          step="0.01"
          value={form.unitPrice}
          onChange={(event) => setForm({ ...form, unitPrice: event.target.value })}
          required
        />

        {error ? (
          <div className="sm:col-span-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <button className="sm:col-span-3 rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black" disabled={loading}>
          {loading ? "Saving..." : "Add Part"}
        </button>
      </form>

      <div className="grid gap-3">
        <AnimatePresence>
          {parts.map((part) => (
            <motion.div
              key={part.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
            >
              <div>
                <div className="font-medium">{part.name}</div>
                <div className="text-sm text-zinc-500">
                  Stock: {part.quantityInStock} · Unit price: {formatCurrency(part.unitPrice)}
                </div>
                <div className="text-sm text-zinc-500">
                  Used in {part._count?.items || 0} job entries
                </div>
              </div>

              <button
                type="button"
                onClick={() => removePart(part.id)}
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
