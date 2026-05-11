export const personName = (v) => {
  if (!v?.trim()) return 'Name is required';
  if (/\d/.test(v)) return 'Name cannot contain numbers';
  if (v.trim().length < 2) return 'Name must be at least 2 characters';
  if (/[^a-zA-Z\sÀ-ÿ'\-.]/.test(v)) return "Name can only contain letters, spaces, hyphens or apostrophes";
  return null;
};

export const emailOptional = (v) => {
  if (!v?.trim()) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
    return 'Enter a valid email address (e.g. john@example.com)';
  return null;
};

export const emailRequired = (v) => {
  if (!v?.trim()) return 'Email address is required';
  return emailOptional(v);
};

export const phoneOptional = (v) => {
  if (!v?.trim()) return null;
  if (/[a-zA-Z]/.test(v)) return 'Phone number cannot contain letters';
  if (v.replace(/[\s\-+()]/g, '').length < 7) return 'Phone number is too short';
  if (!/^[\d\s+\-()]+$/.test(v)) return 'Phone number contains invalid characters';
  return null;
};

export const passwordRequired = (v) => {
  if (!v) return 'Password is required';
  if (v.length < 6) return 'Password must be at least 6 characters';
  return null;
};

export const passwordOptional = (v) => {
  if (!v) return null;
  if (v.length < 6) return 'New password must be at least 6 characters';
  return null;
};

export const confirmPassword = (pw) => (v) => {
  if (!v) return 'Please confirm your password';
  if (v !== pw) return 'Passwords do not match';
  return null;
};

export const vehicleYear = (v) => {
  if (!v) return null;
  const n = parseInt(v, 10);
  if (isNaN(n)) return 'Year must be a number (e.g. 2019)';
  if (n < 1960 || n > 2030) return 'Year must be between 1960 and 2030';
  return null;
};

export const positiveAmount = (label = 'Amount') => (v) => {
  if (v === '' || v == null) return null;
  if (isNaN(Number(v))) return `${label} must be a number`;
  if (Number(v) < 0) return `${label} cannot be negative`;
  return null;
};

export const vatRateVal = (v) => {
  if (v === '' || v == null) return null;
  if (isNaN(Number(v))) return 'VAT rate must be a number';
  if (Number(v) < 0 || Number(v) > 100) return 'VAT rate must be between 0 and 100';
  return null;
};

export const quantityVal = (v) => {
  if (v === '' || v == null) return null;
  if (isNaN(Number(v))) return 'Quantity must be a number';
  if (Number(v) <= 0) return 'Quantity must be greater than 0';
  return null;
};

export const requiredSelect = (label) => (v) => {
  if (!v) return `Please select a ${label}`;
  return null;
};

export const titleRequired = (v) => {
  if (!v?.trim()) return 'Title is required';
  if (v.trim().length < 3) return 'Title must be at least 3 characters';
  return null;
};

export const passwordStrength = (v) => {
  if (!v) return { score: 0, label: '', color: '' };
  let score = 0;
  if (v.length >= 6) score++;
  if (v.length >= 10) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/\d/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  const levels = [
    { label: '', color: '' },
    { label: 'Weak', color: '#EF4444' },
    { label: 'Fair', color: '#F59E0B' },
    { label: 'Good', color: '#3B82F6' },
    { label: 'Strong', color: '#22C55E' },
    { label: 'Very Strong', color: '#22C55E' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
};
