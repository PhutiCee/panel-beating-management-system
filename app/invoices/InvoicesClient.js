'use client';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INV_STATUS = { DRAFT: 'b-draft', SENT: 'b-sent', PAID: 'b-paid', VOID: 'b-void' };
const INV_LABELS = { DRAFT: 'Draft', SENT: 'Sent', PAID: 'Paid', VOID: 'Void' };

const fmt = (n) => `R ${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const BLANK_LINE = { description: '', quantity: 1, unitPrice: '' };

const DocIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="anim-float" style={{ color: 'var(--text-muted)' }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const numbersOnly = (e) => {
  const allowed = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '.'];
  if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};

function LineItemsEditor({ lines, onAdd, onRemove, onUpdate }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 36px', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Description</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Qty</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Unit Price</div>
        <div />
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 36px', gap: 8, marginBottom: 8 }}>
          <input className="inp" placeholder="e.g. Paint material" value={l.description}
            onChange={e => onUpdate(i, 'description', e.target.value)} />
          <input type="number" className="inp" min="0.1" step="0.1" placeholder="1" value={l.quantity}
            onChange={e => onUpdate(i, 'quantity', e.target.value)} onKeyDown={numbersOnly} />
          <input type="number" className="inp" min="0" placeholder="0.00" value={l.unitPrice}
            onChange={e => onUpdate(i, 'unitPrice', e.target.value)} onKeyDown={numbersOnly} />
          {lines.length > 1 && (
            <button type="button" onClick={() => onRemove(i)}
              style={{ background: 'var(--danger-muted)', color: 'var(--danger)', border: '1px solid var(--danger-border)', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
              ×
            </button>
          )}
          {lines.length === 1 && <div />}
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={onAdd} style={{ marginTop: 4 }}>
        + Add Line
      </button>
    </div>
  );
}

export default function InvoicesClient({ initialInvoices, availableJobs, userRole, preselectedJob }) {
  const [invoices, setInvoices] = useState(initialInvoices || []);
  const [showForm, setShowForm] = useState(!!preselectedJob);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);

  // Create form state
  const [selectedJobId, setSelectedJobId] = useState(preselectedJob?.id || '');
  const [lineItems, setLineItems] = useState([{ ...BLANK_LINE, description: 'Labour' }]);
  const [labourCost, setLabourCost] = useState('');
  const [vatRate, setVatRate] = useState('15');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editInvoice, setEditInvoice] = useState(null);
  const [editLines, setEditLines] = useState([]);
  const [editLabour, setEditLabour] = useState('');
  const [editVat, setEditVat] = useState('15');
  const [editNotes, setEditNotes] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // View modal
  const [viewInvoice, setViewInvoice] = useState(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [voidConfirm, setVoidConfirm] = useState(null);
  const [paidConfirm, setPaidConfirm] = useState(null);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 4000); };

  const selectedJob = useMemo(() => [...availableJobs, ...(preselectedJob ? [preselectedJob] : [])].find(j => j.id === selectedJobId), [selectedJobId, availableJobs, preselectedJob]);

  // Compute totals
  const computeTotals = (lines, labour, vat) => {
    const linesTotal = lines.reduce((s, l) => s + (Number(l.quantity) * Number(l.unitPrice || 0)), 0);
    const subtotal = linesTotal + Number(labour || 0);
    const vatAmt = subtotal * (Number(vat || 0) / 100);
    return { subtotal, vatAmt, grand: subtotal + vatAmt };
  };

  const totals = computeTotals(lineItems, labourCost, vatRate);
  const editTotals = editInvoice ? computeTotals(editLines, editLabour, editVat) : null;

  const addLine = () => setLineItems([...lineItems, { ...BLANK_LINE }]);
  const removeLine = (i) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => setLineItems(lineItems.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const addEditLine = () => setEditLines([...editLines, { ...BLANK_LINE }]);
  const removeEditLine = (i) => setEditLines(editLines.filter((_, idx) => idx !== i));
  const updateEditLine = (i, field, val) => setEditLines(editLines.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const createInvoice = async (e) => {
    e.preventDefault();
    if (!selectedJobId) return;
    setCreating(true);
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: selectedJobId, lineItems, labourCost: Number(labourCost || 0), vatRate: Number(vatRate || 15), notes, dueDate: dueDate || null }),
    });
    setCreating(false);
    if (res.ok) {
      const created = await res.json();
      setInvoices([created, ...invoices]);
      setShowForm(false);
      setSelectedJobId(''); setLineItems([{ ...BLANK_LINE, description: 'Labour' }]);
      setLabourCost(''); setNotes(''); setDueDate('');
      flash(`Invoice ${created.invoiceNumber} created successfully.`);
    } else {
      const err = await res.json();
      flash(err.error || 'Failed to create invoice.', 'error');
    }
  };

  const openEdit = (inv) => {
    setEditInvoice(inv);
    setEditLines(inv.lineItems.map(l => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice.toString() })));
    setEditLabour(inv.labourCost.toString());
    setEditVat(inv.vatRate.toString());
    setEditNotes(inv.notes || '');
    setEditDue(inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '');
  };

  const saveEdit = async (e) => {
    e.preventDefault(); setEditLoading(true);
    const res = await fetch(`/api/invoices/${editInvoice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineItems: editLines, labourCost: Number(editLabour || 0), vatRate: Number(editVat || 15), notes: editNotes, dueDate: editDue || null }),
    });
    setEditLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setInvoices(invoices.map(inv => inv.id === updated.id ? updated : inv));
      setEditInvoice(null);
      flash('Invoice updated.');
    }
  };

  const sendInvoice = async (id) => {
    setSendLoading(true);
    const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' });
    setSendLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updated } : inv));
      if (viewInvoice?.id === id) setViewInvoice({ ...viewInvoice, ...updated });
      flash('Invoice sent to customer successfully!');
    }
  };

  const markPaid = async (id) => {
    const res = await fetch(`/api/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAID' }) });
    if (res.ok) {
      const updated = await res.json();
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updated } : inv));
      if (viewInvoice?.id === id) setViewInvoice({ ...viewInvoice, ...updated });
      setPaidConfirm(null); flash('Invoice marked as paid.');
    }
  };

  const voidInvoice = async (id) => {
    const res = await fetch(`/api/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'VOID' }) });
    if (res.ok) {
      const updated = await res.json();
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updated } : inv));
      if (viewInvoice?.id === id) setViewInvoice({ ...viewInvoice, ...updated });
      setVoidConfirm(null); flash('Invoice voided.');
    }
  };

  const filtered = useMemo(() => invoices.filter(inv => {
    const matchFilter = filter === 'ALL' || inv.status === filter;
    const matchSearch = !search || inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || inv.job?.customer?.name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }), [invoices, filter, search]);

  return (
    <div className="anim-up">
      <div className="page-hdr">
        <div>
          <div className="page-title">Invoices</div>
          <div className="page-sub">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total</div>
        </div>
        <button className="btn" onClick={() => setShowForm(s => !s)}>{showForm ? '✕ Cancel' : '+ New Invoice'}</button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? '✓' : '⚠'} {msg.text}</div>}

      {/* Create Invoice Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">Create New Invoice</div>
            </div>
            <form onSubmit={createInvoice}>
              <div className="card-body">
                {/* Job selection */}
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label">Select Completed Job *</label>
                  <select className="sel" required value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}>
                    <option value="">— Select a job to invoice —</option>
                    {preselectedJob && !availableJobs.find(j => j.id === preselectedJob.id) && (
                      <option value={preselectedJob.id}>{preselectedJob.title} — {preselectedJob.customer?.name}</option>
                    )}
                    {availableJobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title} — {j.customer?.name} ({j.vehicle?.make} {j.vehicle?.model})</option>
                    ))}
                  </select>
                  {selectedJob && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', borderRadius: 8, fontSize: 13, color: 'var(--primary)' }}>
                      <strong>{selectedJob.customer?.name}</strong> · {selectedJob.vehicle?.make} {selectedJob.vehicle?.model} ({selectedJob.vehicle?.regNumber || 'No Reg'})
                    </div>
                  )}
                </div>

                {/* Line Items */}
                <div style={{ marginBottom: 20 }}>
                  <div className="section-hdr">Line Items (Parts & Materials)</div>
                  <LineItemsEditor lines={lineItems} onAdd={addLine} onRemove={removeLine} onUpdate={updateLine} />
                </div>

                {/* Labour & VAT */}
                <div className="form-grid-2" style={{ marginBottom: 20 }}>
                  <div>
                    <label className="form-label">Labour Cost (R)</label>
                    <input type="number" className="inp" placeholder="0.00" min="0" step="0.01" value={labourCost} onChange={e => setLabourCost(e.target.value)} onKeyDown={numbersOnly} />
                  </div>
                  <div>
                    <label className="form-label">VAT Rate (%)</label>
                    <input type="number" className="inp" placeholder="15" min="0" max="100" step="0.1" value={vatRate} onChange={e => setVatRate(e.target.value)} onKeyDown={numbersOnly} />
                  </div>
                  <div>
                    <label className="form-label">Due Date</label>
                    <input type="date" className="inp" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Notes</label>
                    <input className="inp" placeholder="Payment instructions, bank details…" value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                </div>

                {/* Totals preview */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, maxWidth: 320, marginLeft: 'auto' }}>
                  <div className="invoice-total-row"><span>Subtotal (excl. VAT)</span><span>{fmt(totals.subtotal)}</span></div>
                  <div className="invoice-total-row"><span>VAT ({vatRate || 0}%)</span><span>{fmt(totals.vatAmt)}</span></div>
                  <div className="invoice-total-row grand"><span>Total</span><span>{fmt(totals.grand)}</span></div>
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                <button type="submit" className="btn" disabled={creating || !selectedJobId}>{creating ? 'Creating…' : 'Create Invoice'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input className="search-inp" placeholder="Search invoice # or customer…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-chips">
          {['ALL', 'DRAFT', 'SENT', 'PAID', 'VOID'].map(s => (
            <button key={s} className={`chip${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'ALL' ? 'All' : INV_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <DocIcon />
            <div className="empty-title">{search || filter !== 'ALL' ? 'No invoices match your filter' : 'No invoices yet'}</div>
            <div className="empty-sub">{!search && filter === 'ALL' && 'Create an invoice from a completed job'}</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Invoice #</th><th>Customer</th><th>Vehicle / Job</th><th>Amount</th><th>Status</th><th>Due</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((inv, i) => {
                  const total = computeTotals(inv.lineItems, inv.labourCost, inv.vatRate);
                  return (
                    <motion.tr key={inv.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{inv.invoiceNumber}</div>
                        <div className="cell-sub">{new Date(inv.issuedAt).toLocaleDateString('en-ZA')}</div>
                      </td>
                      <td>
                        <div className="cell-main">{inv.job?.customer?.name || '—'}</div>
                        <div className="cell-sub">{inv.job?.customer?.email || inv.job?.customer?.phone || ''}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{inv.job?.vehicle?.make} {inv.job?.vehicle?.model}</div>
                        <div className="cell-sub">{inv.job?.title}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{fmt(total.grand)}</td>
                      <td><span className={`badge ${INV_STATUS[inv.status]}`}>{INV_LABELS[inv.status]}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-ZA') : <span style={{ fontStyle: 'italic' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <button className="btn btn-xs btn-outline" onClick={() => setViewInvoice(inv)}>View</button>
                          {inv.status === 'DRAFT' && <>
                            <button className="btn btn-xs btn-outline" onClick={() => openEdit(inv)}>Edit</button>
                            <button className="btn btn-xs btn-success" onClick={() => sendInvoice(inv.id)} disabled={sendLoading}><SendIcon /> Send</button>
                          </>}
                          {inv.status === 'SENT' && <button className="btn btn-xs btn-success" onClick={() => setPaidConfirm(inv.id)}>Mark Paid</button>}
                          {(inv.status === 'DRAFT' || inv.status === 'SENT') && <button className="btn btn-xs btn-danger" onClick={() => setVoidConfirm(inv.id)}>Void</button>}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* View Invoice Modal */}
      <AnimatePresence>
        {viewInvoice && (() => {
          const inv = invoices.find(i => i.id === viewInvoice.id) || viewInvoice;
          const t = computeTotals(inv.lineItems, inv.labourCost, inv.vatRate);
          return (
            <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setViewInvoice(null)}>
              <motion.div className="modal" style={{ maxWidth: 640 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="modal-title">{inv.invoiceNumber}</div>
                    <span className={`badge ${INV_STATUS[inv.status]}`}>{INV_LABELS[inv.status]}</span>
                  </div>
                  <button className="modal-close" onClick={() => setViewInvoice(null)}>×</button>
                </div>
                <div className="modal-body">
                  {/* Header info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24, padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Bill To</div>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{inv.job?.customer?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{inv.job?.customer?.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inv.job?.customer?.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Details</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Vehicle: {inv.job?.vehicle?.make} {inv.job?.vehicle?.model}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Reg: {inv.job?.vehicle?.regNumber || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Issued: {new Date(inv.issuedAt).toLocaleDateString('en-ZA')}</div>
                      {inv.dueDate && <div style={{ fontSize: 12, color: 'var(--warning)' }}>Due: {new Date(inv.dueDate).toLocaleDateString('en-ZA')}</div>}
                      {inv.sentAt && <div style={{ fontSize: 12, color: 'var(--success)' }}>Sent: {new Date(inv.sentAt).toLocaleDateString('en-ZA')}</div>}
                    </div>
                  </div>

                  {/* Line items */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="section-hdr">Line Items</div>
                    {/* Labour */}
                    {Number(inv.labourCost) > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span style={{ color: 'var(--text)' }}>Labour</span>
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{fmt(inv.labourCost)}</span>
                      </div>
                    )}
                    {inv.lineItems.map((l, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span style={{ color: 'var(--text)' }}>{l.description}</span>
                        <span style={{ color: 'var(--text-muted)' }}>× {l.quantity}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{fmt(Number(l.quantity) * Number(l.unitPrice))}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div style={{ maxWidth: 280, marginLeft: 'auto', background: 'var(--surface)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div className="invoice-total-row"><span>Subtotal</span><span>{fmt(t.subtotal)}</span></div>
                    <div className="invoice-total-row"><span>VAT ({Number(inv.vatRate)}%)</span><span>{fmt(t.vatAmt)}</span></div>
                    <div className="invoice-total-row grand"><span>Total</span><span>{fmt(t.grand)}</span></div>
                  </div>

                  {inv.notes && <div style={{ marginTop: 16, padding: 12, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-light)' }}><strong>Notes:</strong> {inv.notes}</div>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setViewInvoice(null)}>Close</button>
                  {inv.status === 'DRAFT' && <button className="btn btn-outline" onClick={() => { setViewInvoice(null); openEdit(inv); }}>Edit</button>}
                  {inv.status === 'DRAFT' && <button className="btn btn-success" onClick={() => sendInvoice(inv.id)} disabled={sendLoading}><SendIcon />{sendLoading ? 'Sending…' : 'Send to Customer'}</button>}
                  {inv.status === 'SENT' && <button className="btn btn-success" onClick={() => { setViewInvoice(null); setPaidConfirm(inv.id); }}>Mark as Paid</button>}
                  {(inv.status === 'DRAFT' || inv.status === 'SENT') && <button className="btn btn-danger" onClick={() => { setViewInvoice(null); setVoidConfirm(inv.id); }}>Void</button>}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Edit Invoice Modal */}
      <AnimatePresence>
        {editInvoice && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setEditInvoice(null)}>
            <motion.div className="modal" style={{ maxWidth: 640 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <div className="modal-title">Edit Invoice — {editInvoice.invoiceNumber}</div>
                <button className="modal-close" onClick={() => setEditInvoice(null)}>×</button>
              </div>
              <form onSubmit={saveEdit}>
                <div className="modal-body">
                  <div style={{ marginBottom: 20 }}>
                    <div className="section-hdr">Line Items</div>
                    <LineItemsEditor lines={editLines} onAdd={addEditLine} onRemove={removeEditLine} onUpdate={updateEditLine} />
                  </div>
                  <div className="form-grid-2" style={{ marginBottom: 16 }}>
                    <div><label className="form-label">Labour Cost (R)</label><input type="number" className="inp" min="0" step="0.01" value={editLabour} onChange={e => setEditLabour(e.target.value)} onKeyDown={numbersOnly} /></div>
                    <div><label className="form-label">VAT Rate (%)</label><input type="number" className="inp" min="0" max="100" step="0.1" value={editVat} onChange={e => setEditVat(e.target.value)} onKeyDown={numbersOnly} /></div>
                    <div><label className="form-label">Due Date</label><input type="date" className="inp" value={editDue} onChange={e => setEditDue(e.target.value)} /></div>
                    <div><label className="form-label">Notes</label><input className="inp" placeholder="Payment notes…" value={editNotes} onChange={e => setEditNotes(e.target.value)} /></div>
                  </div>
                  {editTotals && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, maxWidth: 280, marginLeft: 'auto' }}>
                      <div className="invoice-total-row"><span>Subtotal</span><span>{fmt(editTotals.subtotal)}</span></div>
                      <div className="invoice-total-row"><span>VAT ({editVat}%)</span><span>{fmt(editTotals.vatAmt)}</span></div>
                      <div className="invoice-total-row grand"><span>Total</span><span>{fmt(editTotals.grand)}</span></div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditInvoice(null)}>Cancel</button>
                  <button type="submit" className="btn" disabled={editLoading}>{editLoading ? 'Saving…' : 'Save Invoice'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark Paid confirm */}
      <AnimatePresence>
        {paidConfirm && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" style={{ maxWidth: 380 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header"><div className="modal-title">Mark as Paid?</div></div>
              <div className="modal-body"><p style={{ color: 'var(--text-light)', fontSize: 14, lineHeight: 1.6 }}>This will mark the invoice as fully paid and close the associated job card.</p></div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setPaidConfirm(null)}>Cancel</button>
                <button className="btn btn-success" onClick={() => markPaid(paidConfirm)}>Confirm Payment</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Void confirm */}
      <AnimatePresence>
        {voidConfirm && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" style={{ maxWidth: 380 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header"><div className="modal-title">Void Invoice?</div></div>
              <div className="modal-body"><p style={{ color: 'var(--text-light)', fontSize: 14, lineHeight: 1.6 }}>This will void the invoice. The job card will remain but you can create a new invoice if needed.</p></div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setVoidConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => voidInvoice(voidConfirm)}>Void Invoice</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
