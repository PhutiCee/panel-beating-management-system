'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BLANK = { name: '', email: '', phone: '', address: '' };

const EmptyIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="anim-float" style={{color:'var(--text-muted)'}}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export default function CustomersClient({ initialCustomers, userRole }) {
  const [customers, setCustomers] = useState(initialCustomers || []);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);
  const [editLoading, setEditLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const filtered = useMemo(() => customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  ), [customers, search]);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) {
      const created = await res.json();
      setCustomers([{ ...created, _count: { vehicles: 0, jobs: 0 } }, ...customers]);
      setForm(BLANK); setShowForm(false);
      flash('Customer registered successfully.');
    }
  };

  const openEdit = (c) => { setEditCustomer(c); setEditForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' }); };

  const saveEdit = async (e) => {
    e.preventDefault(); setEditLoading(true);
    const res = await fetch(`/api/customers/${editCustomer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
    setEditLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setCustomers(customers.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      setEditCustomer(null);
      flash('Customer updated successfully.');
    }
  };

  const deleteCustomer = async () => {
    const res = await fetch(`/api/customers/${deleteId}`, { method: 'DELETE' });
    if (res.ok) { setCustomers(customers.filter(c => c.id !== deleteId)); setDeleteId(null); flash('Customer deleted.'); }
  };

  return (
    <div className="anim-up">
      <div className="page-hdr">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-sub">{customers.length} registered customer{customers.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ New Customer'}
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? '✓' : '⚠'} {msg.text}</div>}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">Register New Customer</div>
            </div>
            <div className="card-body">
              <form onSubmit={submit}>
                <div className="form-grid-2">
                  <div><label className="form-label">Full Name *</label><input className="inp" placeholder="e.g. John Mokoena" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label className="form-label">Email Address</label><input type="email" className="inp" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><label className="form-label">Phone Number</label><input className="inp" placeholder="071 234 5678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><label className="form-label">Address</label><input className="inp" placeholder="123 Main St, Polokwane" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                </div>
                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving…' : 'Register Customer'}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="filter-bar">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="search-inp" placeholder="Search by name, email or phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <EmptyIcon />
            <div className="empty-title">{search ? 'No customers match your search' : 'No customers yet'}</div>
            <div className="empty-sub">{!search && 'Register your first customer to get started'}</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Customer</th><th>Phone</th><th>Email</th><th>Vehicles</th><th>Jobs</th><th>Registered</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="cell-main">{c.name}</div>
                      {c.address && <div className="cell-sub">{c.address}</div>}
                    </td>
                    <td>{c.phone || <span style={{color:'var(--text-dim)',fontStyle:'italic'}}>—</span>}</td>
                    <td style={{ fontSize: 12 }}>{c.email || <span style={{color:'var(--text-dim)',fontStyle:'italic'}}>—</span>}</td>
                    <td><span className="badge b-new">{c._count?.vehicles ?? 0}</span></td>
                    <td><span className="badge b-in_progress">{c._count?.jobs ?? 0}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString('en-ZA')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}>Edit</button>
                        {userRole === 'ADMIN' && <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(c.id)}>Delete</button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editCustomer && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setEditCustomer(null)}>
            <motion.div className="modal" style={{ maxWidth: 520 }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="modal-header">
                <div className="modal-title">Edit Customer</div>
                <button className="modal-close" onClick={() => setEditCustomer(null)}>×</button>
              </div>
              <form onSubmit={saveEdit}>
                <div className="modal-body">
                  <div className="form-grid-2">
                    <div className="col-span-2"><label className="form-label">Full Name *</label><input className="inp" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                    <div><label className="form-label">Email</label><input type="email" className="inp" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                    <div><label className="form-label">Phone</label><input className="inp" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                    <div className="col-span-2"><label className="form-label">Address</label><input className="inp" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditCustomer(null)}>Cancel</button>
                  <button type="submit" className="btn" disabled={editLoading}>{editLoading ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" style={{ maxWidth: 400 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header"><div className="modal-title">Delete Customer?</div></div>
              <div className="modal-body">
                <p style={{ color: 'var(--text-light)', fontSize: 14, lineHeight: 1.6 }}>This will permanently delete the customer and all related data (vehicles, jobs). This cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={deleteCustomer}>Delete Customer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
