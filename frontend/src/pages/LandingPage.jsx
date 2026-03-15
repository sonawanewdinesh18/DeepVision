import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Zap, Shield, Brain, BarChart3, Globe, Lock, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

/* ─── Data ──────────────────────────────────────────────────── */
const FEATURES = [
    { Icon: Brain, title: 'AI-Powered Analysis', desc: 'Deep neural models analyze images and video streams in real time with human-level accuracy.' },
    { Icon: Zap, title: 'Lightning Fast', desc: 'Sub-50ms inference pipeline — optimized end-to-end for production workloads at any scale.' },
    { Icon: Shield, title: 'Enterprise Security', desc: 'SOC 2 Type II certified with end-to-end encryption and granular role-based access control.' },
    { Icon: BarChart3, title: 'Rich Analytics', desc: 'Detailed dashboards, exportable reports, and real-time alerting for every use case.' },
    { Icon: Globe, title: 'Global Infrastructure', desc: 'Deployed across 20 regions with a 99.99% SLA — built for mission-critical workloads.' },
    { Icon: Lock, title: 'Privacy First', desc: 'On-device processing options available — your data never has to leave your environment.' },
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
        name: 'Starter', price: '$0', period: '/mo', color: 'var(--bg-card)', highlight: false,
        perks: ['5,000 frames/month', '3 models', 'REST API access', 'Community support']
    },
    {
        name: 'Pro', price: '$49', period: '/mo', color: 'var(--color-primary)', highlight: true,
        perks: ['500k frames/month', 'All models + custom', 'Webhooks & SDK', 'Priority support', 'Analytics dashboard']
    },
    {
        name: 'Enterprise', price: 'Custom', period: '', color: 'var(--bg-card)', highlight: false,
        perks: ['Unlimited frames', 'On-premise deploy', 'SLA guarantee', 'Dedicated CSM', 'Audit logs & SSO']
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
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', overflowX: 'hidden' }}>
            <Navbar />

            {/* ═══ HERO ═══════════════════════════════════════════════ */}
            <section id="home" ref={heroRef}
                style={{
                    position: 'relative', minHeight: '100vh', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 80
                }}>

                {/* Animated gradient orbs */}
                <Orb duration={12} style={{
                    width: 700, height: 700, top: -180, left: -120,
                    background: 'radial-gradient(circle, rgba(108,63,245,0.45) 0%, transparent 70%)'
                }} />
                <Orb duration={9} x={[0, -50, 0]} y={[0, 40, 0]} style={{
                    width: 500, height: 500, bottom: -60, right: -80,
                    background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)'
                }} />
                <Orb duration={14} x={[0, 30, -20, 0]} y={[0, -40, 20, 0]} style={{
                    width: 350, height: 350, top: '40%', left: '55%',
                    background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)'
                }} />

                {/* Dot grid */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(circle, var(--border-color) 1px, transparent 1px)',
                    backgroundSize: '38px 38px', opacity: 0.7,
                }} />

                {/* Radial vignette */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, var(--bg-base) 100%)',
                }} />

                {/* Content */}
                <motion.div style={{
                    y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 1,
                    textAlign: 'center', maxWidth: 820, padding: '0 24px'
                }}>

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <span className="badge badge-primary" style={{ marginBottom: 28, display: 'inline-flex' }}>
                            🚀 Now in Early Access — Join 150+ enterprises
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            fontSize: 'clamp(2.6rem, 6.5vw, 5rem)', fontWeight: 900,
                            lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 28
                        }}>
                        See Everything with<br />
                        <span className="text-gradient">AI-Powered Vision</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        style={{
                            fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', color: 'var(--text-secondary)',
                            maxWidth: 580, margin: '0 auto 44px', lineHeight: 1.7
                        }}>
                        DeepVision gives your team superhuman visual intelligence — detect, classify, and act
                        on what matters instantly, at any scale.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/signup" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                            Get Started Free <ArrowRight size={17} />
                        </a>
                        <a href="#howitworks" className="btn btn-ghost" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                            See How it Works
                        </a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                        style={{
                            display: 'flex', gap: 'clamp(24px,4vw,56px)', justifyContent: 'center',
                            marginTop: 72, flexWrap: 'wrap'
                        }}>
                        {STATS.map(([num, label]) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 900,
                                    color: 'var(--color-primary)', letterSpacing: '-0.02em'
                                }}>{num}</div>
                                <div style={{
                                    fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4,
                                    fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase'
                                }}>{label}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ═══ FEATURES ════════════════════════════════════════════ */}
            <section id="features" style={{ padding: 'clamp(64px,10vw,120px) 24px' }}>
                <div style={{ maxWidth: 1140, margin: '0 auto' }}>
                    <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: 64 }}>
                        <span className="badge badge-primary" style={{ marginBottom: 16, display: 'inline-flex' }}>Features</span>
                        <h2 style={{
                            fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800,
                            letterSpacing: '-0.02em', marginBottom: 16
                        }}>
                            Everything you need to <span className="text-gradient">scale vision AI</span>
                        </h2>
                        <p style={{
                            color: 'var(--text-secondary)', fontSize: '1.05rem',
                            maxWidth: 520, margin: '0 auto', lineHeight: 1.7
                        }}>
                            From prototype to planet-scale production — DeepVision handles the infrastructure
                            so you can focus on what matters.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(310px,1fr))', gap: 20 }}>
                        {FEATURES.map(({ Icon, title, desc }, i) => (
                            <motion.div key={title} {...fadeUp(i * 0.07)} className="feature-card">
                                <div className="feature-icon-wrap"><Icon size={22} color="var(--color-primary-light)" /></div>
                                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8 }}>{title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ HOW IT WORKS ════════════════════════════════════════ */}
            <section id="howitworks" style={{
                padding: 'clamp(64px,10vw,120px) 24px',
                background: 'var(--bg-surface)',
                position: 'relative', overflow: 'hidden',
            }}>
                <Orb duration={18} style={{
                    width: 450, height: 450, top: -100, right: -80, opacity: 0.35,
                    background: 'radial-gradient(circle, rgba(108,63,245,0.4) 0%, transparent 70%)'
                }} />

                <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: 64 }}>
                        <span className="badge badge-primary" style={{ marginBottom: 16, display: 'inline-flex' }}>How it Works</span>
                        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            Up and running in <span className="text-gradient">3 simple steps</span>
                        </h2>
                    </motion.div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {STEPS.map(({ num, title, desc }, i) => (
                            <motion.div key={num}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -32 : 32 }}
                                whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                                className="card step-card">
                                <div style={{
                                    fontSize: '2.6rem', fontWeight: 900, color: 'var(--color-primary)',
                                    opacity: 0.22, lineHeight: 1, flexShrink: 0, letterSpacing: '-0.04em'
                                }}>{num}</div>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ PRICING ═════════════════════════════════════════════ */}
            <section id="pricing" style={{ padding: 'clamp(64px,10vw,120px) 24px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: 64 }}>
                        <span className="badge badge-primary" style={{ marginBottom: 16, display: 'inline-flex' }}>Pricing</span>
                        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
                            Simple, <span className="text-gradient">transparent pricing</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                            Start free, scale when you're ready. No hidden fees.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, alignItems: 'end' }}>
                        {PRICING.map(({ name, price, period, highlight, perks }, i) => (
                            <motion.div key={name} {...fadeUp(i * 0.1)}
                                className={`card pricing-card ${highlight ? 'pricing-highlight' : ''}`}>
                                {highlight && (
                                    <div className="popular-badge">Most Popular</div>
                                )}
                                <div style={{ marginBottom: 24 }}>
                                    <p style={{
                                        fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)',
                                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12
                                    }}>{name}</p>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                        <span style={{
                                            fontSize: '2.6rem', fontWeight: 900, letterSpacing: '-0.04em',
                                            color: highlight ? '#fff' : 'var(--text-primary)'
                                        }}>{price}</span>
                                        <span style={{
                                            color: highlight ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                                            fontSize: '0.9rem'
                                        }}>{period}</span>
                                    </div>
                                </div>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                                    {perks.map(p => (
                                        <li key={p} style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            fontSize: '0.9rem', color: highlight ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)'
                                        }}>
                                            <CheckCircle size={15} color={highlight ? '#a78bfa' : 'var(--color-primary-light)'} strokeWidth={2.5} />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                                <a href="/signup" className={`btn ${highlight ? 'btn-white' : 'btn-primary'}`}
                                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                                    {name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                                </a>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA ═════════════════════════════════════════════════ */}
            <section id="about" style={{
                padding: 'clamp(64px,10vw,120px) 24px',
                background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden', textAlign: 'center'
            }}>
                <Orb duration={16} style={{
                    width: 600, height: 600, top: -200, left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'radial-gradient(circle, rgba(108,63,245,0.3) 0%, transparent 70%)'
                }} />
                <motion.div {...fadeUp()} style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
                    <h2 style={{
                        fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 900,
                        letterSpacing: '-0.03em', marginBottom: 20
                    }}>
                        Ready to see the <span className="text-gradient">difference</span>?
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 44, fontSize: '1.1rem', lineHeight: 1.7 }}>
                        Join 150+ enterprises already using DeepVision to power their vision AI infrastructure.
                        Your first 5,000 frames are on us.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/signup" className="btn btn-primary" style={{ padding: '15px 38px', fontSize: '1.02rem' }}>
                            Start Free Trial <ArrowRight size={17} />
                        </a>
                        <a href="#contact" className="btn btn-ghost" style={{ padding: '15px 38px', fontSize: '1.02rem' }}>
                            Talk to Sales
                        </a>
                    </div>
                </motion.div>
            </section>

            {/* ═══ FOOTER ══════════════════════════════════════════════ */}
            <footer id="contact" style={{
                borderTop: '1px solid var(--border-color)',
                padding: '40px 32px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 16,
                background: 'var(--bg-base)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src="/src/assets/LOGO.png" alt="DeepVision" style={{ height: 26 }} />
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
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    © 2026 DeepVision Inc. · All rights reserved.
                </p>
                <div style={{ display: 'flex', gap: 20 }}>
                    {['Privacy', 'Terms', 'Security', 'Contact'].map(l => (
                        <a key={l} href="#" style={{
                            color: 'var(--text-muted)', fontSize: '0.82rem',
                            textDecoration: 'none', transition: 'color 0.2s'
                        }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>{l}</a>
                    ))}
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
