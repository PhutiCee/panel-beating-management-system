'use client';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = ['NEW', 'QUOTED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'CLOSED'];
const STATUS_LABELS = { NEW: 'New', QUOTED: 'Quoted', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', INVOICED: 'Invoiced', CLOSED: 'Closed' };
const STATUS_CSS = { NEW: 'b-new', QUOTED: 'b-quoted', IN_PROGRESS: 'b-in_progress', COMPLETED: 'b-completed', INVOICED: 'b-invoiced', CLOSED: 'b-closed' };

const BLANK = { title: '', description: '', customerId: '', vehicleId: '', assignedToId: '', startDate: '', endDate: '' };

const WrenchIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', animation: 'spin-slow 6s linear infinite' }}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

export default function JobsClient({ initialJobs, customers, vehicles, technicians, userRole, userId }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs || []);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [msg, setMsg] = useState(null);

  const vehiclesByCustomer = useMemo(() => {
    const map = {};
    for (const v of vehicles) {
      if (!map[v.customerId]) map[v.customerId] = [];
      map[v.customerId].push(v);
    }
    return map;
  }, [vehicles]);

  const filtered = useMemo(() => jobs.filter(j => {
    const matchStatus = filter === 'ALL' || j.status === filter;
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.customer?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }), [jobs, filter, search]);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500); };

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) {
      const created = await res.json();
      setJobs([created, ...jobs]); setForm(BLANK); setShowForm(false);
      flash('Job card created.');
    }
  };

  const openEdit = (j) => {
    setEditJob(j);
    setEditForm({ title: j.title, description: j.description || '', customerId: j.customerId, vehicleId: j.vehicleId, assignedToId: j.assignedToId || '', startDate: j.startDate ? new Date(j.startDate).toISOString().slice(0, 10) : '', endDate: j.endDate ? new Date(j.endDate).toISOString().slice(0, 10) : '', status: j.status });
  };

  const saveEdit = async (e) => {
    e.preventDefault(); setEditLoading(true);
    const payload = userRole === 'TECHNICIAN' ? { status: editForm.status } : editForm;
    const res = await fetch(`/api/jobs/${editJob.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setEditLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setJobs(jobs.map(j => j.id === updated.id ? { ...j, ...updated } : j));
      setEditJob(null); flash('Job card updated.');
    }
  };

  const deleteJob = async () => {
    const res = await fetch(`/api/jobs/${deleteId}`, { method: 'DELETE' });
    if (res.ok) { setJobs(jobs.filter(j => j.id !== deleteId)); setDeleteId(null); flash('Job card deleted.'); }
  };

  const createInvoice = (job) => {
    router.push(`/invoices?newFor=${job.id}`);
  };

  const canCreate = userRole !== 'TECHNICIAN';
  const canDelete = userRole === 'ADMIN';

  return (
    <div className="anim-up">
      <div className="page-hdr">
        <div>
          <div className="page-title">Job Cards</div>
          <div className="page-sub">{userRole === 'TECHNICIAN' ? 'Your assigned repair jobs' : `${jobs.length} total job${jobs.length !== 1 ? 's' : ''}`}</div>
        </div>
        {canCreate && <button className="btn" onClick={() => setShowForm(s => !s)}>{showForm ? '✕ Cancel' : '+ New Job Card'}</button>}
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? '✓' : '⚠'} {msg.text}</div>}

      {/* Create Form */}
      <AnimatePresence>
        {showForm && canCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">New Job Card</div>
            </div>
            <div className="card-body">
              <form onSubmit={submit}>
                <div className="form-grid-2">
                  <div className="col-span-2"><label className="form-label">Job Title *</label><input className="inp" placeholder="e.g. Front bumper repair & respray" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="col-span-2"><label className="form-label">Description</label><textarea className="inp" placeholder="Describe the damage and work required" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div><label className="form-label">Customer *</label>
                    <select className="sel" required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value, vehicleId: '' })}>
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="form-label">Vehicle *</label>
                    <select className="sel" required value={form.vehicleId} disabled={!form.customerId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                      <option value="">Select Vehicle</option>
                      {(vehiclesByCustomer[form.customerId] || []).map(v => (<option key={v.id} value={v.id}>{v.make} {v.model} {v.year} — {v.regNumber || 'No Reg'}</option>))}
                    </select>
                  </div>
                  {userRole === 'ADMIN' && <div><label className="form-label">Assign Technician</label>
                    <select className="sel" value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
                      <option value="">Unassigned</option>
                      {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>}
                  <div><label className="form-label">Start Date</label><input type="date" className="inp" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                </div>
                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn" disabled={loading}>{loading ? 'Creating…' : 'Create Job Card'}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input className="search-inp" placeholder="Search jobs or customers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-chips">
          {['ALL', ...STATUS_OPTIONS].map(s => (
            <button key={s} className={`chip${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'ALL' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <WrenchIcon />
            <div className="empty-title">{search || filter !== 'ALL' ? 'No jobs match your filter' : 'No job cards yet'}</div>
            <div className="empty-sub">{!search && filter === 'ALL' && canCreate && 'Create your first job card above'}</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Job</th><th>Customer</th><th>Vehicle</th><th>Technician</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((j, i) => (
                  <motion.tr key={j.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="cell-main">{j.title}</div>
                      {j.description && <div className="cell-sub">{j.description.slice(0, 55)}{j.description.length > 55 ? '…' : ''}</div>}
                    </td>
                    <td>{j.customer?.name || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {j.vehicle ? <><div>{j.vehicle.make} {j.vehicle.model}</div><div style={{ color: 'var(--text-muted)' }}>{j.vehicle.regNumber || ''}</div></> : '—'}
                    </td>
                    <td style={{ color: j.assignedTo ? 'var(--text-light)' : 'var(--text-muted)', fontStyle: j.assignedTo ? 'normal' : 'italic', fontSize: 12 }}>
                      {j.assignedTo?.name || 'Unassigned'}
                    </td>
                    <td><span className={`badge ${STATUS_CSS[j.status]}`}>{STATUS_LABELS[j.status]}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(j.createdAt).toLocaleDateString('en-ZA')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(j)}>Edit</button>
                        {canCreate && (j.status === 'COMPLETED' || j.status === 'INVOICED') && !j.invoice && (
                          <button className="btn btn-sm btn-success" onClick={() => createInvoice(j)} title="Create invoice for this job">Invoice</button>
                        )}
                        {canDelete && <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(j.id)}>Delete</button>}
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
        {editJob && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setEditJob(null)}>
            <motion.div className="modal" style={{ maxWidth: 600 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <div className="modal-title">Edit Job — {editJob.title}</div>
                <button className="modal-close" onClick={() => setEditJob(null)}>×</button>
              </div>
              <form onSubmit={saveEdit}>
                <div className="modal-body">
                  {userRole === 'TECHNICIAN' ? (
                    <div><label className="form-label">Update Status</label>
                      <select className="sel" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>As a technician, you can update the job status only.</p>
                    </div>
                  ) : (
                    <div className="form-grid-2">
                      <div className="col-span-2"><label className="form-label">Job Title *</label><input className="inp" required value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                      <div className="col-span-2"><label className="form-label">Description</label><textarea className="inp" rows={2} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
                      <div><label className="form-label">Customer</label>
                        <select className="sel" value={editForm.customerId} onChange={e => setEditForm({ ...editForm, customerId: e.target.value, vehicleId: '' })}>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div><label className="form-label">Vehicle</label>
                        <select className="sel" value={editForm.vehicleId} onChange={e => setEditForm({ ...editForm, vehicleId: e.target.value })}>
                          <option value="">Select Vehicle</option>
                          {(vehiclesByCustomer[editForm.customerId] || []).map(v => <option key={v.id} value={v.id}>{v.make} {v.model} — {v.regNumber || 'No Reg'}</option>)}
                        </select>
                      </div>
                      {userRole === 'ADMIN' && <div><label className="form-label">Technician</label>
                        <select className="sel" value={editForm.assignedToId} onChange={e => setEditForm({ ...editForm, assignedToId: e.target.value })}>
                          <option value="">Unassigned</option>
                          {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>}
                      <div><label className="form-label">Status</label>
                        <select className="sel" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      </div>
                      <div><label className="form-label">Start Date</label><input type="date" className="inp" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} /></div>
                      <div><label className="form-label">End Date</label><input type="date" className="inp" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} /></div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditJob(null)}>Cancel</button>
                  <button type="submit" className="btn" disabled={editLoading}>{editLoading ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" style={{ maxWidth: 400 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header"><div className="modal-title">Delete Job Card?</div></div>
              <div className="modal-body"><p style={{ color: 'var(--text-light)', fontSize: 14, lineHeight: 1.6 }}>This will permanently remove the job card and all related data. This cannot be undone.</p></div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={deleteJob}>Delete Job</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
