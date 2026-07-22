import { useState } from 'react';
import { login } from '../config/auth';
import { COMPANIES, PTW_LOGO } from '../config/branding';
import './LoginPage.css';

const ptw = COMPANIES.ptw;

export default function LoginPage({ onLogin }) {
  const [contactNo, setContactNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const ok = login(contactNo, password);
    if (ok) {
      onLogin();
    } else {
      setError('Invalid contact number or password');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__bg">
        <div className="login-page__panel-copy">
          <span className="login-page__accent" />
          <h2>Track attendance with clarity.</h2>
          <p>PTW Holidays staff attendance — day, month, and team views in one place.</p>
        </div>
      </div>

      <div className="login-card">
        <div className="login-card__brand">
          <img src={PTW_LOGO} alt={ptw.label} className="login-card__logo" />
          <h1 className="login-card__title">Sign in</h1>
          <p className="login-card__subtitle">Attendance Management System</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form__field">
            <label htmlFor="contact">Contact Number</label>
            <input
              id="contact"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="Enter contact number"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              required
            />
          </div>

          <div className="login-form__field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-form__error">{error}</p>}

          <button type="submit" className="login-form__submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-card__footer">© PTW Holidays Pvt. Ltd.</p>
      </div>
    </div>
  );
}
