import styles from './FormSection.module.css';

const FormSection = ({ title, description, children, className = '' }) => {
  const classes = [styles.formSection, className].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </section>
  );
};

export default FormSection;
