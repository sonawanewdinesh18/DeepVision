import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    Home, Sparkles, Layers, Users, CreditCard, Mail, Sun, Moon, Menu, X, LogOut, AppWindow
} from 'lucide-react';
import logo from '../assets/LOGO.png';

const NAV_LINKS = [
    { label: 'Home', href: '#home', Icon: Home },
    { label: 'Features', href: '#features', Icon: Sparkles },
    { label: 'How it Works', href: '#howitworks', Icon: Layers },
    { label: 'Pricing', href: '#pricing', Icon: CreditCard },
    { label: 'Contact', href: '#contact', Icon: Mail },
    { label: 'About Us', href: '#about', Icon: Users },
];

export default function Navbar() {
    const { isDark, toggle } = useTheme();
    const { user, isAdmin, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';

    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeLink, setActiveLink] = useState(() => {
        if (!isHome) return '';
        return window.location.hash || '#home';
    });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Profile variables
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const displayEmail = user?.email || 'user@example.com';
    const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Auto-highlight active section on scroll (home page only)
    useEffect(() => {
        if (!isHome) return;
        const sectionIds = NAV_LINKS.map(l => l.href.replace('#', ''));
        const observers = [];

        sectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveLink(`#${id}`); },
                { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
            );
            obs.observe(el);
            observers.push(obs);
        });

        return () => observers.forEach(o => o.disconnect());
    }, [isHome]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setDropdownOpen(false);
        await signOut();
        navigate('/');
    };

    return (
        <>
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: 72,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 32px',
                background: scrolled ? (isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.85)') : 'transparent',
                backdropFilter: scrolled ? 'blur(24px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
                borderBottom: `1px solid ${scrolled ? 'var(--border-color)' : 'transparent'}`,
                transition: 'all 0.35s ease',
            }}>

                {/* Left: Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
                    <img src={logo} alt="DeepVision" style={{ height: 40, width: 'auto' }} />
                    <span style={{
                        fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em',
                        lineHeight: 1,
                    }}>
                        <span style={{
                            background: 'linear-gradient(160deg, #63B3ED 0%, #2B6CB0 55%, #3B48CC 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>Deep</span>
                        <span style={{
                            background: 'linear-gradient(90deg, #63B3ED 0%, #8B5CF6 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>Vision</span>
                    </span>
                </Link>

                {/* Center: Desktop nav links — pill container */}
                <div className="nav-pill-container nav-links-desktop">
                    {NAV_LINKS.map(({ label, href, Icon }) => {
                        const isActive = isHome
                            ? activeLink === href
                            : location.pathname === `/${href.replace('#', '')}`;
                        return (
                            <a
                                key={label}
                                href={isHome ? href : `/${href}`}
                                className={`nav-link ${isActive ? 'nav-link--active' : ''}`}
                                onClick={(e) => {
                                    setActiveLink(href);
                                    if (!isHome) {
                                        e.preventDefault();
                                        navigate(`/${href}`);
                                    }
                                }}
                            >
                                <Icon size={14} strokeWidth={isActive ? 2.5 : 2} className="nav-link-icon" />
                                <span className="nav-link-label">{label}</span>
                            </a>
                        );
                    })}
                </div>

                {/* Right side: Auth & Theme */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    
                    {!user ? (
                        <>
                            <Link to="/signin" className="nav-btn-outline nav-action-btn">Sign In</Link>
                            <Link to="/signup" className="nav-btn-primary nav-action-btn">Sign Up</Link>
                        </>
                    ) : (
                        <div className="profile-container" ref={dropdownRef}>
                            <button
                                className="user-avatar"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                aria-label="User profile"
                            >
                                {initials}
                            </button>

                            {dropdownOpen && (
                                <div className="profile-dropdown-menu">
                                    <div className="dropdown-header">
                                        <p className="user-label">Logged in as</p>
                                        <p className="user-name">{displayName}</p>
                                        <p className="user-email">{displayEmail}</p>
                                    </div>
                                    <div className="dropdown-divider" />
                                    <Link 
                                        to={isAdmin ? "/admin-dashboard" : "/user-dashboard"} 
                                        className="dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <AppWindow size={16} />
                                        <span>Dashboard</span>
                                    </Link>
                                    <button className="dropdown-item danger" onClick={handleLogout}>
                                        <LogOut size={16} />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={toggle} className="theme-toggle-btn" aria-label="Toggle theme">
                        {isDark ? <Sun size={16} strokeWidth={2.2} /> : <Moon size={16} strokeWidth={2.2} />}
                    </button>

                    <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div style={{
                    position: 'fixed', top: 72, left: 0, right: 0, zIndex: 999,
                    background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
                    padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8,
                    backdropFilter: 'blur(24px)',
                }}>
                    {NAV_LINKS.map(({ label, href, Icon }) => (
                        <a key={label}
                            href={isHome ? href : `/${href}`}
                            className="nav-link-mobile"
                            onClick={(e) => {
                                setMobileOpen(false);
                                if (!isHome) {
                                    e.preventDefault();
                                    navigate(`/${href}`);
                                }
                            }}>
                            <Icon size={16} /> {label}
                        </a>
                    ))}
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        {!user ? (
                            <>
                                <Link to="/signin" className="nav-btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Sign In</Link>
                                <Link to="/signup" className="nav-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Sign Up</Link>
                            </>
                        ) : (
                            <Link to={isAdmin ? "/admin-dashboard" : "/user-dashboard"} className="nav-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                Go to Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Scoped CSS using styled tags */}
            <style>{`
        /* Center nav links — flat horizontal row */
        .nav-pill-container {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 5px;
          border-radius: 9999px;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          flex: 0 1 auto;
        }

        /* Each nav link */
        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 9999px;
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          position: relative;
          transition: all 0.25s ease;
        }

        .nav-link:hover {
          color: var(--text-primary);
        }

        /* Active — pill highlight + gradient text + bottom dot */
        .nav-link--active {
          font-weight: 700;
          background: var(--bg-card);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          color: var(--text-primary);
        }

        .nav-link--active .nav-link-label {
          background: linear-gradient(90deg, #63B3ED 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-link--active .nav-link-icon {
          color: #63B3ED;
          filter: drop-shadow(0 0 3px rgba(99,179,237,0.4));
        }

        .nav-link--active::after {
          content: '';
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 3px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #63B3ED 0%, #7B2FF7 100%);
        }

        /* Right Side Primary & Outline Buttons */
        .nav-btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px 24px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .nav-btn-outline:hover {
          background: var(--bg-surface);
          border-color: var(--text-muted);
        }

        .nav-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px 26px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #63B3ED 0%, #8B5CF6 100%);
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          border: none;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
        }
        .nav-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59, 72, 204, 0.4);
        }

        /* Theme Toggle Circle */
        .theme-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .theme-toggle-btn:hover {
          color: var(--text-primary);
          border-color: #63B3ED;
          transform: scale(1.05);
        }

        /* Profile Avatar / Dropdown */
        .profile-container {
          position: relative;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(90deg, #63B3ED 0%, #8B5CF6 100%);
          color: white;
          border: 2px solid var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          letter-spacing: 1px;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .user-avatar:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .profile-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          width: 240px;
          margin-top: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 8px;
          box-shadow: var(--shadow-lg), 0 0 0 1px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 100;
          animation: drop-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes drop-fade {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .dropdown-header {
          padding: 12px 14px;
        }

        .user-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
          font-weight: 600;
        }

        .user-name {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .user-email {
          font-size: 0.85rem;
          color: var(--text-secondary);
          word-break: break-all;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-color);
          margin: 4px 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .dropdown-item:hover {
          color: var(--text-primary);
          background: var(--bg-surface);
        }

        .dropdown-item.danger:hover {
          color: var(--error-color);
          background: var(--bg-error-ghost, rgba(239, 68, 68, 0.1));
        }

        /* Mobile specific adjustments */
        .mobile-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          cursor: pointer;
        }

        .nav-link-mobile {
          display: flex; align-items: center; gap: 12px;
          padding: 14px; border-radius: var(--radius-md);
          color: var(--text-secondary); font-size: 0.95rem; font-weight: 600;
          text-decoration: none; transition: all 0.2s;
        }
        
        .nav-link-mobile:hover { 
          color: var(--text-primary); 
          background: var(--bg-surface); 
        }

        @media (max-width: 1024px) {
          .nav-links-desktop { display: none !important; }
          .nav-action-btn { display: none !important; }
          .profile-container { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
        </>
    );
}
