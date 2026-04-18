"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "VOID"];
const PAYMENT_METHODS = ["CASH", "CARD", "EFT"];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(Number(value || 0));
}

export default function BillingClient({ availableJobs, initialInvoices }) {
  const [jobs, setJobs] = useState(availableJobs || []);
  const [invoices, setInvoices] = useState(initialInvoices || []);
  const [invoiceForm, setInvoiceForm] = useState({
    jobId: "",
    amount: "",
    status: "DRAFT",
  });
  const [paymentForms, setPaymentForms] = useState({});
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [error, setError] = useState("");

  const invoiceTotals = useMemo(() => {
    return Object.fromEntries(
      invoices.map((invoice) => [
        invoice.id,
        invoice.payments.reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0
        ),
      ])
    );
  }, [invoices]);

  const createInvoice = async (event) => {
    event.preventDefault();
    setLoadingInvoice(true);
    setError("");

    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceForm),
    });

    const payload = await response.json();
    setLoadingInvoice(false);

    if (!response.ok) {
      setError(payload.error || "Failed to create invoice.");
      return;
    }

    setInvoices([payload, ...invoices]);
    setJobs(jobs.filter((job) => job.id !== payload.jobId));
    setInvoiceForm({ jobId: "", amount: "", status: "DRAFT" });
  };

  const createPayment = async (invoiceId) => {
    setError("");
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId,
        ...paymentForms[invoiceId],
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Failed to record payment.");
      return;
    }

    setInvoices(
      invoices.map((invoice) =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              payments: [...invoice.payments, payload],
              status:
                Number(invoiceTotals[invoice.id] || 0) + Number(payload.amount) >=
                Number(invoice.amount)
                  ? "PAID"
                  : "SENT",
            }
          : invoice
      )
    );

    setPaymentForms({
      ...paymentForms,
      [invoiceId]: { amount: "", method: "EFT" },
    });
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-zinc-500">
          Generate invoices from jobs and record payments against each invoice.
        </p>
      </div>

      <form
        onSubmit={createInvoice}
        className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-3 dark:border-zinc-800"
      >
        <select
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          value={invoiceForm.jobId}
          onChange={(event) => setInvoiceForm({ ...invoiceForm, jobId: event.target.value })}
          required
        >
          <option value="">Select completed job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title} - {job.customer?.name}
            </option>
          ))}
        </select>
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Invoice amount"
          type="number"
          min="0.01"
          step="0.01"
          value={invoiceForm.amount}
          onChange={(event) => setInvoiceForm({ ...invoiceForm, amount: event.target.value })}
          required
        />
        <select
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          value={invoiceForm.status}
          onChange={(event) => setInvoiceForm({ ...invoiceForm, status: event.target.value })}
        >
          {INVOICE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {error ? (
          <div className="sm:col-span-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <button className="sm:col-span-3 rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black" disabled={loadingInvoice}>
          {loadingInvoice ? "Saving..." : "Create Invoice"}
        </button>
      </form>

      <div className="grid gap-4">
        <AnimatePresence>
          {invoices.map((invoice) => {
            const paidTotal = invoiceTotals[invoice.id] || 0;
            const paymentForm = paymentForms[invoice.id] || {
              amount: "",
              method: "EFT",
            };

            return (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">
                      {invoice.job?.title} - {invoice.job?.customer?.name}
                    </div>
                    <div className="text-sm text-zinc-500">
                      {invoice.job?.vehicle?.make} {invoice.job?.vehicle?.model} · {invoice.status}
                    </div>
                  </div>
                  <div className="text-sm text-zinc-500">
                    Amount: {formatCurrency(invoice.amount)} · Paid: {formatCurrency(paidTotal)}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                    placeholder="Payment amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(event) =>
                      setPaymentForms({
                        ...paymentForms,
                        [invoice.id]: {
                          ...paymentForm,
                          amount: event.target.value,
                        },
                      })
                    }
                  />
                  <select
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                    value={paymentForm.method}
                    onChange={(event) =>
                      setPaymentForms({
                        ...paymentForms,
                        [invoice.id]: {
                          ...paymentForm,
                          method: event.target.value,
                        },
                      })
                    }
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => createPayment(invoice.id)}
                    className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    Record Payment
                  </button>
                </div>

                <div className="grid gap-2">
                  {invoice.payments.length ? (
                    invoice.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
                      >
                        {payment.method} · {formatCurrency(payment.amount)}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-zinc-500">No payments recorded yet.</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
