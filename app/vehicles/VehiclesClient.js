'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BLANK = { make: '', model: '', year: '', regNumber: '', vin: '', colour: '', customerId: '' };

const CarIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="anim-float" style={{color:'var(--text-muted)'}}>
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
  </svg>
);

export default function VehiclesClient({ initialVehicles, customers, userRole }) {
  const [vehicles, setVehicles] = useState(initialVehicles || []);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editVehicle, setEditVehicle] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);
  const [editLoading, setEditLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const filtered = useMemo(() => vehicles.filter(v =>
    !search || `${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase()) ||
    v.regNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.customer?.name?.toLowerCase().includes(search.toLowerCase())
  ), [vehicles, search]);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    const payload = { ...form, year: form.year ? parseInt(form.year) : null };
    const res = await fetch('/api/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setLoading(false);
    if (res.ok) {
      const created = await res.json();
      const customer = customers.find(c => c.id === created.customerId);
      setVehicles([{ ...created, customer, _count: { jobs: 0 } }, ...vehicles]);
      setForm(BLANK); setShowForm(false);
      flash('Vehicle registered successfully.');
    }
  };

  const openEdit = (v) => {
    setEditVehicle(v);
    setEditForm({ make: v.make, model: v.model, year: v.year?.toString() || '', regNumber: v.regNumber || '', vin: v.vin || '', colour: v.colour || '', customerId: v.customerId });
  };

  const saveEdit = async (e) => {
    e.preventDefault(); setEditLoading(true);
    const payload = { ...editForm, year: editForm.year ? parseInt(editForm.year) : null };
    const res = await fetch(`/api/vehicles/${editVehicle.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setEditLoading(false);
    if (res.ok) {
      const updated = await res.json();
      const customer = customers.find(c => c.id === updated.customerId);
      setVehicles(vehicles.map(v => v.id === updated.id ? { ...v, ...updated, customer } : v));
      setEditVehicle(null);
      flash('Vehicle updated.');
    }
  };

  const deleteVehicle = async () => {
    const res = await fetch(`/api/vehicles/${deleteId}`, { method: 'DELETE' });
    if (res.ok) { setVehicles(vehicles.filter(v => v.id !== deleteId)); setDeleteId(null); flash('Vehicle deleted.'); }
  };

  return (
    <div className="anim-up">
      <div className="page-hdr">
        <div>
          <div className="page-title">Vehicles</div>
          <div className="page-sub">{vehicles.length} registered vehicle{vehicles.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn" onClick={() => setShowForm(s => !s)}>{showForm ? '✕ Cancel' : '+ Register Vehicle'}</button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? '✓' : '⚠'} {msg.text}</div>}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">Register New Vehicle</div>
            </div>
            <div className="card-body">
              <form onSubmit={submit}>
                <div className="form-grid-3">
                  <div className="col-span-2"><label className="form-label">Owner (Customer) *</label>
                    <select className="sel" required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="form-label">Colour</label><input className="inp" placeholder="Silver" value={form.colour} onChange={e => setForm({ ...form, colour: e.target.value })} /></div>
                  <div><label className="form-label">Make *</label><input className="inp" placeholder="Toyota" required value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} /></div>
                  <div><label className="form-label">Model *</label><input className="inp" placeholder="Corolla" required value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
                  <div><label className="form-label">Year</label><input type="number" className="inp" placeholder="2020" min="1970" max="2030" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
                  <div><label className="form-label">Reg Number</label><input className="inp" placeholder="LP 123 GP" value={form.regNumber} onChange={e => setForm({ ...form, regNumber: e.target.value })} /></div>
                  <div className="col-span-2"><label className="form-label">VIN Number</label><input className="inp" placeholder="17-character VIN" value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value })} /></div>
                </div>
                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving…' : 'Register Vehicle'}</button>
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
          <input className="search-inp" placeholder="Search make, model, reg or owner…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <CarIcon />
            <div className="empty-title">{search ? 'No vehicles match your search' : 'No vehicles registered'}</div>
            <div className="empty-sub">{!search && 'Register the first vehicle to begin'}</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Vehicle</th><th>Reg Number</th><th>Owner</th><th>Colour</th><th>Jobs</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((v, i) => (
                  <motion.tr key={v.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="cell-main">{v.make} {v.model}</div>
                      <div className="cell-sub">{v.year || 'Year unknown'}{v.vin ? ` · ${v.vin}` : ''}</div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-muted)', padding: '3px 8px', borderRadius: 5, border: '1px solid var(--primary-border)' }}>{v.regNumber || '—'}</span></td>
                    <td>{v.customer?.name || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{v.colour || '—'}</td>
                    <td><span className="badge b-in_progress">{v._count?.jobs ?? 0}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(v)}>Edit</button>
                        {userRole === 'ADMIN' && <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(v.id)}>Delete</button>}
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
        {editVehicle && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setEditVehicle(null)}>
            <motion.div className="modal" style={{ maxWidth: 560 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <div className="modal-title">Edit Vehicle — {editVehicle.make} {editVehicle.model}</div>
                <button className="modal-close" onClick={() => setEditVehicle(null)}>×</button>
              </div>
              <form onSubmit={saveEdit}>
                <div className="modal-body">
                  <div className="form-grid-3">
                    <div className="col-span-2"><label className="form-label">Owner *</label>
                      <select className="sel" required value={editForm.customerId} onChange={e => setEditForm({ ...editForm, customerId: e.target.value })}>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div><label className="form-label">Colour</label><input className="inp" value={editForm.colour} onChange={e => setEditForm({ ...editForm, colour: e.target.value })} /></div>
                    <div><label className="form-label">Make *</label><input className="inp" required value={editForm.make} onChange={e => setEditForm({ ...editForm, make: e.target.value })} /></div>
                    <div><label className="form-label">Model *</label><input className="inp" required value={editForm.model} onChange={e => setEditForm({ ...editForm, model: e.target.value })} /></div>
                    <div><label className="form-label">Year</label><input type="number" className="inp" min="1970" max="2030" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })} /></div>
                    <div><label className="form-label">Reg Number</label><input className="inp" value={editForm.regNumber} onChange={e => setEditForm({ ...editForm, regNumber: e.target.value })} /></div>
                    <div className="col-span-2"><label className="form-label">VIN</label><input className="inp" value={editForm.vin} onChange={e => setEditForm({ ...editForm, vin: e.target.value })} /></div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditVehicle(null)}>Cancel</button>
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
              <div className="modal-header"><div className="modal-title">Delete Vehicle?</div></div>
              <div className="modal-body"><p style={{ color: 'var(--text-light)', fontSize: 14, lineHeight: 1.6 }}>This will delete the vehicle and all associated job cards. This cannot be undone.</p></div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={deleteVehicle}>Delete Vehicle</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
