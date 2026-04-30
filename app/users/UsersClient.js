'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

const BLANK = { name: '', email: '', phone: '', role: 'RECEPTION', password: '' };
const ROLES = ['ADMIN', 'RECEPTION', 'TECHNICIAN'];
const ROLE_CSS = { ADMIN: 'b-admin', RECEPTION: 'b-reception', TECHNICIAN: 'b-technician' };

const UserIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="anim-float" style={{color:'var(--text-muted)'}}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function UsersClient({ initialUsers }) {
  const { data: session } = useSession();
  const [users, setUsers] = useState(initialUsers || []);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) {
      const created = await res.json();
      setUsers([created, ...users]); setForm(BLANK); setShowForm(false);
      flash('User created successfully.');
    } else {
      const err = await res.json();
      flash(err.error || 'Failed to create user.', 'error');
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, password: '' });
  };

  const saveEdit = async (e) => {
    e.preventDefault(); setEditLoading(true);
    const payload = { name: editForm.name, email: editForm.email, phone: editForm.phone, role: editForm.role };
    if (editForm.password) payload.password = editForm.password;
    const res = await fetch(`/api/users/${editUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setEditLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setUsers(users.map(u => u.id === updated.id ? updated : u));
      setEditUser(null); flash('User updated.');
    }
  };

  const deleteUser = async () => {
    if (deleteId === session?.user?.id) return;
    const res = await fetch(`/api/users/${deleteId}`, { method: 'DELETE' });
    if (res.ok) { setUsers(users.filter(u => u.id !== deleteId)); setDeleteId(null); flash('User deleted.'); }
  };

  return (
    <div className="anim-up">
      <div className="page-hdr">
        <div>
          <div className="page-title">System Users</div>
          <div className="page-sub">{users.length} user account{users.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn" onClick={() => setShowForm(s => !s)}>{showForm ? '✕ Cancel' : '+ Add User'}</button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? '✓' : '⚠'} {msg.text}</div>}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">Create New User</div>
            </div>
            <div className="card-body">
              <form onSubmit={submit}>
                <div className="form-grid-2">
                  <div><label className="form-label">Full Name *</label><input className="inp" required placeholder="Staff member name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label className="form-label">Email *</label><input type="email" className="inp" required placeholder="user@mangena.co.za" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><label className="form-label">Phone</label><input className="inp" placeholder="071 234 5678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><label className="form-label">Role</label>
                    <select className="sel" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><label className="form-label">Password *</label><input type="password" className="inp" required placeholder="Minimum 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                </div>
                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn" disabled={loading}>{loading ? 'Creating…' : 'Create User'}</button>
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
          <input className="search-inp" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><UserIcon /><div className="empty-title">No users found</div></div>
        ) : (
          <table className="tbl">
            <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                          {u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="cell-main">{u.name}{u.id === session?.user?.id && <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--text-muted)', fontWeight: 400 }}>(you)</span>}</div>
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
                        {u.id !== session?.user?.id && <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(u.id)}>Delete</button>}
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
        {editUser && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setEditUser(null)}>
            <motion.div className="modal" style={{ maxWidth: 520 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header">
                <div className="modal-title">Edit User — {editUser.name}</div>
                <button className="modal-close" onClick={() => setEditUser(null)}>×</button>
              </div>
              <form onSubmit={saveEdit}>
                <div className="modal-body">
                  <div className="form-grid-2">
                    <div className="col-span-2"><label className="form-label">Full Name *</label><input className="inp" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                    <div><label className="form-label">Email *</label><input type="email" className="inp" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                    <div><label className="form-label">Phone</label><input className="inp" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                    <div><label className="form-label">Role</label>
                      <select className="sel" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} disabled={editUser.id === session?.user?.id}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {editUser.id === session?.user?.id && <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>You cannot change your own role.</div>}
                    </div>
                    <div><label className="form-label">New Password</label><input type="password" className="inp" placeholder="Leave blank to keep current" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} /></div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
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
            <motion.div className="modal" style={{ maxWidth: 380 }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="modal-header"><div className="modal-title">Delete User?</div></div>
              <div className="modal-body"><p style={{ color: 'var(--text-light)', fontSize: 14, lineHeight: 1.6 }}>This user account will be permanently deleted. Their assigned jobs will remain but become unassigned.</p></div>
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
