'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { vehicleYear, requiredSelect } from '@/app/lib/validators';
import { ValidatedField } from '@/app/components/FieldError';

const BLANK = { make: '', model: '', year: '', regNumber: '', vin: '', colour: '', customerId: '' };

const validate = {
  make: v => !v?.trim() ? 'Vehicle make is required (e.g. Toyota)' : /\d/.test(v) ? 'Make cannot contain numbers' : null,
  model: v => !v?.trim() ? 'Vehicle model is required (e.g. Hilux)' : null,
  year: vehicleYear,
  customerId: requiredSelect('customer'),
};

const getErrors = f => Object.fromEntries(Object.entries(validate).map(([k, fn]) => [k, fn(f[k])]));
const hasError = e => Object.values(e).some(Boolean);
const inpCls = (err, val) => `inp${err ? ' inp-error' : val ? ' inp-ok' : ''}`;
const selCls = err => `sel${err ? ' sel-error' : ''}`;

export default function VehiclesClient({ initialVehicles, customers, userRole }) {
  const [vehicles, setVehicles] = useState(initialVehicles || []);
  const [form, setForm] = useState(BLANK);
  const [touched, setTouched] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editVehicle, setEditVehicle] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);
  const [editTouched, setEditTouched] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const formErrors = getErrors(form);
  const editErrors = getErrors(editForm);

  const filtered = useMemo(() => vehicles.filter(v =>
    !search ||
    `${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase()) ||
    v.regNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.customer?.name?.toLowerCase().includes(search.toLowerCase())
  ), [vehicles, search]);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  const touchAll = setT =>
    setT(Object.fromEntries(Object.keys(validate).map(k => [k, true])));

  const submit = async (e) => {
    e.preventDefault();
    touchAll(setTouched);
    if (hasError(formErrors)) return;
    setLoading(true);
    const payload = { ...form, year: form.year ? parseInt(form.year) : null };
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) {
      const created = await res.json();
      const customer = customers.find(c => c.id === created.customerId);
      setVehicles(prev => [{ ...created, customer, _count: { jobs: 0 } }, ...prev]);
      setForm(BLANK);
      setTouched({});
      setShowForm(false);
      flash('Vehicle registered successfully.');
    } else {
      flash('Registration failed. Registration number or VIN may already exist.', 'error');
    }
  };

  const openEdit = (v) => {
    setEditVehicle(v);
    setEditForm({
      make: v.make,
      model: v.model,
      year: v.year?.toString() || '',
      regNumber: v.regNumber || '',
      vin: v.vin || '',
      colour: v.colour || '',
      customerId: v.customerId,
    });
    setEditTouched({});
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    touchAll(setEditTouched);
    if (hasError(editErrors)) return;
    setEditLoading(true);
    const payload = { ...editForm, year: editForm.year ? parseInt(editForm.year) : null };
    const res = await fetch(`/api/vehicles/${editVehicle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setEditLoading(false);
    if (res.ok) {
      const updated = await res.json();
      const customer = customers.find(c => c.id === updated.customerId);
      setVehicles(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated, customer } : v));
      setEditVehicle(null);
      flash('Vehicle updated.');
    } else {
      flash('Update failed. Registration number or VIN may already exist.', 'error');
    }
  };

  const deleteVehicle = async () => {
    const res = await fetch(`/api/vehicles/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      setVehicles(prev => prev.filter(v => v.id !== deleteId));
      setDeleteId(null);
      flash('Vehicle deleted.');
    }
  };

  return (
    <div className="anim-up">
      <div className="page-hdr">
        <div>
          <div className="page-title">Vehicles</div>
          <div className="page-sub">{vehicles.length} registered vehicle{vehicles.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn" onClick={() => { setShowForm(s => !s); setForm(BLANK); setTouched({}); }}>
          {showForm ? '✕ Cancel' : '+ Register Vehicle'}
        </button>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`}>
          {msg.type === 'success' ? '✓' : '⚠'} {msg.text}
        </div>
      )}

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">Register New Vehicle</div>
            </div>
            <div className="card-body">
              <form onSubmit={submit} noValidate>
                <div className="form-grid-3">

                  {/* Customer */}
                  <div className="col-span-2">
                    {(() => {
                      const e = touched.customerId ? validate.customerId(form.customerId) : null;
                      return (
                        <ValidatedField label="Owner (Customer)" error={e} required>
                          <select
                            className={selCls(e)}
                            value={form.customerId}
                            onChange={ev => {
                              const v = ev.target.value;
                              setForm(p => ({ ...p, customerId: v }));
                              setTouched(p => ({ ...p, customerId: true }));
                            }}
                            onBlur={() => setTouched(p => ({ ...p, customerId: true }))}>
                            <option value="">— Select Customer —</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </ValidatedField>
                      );
                    })()}
                  </div>

                  {/* Colour */}
                  <ValidatedField label="Colour">
                    <input className="inp" placeholder="Silver" value={form.colour}
                      onChange={e => { const v = e.target.value; setForm(p => ({ ...p, colour: v })); }} />
                  </ValidatedField>

                  {/* Make */}
                  {(() => {
                    const e = touched.make ? validate.make(form.make) : null;
                    return (
                      <ValidatedField label="Make" error={e} ok={!!form.make && !validate.make(form.make)} required>
                        <input
                          className={inpCls(e, form.make)} placeholder="Toyota" value={form.make}
                          onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, make: v })); if (touched.make) setTouched(p => ({ ...p, make: true })); }}
                          onBlur={() => setTouched(p => ({ ...p, make: true }))} />
                      </ValidatedField>
                    );
                  })()}

                  {/* Model */}
                  {(() => {
                    const e = touched.model ? validate.model(form.model) : null;
                    return (
                      <ValidatedField label="Model" error={e} ok={!!form.model && !validate.model(form.model)} required>
                        <input
                          className={inpCls(e, form.model)} placeholder="Hilux" value={form.model}
                          onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, model: v })); if (touched.model) setTouched(p => ({ ...p, model: true })); }}
                          onBlur={() => setTouched(p => ({ ...p, model: true }))} />
                      </ValidatedField>
                    );
                  })()}

                  {/* Year */}
                  {(() => {
                    const e = touched.year ? validate.year(form.year) : null;
                    return (
                      <ValidatedField label="Year" error={e} ok={!!form.year && !validate.year(form.year)}>
                        <input
                          type="number" className={inpCls(e, form.year)} placeholder="2020" value={form.year}
                          onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, year: v })); if (touched.year) setTouched(p => ({ ...p, year: true })); }}
                          onBlur={() => setTouched(p => ({ ...p, year: true }))} />
                      </ValidatedField>
                    );
                  })()}

                  {/* Reg Number */}
                  <ValidatedField label="Reg Number">
                    <input className="inp" placeholder="LP 123 GP" value={form.regNumber}
                      onChange={e => { const v = e.target.value; setForm(p => ({ ...p, regNumber: v })); }} />
                  </ValidatedField>

                  {/* VIN */}
                  <div className="col-span-2">
                    <ValidatedField label="VIN Number">
                      <input className="inp" placeholder="17-character VIN" value={form.vin}
                        onChange={e => { const v = e.target.value; setForm(p => ({ ...p, vin: v })); }} />
                    </ValidatedField>
                  </div>

                </div>

                <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Saving…' : 'Register Vehicle'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                  {hasError(formErrors) && Object.keys(touched).length > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--danger)' }}>⚠ Please fix the errors above</span>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="filter-bar">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input className="search-inp" placeholder="Search make, model, reg or owner…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
              className="anim-float" style={{ color: 'var(--text-muted)' }}>
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" />
              <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
            </svg>
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
                  <motion.tr key={v.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="cell-main">{v.make} {v.model}</div>
                      <div className="cell-sub">{v.year || 'Year unknown'}{v.vin ? ` · ${v.vin}` : ''}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-muted)', padding: '3px 8px', borderRadius: 5, border: '1px solid var(--primary-border)' }}>
                        {v.regNumber || '—'}
                      </span>
                    </td>
                    <td>{v.customer?.name || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{v.colour || '—'}</td>
                    <td><span className="badge b-in_progress">{v._count?.jobs ?? 0}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(v)}>Edit</button>
                        {userRole === 'ADMIN' && (
                          <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(v.id)}>Delete</button>
                        )}
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
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setEditVehicle(null)}>
            <motion.div className="modal" style={{ maxWidth: 560 }}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <div className="modal-title">Edit Vehicle — {editVehicle.make} {editVehicle.model}</div>
                <button className="modal-close" onClick={() => setEditVehicle(null)}>×</button>
              </div>

              <form onSubmit={saveEdit} noValidate>
                <div className="modal-body">
                  <div className="form-grid-3">

                    {/* Customer */}
                    <div className="col-span-2">
                      {(() => {
                        const e = editTouched.customerId ? validate.customerId(editForm.customerId) : null;
                        return (
                          <ValidatedField label="Owner (Customer)" error={e} required>
                            <select
                              className={selCls(e)}
                              value={editForm.customerId}
                              onChange={ev => {
                                const v = ev.target.value;
                                setEditForm(p => ({ ...p, customerId: v }));
                                setEditTouched(p => ({ ...p, customerId: true }));
                              }}
                              onBlur={() => setEditTouched(p => ({ ...p, customerId: true }))}>
                              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </ValidatedField>
                        );
                      })()}
                    </div>

                    {/* Colour */}
                    <ValidatedField label="Colour">
                      <input className="inp" value={editForm.colour}
                        onChange={e => { const v = e.target.value; setEditForm(p => ({ ...p, colour: v })); }} />
                    </ValidatedField>

                    {/* Make */}
                    {(() => {
                      const e = editTouched.make ? validate.make(editForm.make) : null;
                      return (
                        <ValidatedField label="Make" error={e} ok={!!editForm.make && !validate.make(editForm.make)} required>
                          <input
                            className={inpCls(e, editForm.make)} value={editForm.make}
                            onChange={ev => { const v = ev.target.value; setEditForm(p => ({ ...p, make: v })); if (editTouched.make) setEditTouched(p => ({ ...p, make: true })); }}
                            onBlur={() => setEditTouched(p => ({ ...p, make: true }))} />
                        </ValidatedField>
                      );
                    })()}

                    {/* Model */}
                    {(() => {
                      const e = editTouched.model ? validate.model(editForm.model) : null;
                      return (
                        <ValidatedField label="Model" error={e} ok={!!editForm.model && !validate.model(editForm.model)} required>
                          <input
                            className={inpCls(e, editForm.model)} value={editForm.model}
                            onChange={ev => { const v = ev.target.value; setEditForm(p => ({ ...p, model: v })); if (editTouched.model) setEditTouched(p => ({ ...p, model: true })); }}
                            onBlur={() => setEditTouched(p => ({ ...p, model: true }))} />
                        </ValidatedField>
                      );
                    })()}

                    {/* Year */}
                    {(() => {
                      const e = editTouched.year ? validate.year(editForm.year) : null;
                      return (
                        <ValidatedField label="Year" error={e} ok={!!editForm.year && !validate.year(editForm.year)}>
                          <input
                            type="number" className={inpCls(e, editForm.year)} value={editForm.year}
                            onChange={ev => { const v = ev.target.value; setEditForm(p => ({ ...p, year: v })); if (editTouched.year) setEditTouched(p => ({ ...p, year: true })); }}
                            onBlur={() => setEditTouched(p => ({ ...p, year: true }))} />
                        </ValidatedField>
                      );
                    })()}

                    {/* Reg Number */}
                    <ValidatedField label="Reg Number">
                      <input className="inp" value={editForm.regNumber}
                        onChange={e => { const v = e.target.value; setEditForm(p => ({ ...p, regNumber: v })); }} />
                    </ValidatedField>

                    {/* VIN */}
                    <div className="col-span-2">
                      <ValidatedField label="VIN Number">
                        <input className="inp" value={editForm.vin}
                          onChange={e => { const v = e.target.value; setEditForm(p => ({ ...p, vin: v })); }} />
                      </ValidatedField>
                    </div>

                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditVehicle(null)}>Cancel</button>
                  <button type="submit" className="btn" disabled={editLoading}>
                    {editLoading ? 'Saving…' : 'Save Changes'}
                  </button>
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
            <motion.div className="modal" style={{ maxWidth: 400 }}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header"><div className="modal-title">Delete Vehicle?</div></div>
              <div className="modal-body">
                <p style={{ color: 'var(--text-light)', fontSize: 14, lineHeight: 1.6 }}>
                  This will delete the vehicle and all associated job cards. This cannot be undone.
                </p>
              </div>
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