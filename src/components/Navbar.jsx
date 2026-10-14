import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';
import Button from './Button';
import styles from './Navbar.module.css';
import { AUTH_EVENT, clearAuthToken, getAuthToken, isAuthenticated } from '../features/auth/authStorage';
import { getProfile } from '../features/auth/authService';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [userName, setUserName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const refreshAuth = () => {
      const auth = isAuthenticated();
      setAuthenticated(auth);
      if (auth) {
        const token = getAuthToken();
        getProfile(token)
          .then((data) => {
            if (data?.name) setUserName(data.name.split(' ')[0]);
          })
          .catch(() => {});
      } else {
        setUserName('');
      }
    };

    refreshAuth();
    window.addEventListener(AUTH_EVENT, refreshAuth);
    window.addEventListener('storage', refreshAuth);
    return () => {
      window.removeEventListener(AUTH_EVENT, refreshAuth);
      window.removeEventListener('storage', refreshAuth);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = () => {
    clearAuthToken();
    navigate('/login');
  };

  const navLinks = authenticated
    ? [
        { label: 'Discover', to: '/main' },
        { label: 'Messages', to: '/matches' },
        { label: 'Support', to: '/support' }
      ]
    : [
        { label: 'Explore', to: '/' },
        { label: 'About', to: '/about' },
        { label: 'Campus Support', to: '/support' }
      ];

  return (
    <header className={styles.navbar}>
      <div className={styles.navInner}>
        <Link to={authenticated ? '/main' : '/'} className={styles.brandLink}>
          <BrandLogo size="medium" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className={styles.desktopLinks} aria-label="Main Navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.active : ''].filter(Boolean).join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className={styles.actions}>
          {authenticated ? (
            <div className={styles.userControls}>
              <Link to="/profile" className={styles.profileChip}>
                <span className={styles.avatarBadge}>
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className={styles.profileText}>{userName || 'Profile'}</span>
              </Link>
              <Button variant="ghost" size="small" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Button variant="ghost" size="small" onClick={() => navigate('/login')}>
                Log In
              </Button>
              <Button variant="primary" size="small" onClick={() => navigate('/signup')}>
                Join Campus
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span className={[styles.hamburgerLine, mobileMenuOpen ? styles.lineOpen1 : ''].filter(Boolean).join(' ')} />
          <span className={[styles.hamburgerLine, mobileMenuOpen ? styles.lineOpen2 : ''].filter(Boolean).join(' ')} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={styles.mobileDrawer}>
          <nav className={styles.mobileNav}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [styles.mobileNavLink, isActive ? styles.activeMobile : ''].filter(Boolean).join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className={styles.mobileDrawerActions}>
            {authenticated ? (
              <>
                <Button variant="lavender" size="medium" onClick={() => navigate('/profile')}>
                  My Profile
                </Button>
                <Button variant="ghost" size="medium" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" size="medium" onClick={() => navigate('/signup')}>
                  Join Campus
                </Button>
                <Button variant="ghost" size="medium" onClick={() => navigate('/login')}>
                  Log In
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
