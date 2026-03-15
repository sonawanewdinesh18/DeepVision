import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
    Home, Sparkles, Layers, Users, CreditCard, Mail, Sun, Moon, Menu, X,
} from 'lucide-react';
import logo from '../assets/LOGO.png';

const NAV_LINKS = [
    { label: 'Home', href: '#home', Icon: Home },
    { label: 'Features', href: '#features', Icon: Sparkles },
    { label: 'How it Works', href: '#howitworks', Icon: Layers },
    { label: 'About Us', href: '#about', Icon: Users },
    { label: 'Pricing', href: '#pricing', Icon: CreditCard },
    { label: 'Contact', href: '#contact', Icon: Mail },
];

export default function Navbar() {
    const { isDark, toggle } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeLink, setActiveLink] = useState('#home');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 32px',
                background: scrolled ? (isDark ? '#000000' : '#ffffff') : 'transparent',
                backdropFilter: scrolled ? 'blur(24px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
                borderBottom: `1px solid ${scrolled ? 'var(--border-color)' : 'transparent'}`,
                transition: 'all 0.35s ease',
            }}>

                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
                    <img src={logo} alt="DeepVision" style={{ height: 40, width: 'auto' }} />
                    <span style={{
                        fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.02em',
                        lineHeight: 1,
                        filter: 'drop-shadow(0 0 10px rgba(99,179,237,0.35)) drop-shadow(0 0 20px rgba(108,63,245,0.25))',
                    }}>
                        <span style={{
                            background: 'linear-gradient(160deg, #63B3ED 0%, #2B6CB0 55%, #3B48CC 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>Deep</span>
                        <span style={{
                            background: 'linear-gradient(160deg, #553ECC 0%, #7B2FF7 55%, #5B21B6 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>Vision</span>
                    </span>
                </Link>

                {/* Desktop nav links — pill container */}
                <div className="nav-pill-container nav-links-desktop">
                    {NAV_LINKS.map(({ label, href, Icon }) => {
                        const isActive = activeLink === href;
                        return (
                            <a
                                key={label}
                                href={href}
                                className={`nav-link ${isActive ? 'nav-link--active' : ''}`}
                                onClick={() => setActiveLink(href)}
                            >
                                <Icon size={13} strokeWidth={2.5} className="nav-link-icon" />
                                <span className="nav-link-label">{label}</span>
                            </a>
                        );
                    })}
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <Link to="/signin" className="btn btn-ghost nav-action-btn">Sign In</Link>
                    <Link to="/signup" className="btn btn-primary nav-action-btn">Sign Up</Link>
                    <button onClick={toggle} className="theme-toggle-btn" aria-label="Toggle theme">
                        {isDark ? <Sun size={15} strokeWidth={2.2} /> : <Moon size={15} strokeWidth={2.2} />}
                    </button>
                    <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div style={{
                    position: 'fixed', top: 64, left: 0, right: 0, zIndex: 999,
                    background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
                    padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4,
                    backdropFilter: 'blur(24px)',
                }}>
                    {NAV_LINKS.map(({ label, href, Icon }) => (
                        <a key={label} href={href} className="nav-link-mobile" onClick={() => setMobileOpen(false)}>
                            <Icon size={14} /> {label}
                        </a>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <Link to="/signin" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Sign In</Link>
                        <Link to="/signup" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Sign Up</Link>
                    </div>
                </div>
            )}

            <style>{`
        /* Pill outer container */
        .nav-pill-container {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 4px;
          border-radius: 9999px;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          flex: 1;
          justify-content: center;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Each nav link */
        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          color: var(--text-muted);
          font-size: 0.855rem;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          position: relative;
          transition: color 0.2s, background 0.2s;
        }

        /* Hover — subtle lift */
        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-card);
        }

        /* Active — inner white pill + gradient text */
        .nav-link--active {
          position: relative;
          font-weight: 700;
        }

        /* White/card pill behind active link */
        .nav-link--active::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: var(--bg-base);
          box-shadow: 0 1px 8px rgba(0,0,0,0.13);
          z-index: 0;
        }

        /* Gradient text — only on the label span */
        .nav-link--active .nav-link-label {
          position: relative; z-index: 1;
          background: linear-gradient(135deg, #63B3ED 0%, #3B48CC 48%, #7B2FF7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Active icon — tinted to cyan */
        .nav-link--active .nav-link-icon {
          color: #63B3ED;
          position: relative; z-index: 1;
          filter: drop-shadow(0 0 3px rgba(99,179,237,0.5));
        }

        /* Gradient underline on active */
        .nav-link--active::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 16px;
          right: 16px;
          height: 2px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #63B3ED 0%, #3B48CC 50%, #7B2FF7 100%);
          z-index: 1;
        }

        /* Mobile */
        .nav-link-mobile {
          display: flex; align-items: center; gap: 10px;
          padding: 12px; border-radius: var(--radius-md);
          color: var(--text-secondary); font-size: 0.9rem; font-weight: 500;
          text-decoration: none; transition: all 0.2s;
        }
        .nav-link-mobile:hover { color: var(--text-primary); background: var(--bg-surface); }

        .nav-action-btn { padding: 7px 18px !important; font-size: 0.855rem !important; }

        .theme-toggle-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: var(--radius-full);
          background: var(--bg-surface); border: 1px solid var(--border-color);
          color: var(--text-secondary); cursor: pointer;
          transition: all 0.2s;
        }
        .theme-toggle-btn:hover { color: var(--text-primary); border-color: #63B3ED; }

        .mobile-menu-btn {
          display: none; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: var(--radius-md);
          background: transparent; border: 1px solid var(--border-color);
          color: var(--text-primary); cursor: pointer;
        }

        @media (max-width: 920px) {
          .nav-links-desktop { display: none !important; }
          .nav-action-btn { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
        </>
    );
}
