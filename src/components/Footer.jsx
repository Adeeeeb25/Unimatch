import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import styles from './Footer.module.css';

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.footerInner}>
      <div className={styles.brandColumn}>
        <BrandLogo size="small" showTagline={false} />
        <p className={styles.tagline}>
          Your campus. Your people. Discover classmates, find study buddies, and build genuine university friendships.
        </p>
      </div>

      <div className={styles.navColumns}>
        <div className={styles.column}>
          <span className={styles.columnTitle}>Community</span>
          <Link to="/main">Student Discovery</Link>
          <Link to="/matches">Direct Messages</Link>
          <Link to="/cafe">Campus Study Spots</Link>
        </div>
        <div className={styles.column}>
          <span className={styles.columnTitle}>Campus & Support</span>
          <Link to="/about">About UniMatch</Link>
          <Link to="/support">Help & Inquiries</Link>
          <Link to="/admin">Campus Admin Portal</Link>
        </div>
      </div>
    </div>

    <div className={styles.bottomBar}>
      <p>© {new Date().getFullYear()} UniMatch Social Club. Campus-exclusive student network.</p>
      <div className={styles.legalLinks}>
        <Link to="/about">Guidelines</Link>
        <Link to="/support">Student Privacy</Link>
        <Link to="/support">Campus Security</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
