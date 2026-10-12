import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import Button from '../../components/Button';
import styles from './SignupPage.module.css';
import { signup } from './authService';
import { setAuthToken } from './authStorage';

const REDIRECT_DELAY = 1000;

const commonDomains = [
  { label: 'Chandigarh University (@cuchd.in)', domain: 'cuchd.in' },
  { label: 'Standard University (.edu)', domain: 'edu' },
  { label: 'Custom Campus Domain', domain: 'custom' }
];

const SignupPage = () => {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDomainOption, setSelectedDomainOption] = useState('cuchd.in');
  const [customDomainName, setCustomDomainName] = useState('');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const showMessage = useCallback((text, type) => {
    setMessage(text);
    setTone(type);
  }, []);

  const handleSignup = useCallback(
    async (event) => {
      event.preventDefault();
      setIsLoading(true);
      setMessage('');

      const trimmedName = fullName.trim();
      let normalizedEmail = email.trim().toLowerCase();

      // If user typed username and selected a domain preset
      if (!normalizedEmail.includes('@') && selectedDomainOption === 'custom' && customDomainName.trim()) {
        normalizedEmail = `${normalizedEmail}@${customDomainName.trim().replace(/^@/, '')}`;
      } else if (!normalizedEmail.includes('@') && selectedDomainOption !== 'custom') {
        normalizedEmail = `${normalizedEmail}@${selectedDomainOption}`;
      }

      if (password.length < 8) {
        showMessage('Password must have at least 8 characters.', 'error');
        setIsLoading(false);
        return;
      }

      try {
        const response = await signup({ email: normalizedEmail, password, name: trimmedName });
        setAuthToken(response.token);
        showMessage('Welcome to UniMatch! Redirecting to setup your profile...', 'success');
        timerRef.current = window.setTimeout(() => {
          navigate(response.profileComplete ? '/main' : '/profile-setup');
        }, REDIRECT_DELAY);
      } catch (error) {
        showMessage(error.message || 'Unable to create account', 'error');
        setIsLoading(false);
      }
    },
    [customDomainName, email, fullName, navigate, password, selectedDomainOption, showMessage]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.authCard}>
        <div className={styles.logoWrap}>
          <BrandLogo size="medium" />
        </div>

        <div className={styles.header}>
          <h1>Join your campus</h1>
          <p className={styles.lead}>
            Create your student account to discover classmates, study partners, and campus events.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSignup}>
          <div className={styles.fieldGroup}>
            <label htmlFor="fullname" className={styles.label}>
              Full Name
            </label>
            <input
              id="fullname"
              className={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Maya Patel"
              type="text"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="campusDomain" className={styles.label}>
              Campus Institution
            </label>
            <select
              id="campusDomain"
              className={styles.select}
              value={selectedDomainOption}
              onChange={(e) => setSelectedDomainOption(e.target.value)}
            >
              {commonDomains.map((d) => (
                <option key={d.domain} value={d.domain}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {selectedDomainOption === 'custom' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="customDomain" className={styles.label}>
                Campus Domain Name
              </label>
              <input
                id="customDomain"
                className={styles.input}
                value={customDomainName}
                onChange={(e) => setCustomDomainName(e.target.value)}
                placeholder="e.g. students.harvard.edu"
                type="text"
                required
              />
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              University Email Address
            </label>
            <input
              id="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                selectedDomainOption === 'cuchd.in'
                  ? 'username@cuchd.in'
                  : selectedDomainOption === 'custom'
                  ? 'student.username'
                  : 'username@university.edu'
              }
              type="email"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="password" className={styles.label}>
                Password <span className={styles.labelHint}>(min 8 characters)</span>
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
              id="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
            />
          </div>

          {message && (
            <div className={[styles.messageBanner, tone === 'error' ? styles.errorBanner : styles.successBanner].join(' ')}>
              {message}
            </div>
          )}

          <Button
            className={styles.submitBtn}
            variant="primary"
            size="large"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Join UniMatch'}
          </Button>
        </form>

        <div className={styles.footerNote}>
          <p>
            Already have an account?{' '}
            <Link to="/login" className={styles.loginLink}>
              Sign in here
            </Link>
          </p>
          <div className={styles.securityHint}>
            <ShieldCheck size={14} className={styles.securityIcon} />
            <span>Verified campus community · Strictly zero spam</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignupPage;
