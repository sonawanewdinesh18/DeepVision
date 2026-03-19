import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { AnimatedCharacters, GoogleButton } from '../components/auth';
import { toast } from 'sonner';
import logo from '../assets/LOGO.png';
import './SignIn.css';

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [focused, setFocused] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithGoogle, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setIsTyping(true);
    clearTimeout(window._typingTimer);
    window._typingTimer = setTimeout(() => setIsTyping(false), 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      setIsLoading(true);
      const { error } = await signIn(form.email, form.password);
      if (error) {
        toast.error(error.message || 'Failed to sign in.');
      } else {
        toast.success('Successfully signed in!');
        // Redirect based on role
        if (form.email === import.meta.env.VITE_ADMIN_EMAIL || isAdmin) {
          navigate('/admin-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
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

          {/* Characters pushed toward bottom */}
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
                <h1 className="lcard-title">Welcome Back</h1>
                <p className="lcard-sub">Please enter your details to sign in.</p>
              </div>

              {/* Google first */}
              <div className="lgoogle-wrap">
                <GoogleButton label="Continue with Google" onClick={signInWithGoogle} />
              </div>

              <div className="lor"><span>OR</span></div>

              <form onSubmit={handleSubmit} noValidate className="lform">

                {/* Email */}
                <div className="lfield-group">
                  <label className="lfield-label" htmlFor="si-email">EMAIL ADDRESS</label>
                  <div className={`lfield ${focused === 'email' ? 'lfield--focus' : ''}`}>
                    <Mail size={15} className="lfield-icon" />
                    <input
                      id="si-email"
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
                  <label className="lfield-label" htmlFor="si-password">PASSWORD</label>
                  <div className={`lfield ${focused === 'password' ? 'lfield--focus' : ''}`}>
                    <Lock size={15} className="lfield-icon" />
                    <input
                      id="si-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused('')}
                    />
                    <button type="button" className="lfield-eye" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <Link to="/forgot-password" className="lforgot">Forgot password?</Link>
                </div>

                {/* Sign In — black in light, white in dark */}
                <button type="submit" className="lsubmit" disabled={isLoading}>
                  {isLoading
                    ? <span className="lspin" />
                    : <><span>Sign In</span><ArrowRight size={17} /></>
                  }
                </button>
              </form>

              <p className="lswitch">
                Don't have an account?{' '}
                <Link to="/signup" className="llink">Create Account</Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
