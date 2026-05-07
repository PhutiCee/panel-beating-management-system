'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { personName, emailRequired, phoneOptional, passwordRequired, passwordOptional, confirmPassword, passwordStrength } from '@/app/lib/validators';
import { ValidatedField } from '@/app/components/FieldError';

const BLANK = { name: '', email: '', phone: '', role: 'RECEPTION', password: '', confirm: '' };
const ROLES = ['ADMIN', 'RECEPTION', 'TECHNICIAN'];
const ROLE_CSS = { ADMIN: 'b-admin', RECEPTION: 'b-reception', TECHNICIAN: 'b-technician' };

const inpCls = (err, val) => `inp${err ? ' inp-error' : val ? ' inp-ok' : ''}`;

export default function UsersClient({ initialUsers }) {
  const { data: session } = useSession();
  const [users, setUsers] = useState(initialUsers || []);
  const [form, setForm] = useState(BLANK);
  const [touched, setTouched] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editTouched, setEditTouched] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  // ── Validators ────────────────────────────────────────────────────────────
  const createValidators = {
    name: personName,
    email: emailRequired,
    phone: phoneOptional,
    password: passwordRequired,
    confirm: v => confirmPassword(form.password)(v),
  };

  const editValidators = {
    name: personName,
    email: emailRequired,
    phone: phoneOptional,
    password: passwordOptional,
    confirm: v => editForm.password ? confirmPassword(editForm.password)(v) : null,
  };

  const getErrors = (f, vv) =>
    Object.fromEntries(Object.entries(vv).map(([k, fn]) => [k, fn(f[k])]));
  const hasError = e => Object.values(e).some(Boolean);

  const touchAll = (vv, setT) =>
    setT(Object.fromEntries(Object.keys(vv).map(k => [k, true])));

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // ── Submit create ─────────────────────────────────────────────────────────
  const submit = async (e) => {
    e.preventDefault();
    touchAll(createValidators, setTouched);
    if (hasError(getErrors(form, createValidators))) return;
    setLoading(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      const created = await res.json();
      setUsers(prev => [created, ...prev]);
      setForm(BLANK);
      setTouched({});
      setShowForm(false);
      flash('User created successfully.');
    } else {
      const err = await res.json();
      flash(err.error || 'Failed to create user. Email may already exist.', 'error');
    }
  };

  // ── Open edit ─────────────────────────────────────────────────────────────
  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, password: '', confirm: '' });
    setEditTouched({});
  };

  // ── Submit edit ───────────────────────────────────────────────────────────
  const saveEdit = async (e) => {
    e.preventDefault();
    touchAll(editValidators, setEditTouched);
    if (hasError(getErrors(editForm, editValidators))) return;
    setEditLoading(true);
    const payload = { name: editForm.name, email: editForm.email, phone: editForm.phone, role: editForm.role };
    if (editForm.password) payload.password = editForm.password;
    const res = await fetch(`/api/users/${editUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setEditLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditUser(null);
      flash('User updated.');
    } else {
      flash('Update failed. Email may already be in use.', 'error');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteUser = async () => {
    if (deleteId === session?.user?.id) return;
    const res = await fetch(`/api/users/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== deleteId));
      setDeleteId(null);
      flash('User deleted.');
    }
  };

  // ── Password strength (create form) ──────────────────────────────────────
  const strength = passwordStrength(form.password);
  const editStrength = passwordStrength(editForm.password);

  return (
    <div className="anim-up">
      <div className="page-hdr">
        <div>
          <div className="page-title">System Users</div>
          <div className="page-sub">{users.length} user account{users.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn" onClick={() => { setShowForm(s => !s); setForm(BLANK); setTouched({}); }}>
          {showForm ? '✕ Cancel' : '+ Add User'}
        </button>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`}>
          {msg.type === 'success' ? '✓' : '⚠'} {msg.text}
        </div>
      )}

      {/* ── Create Form ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">Create New User</div>
            </div>
            <div className="card-body">
              <form onSubmit={submit} noValidate>
                <div className="form-grid-2">

                  {/* Name */}
                  {(() => {
                    const e = touched.name ? createValidators.name(form.name) : null;
                    return (
                      <ValidatedField label="Full Name" error={e} ok={!!form.name && !createValidators.name(form.name)} required>
                        <input
                          className={inpCls(e, form.name)} placeholder="Staff member name" value={form.name}
                          onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, name: v })); if (touched.name) setTouched(p => ({ ...p, name: true })); }}
                          onBlur={() => setTouched(p => ({ ...p, name: true }))} />
                      </ValidatedField>
                    );
                  })()}

                  {/* Email */}
                  {(() => {
                    const e = touched.email ? createValidators.email(form.email) : null;
                    return (
                      <ValidatedField label="Email Address" error={e} ok={!!form.email && !createValidators.email(form.email)} required>
                        <input
                          type="email" className={inpCls(e, form.email)} placeholder="user@mangena.co.za" value={form.email}
                          onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, email: v })); if (touched.email) setTouched(p => ({ ...p, email: true })); }}
                          onBlur={() => setTouched(p => ({ ...p, email: true }))} />
                      </ValidatedField>
                    );
                  })()}

                  {/* Phone */}
                  {(() => {
                    const e = touched.phone ? createValidators.phone(form.phone) : null;
                    return (
                      <ValidatedField label="Phone Number" error={e} ok={!!form.phone && !createValidators.phone(form.phone)}>
                        <input
                          className={inpCls(e, form.phone)} placeholder="071 234 5678" value={form.phone}
                          onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, phone: v })); if (touched.phone) setTouched(p => ({ ...p, phone: true })); }}
                          onBlur={() => setTouched(p => ({ ...p, phone: true }))} />
                      </ValidatedField>
                    );
                  })()}

                  {/* Role */}
                  <ValidatedField label="Role">
                    <select className="sel" value={form.role}
                      onChange={e => { const v = e.target.value; setForm(p => ({ ...p, role: v })); }}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </ValidatedField>

                  {/* Password */}
                  {(() => {
                    const e = touched.password ? createValidators.password(form.password) : null;
                    return (
                      <ValidatedField label="Password" error={e} required>
                        <input
                          type="password" className={inpCls(e, form.password)} placeholder="Min. 6 characters" value={form.password}
                          onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, password: v })); if (touched.password) setTouched(p => ({ ...p, password: true })); }}
                          onBlur={() => setTouched(p => ({ ...p, password: true }))} />
                        {form.password && (
                          <div style={{ marginTop: 6 }}>
                            <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                              <div style={{ height: '100%', borderRadius: 2, transition: 'all 0.3s', width: `${(strength.score / 5) * 100}%`, background: strength.color }} />
                            </div>
                            {strength.label && (
                              <div style={{ fontSize: 11, color: strength.color, marginTop: 3, fontWeight: 600 }}>
                                {strength.label} password
                              </div>
                            )}
                          </div>
                        )}
                      </ValidatedField>
                    );
                  })()}

                  {/* Confirm Password */}
                  {(() => {
                    const e = touched.confirm ? confirmPassword(form.password)(form.confirm) : null;
                    return (
                      <ValidatedField label="Confirm Password" error={e} ok={!!form.confirm && !confirmPassword(form.password)(form.confirm)} required>
                        <input
                          type="password" className={inpCls(e, form.confirm)} placeholder="Re-enter password" value={form.confirm}
                          onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, confirm: v })); if (touched.confirm) setTouched(p => ({ ...p, confirm: true })); }}
                          onBlur={() => setTouched(p => ({ ...p, confirm: true }))} />
                      </ValidatedField>
                    );
                  })()}

                </div>

                <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Creating…' : 'Create User'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                  {hasError(getErrors(form, createValidators)) && Object.keys(touched).length > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--danger)' }}>⚠ Please fix the errors above</span>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="filter-bar">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input className="search-inp" placeholder="Search users…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
              className="anim-float" style={{ color: 'var(--text-muted)' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <div className="empty-title">No users found</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((u, i) => (
                  <motion.tr key={u.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                          {u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="cell-main">
                          {u.name}
                          {u.id === session?.user?.id && (
                            <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--text-muted)', fontWeight: 400 }}>(you)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{u.email}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.phone || '—'}</td>
                    <td><span className={`badge ${ROLE_CSS[u.role]}`}>{u.role}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString('en-ZA')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(u)}>Edit</button>
                        {u.id !== session?.user?.id && (
                          <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(u.id)}>Delete</button>
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

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editUser && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setEditUser(null)}>
            <motion.div className="modal" style={{ maxWidth: 520 }}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <div className="modal-title">Edit User — {editUser.name}</div>
                <button className="modal-close" onClick={() => setEditUser(null)}>×</button>
              </div>

              <form onSubmit={saveEdit} noValidate>
                <div className="modal-body">
                  <div className="form-grid-2">

                    {/* Name */}
                    <div className="col-span-2">
                      {(() => {
                        const e = editTouched.name ? editValidators.name(editForm.name) : null;
                        return (
                          <ValidatedField label="Full Name" error={e} ok={!!editForm.name && !editValidators.name(editForm.name)} required>
                            <input
                              className={inpCls(e, editForm.name)} value={editForm.name}
                              onChange={ev => { const v = ev.target.value; setEditForm(p => ({ ...p, name: v })); if (editTouched.name) setEditTouched(p => ({ ...p, name: true })); }}
                              onBlur={() => setEditTouched(p => ({ ...p, name: true }))} />
                          </ValidatedField>
                        );
                      })()}
                    </div>

                    {/* Email */}
                    {(() => {
                      const e = editTouched.email ? editValidators.email(editForm.email) : null;
                      return (
                        <ValidatedField label="Email Address" error={e} ok={!!editForm.email && !editValidators.email(editForm.email)} required>
                          <input
                            type="email" className={inpCls(e, editForm.email)} value={editForm.email}
                            onChange={ev => { const v = ev.target.value; setEditForm(p => ({ ...p, email: v })); if (editTouched.email) setEditTouched(p => ({ ...p, email: true })); }}
                            onBlur={() => setEditTouched(p => ({ ...p, email: true }))} />
                        </ValidatedField>
                      );
                    })()}

                    {/* Phone */}
                    {(() => {
                      const e = editTouched.phone ? editValidators.phone(editForm.phone) : null;
                      return (
                        <ValidatedField label="Phone Number" error={e} ok={!!editForm.phone && !editValidators.phone(editForm.phone)}>
                          <input
                            className={inpCls(e, editForm.phone)} value={editForm.phone}
                            onChange={ev => { const v = ev.target.value; setEditForm(p => ({ ...p, phone: v })); if (editTouched.phone) setEditTouched(p => ({ ...p, phone: true })); }}
                            onBlur={() => setEditTouched(p => ({ ...p, phone: true }))} />
                        </ValidatedField>
                      );
                    })()}

                    {/* Role */}
                    <ValidatedField label="Role">
                      <select className="sel" value={editForm.role}
                        disabled={editUser.id === session?.user?.id}
                        onChange={e => { const v = e.target.value; setEditForm(p => ({ ...p, role: v })); }}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {editUser.id === session?.user?.id && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          You cannot change your own role.
                        </div>
                      )}
                    </ValidatedField>

                    {/* New Password */}
                    {(() => {
                      const e = editTouched.password ? editValidators.password(editForm.password) : null;
                      return (
                        <ValidatedField label="New Password" error={e} hint="Leave blank to keep current password">
                          <input
                            type="password" className={inpCls(e, editForm.password)} placeholder="Leave blank to keep current" value={editForm.password}
                            onChange={ev => { const v = ev.target.value; setEditForm(p => ({ ...p, password: v })); if (editTouched.password) setEditTouched(p => ({ ...p, password: true })); }}
                            onBlur={() => setEditTouched(p => ({ ...p, password: true }))} />
                          {editForm.password && (
                            <div style={{ marginTop: 6 }}>
                              <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                                <div style={{ height: '100%', borderRadius: 2, transition: 'all 0.3s', width: `${(editStrength.score / 5) * 100}%`, background: editStrength.color }} />
                              </div>
                              {editStrength.label && (
                                <div style={{ fontSize: 11, color: editStrength.color, marginTop: 3, fontWeight: 600 }}>
                                  {editStrength.label} password
                                </div>
                              )}
                            </div>
                          )}
                        </ValidatedField>
                      );
                    })()}

                    {/* Confirm — only shown when typing a new password */}
                    {editForm.password ? (
                      (() => {
                        const e = editTouched.confirm ? confirmPassword(editForm.password)(editForm.confirm) : null;
                        return (
                          <ValidatedField label="Confirm New Password" error={e} ok={!!editForm.confirm && !confirmPassword(editForm.password)(editForm.confirm)} required>
                            <input
                              type="password" className={inpCls(e, editForm.confirm)} placeholder="Re-enter new password" value={editForm.confirm}
                              onChange={ev => { const v = ev.target.value; setEditForm(p => ({ ...p, confirm: v })); if (editTouched.confirm) setEditTouched(p => ({ ...p, confirm: true })); }}
                              onBlur={() => setEditTouched(p => ({ ...p, confirm: true }))} />
                          </ValidatedField>
                        );
                      })()
                    ) : <div />}

                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
                  <button type="submit" className="btn" disabled={editLoading}>
                    {editLoading ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" style={{ maxWidth: 380 }}
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header"><div className="modal-title">Delete User?</div></div>
              <div className="modal-body">
                <p style={{ color: 'var(--text-light)', fontSize: 14, lineHeight: 1.6 }}>
                  This account will be permanently deleted. Assigned jobs will remain but become unassigned.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={deleteUser}>Delete User</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}