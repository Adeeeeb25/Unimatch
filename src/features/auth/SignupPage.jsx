import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import Button from '../../components/Button';
import styles from './SignupPage.module.css';
import { sendSignupOtp, signup } from './authService';
import { setAuthToken } from './authStorage';

const REDIRECT_DELAY = 1000;
const RESEND_COOLDOWN = 60;

const commonDomains = [
  { label: 'Chandigarh University (@cuchd.in)', domain: 'cuchd.in' },
  { label: 'Standard University (.edu)', domain: 'edu' },
  { label: 'Custom Campus Domain', domain: 'custom' }
];

const SignupPage = () => {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  // Form State
  const [step, setStep] = useState('details'); // 'details' | 'verify'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDomainOption, setSelectedDomainOption] = useState('cuchd.in');
  const [customDomainName, setCustomDomainName] = useState('');
  const [otp, setOtp] = useState('');

  // UI State
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewOtp, setPreviewOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const showMessage = useCallback((text, type) => {
    setMessage(text);
    setTone(type);
  }, []);

  // Compute fully qualified normalized email
  const getNormalizedEmail = useCallback(() => {
    let normalized = email.trim().toLowerCase();
    if (!normalized.includes('@') && selectedDomainOption === 'custom' && customDomainName.trim()) {
      normalized = `${normalized}@${customDomainName.trim().replace(/^@/, '')}`;
    } else if (!normalized.includes('@') && selectedDomainOption !== 'custom') {
      normalized = `${normalized}@${selectedDomainOption}`;
    }
    return normalized;
  }, [customDomainName, email, selectedDomainOption]);

  // Start resend cooldown countdown
  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // STEP 1: Request 6-digit verification code
  const handleRequestOtp = useCallback(
    async (event) => {
      event.preventDefault();
      setIsLoading(true);
      setMessage('');

      const trimmedName = fullName.trim();
      const normalizedEmail = getNormalizedEmail();

      if (!trimmedName || trimmedName.length < 2) {
        showMessage('Full name must be at least 2 characters.', 'error');
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        showMessage('Password must have at least 8 characters.', 'error');
        setIsLoading(false);
        return;
      }

      try {
        const res = await sendSignupOtp({ email: normalizedEmail });
        setStep('verify');
        setOtp('');
        if (res.previewOtp) {
          setPreviewOtp(res.previewOtp);
        }
        showMessage(res.message || 'Verification code sent to your email!', 'success');
        startCooldown();
      } catch (error) {
        showMessage(error.message || 'Unable to send verification code. Please check your email.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [fullName, getNormalizedEmail, password, showMessage, startCooldown]
  );

  // Resend code
  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setMessage('');
    const normalizedEmail = getNormalizedEmail();

    try {
      const res = await sendSignupOtp({ email: normalizedEmail });
      if (res.previewOtp) setPreviewOtp(res.previewOtp);
      showMessage('A fresh 6-digit code has been sent to your email.', 'success');
      startCooldown();
    } catch (error) {
      showMessage(error.message || 'Unable to resend code.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [getNormalizedEmail, isLoading, resendCooldown, showMessage, startCooldown]);

  // STEP 2: Verify 6-digit OTP and complete signup
  const handleVerifyAndSignup = useCallback(
    async (event) => {
      event.preventDefault();
      setIsLoading(true);
      setMessage('');

      const trimmedName = fullName.trim();
      const normalizedEmail = getNormalizedEmail();
      const cleanOtp = otp.trim();

      if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
        showMessage('Please enter the full 6-digit verification code.', 'error');
        setIsLoading(false);
        return;
      }

      try {
        const response = await signup({
          email: normalizedEmail,
          password,
          name: trimmedName,
          otp: cleanOtp
        });
        setAuthToken(response.token);
        showMessage('Email verified! Redirecting to setup your profile...', 'success');
        timerRef.current = window.setTimeout(() => {
          navigate(response.profileComplete ? '/main' : '/profile-setup');
        }, REDIRECT_DELAY);
      } catch (error) {
        showMessage(error.message || 'Unable to create account. Please check the code.', 'error');
        setIsLoading(false);
      }
    },
    [fullName, getNormalizedEmail, navigate, otp, password, showMessage]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.splitWrapper}>
        {/* Left Side: Restrained Branded Editorial Panel */}
        <aside className={styles.brandSidePanel}>
          <div className={styles.brandSideTop}>
            <BrandLogo size="medium" />
            <span className={styles.brandSideBadge}>New Student</span>
          </div>

          <div className={styles.brandStatementBlock}>
            <span className={styles.brandOverline}>Campus Network</span>
            <h2 className={styles.brandHeadline}>
              BUILD YOUR CAMPUS CREW.
            </h2>
            <p className={styles.brandLead}>
              Join your university network to discover project partners, share syllabus notes, and build genuine friendships.
            </p>
          </div>

          <div className={styles.perksList}>
            <div className={styles.perkItem}>
              <CheckCircle2 size={16} className={styles.perkIcon} />
              <span>Campus exclusivity via institutional email verification</span>
            </div>
            <div className={styles.perkItem}>
              <CheckCircle2 size={16} className={styles.perkIcon} />
              <span>Course overlap and shared interest recommendations</span>
            </div>
            <div className={styles.perkItem}>
              <CheckCircle2 size={16} className={styles.perkIcon} />
              <span>Zero advertisements, zero data brokering, student privacy first</span>
            </div>
          </div>
        </aside>

        {/* Right Side: Form Card */}
        <main className={styles.authCard}>
          {step === 'details' ? (
            /* STEP 1: Personal Details & Email Input */
            <>
              <div className={styles.header}>
                <span className={styles.formEyebrow}>STEP 01 OF 02 · ACCOUNT DETAILS</span>
                <h1>Create your student profile</h1>
                <p className={styles.lead}>
                  Register with your authorized university email to join your campus directory.
                </p>
              </div>

              <form className={styles.form} onSubmit={handleRequestOtp}>
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
                      {showPassword ? 'Hide password' : 'Show password'}
                    </button>
                  </div>
                  <input
                    id="password"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                  />
                </div>

                {message && (
                  <div
                    className={[
                      styles.messageBanner,
                      tone === 'error' ? styles.errorBanner : styles.successBanner
                    ].join(' ')}
                  >
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
                  {isLoading ? 'Sending Verification Code...' : 'Send Verification Code'} <ArrowRight size={16} />
                </Button>
              </form>

              <div className={styles.footerNote}>
                <p>
                  Already registered?{' '}
                  <Link to="/login" className={styles.loginLink}>
                    Sign in to your account
                  </Link>
                </p>
                <div className={styles.securityHint}>
                  <ShieldCheck size={14} className={styles.securityIcon} />
                  <span>A 6-digit security code will be dispatched to verify your address</span>
                </div>
              </div>
            </>
          ) : (
            /* STEP 2: 6-Digit Email OTP Verification */
            <>
              <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => {
                      setStep('details');
                      setMessage('');
                    }}
                  >
                    <ArrowLeft size={14} /> Edit details
                  </button>
                </div>
                <span className={styles.formEyebrow}>STEP 02 OF 02 · EMAIL VERIFICATION</span>
                <h1>Verify your university email</h1>
                <p className={styles.lead}>
                  We sent a 6-digit verification code to <strong>{getNormalizedEmail()}</strong>.
                </p>
              </div>

              <form className={styles.form} onSubmit={handleVerifyAndSignup}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="otpInput" className={styles.label}>
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    id="otpInput"
                    className={styles.otpInput}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                {/* Developer Preview Code Helper (for development or simulated test accounts) */}
                {previewOtp && (
                  <div className={styles.devHintBanner}>
                    <span>
                      📬 <strong>Code:</strong> <code>{previewOtp}</code>
                    </span>
                    <button
                      type="button"
                      className={styles.devFillBtn}
                      onClick={() => setOtp(previewOtp)}
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                {message && (
                  <div
                    className={[
                      styles.messageBanner,
                      tone === 'error' ? styles.errorBanner : styles.successBanner
                    ].join(' ')}
                  >
                    {message}
                  </div>
                )}

                <div className={styles.otpActionsRow}>
                  <button
                    type="button"
                    className={styles.resendBtn}
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isLoading}
                  >
                    <RefreshCw size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #8E8799)' }}>
                    Expires in 10 minutes
                  </span>
                </div>

                <Button
                  className={styles.submitBtn}
                  variant="primary"
                  size="large"
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? 'Verifying Code...' : 'Verify & Create Account'} <ArrowRight size={16} />
                </Button>
              </form>

              <div className={styles.footerNote}>
                <p>
                  Mistyped your email?{' '}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                    className={styles.loginLink}
                    onClick={() => {
                      setStep('details');
                      setMessage('');
                    }}
                  >
                    Change university email address
                  </button>
                </p>
                <div className={styles.securityHint}>
                  <Mail size={14} className={styles.securityIcon} />
                  <span>Check your spam or junk folder if the email does not arrive promptly</span>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </section>
  );
};

export default SignupPage;
