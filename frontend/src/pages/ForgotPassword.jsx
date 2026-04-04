import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AnimatedCharacters } from '@/components/auth';
import toast from '@/utils/toast';
import logo from '@/assets/LOGO.png';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [focused, setFocused] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { resetPasswordForEmail } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address.');
            return;
        }

        try {
            setIsLoading(true);
            const { error } = await resetPasswordForEmail(email);
            if (error) {
                if (error.message.includes('User not found')) {
                    toast.error('No account found with this email address.');
                } else {
                    toast.error(error.message || 'Failed to send reset link.');
                }
            } else {
                toast.success('Password reset link sent! Check your email inbox.');
                // Clear the email field after success
                setTimeout(() => {
                    setEmail('');
                }, 2000);
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
                        <AnimatedCharacters />
                    </div>
                </aside>

                {/* ── Right scrollable panel ── */}
                <main className="lform-bg">
                    <div className="lform-inner">
                        <div className="lform-card">
                            <div className="lcard-logo-wrap">
                                <img src={logo} alt="DeepVision Logo" className="lcard-logo" />
                            </div>

                            <div className="lcard-header">
                                <h1 className="lcard-title">Reset Password</h1>
                                <p className="lcard-sub">Enter your email and we'll send you a link.</p>
                            </div>

                            <form onSubmit={handleSubmit} noValidate className="lform">

                                <div className="lfield-group">
                                    <label className="lfield-label" htmlFor="fp-email">EMAIL ADDRESS</label>
                                    <div className={`lfield ${focused === 'email' ? 'lfield--focus' : ''}`}>
                                        <Mail size={15} className="lfield-icon" />
                                        <input
                                            id="fp-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                                            onFocus={() => setFocused('email')}
                                            onBlur={() => setFocused('')}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="lsubmit" disabled={isLoading}>
                                    {isLoading
                                        ? <span className="lspin" />
                                        : <><span>Send Reset Link</span><ArrowRight size={17} /></>
                                    }
                                </button>
                            </form>

                            <p className="lswitch">
                                Remember your password?{' '}
                                <Link to="/signin" className="llink">Back to Sign In</Link>
                            </p>
                        </div>
                    </div>
                </main>
            </div>
            <style>{FORGOT_CSS}</style>
        </>
    );
}

const FORGOT_CSS = `
.lpage { display: grid; grid-template-columns: 1fr 1fr; height: 100vh; overflow: hidden; }
.lpanel { position: relative; display: flex; flex-direction: column; background: #0d0d0f; overflow: hidden; height: 100%; }
.lpanel-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(99,179,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.05) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; }
.lpanel-glow { position: absolute; border-radius: 50%; pointer-events: none; }
.lpanel-glow--tl { width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,179,237,0.12) 0%, transparent 65%); top: -200px; left: -200px; }
.lpanel-glow--br { width: 400px; height: 400px; background: radial-gradient(circle, rgba(123,47,247,0.15) 0%, transparent 65%); bottom: -160px; right: -120px; }
.lbrand { position: absolute; top: 36px; left: 40px; display: flex; align-items: center; gap: 10px; text-decoration: none; z-index: 2; }
.lbrand-logo { width: 34px !important; height: 34px !important; max-width: 34px !important; object-fit: contain; flex-shrink: 0; }
.lbrand-name { font-size: 1.25rem; font-weight: 900; letter-spacing: -0.025em; white-space: nowrap; }
.lbrand-deep { background: linear-gradient(150deg,#63B3ED 0%,#2B6CB0 55%,#3B48CC 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.lbrand-vision { background: linear-gradient(150deg,#553ECC 0%,#7B2FF7 55%,#5B21B6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

.lcharacters { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: center; align-items: flex-end; z-index: 1; }
.lcharacters > div { transform: scale(1.08); transform-origin: bottom center; }

.lform-bg { height: 100%; overflow-y: auto; background: #f2f2f7; }
html.dark .lform-bg, [data-theme="dark"] .lform-bg { background: #0f0f18; }
.lform-inner { min-height: 100%; display: flex; align-items: center; justify-content: center; padding: 48px 32px; }

.lform-card {
  width: 100%; max-width: 400px; background: #fff; border-radius: 24px;
  padding: 36px 32px 32px; box-shadow: 0 4px 32px rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.04);
  display: flex; flex-direction: column; gap: 18px;
}
html.dark .lform-card, [data-theme="dark"] .lform-card { background: #1a1a2a; box-shadow: 0 8px 40px rgba(0,0,0,0.55); }

.lcard-logo-wrap { display: flex; justify-content: center; align-items: center; }
.lcard-logo { width: 64px; height: 64px; object-fit: contain; }
.lcard-header { display: flex; flex-direction: column; gap: 4px; text-align: center; }
.lcard-title { font-size: 1.75rem; font-weight: 900; letter-spacing: -0.03em; color: #0f0f14; line-height: 1.1; }
html.dark .lcard-title, [data-theme="dark"] .lcard-title { color: #f0f0fa; }
.lcard-sub { color: #8a8aa8; font-size: 0.875rem; }

.lform { display: flex; flex-direction: column; gap: 14px; }
.lfield-group { display: flex; flex-direction: column; gap: 6px; }
.lfield-label { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; color: #3a3a50; text-transform: uppercase; }
html.dark .lfield-label, [data-theme="dark"] .lfield-label { color: #9090b8; }

.lfield { position: relative; background: #f4f4f9; border: 1.5px solid #e0e0ea; border-radius: 12px; display: flex; align-items: center; transition: border-color 0.2s, box-shadow 0.2s; }
html.dark .lfield, [data-theme="dark"] .lfield { background: #12121e; border-color: rgba(255,255,255,0.1); }
.lfield--focus { border-color: #1a73e8; box-shadow: 0 0 0 3px rgba(26,115,232,0.15); }
.lfield-icon { position: absolute; left: 14px; color: #a0a0be; pointer-events: none; flex-shrink: 0; transition: color 0.2s; }
.lfield--focus .lfield-icon { color: #1a73e8; }
.lfield input { display: block; width: 100%; padding: 14px 44px 14px 40px; background: transparent; border: none; outline: none; font-family: inherit; font-size: 0.9rem; color: #0f0f14; border-radius: 12px; }
html.dark .lfield input, [data-theme="dark"] .lfield input { color: #f0f0fa; }
.lfield input::placeholder { color: #b8b8d0; }

.lsubmit {
  display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 15px;
  background: #111111; color: #ffffff; border: none; border-radius: 50px;
  font-family: inherit; font-size: 0.96rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s, transform 0.15s;
}
html.dark .lsubmit, [data-theme="dark"] .lsubmit { background: #ffffff; color: #111111; }
.lsubmit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.lsubmit:disabled { opacity: 0.55; cursor: not-allowed; }

.lswitch { text-align: center; font-size: 0.855rem; color: #8a8aaa; }
.llink { color: #1a73e8; font-weight: 700; text-decoration: none; transition: opacity 0.2s; }
.llink:hover { opacity: 0.75; }

.lerror { padding: 10px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px; color: #ef4444; font-size: 0.84rem; }
.lspin { display: inline-block; width: 18px; height: 18px; border: 2.5px solid rgba(0,0,0,0.15); border-top-color: #111; border-radius: 50%; animation: lspin 0.65s linear infinite; }
html.dark .lspin, [data-theme="dark"] .lspin { border-color: rgba(255,255,255,0.2); border-top-color: #111; }
@keyframes lspin { to { transform: rotate(360deg); } }

@media (max-width: 860px) { .lpage { grid-template-columns: 1fr; height: auto; } .lpanel { display: none; } .lform-bg { height: auto; min-height: 100vh; } .lform-inner { padding: 40px 20px; } }
`;
