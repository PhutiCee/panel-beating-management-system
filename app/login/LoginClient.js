'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { emailRequired, passwordRequired } from '@/app/lib/validators';
import { ValidatedField } from '@/app/components/FieldError';

const inpCls = (err, val) => `inp${err ? ' inp-error' : val ? ' inp-ok' : ''}`;

const DEMO_USERS = [
    { label: 'Admin', email: 'admin@mangena.co.za', pass: 'admin123', desc: 'Full system access' },
    { label: 'Reception', email: 'reception@mangena.co.za', pass: 'reception123', desc: 'Customers, jobs, invoices' },
    { label: 'Technician', email: 'tech@mangena.co.za', pass: 'tech123', desc: 'Assigned jobs only' },
];

export default function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const params = useSearchParams();
    const { data: session, status } = useSession();

    useEffect(() => { if (status === 'authenticated') router.push('/'); }, [status, router]);

    const emailErr = emailTouched ? emailRequired(email) : null;
    const passwordErr = passwordTouched ? passwordRequired(password) : null;
    const canSubmit = !emailErr && !passwordErr && email && password;

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setEmailTouched(true); setPasswordTouched(true);
        if (!canSubmit && !email) return;
        setLoading(true); setError('');
        const res = await signIn('credentials', { email, password, redirect: false });
        setLoading(false);
        if (res?.ok) router.push(params.get('callbackUrl') || '/');
        else setError('Incorrect email or password. Please try again.');
    };

    const quickLogin = (u) => { setEmail(u.email); setPassword(u.pass); setEmailTouched(false); setPasswordTouched(false); setError(''); };

    if (status === 'loading') return null;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
            <div style={{ width: '100%', maxWidth: 940, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-hi)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>

                {/* Left — Branding */}
                <div style={{ background: 'var(--surface)', padding: '44px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
                            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#4A8FE7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin-slow 8s linear infinite' }}>
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                            <div>
                                <div style={{ fontFamily: 'var(--font-poppins)', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Mangena Panel Beater</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Management Information System</div>
                            </div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-poppins)', fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 10 }}>
                            Workshop management, simplified.
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
                            Manage job cards, customers, vehicles, and invoices from one place. Built for real workshop workflow.
                        </div>
                    </div>

                    {/* Demo logins */}
                    <div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10, fontWeight: 600 }}>
                            Quick Login (Demo)
                        </div>
                        {DEMO_USERS.map(u => (
                            <button key={u.email} onClick={() => quickLogin(u)} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}
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
                <div style={{ background: 'var(--card)', padding: '44px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-poppins)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Sign In</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Enter your credentials to access the system</div>

                    {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠ {error}</div>}

                    <form onSubmit={handleSubmit} noValidate>
                        <div style={{ marginBottom: 18 }}>
                            <ValidatedField label="Email Address" error={emailErr} ok={!!email && !emailErr} required>
                                <input
                                    className={inpCls(emailErr, email)}
                                    type="email" placeholder="you@mangena.co.za" value={email} autoFocus
                                    onChange={e => { setEmail(e.target.value); if (emailTouched) setEmailTouched(true); }}
                                    onBlur={() => setEmailTouched(true)} />
                            </ValidatedField>
                        </div>
                        <div style={{ marginBottom: 28 }}>
                            <ValidatedField label="Password" error={passwordErr} required>
                                <input
                                    className={inpCls(passwordErr, password)}
                                    type="password" placeholder="••••••••" value={password}
                                    onChange={e => { setPassword(e.target.value); if (passwordTouched) setPasswordTouched(true); }}
                                    onBlur={() => setPasswordTouched(true)} />
                            </ValidatedField>
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%', padding: '11px', fontSize: 14 }} disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    {/* Register link */}
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Setting up a new workshop?</div>
                        <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: 'var(--surface)', border: '1px solid var(--border-hi)', borderRadius: 8, color: 'var(--text-light)', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-border)'; e.currentTarget.style.color = 'var(--primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.color = 'var(--text-light)'; }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                            Register New Workshop
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
