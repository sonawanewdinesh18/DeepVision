import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { AnimatedCharacters, GoogleButton } from '../components/auth';
import logo from '../assets/LOGO.png';
import './SignUp.css';

export default function SignUp() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [focused, setFocused] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: name === 'fullName' ? value.toUpperCase() : name === 'email' ? value.toLowerCase() : value,
    }));
    setIsTyping(true);
    clearTimeout(window._typingTimer);
    window._typingTimer = setTimeout(() => setIsTyping(false), 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.fullName || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      setIsLoading(true);
      const { error } = await signUp(form.email, form.password, form.fullName);
      if (error) {
        setError(error.message);
      } else {
        // Option 1: auto-login works immediately, option 2 requires email confirmation.
        // Assuming no email confirmation is required based on settings config.
        navigate('/user-dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="lpage">
        {/* ── Left dark panel ── */}
        <aside className="lpanel">
          <div className="lpanel-grid" />
          <div className="lpanel-glow lpanel-glow--tl" />
          <div className="lpanel-glow lpanel-glow--br" />

          <Link to="/" className="lbrand">
            <img src={logo} alt="DeepVision" className="lbrand-logo" />
            <span className="lbrand-name">
              <span className="lbrand-deep">Deep</span><span className="lbrand-vision">Vision</span>
            </span>
          </Link>

          {/* Characters at bottom */}
          <div className="lcharacters">
            <AnimatedCharacters
              isTyping={isTyping}
              passwordLength={form.password.length}
              showPassword={showPassword}
            />
          </div>
        </aside>

        {/* ── Right scrollable panel ── */}
        <main className="lform-bg">
          <div className="lform-inner">
            <div className="lform-card">

              {/* Logo only — no text */}
              <div className="lcard-logo-wrap">
                <img src={logo} alt="DeepVision Logo" className="lcard-logo" />
              </div>

              <div className="lcard-header">
                <h1 className="lcard-title">Create Account</h1>
                <p className="lcard-sub">Start your AI-powered visual intelligence journey today.</p>
              </div>

              {/* Google first */}
              <div className="lgoogle-wrap">
                <GoogleButton label="Sign up with Google" onClick={signInWithGoogle} />
              </div>

              <div className="lor"><span>OR</span></div>

              <form onSubmit={handleSubmit} noValidate className="lform">
                {error && <div className="lerror">{error}</div>}

                {/* Full Name */}
                <div className="lfield-group">
                  <label className="lfield-label" htmlFor="su-name">FULL NAME</label>
                  <div className={`lfield ${focused === 'name' ? 'lfield--focus' : ''}`}>
                    <User size={15} className="lfield-icon" />
                    <input
                      id="su-name"
                      type="text"
                      name="fullName"
                      placeholder="John Doe"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={handleChange}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused('')}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="lfield-group">
                  <label className="lfield-label" htmlFor="su-email">EMAIL ADDRESS</label>
                  <div className={`lfield ${focused === 'email' ? 'lfield--focus' : ''}`}>
                    <Mail size={15} className="lfield-icon" />
                    <input
                      id="su-email"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="lfield-group">
                  <label className="lfield-label" htmlFor="su-password">PASSWORD</label>
                  <div className={`lfield ${focused === 'password' ? 'lfield--focus' : ''}`}>
                    <Lock size={15} className="lfield-icon" />
                    <input
                      id="su-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused('')}
                    />
                    <button type="button" className="lfield-eye" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="lfield-hint">Must be at least 6 characters</p>
                </div>

                {/* Create Account — black light / white dark */}
                <button type="submit" className="lsubmit" disabled={isLoading}>
                  {isLoading
                    ? <span className="lspin" />
                    : <><span>Create Account</span><ArrowRight size={17} /></>
                  }
                </button>
              </form>

              <p className="lswitch">
                Already have an account?{' '}
                <Link to="/signin" className="llink">Sign In</Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
