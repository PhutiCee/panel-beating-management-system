'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  personName,
  emailRequired,
  phoneOptional,
  passwordRequired,
  confirmPassword,
  passwordStrength,
} from '@/app/lib/validators';
import { ValidatedField } from '@/app/components/FieldError';

const inpCls = (err, val) => `inp${err ? ' inp-error' : val ? ' inp-ok' : ''}`;

const getErrors = (f) => ({
  businessName: !f.businessName?.trim() ? 'Business name is required' : f.businessName.trim().length < 2 ? 'Business name is too short' : null,
  ownerName: personName(f.ownerName),
  email: emailRequired(f.email),
  phone: phoneOptional(f.phone),
  password: passwordRequired(f.password),
  confirm: confirmPassword(f.password)(f.confirm),
});

const hasError = e => Object.values(e).some(Boolean);

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({ businessName: '', ownerName: '', email: '', phone: '', password: '', confirm: '' });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const errs = getErrors(form);
  const strength = passwordStrength(form.password);

  const touch = field => setTouched(p => ({ ...p, [field]: true }));
  const touchAll = () => setTouched(Object.fromEntries(Object.keys(errs).map(k => [k, true])));

  const handleSubmit = async (e) => {
    e.preventDefault();
    touchAll();
    if (hasError(errs)) return;
    setLoading(true);
    setServerError('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } else {
      const data = await res.json();
      setServerError(data.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="register-wrap">
      <div className="register-card">

        {/* Header */}
        <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A8FE7" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: 'spin-slow 8s linear infinite' }}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            <div>
              <div style={{ fontFamily: 'var(--font-poppins)', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                Register Your Workshop
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Create an Admin account to get started
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--primary)' }}>
            This creates the main <strong>Admin</strong> account for your workshop. After registering,
            sign in and add your staff from the Users section.
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 32px 28px' }}>

          {success ? (
            /* Success state */
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: 'bounce-in 0.5s ease' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <div style={{ fontFamily: 'var(--font-poppins)', fontSize: 18, fontWeight: 700, color: 'var(--success)', marginTop: 12 }}>
                Account created!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                Redirecting you to sign in…
              </div>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} noValidate>

              {serverError && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>
                  ⚠ {serverError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Business Name */}
                {(() => {
                  const e = touched.businessName ? errs.businessName : null;
                  return (
                    <ValidatedField label="Business Name" error={e} ok={!!form.businessName && !errs.businessName} required>
                      <input
                        className={inpCls(e, form.businessName)}
                        placeholder="e.g. Mangena Panel Beater"
                        value={form.businessName}
                        onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, businessName: v })); if (touched.businessName) touch('businessName'); }}
                        onBlur={() => touch('businessName')} />
                    </ValidatedField>
                  );
                })()}

                {/* Owner Name */}
                {(() => {
                  const e = touched.ownerName ? errs.ownerName : null;
                  return (
                    <ValidatedField label="Owner / Admin Full Name" error={e} ok={!!form.ownerName && !errs.ownerName} required>
                      <input
                        className={inpCls(e, form.ownerName)}
                        placeholder="e.g. Thabo Mangena"
                        value={form.ownerName}
                        onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, ownerName: v })); if (touched.ownerName) touch('ownerName'); }}
                        onBlur={() => touch('ownerName')} />
                    </ValidatedField>
                  );
                })()}

                {/* Email */}
                {(() => {
                  const e = touched.email ? errs.email : null;
                  return (
                    <ValidatedField label="Email Address" error={e} ok={!!form.email && !errs.email} required>
                      <input
                        type="email"
                        className={inpCls(e, form.email)}
                        placeholder="admin@yourbusiness.co.za"
                        value={form.email}
                        onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, email: v })); if (touched.email) touch('email'); }}
                        onBlur={() => touch('email')} />
                    </ValidatedField>
                  );
                })()}

                {/* Phone */}
                {(() => {
                  const e = touched.phone ? errs.phone : null;
                  return (
                    <ValidatedField label="Phone Number" error={e} ok={!!form.phone && !errs.phone}>
                      <input
                        className={inpCls(e, form.phone)}
                        placeholder="071 234 5678 (optional)"
                        value={form.phone}
                        onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, phone: v })); if (touched.phone) touch('phone'); }}
                        onBlur={() => touch('phone')} />
                    </ValidatedField>
                  );
                })()}

                {/* Password + strength meter */}
                {(() => {
                  const e = touched.password ? errs.password : null;
                  return (
                    <ValidatedField label="Password" error={e} required>
                      <input
                        type="password"
                        className={inpCls(e, form.password)}
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, password: v })); if (touched.password) touch('password'); }}
                        onBlur={() => touch('password')} />
                      {form.password && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                            <div style={{
                              height: '100%', borderRadius: 2, transition: 'all 0.3s',
                              width: `${(strength.score / 5) * 100}%`,
                              background: strength.color,
                            }} />
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
                  const e = touched.confirm ? errs.confirm : null;
                  return (
                    <ValidatedField label="Confirm Password" error={e} ok={!!form.confirm && !errs.confirm} required>
                      <input
                        type="password"
                        className={inpCls(e, form.confirm)}
                        placeholder="Re-enter password"
                        value={form.confirm}
                        onChange={ev => { const v = ev.target.value; setForm(p => ({ ...p, confirm: v })); if (touched.confirm) touch('confirm'); }}
                        onBlur={() => touch('confirm')} />
                    </ValidatedField>
                  );
                })()}

              </div>

              <button
                type="submit" className="btn"
                style={{ width: '100%', marginTop: 24, padding: '11px', fontSize: 14 }}
                disabled={loading}>
                {loading ? 'Creating account…' : 'Create Admin Account'}
              </button>

              {hasError(errs) && Object.keys(touched).length > 0 && (
                <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--danger)' }}>
                  ⚠ Please fix the highlighted errors before continuing
                </div>
              )}

            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border)', background: 'var(--surface)', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link href="/login" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in →
          </Link>
        </div>

      </div>
    </div>
  );
}