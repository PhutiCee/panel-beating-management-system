import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';

const StatIcon = ({ children, color, bg }) => (
  <div className="stat-icon" style={{ background: bg }}>
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      {children}
    </svg>
  </div>
);

const STATUS_LABELS = { NEW: 'New', QUOTED: 'Quoted', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', INVOICED: 'Invoiced', CLOSED: 'Closed' };
const STATUS_CSS = { NEW: 'b-new', QUOTED: 'b-quoted', IN_PROGRESS: 'b-in_progress', COMPLETED: 'b-completed', INVOICED: 'b-invoiced', CLOSED: 'b-closed' };

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const role = session.user.role;
  const userId = session.user.id;

  const where = role === 'TECHNICIAN' ? { assignedToId: userId } : {};

  const [customers, vehicles, jobs, invoices, recentJobs] = await Promise.all([
    role !== 'TECHNICIAN' ? prisma.customer.count() : Promise.resolve(null),
    role !== 'TECHNICIAN' ? prisma.vehicle.count() : Promise.resolve(null),
    prisma.job.count({ where }),
    role !== 'TECHNICIAN' ? prisma.invoice.count() : Promise.resolve(null),
    prisma.job.findMany({
      where,
      take: 8,
      orderBy: { updatedAt: 'desc' },
      include: { customer: true, vehicle: true, assignedTo: true },
    }),
  ]);

  const inProgress = await prisma.job.count({ where: { ...where, status: 'IN_PROGRESS' } });
  const completed = await prisma.job.count({ where: { ...where, status: 'COMPLETED' } });

  return (
    <div className="anim-up">
      <div className="page-hdr">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Welcome back, {session.user.name}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
          <div>{new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div style={{ marginTop: 2 }}><span className={`badge b-${role.toLowerCase()}`}>{role}</span></div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {role !== 'TECHNICIAN' && (
          <>
            <div className="stat-card">
              <StatIcon color="#4A8FE7" bg="rgba(74,143,231,0.12)">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </StatIcon>
              <div className="stat-value">{customers}</div>
              <div className="stat-label">Customers</div>
            </div>
            <div className="stat-card">
              <StatIcon color="#8B5CF6" bg="rgba(139,92,246,0.12)">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" />
                <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
              </StatIcon>
              <div className="stat-value">{vehicles}</div>
              <div className="stat-label">Vehicles</div>
            </div>
          </>
        )}
        <div className="stat-card">
          <StatIcon color="#F59E0B" bg="rgba(245,158,11,0.12)">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </StatIcon>
          <div className="stat-value">{jobs}</div>
          <div className="stat-label">{role === 'TECHNICIAN' ? 'My Jobs' : 'Total Jobs'}</div>
        </div>
        <div className="stat-card">
          <StatIcon color="#F59E0B" bg="rgba(245,158,11,0.12)">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </StatIcon>
          <div className="stat-value">{inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <StatIcon color="#22C55E" bg="rgba(34,197,94,0.12)">
            <polyline points="20 6 9 17 4 12" />
          </StatIcon>
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        {role !== 'TECHNICIAN' && (
          <div className="stat-card">
            <StatIcon color="#60A5FA" bg="rgba(96,165,250,0.12)">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </StatIcon>
            <div className="stat-value">{invoices}</div>
            <div className="stat-label">Invoices</div>
          </div>
        )}
      </div>

      {/* Recent Jobs */}
      <div className="card">
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-poppins)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Recent Job Cards</div>
          <Link href="/jobs" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
        </div>
        {recentJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div className="empty-title">No job cards yet</div>
            <div className="empty-sub">Create your first job card to get started</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Job</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Technician</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map(j => (
                <tr key={j.id}>
                  <td>
                    <div className="cell-main">{j.title}</div>
                    {j.description && <div className="cell-sub">{j.description.slice(0, 50)}{j.description.length > 50 ? '…' : ''}</div>}
                  </td>
                  <td>{j.customer?.name || '—'}</td>
                  <td>{j.vehicle ? `${j.vehicle.make} ${j.vehicle.model}` : '—'}</td>
                  <td style={{ color: j.assignedTo ? 'var(--text-light)' : 'var(--text-muted)', fontStyle: j.assignedTo ? 'normal' : 'italic' }}>
                    {j.assignedTo?.name || 'Unassigned'}
                  </td>
                  <td><span className={`badge ${STATUS_CSS[j.status]}`}>{STATUS_LABELS[j.status]}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(j.createdAt).toLocaleDateString('en-ZA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
