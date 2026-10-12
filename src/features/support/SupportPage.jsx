import { useCallback, useState } from 'react';
import Button from '../../components/Button';
import styles from './SupportPage.module.css';
import { submitSupportRequest } from '../auth/authService';

const topics = [
  'General question',
  'Custom domain request',
  'Account verification',
  'Report an issue',
  'Other'
];

const SupportPage = () => {
  const [formState, setFormState] = useState({ name: '', email: '', topic: topics[0], message: '' });
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setIsSubmitting(true);
      setStatus('');
      setIsError(false);

      const token = window.localStorage.getItem('unimatch_token') || undefined;

      try {
        const response = await submitSupportRequest(formState, token);
        setStatus(response.message || 'Thank you. Your message has been submitted. Our campus team will respond within one business day.');
        setIsError(false);
        setFormState({ name: '', email: '', topic: topics[0], message: '' });
      } catch (err) {
        setStatus(err.message || 'Failed to submit inquiry. Please check your information and try again.');
        setIsError(true);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState]
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Help & Administration</span>
        <h1>Campus Support & Domain Assistance</h1>
        <p className={styles.lead}>
          Contact our campus support team for student verification, technical inquiries, or custom university domain setup.
        </p>
      </header>

      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>Contact Support</h2>
          <p className={styles.cardLead}>Submit an inquiry and we will respond within one business day.</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Full name
              <input
                type="text"
                value={formState.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
              />
            </label>
            <label>
              Campus email address
              <input
                type="email"
                value={formState.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
              />
            </label>
            <label>
              Inquiry topic
              <select value={formState.topic} onChange={(event) => updateField('topic', event.target.value)}>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Message details
              <textarea
                rows={4}
                value={formState.message}
                onChange={(event) => updateField('message', event.target.value)}
                placeholder="Include your campus name or domain if relevant (min 10 characters)..."
                required
                minLength={10}
                maxLength={2000}
              />
            </label>
            {status && (
              <p
                className={styles.feedback}
                style={{ color: isError ? 'var(--color-danger, #ef4444)' : 'var(--color-success, #10b981)' }}
                aria-live="polite"
              >
                {status}
              </p>
            )}
            <Button variant="glow" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Message'}
            </Button>
          </form>
        </article>

        <article className={styles.card}>
          <h2>Campus IT & FAQ</h2>
          <p className={styles.cardLead}>Common setup guidelines and contact channels.</p>
          <div className={styles.metaList}>
            <div>
              <strong>Institutional Domain Setup</strong>
              <p>Campus admins can register custom subdomains (e.g., connect.campus.edu) in the Admin Console.</p>
            </div>
            <div>
              <strong>Email Support</strong>
              <p>support@unimatch.com</p>
            </div>
            <div>
              <strong>Response SLA</strong>
              <p>Standard response time is within 24 hours on business days.</p>
            </div>
          </div>

          <h3 className={styles.faqTitle}>Frequently Asked Questions</h3>
          <ul className={styles.faqList}>
            <li>
              <strong>How do custom university domains work?</strong>
              <p>Universities can configure DNS CNAME/TXT records to map their institutional domain directly to UniMatch.</p>
            </li>
            <li>
              <strong>Who can register for an account?</strong>
              <p>Any student with an authorized university email address (.edu, .ac.in, or verified custom domain).</p>
            </li>
            <li>
              <strong>How do I update my major or department?</strong>
              <p>Open your profile page, update the department field, and click Save Profile.</p>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
};

export default SupportPage;