import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Coffee, ShieldCheck, ArrowRight, Sparkles, Search, MessageSquare, MapPin } from 'lucide-react';
import Button from '../../components/Button';
import styles from './HomePage.module.css';
import { isAuthenticated } from '../auth/authStorage';

const HomePage = () => {
  const navigate = useNavigate();

  // If already authenticated, jump straight to the student discovery feed
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/main', { replace: true });
    }
  }, [navigate]);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.campusBadge}>
            <span className={styles.campusDot} />
            <span>Campus Network</span>
          </div>

          <h1 className={styles.heroHeadline}>
            Find students who share your interests.
          </h1>

          <p className={styles.heroLead}>
            UniMatch connects verified university students for coursework collaboration, project partnerships, and genuine campus friendships.
          </p>

          <div className={styles.heroCtaGroup}>
            <Button
              variant="primary"
              size="large"
              onClick={() => navigate('/signup')}
            >
              Get Started <ArrowRight size={16} />
            </Button>
            <Button
              variant="lavender"
              size="large"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>

          <p className={styles.trustMicrocopy}>
            <ShieldCheck size={14} className={styles.trustIcon} />
            University email required (.edu / .cuchd.in). Strictly zero ads or third-party tracking.
          </p>
        </div>

        {/* Hero Interactive Visual: Authentic Product Architecture Preview */}
        <div className={styles.heroVisualWrap} aria-hidden="true">
          <div className={styles.productMockupCard}>
            <div className={styles.mockupHeader}>
              <div className={styles.mockupDots}>
                <span className={styles.mockupDot} />
                <span className={styles.mockupDot} />
                <span className={styles.mockupDot} />
              </div>
              <span className={styles.mockupTitle}>UniMatch Directory Preview</span>
            </div>

            <div className={styles.mockupBody}>
              <div className={styles.mockupSearchBar}>
                <Search size={14} className={styles.mockupSearchIcon} />
                <span className={styles.mockupSearchPlaceholder}>Search peers by course, lab, or shared hobby...</span>
              </div>

              <div className={styles.mockupFeatureRow}>
                <div className={styles.mockupFeatureCard}>
                  <div className={styles.mockupFeatureIcon}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className={styles.mockupFeatureTitle}>Interest Matcher</h4>
                    <p className={styles.mockupFeatureText}>Connect with peers in your courses or student clubs</p>
                  </div>
                </div>

                <div className={styles.mockupFeatureCard}>
                  <div className={styles.mockupFeatureIcon}>
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h4 className={styles.mockupFeatureTitle}>Direct Messaging</h4>
                    <p className={styles.mockupFeatureText}>Reach out with a single click to coordinate study groups</p>
                  </div>
                </div>

                <div className={styles.mockupFeatureCard}>
                  <div className={styles.mockupFeatureIcon}>
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h4 className={styles.mockupFeatureTitle}>Study Space Map</h4>
                    <p className={styles.mockupFeatureText}>Discover quiet spots, Wi-Fi zones, and campus cafes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section: Clear, Human Copy */}
      <section className={styles.pillarsSection}>
        <div className={styles.pillarsHeader}>
          <span className={styles.sectionEyebrow}>How It Works</span>
          <h2 className={styles.sectionTitle}>
            Designed for real student collaboration.
          </h2>
          <p className={styles.sectionSubtitle}>
            Whether you need a study partner for an upcoming exam or want to find peers for a weekend hackathon, UniMatch helps you connect with the right people on campus.
          </p>
        </div>

        <div className={styles.pillarsGrid}>
          <article className={[styles.pillarCard, styles.pillarLavender].join(' ')}>
            <div className={styles.pillarIconBadge}>
              <BookOpen size={22} />
            </div>
            <h3>Course & Study Coordination</h3>
            <p>
              Find peers enrolled in the same difficult subjects. Compare notes, work through problem sets, and stay on schedule together.
            </p>
          </article>

          <article className={[styles.pillarCard, styles.pillarPink].join(' ')}>
            <div className={styles.pillarIconBadge}>
              <Coffee size={22} />
            </div>
            <h3>Shared Interests & Campus Projects</h3>
            <p>
              Connect with fellow developers, designers, or club members who share your passions outside the lecture hall.
            </p>
          </article>

          <article className={[styles.pillarCard, styles.pillarYellow].join(' ')}>
            <div className={styles.pillarIconBadge}>
              <ShieldCheck size={22} />
            </div>
            <h3>Verified Campus Access</h3>
            <p>
              Registration requires an authorized institutional email domain. Every profile belongs to a student attending your institution.
            </p>
          </article>
        </div>
      </section>

      {/* Campus Admin Callout */}
      <section className={styles.campusAdminCard}>
        <div className={styles.adminCopy}>
          <span className={styles.adminEyebrow}>Campus Administration</span>
          <h3>Bring UniMatch to your university or campus subdomain</h3>
          <p>
            Configure custom domains (e.g. <code>connect.yourcampus.edu</code>) with cryptographically verified DNS challenges, student directory controls, and administrative moderation.
          </p>
        </div>
        <div className={styles.adminActions}>
          <Button
            variant="ghost"
            size="medium"
            onClick={() => navigate('/admin')}
          >
            Admin Console Portal
          </Button>
          <Button
            variant="lavender"
            size="medium"
            onClick={() => navigate('/support')}
          >
            Contact Campus Team
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
