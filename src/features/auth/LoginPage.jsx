import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import Button from '../../components/Button';
import styles from './LoginPage.module.css';
import { login } from './authService';
import { setAuthToken } from './authStorage';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const showMessage = useCallback((text, type) => {
    setMessage(text);
    setTone(type);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setIsLoading(true);
      setMessage('');
      const normalizedEmail = email.trim().toLowerCase();

      try {
        const response = await login({ email: normalizedEmail, password });
        setAuthToken(response.token);
        const destination = response.profileComplete ? '/main' : '/profile-setup';
        navigate(destination);
      } catch (error) {
        showMessage(error.message || 'Invalid email or password', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [email, navigate, password, showMessage]
  );

  return (
    <section className={styles.page}>
      <div className={styles.authCard}>
        <div className={styles.logoWrap}>
          <BrandLogo size="medium" />
        </div>

        <div className={styles.header}>
          <h1>Welcome back!</h1>
          <p className={styles.lead}>
            Sign in with your university credentials to connect with classmates and discover study spots.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="loginEmail" className={styles.label}>
              University Email
            </label>
            <input
              id="loginEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="e.g. yourname@university.edu"
              required
              className={styles.input}
              autoComplete="email"
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="loginPassword" className={styles.label}>
                Password
              </label>
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="loginPassword"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              className={styles.input}
              autoComplete="current-password"
            />
          </div>

          {message && (
            <div className={[styles.messageBanner, tone === 'error' ? styles.errorBanner : styles.successBanner].join(' ')}>
              {message}
            </div>
          )}

          <Button
            variant="primary"
            size="large"
            type="submit"
            disabled={isLoading}
            className={styles.submitBtn}
          >
            {isLoading ? 'Signing In...' : 'Sign In to Campus'}
          </Button>
        </form>

        <div className={styles.footerNote}>
          <p>
            New to UniMatch?{' '}
            <Link to="/signup" className={styles.signupLink}>
              Create your student profile
            </Link>
          </p>
          <div className={styles.securityHint}>
            <ShieldCheck size={14} className={styles.securityIcon} />
            <span>Verified campus community · Student privacy first</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
