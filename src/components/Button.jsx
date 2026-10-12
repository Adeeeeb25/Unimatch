import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  type = 'button',
  ...props
}) => {
  // Map legacy variants gracefully
  const normalizedVariant = variant === 'glow' ? 'primary' : variant;
  const variantClass = styles[normalizedVariant] || styles.primary;
  const sizeClass = styles[size] || styles.medium;
  const combinedClassName = [styles.button, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={combinedClassName} {...props}>
      {children}
    </button>
  );
};

export default Button;
