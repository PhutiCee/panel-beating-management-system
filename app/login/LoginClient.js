'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

const WrenchSVG = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4A8FE7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: 'spin-slow 8s linear infinite' }}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
);

const DEMO_USERS = [
    { label: 'Admin', email: 'admin@mangena.co.za', pass: 'admin123', desc: 'Full system access' },
    { label: 'Reception', email: 'reception@mangena.co.za', pass: 'reception123', desc: 'Customers, jobs, invoices' },
    { label: 'Technician', email: 'tech@mangena.co.za', pass: 'tech123', desc: 'Assigned jobs only' },
];

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const params = useSearchParams();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated') router.push('/');
    }, [status, router]);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setLoading(true); setError('');
        const res = await signIn('credentials', { email, password, redirect: false });
        setLoading(false);
        if (res?.ok) router.push(params.get('callbackUrl') || '/');
        else setError('Invalid email or password. Please try again.');
    };

    const quickLogin = (u) => {
        setEmail(u.email); setPassword(u.pass);
    };

    if (status === 'loading') return null;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
            <div style={{ width: '100%', maxWidth: 920, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-hi)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>

                {/* Left — Branding */}
                <div style={{ background: 'var(--surface)', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
                            <WrenchSVG />
                            <div>
                                <div style={{ fontFamily: 'var(--font-poppins)', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Mangena</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Panel Beater MIS</div>
                            </div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-poppins)', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 12 }}>
                            Workshop Management System
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                            Manage job cards, customers, vehicles, and invoices from one place. Built for real workshop workflow.
                        </div>
                    </div>

                    {/* Demo credentials */}
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10, fontWeight: 600 }}>
                            Quick Login (Demo)
                        </div>
                        {DEMO_USERS.map(u => (
                            <button key={u.email} onClick={() => quickLogin(u)}
                                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-border)'; e.currentTarget.style.background = 'var(--primary-muted)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)'; }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.label}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.desc}</div>
                                    </div>
                                    <span className={`badge b-${u.label.toLowerCase()}`}>{u.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right — Form */}
                <div style={{ background: 'var(--card)', padding: '48px 40px' }}>
                    <div style={{ fontFamily: 'var(--font-poppins)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Sign In</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Enter your credentials to access the system</div>

                    {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠ {error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 18 }}>
                            <label className="form-label">Email Address</label>
                            <input className="inp" type="email" placeholder="you@mangena.co.za" required
                                value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                        </div>
                        <div style={{ marginBottom: 28 }}>
                            <label className="form-label">Password</label>
                            <input className="inp" type="password" placeholder="••••••••" required
                                value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%', padding: '11px', fontSize: 14 }} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: 32, padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Role Access Summary</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                            <div>🔵 <strong style={{ color: 'var(--text-light)' }}>Admin</strong> — Full access, user management</div>
                            <div>🟣 <strong style={{ color: 'var(--text-light)' }}>Reception</strong> — Customers, jobs, invoices</div>
                            <div>🟠 <strong style={{ color: 'var(--text-light)' }}>Technician</strong> — Assigned jobs only</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
