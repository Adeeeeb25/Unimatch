import styles from './HeroVisual.module.css';

const sampleTags = ['Algorithms', 'Data Systems', 'Robotics Club'];

const HeroVisual = () => (
  <div className={styles.container}>
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>AR</div>
          <div>
            <h4 className={styles.studentName}>Alex Rivera</h4>
            <p className={styles.studentMeta}>Computer Science · Class of 2026</p>
          </div>
        </div>
        <span className={styles.verifiedBadge}>Verified Campus Email</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Academic Focus</span>
          <span className={styles.infoValue}>Distributed Systems & Algorithms</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Campus Location</span>
          <span className={styles.infoValue}>North Campus Engineering Center</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Current Objective</span>
          <span className={styles.infoValue}>Forming study group for midterm review</span>
        </div>

        <div className={styles.tagSection}>
          <span className={styles.tagLabel}>Shared Topics</span>
          <div className={styles.tags}>
            {sampleTags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.footerNote}>Active today on campus directory</span>
        <button type="button" className={styles.actionBtn}>
          Request Contact
        </button>
      </div>
    </div>
  </div>
);

export default HeroVisual;
