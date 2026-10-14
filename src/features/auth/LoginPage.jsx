import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
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

  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const showMessage = useCallback((text, type) => {
    setMessage(text);
    setTone(type);
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setIsLoading(true);
      setMessage('');
      setUnverifiedEmail('');
      const normalizedEmail = email.trim().toLowerCase();

      try {
        const response = await login({ email: normalizedEmail, password });
        setAuthToken(response.token);
        const destination = response.profileComplete ? '/main' : '/profile-setup';
        navigate(destination);
      } catch (error) {
        if (error.code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(normalizedEmail);
          showMessage(error.message || 'Please verify your email address to access your account.', 'error');
        } else {
          showMessage(error.message || 'Invalid email or password', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [email, navigate, password, showMessage]
  );

  return (
    <section className={styles.page}>
      <div className={styles.splitWrapper}>
        {/* Left Side: Restrained Branded Editorial Panel */}
        <aside className={styles.brandSidePanel}>
          <div className={styles.brandSideTop}>
            <BrandLogo size="medium" />
            <span className={styles.brandSideBadge}>Student Portal</span>
          </div>

          <div className={styles.brandStatementBlock}>
            <span className={styles.brandOverline}>Campus Access</span>
            <h2 className={styles.brandHeadline}>
              YOUR PEOPLE ARE ON CAMPUS.
            </h2>
            <p className={styles.brandLead}>
              Sign in to coordinate courses, join hackathon teams, and find quiet study spots across campus.
            </p>
          </div>

          <div className={styles.perksList}>
            <div className={styles.perkItem}>
              <CheckCircle2 size={16} className={styles.perkIcon} />
              <span>Verified university email required (.edu / .cuchd.in)</span>
            </div>
            <div className={styles.perkItem}>
              <CheckCircle2 size={16} className={styles.perkIcon} />
              <span>Course and department collaboration with classmates</span>
            </div>
            <div className={styles.perkItem}>
              <CheckCircle2 size={16} className={styles.perkIcon} />
              <span>Direct peer messaging and study spot discovery</span>
            </div>
          </div>
        </aside>

        {/* Right Side: Form Card */}
        <main className={styles.authCard}>
          <div className={styles.header}>
            <span className={styles.formEyebrow}>WELCOME BACK</span>
            <h1>Sign in to your account</h1>
            <p className={styles.lead}>
              Enter your authorized university email address to access your campus directory.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="loginEmail" className={styles.label}>
                University Email Address
              </label>
              <input
                id="loginEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="e.g. alex@cuchd.in or name@university.edu"
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
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
              </div>
              <input
                id="loginPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your account password"
                required
                className={styles.input}
                autoComplete="current-password"
              />
            </div>

            {message && (
              <div
                className={[
                  styles.messageBanner,
                  tone === 'error' ? styles.errorBanner : styles.successBanner
                ].join(' ')}
              >
                <div>{message}</div>
                {unverifiedEmail && (
                  <div style={{ marginTop: '0.45rem' }}>
                    <Link
                      to={`/signup?verifyEmail=${encodeURIComponent(unverifiedEmail)}`}
                      className={styles.signupLink}
                      style={{ fontWeight: 800, textDecoration: 'underline' }}
                    >
                      Enter verification code now &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}

            <Button
              variant="primary"
              size="large"
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? 'Signing In...' : 'Sign In to Campus'} <ArrowRight size={16} />
            </Button>
          </form>

          <div className={styles.footerNote}>
            <p>
              New to UniMatch?{' '}
              <Link to="/signup" className={styles.signupLink}>
                Create a student profile
              </Link>
            </p>
            <div className={styles.securityHint}>
              <ShieldCheck size={14} className={styles.securityIcon} />
              <span>Strictly zero ads or tracking · Institutional accounts only</span>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default LoginPage;
