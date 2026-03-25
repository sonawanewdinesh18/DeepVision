import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Brain, BarChart3, Upload, Play, Lock, CheckCircle, Mail, Phone, MapPin, Clock, Send, Github, Linkedin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import demoVideo from '../assets/DeepFake.mp4';
import logoImg from '../assets/LOGO.png';

/* ─── Count-up hook ─────────────────────────────────────────── */
function useCountUp(target, duration = 1800, delay = 2700) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let timeout;
        timeout = setTimeout(() => {
            const start = performance.now();
            const tick = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                setCount(Math.round(eased * target));
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, delay);
        return () => clearTimeout(timeout);
    }, [target, duration, delay]);
    return count;
}

/* ─── Letter drop animation component ──────────────────────── */
function DropText({ words, color, gradient, delay = 0 }) {
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'inline-block',
            marginRight: '0.28em',
            color: color || 'inherit',
            ...(gradient ? {
              background: gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            } : {}),
          }}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

/* ─── Data ──────────────────────────────────────────────────── */
const FEATURES = [
    {
        Icon: Upload,
        title: 'Upload Image or Video',
        desc: 'Drag and drop or browse to upload any image or video file. Supports JPG, PNG, MP4, and more — results in seconds.',
        tag: 'Upload',
        color: '#63B3ED',
        glow: 'rgba(99,179,237,0.15)',
    },
    {
        Icon: Brain,
        title: 'AI Deepfake Detection',
        desc: 'Our neural network analyzes facial features, GAN artifacts, and pixel-level inconsistencies to detect manipulated media with 95%+ accuracy.',
        tag: 'Detection',
        color: '#8B5CF6',
        glow: 'rgba(139,92,246,0.15)',
    },
    {
        Icon: Shield,
        title: 'Instant Verdict',
        desc: 'Get a clear REAL or FAKE verdict with a confidence score, authenticity breakdown, and highlighted suspicious regions.',
        tag: 'Results',
        color: '#10b981',
        glow: 'rgba(16,185,129,0.15)',
    },
    {
        Icon: BarChart3,
        title: 'Detection Analytics',
        desc: 'Track your detection history, view confidence trends, and monitor usage stats from your personal analytics dashboard.',
        tag: 'Analytics',
        color: '#F59E0B',
        glow: 'rgba(245,158,11,0.15)',
    },
    {
        Icon: Zap,
        title: 'Real-Time Processing',
        desc: 'Sub-second inference on images and fast video analysis — no waiting, no queues. Results delivered the moment processing completes.',
        tag: 'Speed',
        color: '#63B3ED',
        glow: 'rgba(99,179,237,0.15)',
    },
    {
        Icon: Lock,
        title: 'Private & Secure',
        desc: 'Your uploaded media is processed securely and never shared. Full control over your data with account-level privacy settings.',
        tag: 'Privacy',
        color: '#8B5CF6',
        glow: 'rgba(139,92,246,0.15)',
    },
];

const STEPS = [
    { num: '01', title: 'Connect your data', desc: 'Upload images, wire in video streams, or connect via our REST / gRPC API in minutes.' },
    { num: '02', title: 'Configure your model', desc: 'Pick from pre-built models or fine-tune on your own labelled dataset with a single click.' },
    { num: '03', title: 'Ship real insights', desc: 'Receive live detections, classifications, and threshold-based alerts via webhooks or SDK.' },
];

const STATS = [
    ['10M+', 'Frames Analyzed/Day'],
    ['99.99%', 'Platform Uptime'],
    ['<50ms', 'Median Latency'],
    ['150+', 'Enterprise Clients'],
];

const PRICING = [
    {
        name: 'Free', price: '₹0', period: '/mo', highlight: false,
        perks: ['50 detections/month', 'Image & video support', 'Basic confidence score', 'Community support'],
    },
    {
        name: 'Pro', price: '₹999', period: '/mo', highlight: true,
        perks: ['Unlimited detections', 'Priority AI processing', 'Full analytics dashboard', 'Detection history & export', 'Email support'],
    },
    {
        name: 'Enterprise', price: 'Custom', period: '', highlight: false,
        perks: ['Unlimited + API access', 'Custom model fine-tuning', 'On-premise deployment', 'SLA guarantee', 'Dedicated account manager'],
    },
];

/* ─── Helper: animated background orb ───────────────────────── */
function Orb({ style, x, y, scale, duration = 10 }) {
    return (
        <motion.div
            animate={{ x: x ?? [0, 40, 0], y: y ?? [0, -30, 0], scale: scale ?? [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration, ease: 'easeInOut' }}
            style={{
                position: 'absolute', borderRadius: '50%',
                filter: 'blur(90px)', pointerEvents: 'none',
                ...style,
            }}
        />
    );
}

/* ─── Fade-up on scroll ──────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
    const heroRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    /* contact form state */
    const [contactForm, setContactForm] = useState({ name:'', email:'', subject:'', message:'' });
    const [contactSent, setContactSent] = useState(false);
    const [contactLoading, setContactLoading] = useState(false);

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            sessionStorage.setItem('pendingRedirect', '/');
            navigate('/signin');
            return;
        }
        setContactLoading(true);
        await new Promise(r => setTimeout(r, 1600));
        setContactLoading(false);
        setContactSent(true);
        setContactForm({ name:'', email:'', subject:'', message:'' });
        setTimeout(() => setContactSent(false), 5000);
    };
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
    const [showVideo, setShowVideo] = useState(false);
    const videoRef = useRef(null);
    const accuracyCount  = useCountUp(95,    1800, 2700);
    const usersCount     = useCountUp(10000, 1800, 2800);
    const mediaCount     = useCountUp(1000000, 1800, 2900);
    const timeCount      = useCountUp(100, 1200, 3000);

    useEffect(() => {
        if (showVideo && videoRef.current) videoRef.current.play();
    }, [showVideo]);

    // Scroll to hash section when navigated from another page (e.g. /#features)
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            setTimeout(() => {
                const el = document.getElementById(hash.replace('#', ''));
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, []);

    const formatUsers = (n) => n >= 10000 ? '10K+' : n >= 1000 ? `${(n/1000).toFixed(0)}K+` : `${n}+`;
    const formatMedia = (n) => n >= 1000000 ? '1M+' : n >= 1000 ? `${(n/1000).toFixed(0)}K+` : `${n}+`;
    const formatTime  = (n) => n >= 100 ? '<1s' : `${(n / 100).toFixed(1)}s`;

    const STAT_BOXES = [
        {
            value: `${accuracyCount}%`, label: 'Detection Accuracy',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M8 12.5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3v1M12 20v1M3 12h1M20 12h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            ),
        },
        {
            value: formatUsers(usersCount), label: 'Active Users',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="18" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M21 19c0-2.21-1.343-4-3-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
            ),
        },
        {
            value: formatMedia(mediaCount), label: 'Media Analyzed',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M10 9.5l5 2.5-5 2.5V9.5z" fill="currentColor"/>
                    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2"/>
                </svg>
            ),
        },
        {
            value: formatTime(timeCount), label: 'Processing Time',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M12 9v4l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 2h6M12 2v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M19.5 5.5l-1.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
            ),
        },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', overflowX: 'hidden' }}>
            <Navbar />

            {/* ═══ HERO ═══════════════════════════════════════════════ */}
            <section id="home" ref={heroRef} style={{
                position: 'relative', minHeight: '100vh', display: 'flex',
                alignItems: 'center', overflow: 'hidden',
            }}>
                {/* Orbs */}
                <Orb duration={12} style={{ width: 800, height: 800, top: -200, left: -150, background: 'radial-gradient(circle,rgba(108,63,245,0.4) 0%,transparent 70%)' }} />
                <Orb duration={9} x={[0,-50,0]} y={[0,40,0]} style={{ width: 600, height: 600, bottom: -100, right: -100, background: 'radial-gradient(circle,rgba(139,92,246,0.3) 0%,transparent 70%)' }} />

                {/* Dot grid */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle,var(--border-color) 1px,transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6 }} />
                {/* Vignette */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% 50%,transparent 30%,var(--bg-base) 100%)' }} />

                <motion.div style={{
                    y: heroY, opacity: heroOpacity,
                    position: 'relative', zIndex: 1,
                    width: '100%', maxWidth: 1240,
                    margin: '0 auto',
                    padding: '120px 60px 80px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 64,
                    alignItems: 'center',
                }}>

                    {/* ── LEFT ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {/* Badge */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                            style={{ marginBottom: 24 }}>
                            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <img src={logoImg} alt="logo" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} />
                                AI-Powered Deepfake Detection
                            </span>
                        </motion.div>

                        {/* Letter-drop title */}
                        <h1 style={{ fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
                            <div style={{ fontSize: 'clamp(1.9rem,2.8vw,3rem)', whiteSpace: 'nowrap' }}>
                                <DropText words={['Deep', 'Learning-Based']} delay={0.1} color="var(--text-primary)" />
                            </div>
                            <div style={{ fontSize: 'clamp(1.9rem,2.8vw,3rem)', whiteSpace: 'nowrap' }}>
                                <DropText words={['Deepfake', 'Detection']} delay={0.5} color="var(--text-primary)" />
                            </div>
                            <div style={{ fontSize: 'clamp(1.9rem,2.8vw,3rem)', whiteSpace: 'nowrap' }}>
                                <DropText words={['in', 'Visual', 'Media']} delay={0.95} gradient="linear-gradient(135deg,#63B3ED,#8B5CF6)" />
                            </div>
                        </h1>

                        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2, duration: 0.6 }}
                            style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 440, marginBottom: 32 }}>
                            Our advanced deep learning system analyzes images and videos in real time
                            to identify deepfakes and manipulated media with high accuracy.
                        </motion.p>

                        {/* Buttons */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4, duration: 0.5 }}
                            style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                            <button onClick={() => navigate('/signin')}
                                className="btn btn-primary"
                                style={{ padding: '13px 28px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <Upload size={16} /> Upload Media
                            </button>
                            <button onClick={() => setShowVideo(true)}
                                className="btn btn-ghost"
                                style={{ padding: '13px 28px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <Play size={16} /> Watch Demo
                            </button>
                        </motion.div>

                        {/* 4 stat boxes */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6, duration: 0.6 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                            {STAT_BOXES.map((s, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 2.7 + i * 0.1, duration: 0.5 }}
                                    whileHover={{ y: -4, scale: 1.03 }}
                                    style={{
                                        padding: '16px 8px 14px', borderRadius: 16, textAlign: 'center',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-card)',
                                        boxShadow: 'var(--shadow-md)',
                                        position: 'relative', overflow: 'hidden',
                                        cursor: 'default',
                                        transition: 'box-shadow 0.25s, transform 0.25s',
                                    }}>
                                    {/* gradient top bar */}
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: i === 0 ? 'linear-gradient(90deg,#10b981,#059669)' : i === 1 ? 'linear-gradient(90deg,#63B3ED,#3B82F6)' : i === 2 ? 'linear-gradient(90deg,#8B5CF6,#6C3FF5)' : 'linear-gradient(90deg,#F59E0B,#EF4444)' }} />
                                    {/* glow bg */}
                                    <div style={{ position: 'absolute', inset: 0, background: i === 0 ? 'radial-gradient(ellipse at 50% 0%,rgba(16,185,129,0.07),transparent 70%)' : i === 1 ? 'radial-gradient(ellipse at 50% 0%,rgba(99,179,237,0.07),transparent 70%)' : i === 2 ? 'radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.07),transparent 70%)' : 'radial-gradient(ellipse at 50% 0%,rgba(245,158,11,0.07),transparent 70%)', pointerEvents: 'none' }} />
                                    {/* icon */}
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 12, margin: '0 auto 5px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: i === 0 ? 'rgba(16,185,129,0.12)' : i === 1 ? 'rgba(99,179,237,0.12)' : i === 2 ? 'rgba(139,92,246,0.12)' : 'rgba(245,158,11,0.12)',
                                        border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.25)' : i === 1 ? 'rgba(99,179,237,0.25)' : i === 2 ? 'rgba(139,92,246,0.25)' : 'rgba(245,158,11,0.25)'}`,
                                        color: i === 0 ? '#10b981' : i === 1 ? '#63B3ED' : i === 2 ? '#8B5CF6' : '#F59E0B',
                                    }}>{s.icon}</div>
                                    <div style={{
                                        fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
                                        background: i === 0 ? 'linear-gradient(135deg,#10b981,#059669)' : i === 1 ? 'linear-gradient(135deg,#63B3ED,#3B82F6)' : i === 2 ? 'linear-gradient(135deg,#8B5CF6,#6C3FF5)' : 'linear-gradient(135deg,#F59E0B,#EF4444)',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    }}>{s.value}</div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3 }}>{s.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* ── RIGHT — Video card ── */}
                    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: [0.22,1,0.36,1] }}
                        style={{ position: 'relative', width: '100%' }}>

                        {/* Outer glow ring */}
                        <div style={{ position: 'absolute', inset: -1, borderRadius: 30, background: 'linear-gradient(135deg,rgba(99,179,237,0.4),rgba(139,92,246,0.4))', zIndex: 0, filter: 'blur(1px)' }} />

                        <div style={{
                            borderRadius: 28, overflow: 'hidden',
                            boxShadow: '0 40px 100px rgba(108,63,245,0.22), 0 8px 32px rgba(0,0,0,0.18)',
                            background: 'var(--bg-card)',
                            position: 'relative', zIndex: 1,
                        }}>
                            {/* Top bar — macOS style */}
                            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 7, borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
                                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
                                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
                                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ padding: '4px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Shield size={10} color="var(--color-primary-light)" />
                                        deepvision.ai — live analysis
                                    </div>
                                </div>
                            </div>

                            {/* Video */}
                            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                                <video ref={videoRef} src={demoVideo} loop muted playsInline autoPlay
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

                                {/* scan line */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 0%,rgba(108,63,245,0.04) 50%,transparent 100%)', pointerEvents: 'none' }} />

                                {/* corner brackets */}
                                {[{top:10,left:10},{top:10,right:10},{bottom:10,left:10},{bottom:10,right:10}].map((pos,i) => (
                                    <div key={i} style={{ position:'absolute', width:20, height:20, ...pos,
                                        borderTop: pos.top!==undefined ? '2px solid rgba(99,179,237,0.9)' : 'none',
                                        borderBottom: pos.bottom!==undefined ? '2px solid rgba(99,179,237,0.9)' : 'none',
                                        borderLeft: pos.left!==undefined ? '2px solid rgba(99,179,237,0.9)' : 'none',
                                        borderRight: pos.right!==undefined ? '2px solid rgba(99,179,237,0.9)' : 'none',
                                    }} />
                                ))}

                                {/* face detection box simulation */}
                                <div style={{ position: 'absolute', top: '22%', left: '30%', width: '38%', height: '55%', border: '1.5px solid rgba(99,179,237,0.7)', borderRadius: 4, boxShadow: '0 0 12px rgba(99,179,237,0.3) inset' }}>
                                    <div style={{ position: 'absolute', top: -10, left: 8, background: 'rgba(0,0,0,0.65)', color: '#63B3ED', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.06em', backdropFilter: 'blur(4px)' }}>FACE #1 · 98.2%</div>
                                </div>

                                {/* LIVE badge */}
                                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(16,185,129,0.92)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 999, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.07em', boxShadow: '0 4px 14px rgba(16,185,129,0.45)' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'livepulse 1.4s infinite' }} />
                                    LIVE
                                </div>

                                {/* model tag */}
                                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(108,63,245,0.85)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 6, backdropFilter: 'blur(6px)', letterSpacing: '0.05em' }}>
                                    EfficientNet-B4
                                </div>

                                {/* frame counter */}
                                <div style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 600, padding: '3px 9px', borderRadius: 5, backdropFilter: 'blur(6px)', letterSpacing: '0.04em' }}>
                                    FRAME 0142 · 30fps · 1080p
                                </div>

                                {/* processing indicator */}
                                <div style={{ position: 'absolute', bottom: 10, right: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.6)', padding: '3px 9px', borderRadius: 5, backdropFilter: 'blur(6px)' }}>
                                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#63B3ED', animation: 'livepulse 0.8s infinite' }} />
                                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#63B3ED', animation: 'livepulse 0.8s 0.2s infinite' }} />
                                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#63B3ED', animation: 'livepulse 0.8s 0.4s infinite' }} />
                                </div>
                            </div>

                            {/* Result panel */}
                            <div style={{ padding: '16px 18px', background: 'var(--bg-card)' }}>
                                {/* header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
                                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Analysis Complete</span>
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(16,185,129,0.2)', letterSpacing: '0.05em' }}>✓ AUTHENTIC</span>
                                </div>

                                {/* main result */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(16,185,129,0.35)', flexShrink: 0 }}>
                                        <Shield size={20} color="#fff" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 2 }}>No Deepfake Detected</div>
                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>GAN artifacts · splice · face-swap — all clear</div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#10b981,#059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>98.2%</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</div>
                                    </div>
                                </div>

                                {/* confidence bar */}
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Authenticity Score</span>
                                        <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>98.2 / 100</span>
                                    </div>
                                    <div style={{ height: 7, borderRadius: 999, background: 'var(--bg-surface)', overflow: 'hidden', position: 'relative' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: '98.2%' }}
                                            transition={{ delay: 1.0, duration: 1.4, ease: [0.22,1,0.36,1] }}
                                            style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#10b981,#34d399)', position: 'relative' }}>
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)', borderRadius: 999 }} />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* 4 mini metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
                                    {[
                                        { label: 'Faces', value: '2', color: '#63B3ED' },
                                        { label: 'Frames', value: '142', color: '#8B5CF6' },
                                        { label: 'Time', value: '0.6s', color: '#10b981' },
                                        { label: 'Model', value: 'B4', color: '#F59E0B' },
                                    ].map((m) => (
                                        <div key={m.label} style={{ padding: '7px 6px', borderRadius: 9, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 900, color: m.color }}>{m.value}</div>
                                            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{m.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Glow under card */}
                        <div style={{ position: 'absolute', bottom: -40, left: '10%', right: '10%', height: 80, background: 'radial-gradient(ellipse,rgba(108,63,245,0.35) 0%,transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0 }} />
                    </motion.div>
                </motion.div>

                {/* Video modal */}
                {showVideo && (
                    <div onClick={() => setShowVideo(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 960, borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', position: 'relative' }}>
                            {/* close button */}
                            <button onClick={() => setShowVideo(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>✕</button>
                            <video src={demoVideo} controls autoPlay muted playsInline style={{ width: '100%', display: 'block', maxHeight: '80vh', objectFit: 'contain', background: '#000' }} />
                        </div>
                    </div>
                )}

                <style>{`
                    @keyframes livepulse {
                        0%,100% { opacity:1; transform:scale(1); }
                        50% { opacity:0.4; transform:scale(1.4); }
                    }
                    @keyframes spin { to { transform:rotate(360deg); } }
                    @media(max-width:900px){
                        .hero-grid { grid-template-columns:1fr !important; }
                    }
                `}</style>
            </section>

            {/* ═══ FEATURES ════════════════════════════════════════════ */}
            <section id="features" style={{ padding: 'clamp(80px,10vw,130px) 24px', position: 'relative', overflow: 'hidden' }}>
                <Orb duration={14} style={{ width: 700, height: 700, top: -150, right: -200, opacity: 0.2, background: 'radial-gradient(circle,rgba(108,63,245,0.6) 0%,transparent 70%)' }} />
                <Orb duration={18} style={{ width: 500, height: 500, bottom: -80, left: -120, opacity: 0.18, background: 'radial-gradient(circle,rgba(99,179,237,0.6) 0%,transparent 70%)' }} />

                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
                        style={{ textAlign: 'center', marginBottom: 72 }}
                    >
                        <span className="badge badge-primary" style={{ marginBottom: 16, display: 'inline-flex' }}>Features</span>
                        <h2 style={{ fontSize: 'clamp(1.9rem,4vw,3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: 'var(--text-primary)' }}>
                            Everything you need to{' '}
                            <span className="text-gradient">detect the undetectable</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                            Purpose-built tools for identifying manipulated media — from single images to live video streams.
                        </p>
                    </motion.div>

                    {/* Cards — drop one by one */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                        {FEATURES.map(({ Icon, title, desc, tag, color, glow }, i) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{
                                    duration: 0.6,
                                    delay: i * 0.15,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-card)',
                                    borderRadius: 24,
                                    padding: '32px 28px 28px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'default',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                                    transition: 'border-color 0.3s, box-shadow 0.3s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = color;
                                    e.currentTarget.style.boxShadow = `0 24px 64px ${glow}, 0 4px 20px rgba(0,0,0,0.12)`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'var(--border-card)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)';
                                }}
                            >
                                {/* top shimmer line */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                                    opacity: 0.9,
                                }} />

                                {/* corner glow */}
                                <div style={{
                                    position: 'absolute', top: -40, right: -40, width: 140, height: 140,
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle, ${glow}, transparent 70%)`,
                                    pointerEvents: 'none',
                                }} />

                                {/* icon */}
                                <div style={{
                                    width: 52, height: 52, borderRadius: 16,
                                    background: `linear-gradient(135deg, ${glow}, transparent)`,
                                    border: `1px solid ${color}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 20,
                                    boxShadow: `0 6px 20px ${glow}`,
                                    position: 'relative',
                                }}>
                                    <Icon size={22} color={color} />
                                </div>

                                {/* tag */}
                                <div style={{ marginBottom: 10 }}>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
                                        textTransform: 'uppercase', color: color,
                                        background: `${glow}`,
                                        border: `1px solid ${color}35`,
                                        padding: '3px 10px', borderRadius: 999,
                                    }}>{tag}</span>
                                </div>

                                {/* title */}
                                <h3 style={{
                                    fontWeight: 700, fontSize: '1.1rem',
                                    color: 'var(--text-primary)', marginBottom: 10,
                                    letterSpacing: '-0.01em', lineHeight: 1.3,
                                }}>{title}</h3>

                                {/* desc */}
                                <p style={{
                                    color: 'var(--text-secondary)', fontSize: '0.875rem',
                                    lineHeight: 1.72, margin: '0 0 20px',
                                }}>{desc}</p>

                                {/* divider */}
                                <div style={{ height: 1, background: `linear-gradient(90deg, ${color}30, transparent)`, marginBottom: 16 }} />

                                {/* footer */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: color }}>
                                    Explore feature <ArrowRight size={13} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ HOW IT WORKS ════════════════════════════════════════ */}
            <section id="howitworks" style={{
                padding: 'clamp(80px,10vw,130px) 24px',
                background: 'var(--bg-surface)',
                position: 'relative', overflow: 'hidden',
            }}>
                <Orb duration={18} style={{ width: 500, height: 500, top: -120, right: -100, opacity: 0.3, background: 'radial-gradient(circle,rgba(108,63,245,0.5) 0%,transparent 70%)' }} />
                <Orb duration={14} style={{ width: 400, height: 400, bottom: -80, left: -80, opacity: 0.2, background: 'radial-gradient(circle,rgba(99,179,237,0.5) 0%,transparent 70%)' }} />

                <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                    {/* Header */}
                    <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: 80 }}>
                        <span className="badge badge-primary" style={{ marginBottom: 16, display: 'inline-flex' }}>How it Works</span>
                        <h2 style={{ fontSize: 'clamp(1.9rem,4vw,3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
                            Detect deepfakes in <span className="text-gradient">3 simple steps</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                            No technical knowledge needed. Upload, analyze, and get your result in seconds.
                        </p>
                    </motion.div>

                    {/* Steps */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, position: 'relative' }}>

                        {/* connector line */}
                        <div style={{
                            position: 'absolute', top: 44, left: '16.66%', right: '16.66%', height: 2,
                            background: 'linear-gradient(90deg,#63B3ED,#8B5CF6,#10b981)',
                            opacity: 0.35, zIndex: 0,
                        }} />

                        {[
                            {
                                num: '01',
                                color: '#63B3ED', glow: 'rgba(99,179,237,0.18)',
                                title: 'Upload Your Media',
                                desc: 'Drag and drop or browse to upload any image or video. Supports JPG, PNG, MP4 and more — processed instantly.',
                                icon: (
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="3" width="18" height="18" rx="3" stroke="#63B3ED" strokeWidth="1.6"/>
                                        <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="#63B3ED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M7 19h10" stroke="#63B3ED" strokeWidth="1.6" strokeLinecap="round" opacity="0.5"/>
                                    </svg>
                                ),
                            },
                            {
                                num: '02',
                                color: '#8B5CF6', glow: 'rgba(139,92,246,0.18)',
                                title: 'AI Analyzes It',
                                desc: 'Our neural network scans every pixel for GAN artifacts, face-swap traces, and manipulation signatures.',
                                icon: (
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="3" stroke="#8B5CF6" strokeWidth="1.8"/>
                                        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="#8B5CF6" strokeWidth="1.6" strokeLinecap="round"/>
                                        <path d="M5.6 5.6l1.4 1.4M16.9 16.9l1.4 1.4M5.6 18.4l1.4-1.4M16.9 7.1l1.4-1.4" stroke="#8B5CF6" strokeWidth="1.4" strokeLinecap="round"/>
                                        <circle cx="12" cy="12" r="7" stroke="#8B5CF6" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.5"/>
                                    </svg>
                                ),
                            },
                            {
                                num: '03',
                                color: '#10b981', glow: 'rgba(16,185,129,0.18)',
                                title: 'Get Your Result',
                                desc: 'Receive a clear REAL or FAKE verdict with a confidence score, visual heatmap, and full breakdown.',
                                icon: (
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 3L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7L12 3z" stroke="#10b981" strokeWidth="1.7" strokeLinejoin="round"/>
                                        <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                ),
                            },
                        ].map(({ num, color, glow, title, desc, icon }, i) => (
                            <motion.div key={num}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.6, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 32px', position: 'relative', zIndex: 1 }}
                            >
                                {/* step circle */}
                                <motion.div
                                    whileInView={{ scale: [0.5, 1.1, 1] }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.18 + 0.2 }}
                                    style={{
                                        width: 88, height: 88, borderRadius: '50%',
                                        background: `radial-gradient(135deg, ${glow}, var(--bg-card))`,
                                        border: `2px solid ${color}50`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 28, position: 'relative',
                                        boxShadow: `0 0 0 8px ${glow}, 0 16px 40px ${glow}`,
                                    }}
                                >
                                    {/* ring pulse */}
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                                        transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4 }}
                                        style={{
                                            position: 'absolute', inset: -8, borderRadius: '50%',
                                            border: `1.5px solid ${color}`,
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    {icon}
                                    {/* step number badge */}
                                    <div style={{
                                        position: 'absolute', top: -6, right: -6,
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: color, color: '#fff',
                                        fontSize: '0.65rem', fontWeight: 900,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 4px 10px ${glow}`,
                                    }}>{num}</div>
                                </motion.div>

                                <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 12, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 260 }}>{desc}</p>

                                {/* bottom tag */}
                                <div style={{
                                    marginTop: 20, padding: '4px 14px', borderRadius: 999,
                                    background: `${glow}`, border: `1px solid ${color}30`,
                                    fontSize: '0.7rem', fontWeight: 700, color: color,
                                    letterSpacing: '0.06em', textTransform: 'uppercase',
                                }}>Step {num}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* bottom CTA strip */}
                    <motion.div {...fadeUp(0.3)} style={{
                        marginTop: 72, padding: '28px 40px',
                        background: 'var(--bg-card)', borderRadius: 20,
                        border: '1px solid var(--border-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 16,
                        boxShadow: '0 8px 32px rgba(108,63,245,0.08)',
                    }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 4 }}>Ready to try it yourself?</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload your first media file — it's free, no account needed.</div>
                        </div>
                        <button onClick={() => navigate('/signin')} className="btn btn-primary" style={{ padding: '12px 28px', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                            <Upload size={16} /> Try It Now
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* ═══ PRICING ═════════════════════════════════════════════ */}
            <section id="pricing" style={{ padding: 'clamp(64px,10vw,120px) 24px', position: 'relative', overflow: 'hidden', background: 'var(--bg-base)' }}>
                {/* bg grid */}
                <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,var(--border-color) 1px,transparent 1px)', backgroundSize:'44px 44px', opacity:0.45, pointerEvents:'none' }} />
                <Orb duration={16} style={{ width:800, height:800, top:-300, left:'50%', transform:'translateX(-50%)', opacity:0.12, background:'radial-gradient(circle,rgba(108,63,245,0.9) 0%,transparent 70%)' }} />

                <div style={{ maxWidth:1160, margin:'0 auto', position:'relative', zIndex:1 }}>

                    {/* Header */}
                    <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:72 }}>
                        <span className="badge badge-primary" style={{ marginBottom:18, display:'inline-flex' }}>Pricing</span>
                        <h2 style={{ fontSize:'clamp(2rem,4.5vw,3.2rem)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:16, color:'var(--text-primary)', lineHeight:1.1 }}>
                            One tool. <span className="text-gradient">Three plans.</span>
                        </h2>
                        <p style={{ color:'var(--text-secondary)', fontSize:'1.05rem', maxWidth:500, margin:'0 auto 28px', lineHeight:1.7 }}>
                            Start free, no card needed. Upgrade when you're ready for more power.
                        </p>
                        <button onClick={() => navigate('/pricing')}
                            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 22px', borderRadius:999, border:'1px solid var(--border-card)', background:'var(--bg-card)', color:'var(--color-primary-light)', fontSize:'0.82rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}
                            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--color-primary-light)'}
                            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-card)'}
                        >
                            See full plan comparison <ArrowRight size={13}/>
                        </button>
                    </motion.div>

                    {/* Cards */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, alignItems:'center' }}>
                        {PRICING.map(({ name, price, period, highlight, perks }, i) => {
                            const accent = i===0 ? '#63B3ED' : i===2 ? '#10b981' : null;
                            return (
                                <motion.div key={name}
                                    initial={{ opacity:0, y:60 }}
                                    whileInView={{ opacity:1, y:0 }}
                                    viewport={{ once:true, amount:0.15 }}
                                    transition={{ duration:0.65, delay:i*0.14, ease:[0.22,1,0.36,1] }}
                                    whileHover={{ y: highlight ? -4 : -6, transition:{ duration:0.2 } }}
                                    style={{
                                        position:'relative', borderRadius:28, overflow:'hidden',
                                        display:'flex', flexDirection:'column',
                                        background: highlight ? 'linear-gradient(155deg,#4c1fd4 0%,#6d28d9 45%,#8B5CF6 100%)' : 'var(--bg-card)',
                                        border: highlight ? '1px solid rgba(139,92,246,0.6)' : '1px solid var(--border-card)',
                                        boxShadow: highlight ? '0 40px 100px rgba(108,63,245,0.45), 0 0 0 1px rgba(139,92,246,0.3)' : '0 8px 40px rgba(0,0,0,0.08)',
                                        transform: highlight ? 'scale(1.05)' : 'scale(1)',
                                        zIndex: highlight ? 2 : 1,
                                    }}
                                >
                                    {/* top accent */}
                                    {!highlight && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${accent},transparent)` }} />}

                                    {/* highlight glows */}
                                    {highlight && <>
                                        <div style={{ position:'absolute', top:-100, right:-100, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.13),transparent 70%)', pointerEvents:'none' }} />
                                        <div style={{ position:'absolute', bottom:-80, left:-80, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.07),transparent 70%)', pointerEvents:'none' }} />
                                    </>}

                                    {/* Popular badge */}
                                    {highlight && (
                                        <div style={{ position:'absolute', top:22, right:22, background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:'0.58rem', fontWeight:900, padding:'5px 13px', borderRadius:999, letterSpacing:'0.12em', textTransform:'uppercase', border:'1px solid rgba(255,255,255,0.35)', backdropFilter:'blur(10px)' }}>
                                            ✦ MOST POPULAR
                                        </div>
                                    )}

                                    <div style={{ padding: highlight ? '40px 32px 36px' : '32px 28px 28px', display:'flex', flexDirection:'column', flex:1 }}>

                                        {/* Plan label */}
                                        <div style={{ fontSize:'0.68rem', fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color: highlight ? 'rgba(255,255,255,0.55)' : accent || 'var(--text-muted)', marginBottom:14 }}>{name}</div>

                                        {/* Price block */}
                                        <div style={{ marginBottom:8 }}>
                                            <div style={{ display:'flex', alignItems:'flex-end', gap:5, lineHeight:1 }}>
                                                <span style={{ fontSize: highlight ? '3.6rem' : '3rem', fontWeight:900, letterSpacing:'-0.05em', color: highlight ? '#fff' : 'var(--text-primary)', lineHeight:1 }}>{price}</span>
                                                {period && <span style={{ fontSize:'0.9rem', color: highlight ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', marginBottom:8 }}>{period}</span>}
                                            </div>
                                        </div>

                                        <p style={{ fontSize:'0.8rem', color: highlight ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginBottom:24, lineHeight:1.5 }}>
                                            {i===0 ? 'Perfect for getting started' : i===1 ? 'Best for individuals & teams' : 'For organizations at scale'}
                                        </p>

                                        <div style={{ height:1, background: highlight ? 'rgba(255,255,255,0.15)' : 'var(--border-color)', marginBottom:24 }} />

                                        {/* Perks */}
                                        <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:13, flex:1, marginBottom:32 }}>
                                            {perks.map(p => (
                                                <li key={p} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:'0.86rem', color: highlight ? 'rgba(255,255,255,0.88)' : 'var(--text-secondary)' }}>
                                                    <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center',
                                                        background: highlight ? 'rgba(255,255,255,0.18)' : `${accent || '#8B5CF6'}18`,
                                                        border: highlight ? '1px solid rgba(255,255,255,0.28)' : `1px solid ${accent || '#8B5CF6'}35`,
                                                    }}>
                                                        <CheckCircle size={11} color={highlight ? '#fff' : accent || '#8B5CF6'} strokeWidth={3}/>
                                                    </div>
                                                    {p}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTA */}
                                        <button
                                            onClick={() => {
                                            if (name === 'Enterprise') { navigate('/signin'); return; }
                                            sessionStorage.setItem('pendingRedirect', '/pricing');
                                            navigate('/signin', { state: { redirectTo: '/pricing' } });
                                        }}
                                            style={{
                                                width:'100%', padding:'15px 20px', borderRadius:999, border:'none',
                                                fontWeight:800, fontSize:'0.93rem', cursor:'pointer',
                                                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                                                transition:'all 0.22s',
                                                background: highlight ? '#fff' : `linear-gradient(135deg,${accent ? accent+','+accent+'cc' : '#6C3FF5,#8B5CF6'})`,
                                                color: highlight ? '#6C3FF5' : '#fff',
                                                boxShadow: highlight ? '0 8px 28px rgba(255,255,255,0.28)' : `0 6px 24px ${accent ? accent+'55' : 'rgba(108,63,245,0.35)'}`,
                                                letterSpacing:'0.01em',
                                            }}
                                            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=highlight?'0 12px 36px rgba(255,255,255,0.38)':'0 12px 36px rgba(108,63,245,0.5)'; }}
                                            onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=highlight?'0 8px 28px rgba(255,255,255,0.28)':'0 6px 24px rgba(108,63,245,0.35)'; }}
                                        >
                                            {name==='Enterprise' ? 'Contact Sales' : name==='Free' ? 'Get Started Free' : 'Choose Plan'}
                                            <ArrowRight size={15}/>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Trust strip */}
                    <motion.div {...fadeUp(0.3)} style={{ marginTop:48, display:'flex', alignItems:'center', justifyContent:'center', gap:32, flexWrap:'wrap' }}>
                        {[['🔒','SSL Encrypted'],['✓','Cancel Anytime'],['🎁','7-day Pro Trial'],['📞','24/7 Support']].map(([ic,lb])=>(
                            <div key={lb} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600 }}>
                                <span style={{ fontSize:'0.95rem' }}>{ic}</span> {lb}
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══ CONTACT ══════════════════════════════════════════════ */}
            <section id="contact" style={{ padding:'100px 24px 120px', background:'var(--bg-base)', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,var(--border-color) 1px,transparent 1px)', backgroundSize:'44px 44px', opacity:0.3, pointerEvents:'none' }}/>
                <Orb duration={20} style={{ width:800, height:800, top:-200, left:-200, opacity:0.12, background:'radial-gradient(circle,rgba(108,63,245,0.8) 0%,transparent 70%)' }}/>
                <Orb duration={15} style={{ width:600, height:600, bottom:-200, right:-100, opacity:0.1, background:'radial-gradient(circle,rgba(6,182,212,0.8) 0%,transparent 70%)' }}/>

                <div style={{ maxWidth:1200, margin:'0 auto', position:'relative', zIndex:1 }}>
                    <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:64 }}>
                        <span className="badge badge-primary" style={{ marginBottom:16, display:'inline-flex' }}>Contact Us</span>
                        <h2 style={{ fontSize:'clamp(2rem,4.5vw,3.2rem)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:14, color:'var(--text-primary)', lineHeight:1.1 }}>
                            Get in touch with <span className="text-gradient">our team</span>
                        </h2>
                        <p style={{ color:'var(--text-secondary)', fontSize:'1rem', maxWidth:460, margin:'0 auto', lineHeight:1.75 }}>
                            Questions, feedback, or enterprise inquiries — we respond within 24 hours.
                        </p>
                    </motion.div>

                    {/* ── 2-COL LAYOUT ── */}
                    <motion.div {...fadeUp(0.1)} style={{ display:'grid', gridTemplateColumns:'400px 1fr', gap:24, alignItems:'start' }}>

                        {/* LEFT — glass info panel */}
                        <div style={{ background:'linear-gradient(155deg,rgba(108,63,245,0.14) 0%,rgba(6,182,212,0.07) 100%)', border:'1px solid rgba(108,63,245,0.22)', borderRadius:28, padding:'36px 30px', backdropFilter:'blur(18px)', position:'relative', overflow:'hidden' }}>
                            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#6C3FF5,#8B5CF6,#06b6d4)' }}/>
                            <div style={{ position:'absolute', bottom:-80, right:-80, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(108,63,245,0.18) 0%,transparent 70%)', pointerEvents:'none' }}/>

                            {/* heading */}
                            <div style={{ marginBottom:28 }}>
                                <div style={{ fontSize:'0.62rem', fontWeight:900, color:'#8B5CF6', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>Contact Info</div>
                                <h3 style={{ fontSize:'1.35rem', fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.02em', lineHeight:1.25, margin:0 }}>
                                    Let's start a<br/><span style={{ background:'linear-gradient(90deg,#6C3FF5,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>conversation</span>
                                </h3>
                            </div>

                            {/* contact rows */}
                            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:28 }}>
                                {[
                                    { icon:<Mail size={16}/>, color:'#8B5CF6', label:'Email', value:'support@deepvision.ai', sub:'Reply within 24 hours' },
                                    { icon:<Phone size={16}/>, color:'#06b6d4', label:'Phone', value:'+91 98765 43210', sub:'Mon–Fri, 9 AM – 7 PM IST' },
                                    { icon:<MapPin size={16}/>, color:'#10b981', label:'Office', value:'Shahada, Maharashtra', sub:'India · 425409' },
                                ].map(({ icon, color, label, value, sub }) => (
                                    <div key={label} style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                                        <div style={{ width:38, height:38, borderRadius:12, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0, marginTop:2 }}>
                                            {icon}
                                        </div>
                                        <div>
                                            <div style={{ fontSize:'0.62rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:2 }}>{label}</div>
                                            <div style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--text-primary)', marginBottom:1 }}>{value}</div>
                                            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* divider */}
                            <div style={{ height:1, background:'linear-gradient(90deg,rgba(108,63,245,0.3),transparent)', marginBottom:22 }}/>

                            {/* working hours */}
                            <div style={{ marginBottom:26 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                                    <Clock size={13} color="#f59e0b"/>
                                    <span style={{ fontSize:'0.65rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Working Hours</span>
                                    <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
                                        <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 6px #10b981', animation:'pulse 2s infinite' }}/>
                                        <span style={{ fontSize:'0.65rem', color:'#10b981', fontWeight:700 }}>Open now</span>
                                    </div>
                                </div>
                                {[['Mon – Fri','9 AM – 7 PM',true],['Saturday','10 AM – 4 PM',true],['Sunday','Closed',false]].map(([d,t,o])=>(
                                    <div key={d} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                                        <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{d}</span>
                                        <span style={{ fontSize:'0.78rem', fontWeight:700, color: o ? '#10b981' : '#ef4444' }}>{t}</span>
                                    </div>
                                ))}
                            </div>

                            {/* social grid */}
                            <div>
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                                    <span style={{ fontSize:'0.65rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.12em' }}>Follow Us</span>
                                    {!user && <span style={{ fontSize:'0.6rem', color:'#8B5CF6', fontWeight:700, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.25)', padding:'2px 8px', borderRadius:999 }}>Sign in to open</span>}
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                    {[
                                        { icon:<Linkedin size={14}/>, label:'LinkedIn', color:'#0A66C2', href:'https://linkedin.com' },
                                        { icon:<Github size={14}/>,   label:'GitHub',   color:'#ffffff', href:'https://github.com' },
                                    ].map(({ icon, label, color, href }) => (
                                        <button key={label}
                                            onClick={() => { if (!user) { sessionStorage.setItem('pendingRedirect','/'); navigate('/signin'); return; } window.open(href,'_blank','noopener,noreferrer'); }}
                                            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 11px', borderRadius:999, border:'1px solid var(--border-color)', background:'var(--bg-surface)', cursor:'pointer', transition:'all 0.2s' }}
                                            onMouseEnter={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.background=`${color}12`; e.currentTarget.style.transform='translateY(-2px)'; }}
                                            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border-color)'; e.currentTarget.style.background='var(--bg-surface)'; e.currentTarget.style.transform='none'; }}>
                                            <div style={{ width:26, height:26, borderRadius:7, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{icon}</div>
                                            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-primary)', flex:1 }}>{label}</span>
                                            {!user ? <Lock size={10} color="var(--text-muted)"/> : <ArrowRight size={10} color="var(--text-muted)"/>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT — form card */}
                        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)', borderRadius:28, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.07)' }}>
                            <div style={{ height:4, background:'linear-gradient(90deg,#6C3FF5,#8B5CF6,#06b6d4)' }}/>
                            <div style={{ padding:'40px 40px 44px' }}>
                                <div style={{ marginBottom:28 }}>
                                    <h3 style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.02em', marginBottom:6 }}>Send us a message</h3>
                                    <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', margin:0 }}>
                                        {user ? "Fill in the form and we'll get back to you shortly." : "You'll be redirected to sign in — takes 10 seconds."}
                                    </p>
                                </div>

                                {contactSent ? (
                                    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                                        style={{ textAlign:'center', padding:'60px 24px' }}>
                                        <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 0 0 16px rgba(16,185,129,0.1)' }}>
                                            <CheckCircle size={34} color="#fff" strokeWidth={2}/>
                                        </div>
                                        <div style={{ fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)', marginBottom:8 }}>Message Sent!</div>
                                        <div style={{ fontSize:'0.88rem', color:'var(--text-muted)' }}>We'll get back to you within 24 hours.</div>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleContactSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
                                        {/* name + email row */}
                                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                                            {[
                                                { key:'name',  label:'Full Name',    ph:'Your name',       type:'text'  },
                                                { key:'email', label:'Email Address', ph:'you@example.com', type:'email' },
                                            ].map(f => (
                                                <div key={f.key}>
                                                    <label style={{ display:'block', fontSize:'0.65rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>{f.label}</label>
                                                    <input type={f.type} required value={contactForm[f.key]} placeholder={f.ph}
                                                        onChange={e=>setContactForm(p=>({...p,[f.key]:e.target.value}))}
                                                        style={{ width:'100%', padding:'13px 15px', borderRadius:12, border:'1.5px solid var(--border-card)', background:'var(--bg-surface)', color:'var(--text-primary)', fontSize:'0.9rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s' }}
                                                        onFocus={e=>{ e.target.style.borderColor='#6C3FF5'; e.target.style.boxShadow='0 0 0 3px rgba(108,63,245,0.12)'; }}
                                                        onBlur={e=>{ e.target.style.borderColor='var(--border-card)'; e.target.style.boxShadow='none'; }}/>
                                                </div>
                                            ))}
                                        </div>

                                        {/* subject */}
                                        <div>
                                            <label style={{ display:'block', fontSize:'0.65rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Subject</label>
                                            <select required value={contactForm.subject} onChange={e=>setContactForm(p=>({...p,subject:e.target.value}))}
                                                style={{ width:'100%', padding:'13px 15px', borderRadius:12, border:'1.5px solid var(--border-card)', background:'var(--bg-surface)', color: contactForm.subject ? 'var(--text-primary)' : 'var(--text-muted)', fontSize:'0.9rem', outline:'none', fontFamily:'inherit', cursor:'pointer', transition:'border-color 0.2s, box-shadow 0.2s' }}
                                                onFocus={e=>{ e.target.style.borderColor='#6C3FF5'; e.target.style.boxShadow='0 0 0 3px rgba(108,63,245,0.12)'; }}
                                                onBlur={e=>{ e.target.style.borderColor='var(--border-card)'; e.target.style.boxShadow='none'; }}>
                                                <option value="" disabled>Select a topic…</option>
                                                {['General Inquiry','Technical Support','Billing & Payments','Enterprise / Sales','Bug Report','Feature Request','Other'].map(o=>(
                                                    <option key={o} value={o}>{o}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* message */}
                                        <div>
                                            <label style={{ display:'block', fontSize:'0.65rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Message</label>
                                            <textarea required rows={5} value={contactForm.message} placeholder="Tell us how we can help…"
                                                onChange={e=>setContactForm(p=>({...p,message:e.target.value}))}
                                                style={{ width:'100%', padding:'13px 15px', borderRadius:12, border:'1.5px solid var(--border-card)', background:'var(--bg-surface)', color:'var(--text-primary)', fontSize:'0.9rem', outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s', minHeight:130 }}
                                                onFocus={e=>{ e.target.style.borderColor='#6C3FF5'; e.target.style.boxShadow='0 0 0 3px rgba(108,63,245,0.12)'; }}
                                                onBlur={e=>{ e.target.style.borderColor='var(--border-card)'; e.target.style.boxShadow='none'; }}/>
                                        </div>

                                        {/* footer row */}
                                        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                                            {!user && (
                                                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(108,63,245,0.07)', border:'1px solid rgba(108,63,245,0.2)', borderRadius:10, flex:1, minWidth:200 }}>
                                                    <Lock size={12} color="#8B5CF6"/>
                                                    <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>Sign in required — redirected back automatically.</span>
                                                </div>
                                            )}
                                            <motion.button type="submit" disabled={contactLoading}
                                                whileHover={{ scale:1.015, y:-1 }} whileTap={{ scale:0.985 }}
                                                style={{ padding:'14px 36px', borderRadius:999, border:'none', background:'linear-gradient(135deg,#6C3FF5,#8B5CF6)', color:'#fff', fontWeight:800, fontSize:'0.95rem', cursor:'pointer', display:'flex', alignItems:'center', gap:9, boxShadow:'0 10px 28px rgba(108,63,245,0.38)', whiteSpace:'nowrap', marginLeft:'auto' }}>
                                                {contactLoading
                                                    ? <><span style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/> Sending…</>
                                                    : <><Send size={15}/> {user ? 'Send Message' : 'Sign In & Send'}</>
                                                }
                                            </motion.button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══ ABOUT US ════════════════════════════════════════════ */}
            <section id="about" style={{ padding: 'clamp(80px,10vw,130px) 24px', background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}>
                <Orb duration={16} style={{ width:600, height:600, top:-200, left:-150, opacity:0.2, background:'radial-gradient(circle,rgba(99,179,237,0.6) 0%,transparent 70%)' }}/>
                <Orb duration={12} style={{ width:500, height:500, bottom:-150, right:-100, opacity:0.18, background:'radial-gradient(circle,rgba(139,92,246,0.6) 0%,transparent 70%)' }}/>

                <div style={{ maxWidth:1160, margin:'0 auto', position:'relative', zIndex:1 }}>

                    <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:72 }}>
                        <span className="badge badge-primary" style={{ marginBottom:18, display:'inline-flex' }}>About Us</span>
                        <h2 style={{ fontSize:'clamp(2rem,4.5vw,3.2rem)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:16, color:'var(--text-primary)', lineHeight:1.1 }}>
                            Built to protect <span className="text-gradient">digital truth</span>
                        </h2>
                        <p style={{ color:'var(--text-secondary)', fontSize:'1rem', maxWidth:540, margin:'0 auto', lineHeight:1.75 }}>
                            We're a team of AI researchers, engineers, and security experts on a mission to make synthetic media detection accessible to everyone.
                        </p>
                    </motion.div>

                    {/* mission + vision */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:40 }}>
                        {[
                            { color:'#8B5CF6', glow:'rgba(139,92,246,0.12)', label:'Our Mission', title:'Detect. Protect. Empower.', desc:'Deepfakes are becoming indistinguishable from reality. We built DeepVision to give individuals, journalists, and enterprises a reliable tool to verify media authenticity — instantly and accurately.' },
                            { color:'#06b6d4', glow:'rgba(6,182,212,0.12)', label:'Our Vision', title:'A world where truth is verifiable.', desc:'We envision a future where every piece of media can be verified in seconds. Our AI models are trained on millions of real and synthetic samples to stay ahead of the latest generation techniques.' },
                        ].map(({ color, glow, label, title, desc }) => (
                            <motion.div key={label} {...fadeUp(0.1)}
                                style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)', borderRadius:24, padding:'36px 32px', position:'relative', overflow:'hidden', transition:'border-color 0.2s, box-shadow 0.2s' }}
                                onMouseEnter={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.boxShadow=`0 16px 48px ${glow}`; }}
                                onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border-card)'; e.currentTarget.style.boxShadow='none'; }}>
                                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${color},transparent)` }}/>
                                <div style={{ fontSize:'0.65rem', fontWeight:900, color, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12, background:`${glow}`, border:`1px solid ${color}30`, padding:'3px 12px', borderRadius:999, display:'inline-block' }}>{label}</div>
                                <h3 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--text-primary)', marginBottom:12, letterSpacing:'-0.02em' }}>{title}</h3>
                                <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem', lineHeight:1.75 }}>{desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* team */}
                    <motion.div {...fadeUp(0.2)}>
                        <div style={{ textAlign:'center', marginBottom:36 }}>
                            <div style={{ fontSize:'0.68rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>The Team</div>
                            <h3 style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>People behind DeepVision</h3>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
                            {[
                                { name:'Dinesh Sonwane',    role:'Team Leader',        color:'#8B5CF6', initials:'DS' },
                                { name:'Jitendra Kulkarni', role:'Team Member',        color:'#06b6d4', initials:'JK' },
                                { name:'Neha Agle',         role:'Team Member',        color:'#10b981', initials:'NA' },
                                { name:'Dakshita Pawar',    role:'Team Member',        color:'#F59E0B', initials:'DP' },
                            ].map(({ name, role, color, initials }) => (
                                <motion.div key={name}
                                    initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                                    transition={{ duration:0.5 }}
                                    whileHover={{ y:-6 }}
                                    style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)', borderRadius:20, padding:'28px 20px', textAlign:'center', transition:'border-color 0.2s, box-shadow 0.2s' }}
                                    onMouseEnter={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.boxShadow=`0 12px 40px ${color}20`; }}
                                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border-card)'; e.currentTarget.style.boxShadow='none'; }}>
                                    <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg,${color},${color}88)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'1.2rem', fontWeight:900, color:'#fff', boxShadow:`0 8px 24px ${color}40` }}>{initials}</div>
                                    <div style={{ fontWeight:800, fontSize:'0.95rem', color:'var(--text-primary)', marginBottom:4 }}>{name}</div>
                                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>{role}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══ FOOTER ══════════════════════════════════════════════ */}
            <footer style={{ background:'var(--bg-surface)', borderTop:'1px solid var(--border-color)', position:'relative', overflow:'hidden' }}>
                <div style={{ height:3, background:'linear-gradient(90deg,transparent 0%,#6C3FF5 30%,#8B5CF6 50%,#06b6d4 70%,transparent 100%)' }}/>

                {/* main grid */}
                <div style={{ maxWidth:1160, margin:'0 auto', padding:'64px 40px 48px', display:'grid', gridTemplateColumns:'2.2fr 1fr 1fr 1fr', gap:48 }}>

                    {/* brand */}
                    <div>
                        <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:16 }}>
                            <img src="/src/assets/LOGO.png" alt="DeepVision" style={{ height:30 }}/>
                            <span style={{ fontWeight:900, fontSize:'1.25rem', letterSpacing:'-0.02em', lineHeight:1 }}>
                                <span style={{ background:'linear-gradient(160deg,#63B3ED,#2B6CB0,#3B48CC)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Deep</span>
                                <span style={{ background:'linear-gradient(160deg,#553ECC,#7B2FF7,#5B21B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Vision</span>
                            </span>
                        </div>
                        <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', lineHeight:1.8, maxWidth:300, marginBottom:28 }}>
                            AI-powered deepfake detection for images and videos. Protecting truth in the age of synthetic media since 2024.
                        </p>
                        <div style={{ display:'flex', gap:8, marginBottom:28 }}>
                            {[
                                { Icon:Linkedin, color:'#0A66C2', href:'https://linkedin.com' },
                                { Icon:Github,   color:'#ffffff', href:'https://github.com'   },
                            ].map(({ Icon, color, href }) => (
                                <button key={color}
                                    onClick={() => { if (!user) { sessionStorage.setItem('pendingRedirect','/'); navigate('/signin'); return; } window.open(href,'_blank','noopener,noreferrer'); }}
                                    style={{ width:38, height:38, borderRadius:999, border:'1px solid var(--border-color)', background:'var(--bg-card)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s', color:'var(--text-muted)' }}
                                    onMouseEnter={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.color=color; e.currentTarget.style.background=`${color}15`; e.currentTarget.style.transform='translateY(-2px)'; }}
                                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border-color)'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='var(--bg-card)'; e.currentTarget.style.transform='translateY(0)'; }}>
                                    <Icon size={15}/>
                                </button>
                            ))}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:12, width:'fit-content' }}>
                            <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981' }}/>
                            <span style={{ fontSize:'0.75rem', color:'#10b981', fontWeight:700 }}>All systems operational</span>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <div style={{ fontSize:'0.68rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:22, paddingBottom:12, borderBottom:'1px solid var(--border-color)' }}>Product</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                            {[['Features','#features'],['How It Works','#how-it-works'],['Pricing','#pricing'],['API Docs','#'],['Changelog','#'],['Status','#']].map(([l,h])=>(
                                <a key={l} href={h} style={{ color:'var(--text-secondary)', fontSize:'0.85rem', textDecoration:'none', transition:'all 0.2s', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}
                                    onMouseEnter={e=>{ e.currentTarget.style.color='var(--color-primary-light)'; e.currentTarget.style.paddingLeft='6px'; }}
                                    onMouseLeave={e=>{ e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.paddingLeft='0'; }}>{l}</a>
                            ))}
                        </div>
                    </div>

                    {/* Company */}
                    <div>
                        <div style={{ fontSize:'0.68rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:22, paddingBottom:12, borderBottom:'1px solid var(--border-color)' }}>Company</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                            {[['About Us','#about'],['Blog','#'],['Careers','#'],['Press Kit','#'],['Contact','#contact'],['Partners','#']].map(([l,h])=>(
                                <a key={l} href={h} style={{ color:'var(--text-secondary)', fontSize:'0.85rem', textDecoration:'none', transition:'all 0.2s', fontWeight:500 }}
                                    onMouseEnter={e=>{ e.currentTarget.style.color='var(--color-primary-light)'; e.currentTarget.style.paddingLeft='6px'; }}
                                    onMouseLeave={e=>{ e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.paddingLeft='0'; }}>{l}</a>
                            ))}
                        </div>
                    </div>

                    {/* Legal */}
                    <div>
                        <div style={{ fontSize:'0.68rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:22, paddingBottom:12, borderBottom:'1px solid var(--border-color)' }}>Legal</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                            {[['Privacy Policy','#'],['Terms of Service','#'],['Cookie Policy','#'],['Security','#'],['GDPR','#'],['Accessibility','#']].map(([l,h])=>(
                                <a key={l} href={h} style={{ color:'var(--text-secondary)', fontSize:'0.85rem', textDecoration:'none', transition:'all 0.2s', fontWeight:500 }}
                                    onMouseEnter={e=>{ e.currentTarget.style.color='var(--color-primary-light)'; e.currentTarget.style.paddingLeft='6px'; }}
                                    onMouseLeave={e=>{ e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.paddingLeft='0'; }}>{l}</a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* bottom bar */}
                <div style={{ borderTop:'1px solid var(--border-color)' }}>
                    <div style={{ maxWidth:1160, margin:'0 auto', padding:'20px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                            <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', margin:0 }}>© 2026 DeepVision Inc. All rights reserved.</p>
                            <span style={{ color:'var(--border-color)' }}>·</span>
                            <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', margin:0 }}>Made with ❤️ in India</p>
                        </div>
                        <div style={{ display:'flex', gap:20 }}>
                            {['Privacy','Terms','Security','Cookies'].map(l=>(
                                <a key={l} href="#" style={{ color:'var(--text-muted)', fontSize:'0.78rem', textDecoration:'none', transition:'color 0.2s', fontWeight:500 }}
                                    onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'}
                                    onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>{l}</a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>

            {/* ═══ PAGE STYLES ═════════════════════════════════════════ */}
            <style>{`
        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-xl);
          padding: 28px;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
          cursor: default;
        }
        .feature-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-glow), var(--shadow-md);
          transform: translateY(-3px);
        }
        .feature-icon-wrap {
          width: 48px; height: 48px; border-radius: 12px;
          background: var(--color-primary-glow);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }

        .step-card {
          display: flex; align-items: flex-start; gap: 28px;
          padding: 32px; transition: border-color 0.25s;
        }
        .step-card:hover { border-color: var(--color-primary); }

        .pricing-card {
          padding: 36px 32px;
          position: relative; overflow: hidden;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .pricing-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

        .pricing-highlight {
          background: linear-gradient(145deg, var(--color-primary), #8B5CF6) !important;
          border-color: transparent !important;
          color: white;
        }

        .popular-badge {
          position: absolute; top: 16px; right: 16px;
          background: rgba(255,255,255,0.2);
          color: white; font-size: 0.72rem; font-weight: 700;
          padding: 4px 12px; border-radius: var(--radius-full);
          letter-spacing: 0.04em; text-transform: uppercase;
        }

        .btn-white {
          background: white !important;
          color: var(--color-primary) !important;
          font-weight: 700;
          transition: all 0.2s;
        }
        .btn-white:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.15);
        }
      `}</style>
        </div>
    );
}
