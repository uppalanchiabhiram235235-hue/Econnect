import { Link, NavLink, Outlet } from 'react-router-dom';
import { Leaf, LogIn, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { navFor } from '../lib/routes';
import { initials } from '../lib/format';
import Button from './Button';

const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const items = navFor(user);
  const bottomItems = user ? items : [...items, { to: '/login', label: 'Log in', icon: LogIn }];

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="brand" aria-label="ECONNECT home">
            <Leaf aria-hidden="true" /> ECONNECT
          </Link>
          <nav className="nav-desktop" aria-label="Main">
            {items.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>{label}</NavLink>
            ))}
          </nav>
          <div className="site-header__actions">
            <button type="button" className="icon-btn" onClick={toggle} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
              {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            </button>
            {user ? (
              <>
                <span className="user-chip">
                  <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
                  <span className="user-chip__name">{user.name}</span>
                </span>
                <button type="button" className="icon-btn" onClick={logout} aria-label="Log out">
                  <LogOut size={20} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm">Log in</Button>
                <Button to="/register" size="sm">Join</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main"><Outlet /></main>

      <footer className="site-footer">
        <div className="container">ECONNECT – Connect. Contribute. Create Impact.</div>
      </footer>

      <nav className="nav-bottom" aria-label="Primary">
        {bottomItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <Icon size={22} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
