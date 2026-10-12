import styles from './HeroStats.module.css';

const capabilities = [
  {
    title: 'Custom Campus Domains',
    detail: 'Configure your university subdomain or institution domain.'
  },
  {
    title: 'Verified Authentication',
    detail: 'Restricted to enrolled students via campus email.'
  },
  {
    title: 'Department Filtering',
    detail: 'Connect with peers by major, course load, and interests.'
  }
];

const HeroStats = () => (
  <div className={styles.grid}>
    {capabilities.map((item) => (
      <div key={item.title} className={styles.card}>
        <h4 className={styles.title}>{item.title}</h4>
        <p className={styles.detail}>{item.detail}</p>
      </div>
    ))}
  </div>
);

export default HeroStats;
