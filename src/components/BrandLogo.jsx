import styles from './BrandLogo.module.css';

const BrandLogo = ({ size = 'medium', showTagline = true, className = '' }) => {
  return (
    <div className={[styles.brandWrap, styles[size], className].filter(Boolean).join(' ')}>
      <div className={styles.iconMark} aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
          <rect width="32" height="32" rx="8" fill="#5B2BE0" />
          {/* Two clean intersecting paths */}
          <path
            d="M9 12C6.8 12 5 13.8 5 16C5 18.2 6.8 20 9 20C11.5 20 13.8 17.5 16 16C18.2 14.5 20.5 12 23 12C25.2 12 27 13.8 27 16C27 18.2 25.2 20 23 20"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className={styles.textWrap}>
        <span className={styles.wordmark}>
          Uni<span className={styles.wordmarkAccent}>Match</span>
        </span>
        {showTagline && <span className={styles.campusTagline}>Campus Student Network</span>}
      </div>
    </div>
  );
};

export default BrandLogo;
