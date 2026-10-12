import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import Button from '../../components/Button';
import styles from './AdminLoginPage.module.css';
import { adminLogin } from '../auth/authService';

export const ADMIN_TOKEN_KEY = 'unimatch-admin-auth';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setIsLoading(true);
      setMessage('');

      try {
        const payload = await adminLogin({ id: identifier.trim(), password: secret });
        const token = payload?.token;
        if (!token) throw new Error('No token returned');
        window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
        window.dispatchEvent(new Event('unimatch-admin-change'));
        navigate('/admin/dashboard');
      } catch (err) {
        setMessage(err.message || 'ID or password is incorrect');
        setTone('error');
      } finally {
        setIsLoading(false);
      }
    },
    [identifier, secret, navigate]
  );

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brandHeader}>
          <BrandLogo size="medium" />
        </div>

        <div className={styles.header}>
          <span className={styles.eyebrow}>Campus Operations</span>
          <h1>Admin Portal Sign In</h1>
          <p className={styles.lead}>
            Authenticate with campus administrator credentials to access directory moderation and institutional domain routing.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="adminId">Administrator ID</label>
            <input
              id="adminId"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="e.g. uni-admin"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="adminSecret">Administrator Password</label>
            <input
              id="adminSecret"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Enter admin password"
              required
              className={styles.input}
            />
          </div>

          {message && (
            <p className={[styles.message, tone ? styles[tone] : ''].filter(Boolean).join(' ')} aria-live="polite">
              {message}
            </p>
          )}

          <Button variant="primary" size="large" type="submit" disabled={isLoading} className={styles.submitBtn}>
            {isLoading ? 'Verifying...' : 'Access Admin Console →'}
          </Button>

          <Button variant="ghost" size="small" onClick={() => navigate('/')}>
            ← Back to Student Experience
          </Button>
        </form>
      </div>
    </section>
  );
};

export default AdminLoginPage;
