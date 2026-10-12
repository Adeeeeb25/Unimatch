import styles from './Card.module.css';

const Card = ({ header, title, description, meta, children, className = '', ...rest }) => {
  const classes = [styles.card, className].filter(Boolean).join(' ');

  return (
    <article className={classes} {...rest}>
      {header && <div className={styles.header}>{header}</div>}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
      {meta && <p className={styles.meta}>{meta}</p>}
    </article>
  );
};

export default Card;
