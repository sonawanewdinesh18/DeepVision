import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, ArrowRight, Zap, Shield, BarChart3, Lock, Star, ChevronDown } from 'lucide-react';
import Navbar from '../components/Navbar';

const PLANS = [
    {
        name: 'Free', tag: 'STARTER',
        price: { monthly: '₹0', yearly: '₹0' },
        desc: 'Try DeepVision with no commitment.',
        color: '#06b6d4', glow: 'rgba(6,182,212,0.18)',
        cardBg: 'linear-gradient(155deg,#0f172a 0%,#0c1a2e 100%)',
        highlight: false,
        icon: <Zap size={22} color="#06b6d4" />,
        perks: ['50 detections / month','Image & video support','Basic confidence score','Community support'],
        missing: ['Detection history','Analytics dashboard','Export results','API access'],
    },
    {
        name: 'Pro', tag: 'MOST POPULAR',
        price: { monthly: '₹999', yearly: '₹799' },
        desc: 'Everything you need for serious deepfake detection.',
        color: '#a78bfa', glow: 'rgba(167,139,250,0.25)',
        cardBg: 'linear-gradient(155deg,#3b0764 0%,#4c1d95 40%,#6d28d9 100%)',
        highlight: true,
        icon: <BarChart3 size={22} color="#fff" />,
        perks: ['Unlimited detections','Image & video support','Full confidence breakdown','Priority email support','Detection history & export','Full analytics dashboard'],
        missing: ['API access'],
    },
    {
        name: 'Enterprise', tag: 'SCALE',
        price: { monthly: 'Custom', yearly: 'Custom' },
        desc: 'Custom solutions for teams and organizations.',
        color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',
        cardBg: 'linear-gradient(155deg,#1c1007 0%,#2d1a00 50%,#3d2200 100%)',
        highlight: false,
        icon: <Shield size={22} color="#f59e0b" />,
        perks: ['Unlimited detections','Image & video support','Full confidence breakdown','Dedicated account manager','Detection history & export','Full analytics dashboard','REST API access','On-premise deployment'],
        missing: [],
    },
];

const COMPARE = [
    { label: 'Detections / month',  free: '50',        pro: 'Unlimited', ent: 'Unlimited' },
    { label: 'Image support',        free: true,        pro: true,        ent: true        },
    { label: 'Video support',        free: true,        pro: true,        ent: true        },
    { label: 'Confidence score',     free: 'Basic',     pro: 'Full',      ent: 'Full'      },
    { label: 'Detection history',    free: false,       pro: true,        ent: true        },
    { label: 'Analytics dashboard',  free: false,       pro: true,        ent: true        },
    { label: 'Export results',       free: false,       pro: true,        ent: true        },
    { label: 'API access',           free: false,       pro: false,       ent: true        },
    { label: 'On-premise deploy',    free: false,       pro: false,       ent: true        },
    { label: 'SLA guarantee',        free: false,       pro: false,       ent: true        },
    { label: 'Support',              free: 'Community', pro: 'Email',     ent: 'Dedicated' },
];

const FAQS = [
    { q: 'Can I upgrade or downgrade anytime?', a: 'Yes — changes take effect immediately. Downgrades apply at the end of your billing cycle with no extra charge.' },
    { q: 'What counts as one detection?', a: 'Each image or video file submitted for analysis counts as one detection, regardless of file size or video length.' },
    { q: 'Is my uploaded media stored?', a: 'No. Files are processed in memory and deleted immediately after analysis. We never store or share your media.' },
    { q: 'Do you offer a free trial for Pro?', a: 'Yes — new accounts automatically get a 7-day Pro trial. No credit card required to start.' },
    { q: 'What payment methods do you accept?', a: 'We accept UPI (GPay, PhonePe, Paytm, BHIM), all major credit/debit cards, and popular digital wallets.' },
];

function Tick({ val, color }) {
    if (val === true)  return <CheckCircle size={15} color={color || '#10b981'} strokeWidth={2.5} />;
    if (val === false) return <X size={14} color="var(--text-muted)" strokeWidth={2} />;
    return <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', fontWeight:600 }}>{val}</span>;
}

export default function PricingPage() {
    const navigate = useNavigate();
    const [yearly, setYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const [hovered, setHovered] = useState(null);

    const handleChoose = (plan) => {
        if (plan.name === 'Enterprise') return navigate('/signin');
        const price = yearly ? plan.price.yearly : plan.price.monthly;
        const period = price === '₹0' ? '/mo' : yearly ? '/mo (billed yearly)' : '/mo';
        navigate('/payment', { state: { plan: { name: plan.name, price, period, perks: plan.perks } } });
    };

    return (
        <div style={{ minHeight:'100vh', background:'var(--bg-base)', overflowX:'hidden' }}>
            <Navbar />

            {/* ══ HERO ══ */}
            <section style={{ padding:'110px 24px 56px', textAlign:'center', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,var(--border-color) 1px,transparent 1px)', backgroundSize:'44px 44px', opacity:0.4, pointerEvents:'none' }} />
                <div style={{ position:'absolute', top:-120, left:'50%', transform:'translateX(-50%)', width:900, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(108,63,245,0.2),transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />

                <motion.div initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.65, ease:[0.22,1,0.36,1] }}
                    style={{ position:'relative', zIndex:1, maxWidth:680, margin:'0 auto' }}>

                    <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:999, background:'rgba(108,63,245,0.1)', border:'1px solid rgba(108,63,245,0.25)', marginBottom:24 }}>
                        <Star size={12} color="#8B5CF6" fill="#8B5CF6" />
                        <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#8B5CF6', letterSpacing:'0.06em', textTransform:'uppercase' }}>Transparent Pricing</span>
                    </div>

                    <h1 style={{ fontSize:'clamp(2.2rem,5.5vw,3.8rem)', fontWeight:900, letterSpacing:'-0.04em', marginBottom:18, color:'var(--text-primary)', lineHeight:1.08 }}>
                        Choose the plan<br/>
                        <span className="text-gradient">that fits your needs</span>
                    </h1>
                    <p style={{ color:'var(--text-secondary)', fontSize:'1.08rem', lineHeight:1.75, marginBottom:40, maxWidth:520, margin:'0 auto 40px' }}>
                        Start free, no credit card needed. Upgrade anytime for more power and features.
                    </p>

                    {/* Billing toggle */}
                    <div style={{ display:'inline-flex', alignItems:'center', gap:0, background:'var(--bg-card)', border:'1px solid var(--border-card)', borderRadius:14, padding:5 }}>
                        {[false, true].map(y => (
                            <button key={String(y)} onClick={() => setYearly(y)}
                                style={{ padding:'10px 28px', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', transition:'all 0.22s', display:'flex', alignItems:'center', gap:8,
                                    background: yearly===y ? 'linear-gradient(135deg,#6C3FF5,#8B5CF6)' : 'transparent',
                                    color: yearly===y ? '#fff' : 'var(--text-muted)',
                                    boxShadow: yearly===y ? '0 4px 16px rgba(108,63,245,0.35)' : 'none',
                                }}>
                                {y ? 'Yearly' : 'Monthly'}
                                {y && <span style={{ fontSize:'0.62rem', fontWeight:900, background:'#10b981', color:'#fff', padding:'2px 8px', borderRadius:999, letterSpacing:'0.04em' }}>SAVE 20%</span>}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ══ PLAN CARDS ══ */}
            <section style={{ padding:'0 24px 80px', position:'relative' }}>
                <div style={{ maxWidth:1140, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, alignItems:'center' }}>
                    {PLANS.map((plan, i) => (
                        <motion.div key={plan.name}
                            initial={{ opacity:0, y:50 }}
                            animate={{ opacity:1, y:0 }}
                            transition={{ duration:0.6, delay:i*0.13, ease:[0.22,1,0.36,1] }}
                            onMouseEnter={() => setHovered(plan.name)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                position:'relative', borderRadius:28, overflow:'hidden',
                                display:'flex', flexDirection:'column',
                                background: plan.cardBg,
                                border: plan.highlight ? `1px solid ${plan.color}50` : hovered===plan.name ? `1px solid ${plan.color}50` : `1px solid ${plan.color}20`,
                                boxShadow: plan.highlight ? `0 40px 100px ${plan.glow}, 0 0 0 1px ${plan.color}30` : hovered===plan.name ? `0 24px 64px ${plan.glow}` : '0 8px 40px rgba(0,0,0,0.15)',
                                transform: plan.highlight ? 'scale(1.05)' : hovered===plan.name ? 'translateY(-6px)' : 'translateY(0)',
                                transition: 'all 0.25s ease',
                                zIndex: plan.highlight ? 2 : 1,
                            }}
                        >
                            {/* top accent */}
                            {!plan.highlight && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${plan.color},transparent)` }} />}

                            {/* highlight glows */}
                            {plan.highlight && <>
                                <div style={{ position:'absolute', top:-100, right:-100, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.12),transparent 70%)', pointerEvents:'none' }} />
                                <div style={{ position:'absolute', bottom:-80, left:-80, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.07),transparent 70%)', pointerEvents:'none' }} />
                            </>}

                            {/* tag */}
                            <div style={{ position:'absolute', top:22, right:22 }}>
                                <span style={{ fontSize:'0.58rem', fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', padding:'5px 13px', borderRadius:999,
                                    background: plan.highlight ? 'rgba(255,255,255,0.2)' : `${plan.color}18`,
                                    color: plan.highlight ? '#fff' : plan.color,
                                    border: plan.highlight ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${plan.color}35`,
                                    backdropFilter: plan.highlight ? 'blur(10px)' : 'none',
                                }}>{plan.tag}</span>
                            </div>

                            <div style={{ padding: plan.highlight ? '44px 34px 38px' : '36px 30px 32px', display:'flex', flexDirection:'column', flex:1 }}>

                                {/* icon */}
                                <div style={{ width:48, height:48, borderRadius:15, marginBottom:20, display:'flex', alignItems:'center', justifyContent:'center',
                                    background: plan.highlight ? 'rgba(255,255,255,0.15)' : plan.glow,
                                    border: plan.highlight ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${plan.color}30`,
                                    boxShadow: plan.highlight ? 'none' : `0 6px 20px ${plan.glow}`,
                                }}>
                                    {plan.icon}
                                </div>

                                <div style={{ fontSize:'0.68rem', fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color: plan.highlight ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)', marginBottom:8 }}>{plan.name}</div>
                                <div style={{ fontSize:'0.85rem', color: plan.highlight ? 'rgba(255,255,255,0.65)' : 'var(--text-secondary)', marginBottom:24, lineHeight:1.55 }}>{plan.desc}</div>

                                {/* price */}
                                <div style={{ display:'flex', alignItems:'flex-end', gap:5, marginBottom:4 }}>
                                    <span style={{ fontSize: plan.highlight ? '3.8rem' : '3.2rem', fontWeight:900, letterSpacing:'-0.05em', lineHeight:1, color: plan.highlight ? '#fff' : 'var(--text-primary)' }}>
                                        {yearly ? plan.price.yearly : plan.price.monthly}
                                    </span>
                                    {plan.price.monthly !== 'Custom' && <span style={{ fontSize:'0.88rem', color: plan.highlight ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', marginBottom:8 }}>/mo</span>}
                                </div>
                                {yearly && plan.price.monthly !== '₹0' && plan.price.monthly !== 'Custom' && (
                                    <div style={{ fontSize:'0.72rem', color: plan.highlight ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', marginBottom:4 }}>billed annually · save ₹2,400/yr</div>
                                )}

                                <div style={{ height:1, background: plan.highlight ? 'rgba(255,255,255,0.15)' : 'var(--border-color)', margin:'22px 0' }} />

                                {/* perks */}
                                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:12, flex:1, marginBottom:28 }}>
                                    {plan.perks.map(p => (
                                        <li key={p} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:'0.86rem', color: plan.highlight ? 'rgba(255,255,255,0.88)' : 'var(--text-secondary)' }}>
                                            <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center',
                                                background: plan.highlight ? 'rgba(255,255,255,0.18)' : `${plan.color}18`,
                                                border: plan.highlight ? '1px solid rgba(255,255,255,0.28)' : `1px solid ${plan.color}35`,
                                            }}>
                                                <CheckCircle size={11} color={plan.highlight ? '#fff' : plan.color} strokeWidth={3}/>
                                            </div>
                                            {p}
                                        </li>
                                    ))}
                                    {plan.missing.map(p => (
                                        <li key={p} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:'0.86rem', color: plan.highlight ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)', opacity:0.5 }}>
                                            <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'1px solid var(--border-color)' }}>
                                                <X size={10} color="var(--text-muted)" strokeWidth={2}/>
                                            </div>
                                            <span style={{ textDecoration:'line-through' }}>{p}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <button onClick={() => handleChoose(plan)}
                                    style={{
                                        width:'100%', padding:'15px', borderRadius:14, border:'none',
                                        fontWeight:800, fontSize:'0.93rem', cursor:'pointer',
                                        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                                        transition:'all 0.22s',
                                        background: plan.highlight ? '#fff' : plan.name==='Free' ? `linear-gradient(135deg,#63B3ED,#3B82F6)` : plan.name==='Enterprise' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6C3FF5,#8B5CF6)',
                                        color: plan.highlight ? '#6C3FF5' : '#fff',
                                        boxShadow: plan.highlight ? '0 8px 28px rgba(255,255,255,0.28)' : `0 6px 24px ${plan.glow}`,
                                    }}
                                    onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; }}
                                    onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; }}
                                >
                                    {plan.name==='Enterprise' ? 'Contact Sales' : plan.price.monthly==='₹0' ? 'Get Started Free' : 'Choose Plan'}
                                    <ArrowRight size={15}/>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* trust strip */}
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5, duration:0.5 }}
                    style={{ maxWidth:1140, margin:'40px auto 0', display:'flex', alignItems:'center', justifyContent:'center', gap:36, flexWrap:'wrap' }}>
                    {[['🔒','256-bit SSL'],['✓','Cancel Anytime'],['🎁','7-day Pro Trial'],['🇮🇳','UPI & Cards Accepted'],['📞','24/7 Support']].map(([ic,lb])=>(
                        <div key={lb} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600 }}>
                            <span>{ic}</span> {lb}
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* ══ COMPARISON TABLE ══ */}
            <section style={{ padding:'0 24px 80px', background:'var(--bg-surface)' }}>
                <div style={{ maxWidth:1100, margin:'0 auto' }}>
                    <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}
                        style={{ textAlign:'center', padding:'64px 0 48px' }}>
                        <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:10 }}>
                            Full feature <span className="text-gradient">comparison</span>
                        </h2>
                        <p style={{ color:'var(--text-secondary)', fontSize:'0.95rem' }}>Every detail, side by side.</p>
                    </motion.div>

                    <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:0.1 }}
                        style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)', borderRadius:24, overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.07)' }}>

                        {/* header */}
                        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', background:'var(--bg-surface)', borderBottom:'1px solid var(--border-color)', padding:'20px 32px' }}>
                            <div style={{ fontSize:'0.72rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Feature</div>
                            {[['Free','#63B3ED'],['Pro','#8B5CF6'],['Enterprise','#10b981']].map(([n,c])=>(
                                <div key={n} style={{ textAlign:'center' }}>
                                    <span style={{ fontSize:'0.82rem', fontWeight:900, color:c, letterSpacing:'0.04em', padding:'4px 14px', borderRadius:999, background:`${c}15`, border:`1px solid ${c}30` }}>{n}</span>
                                </div>
                            ))}
                        </div>

                        {COMPARE.map((row, i) => (
                            <div key={row.label} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', padding:'15px 32px', borderBottom: i<COMPARE.length-1 ? '1px solid var(--border-color)' : 'none', background: i%2===0 ? 'transparent' : 'var(--bg-surface)', alignItems:'center', transition:'background 0.15s' }}>
                                <div style={{ fontSize:'0.86rem', color:'var(--text-secondary)', fontWeight:500 }}>{row.label}</div>
                                <div style={{ display:'flex', justifyContent:'center' }}><Tick val={row.free} color="#63B3ED"/></div>
                                <div style={{ display:'flex', justifyContent:'center' }}><Tick val={row.pro} color="#8B5CF6"/></div>
                                <div style={{ display:'flex', justifyContent:'center' }}><Tick val={row.ent} color="#10b981"/></div>
                            </div>
                        ))}

                        {/* footer CTA row */}
                        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', padding:'24px 32px', background:'var(--bg-surface)', borderTop:'1px solid var(--border-color)' }}>
                            <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', fontWeight:600, display:'flex', alignItems:'center' }}>Ready to get started?</div>
                            {PLANS.map(plan=>(
                                <div key={plan.name} style={{ display:'flex', justifyContent:'center' }}>
                                    <button onClick={()=>handleChoose(plan)}
                                        style={{ padding:'9px 20px', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', transition:'all 0.2s',
                                            background: plan.highlight ? 'linear-gradient(135deg,#6C3FF5,#8B5CF6)' : 'var(--bg-card)',
                                            color: plan.highlight ? '#fff' : 'var(--text-primary)',
                                            border: plan.highlight ? 'none' : '1px solid var(--border-card)',
                                            boxShadow: plan.highlight ? '0 4px 16px rgba(108,63,245,0.35)' : 'none',
                                        }}
                                        onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                                        onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
                                    >
                                        {plan.name==='Enterprise' ? 'Contact' : plan.price.monthly==='₹0' ? 'Start Free' : 'Choose'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ══ FAQ ══ */}
            <section style={{ padding:'64px 24px 80px' }}>
                <div style={{ maxWidth:760, margin:'0 auto' }}>
                    <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}
                        style={{ textAlign:'center', marginBottom:48 }}>
                        <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:10 }}>
                            Frequently asked <span className="text-gradient">questions</span>
                        </h2>
                        <p style={{ color:'var(--text-secondary)', fontSize:'0.95rem' }}>Everything you need to know before choosing a plan.</p>
                    </motion.div>

                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {FAQS.map((faq, i) => (
                            <motion.div key={i}
                                initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.07 }}
                                style={{ background:'var(--bg-card)', border: openFaq===i ? '1px solid rgba(108,63,245,0.35)' : '1px solid var(--border-card)', borderRadius:16, overflow:'hidden', transition:'border-color 0.2s', boxShadow: openFaq===i ? '0 8px 32px rgba(108,63,245,0.1)' : 'none' }}
                            >
                                <button onClick={()=>setOpenFaq(openFaq===i ? null : i)}
                                    style={{ width:'100%', padding:'20px 24px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, textAlign:'left' }}>
                                    <span style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-primary)' }}>{faq.q}</span>
                                    <motion.div animate={{ rotate: openFaq===i ? 180 : 0 }} transition={{ duration:0.22 }}
                                        style={{ width:28, height:28, borderRadius:'50%', background: openFaq===i ? 'linear-gradient(135deg,#6C3FF5,#8B5CF6)' : 'var(--bg-surface)', border:'1px solid var(--border-color)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.2s' }}>
                                        <ChevronDown size={14} color={openFaq===i ? '#fff' : 'var(--text-muted)'} />
                                    </motion.div>
                                </button>
                                <AnimatePresence initial={false}>
                                    {openFaq===i && (
                                        <motion.div key="content" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} style={{ overflow:'hidden' }}>
                                            <div style={{ padding:'0 24px 20px', fontSize:'0.88rem', color:'var(--text-secondary)', lineHeight:1.75, borderTop:'1px solid var(--border-color)' }}>{faq.a}</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ BOTTOM CTA ══ */}
            <section style={{ padding:'0 24px 100px' }}>
                <motion.div initial={{ opacity:0, y:32 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
                    style={{ maxWidth:860, margin:'0 auto', borderRadius:32, overflow:'hidden', position:'relative', padding:'64px 56px', textAlign:'center', background:'linear-gradient(135deg,#4c1fd4 0%,#6d28d9 50%,#8B5CF6 100%)', boxShadow:'0 40px 100px rgba(108,63,245,0.4)' }}>
                    <div style={{ position:'absolute', top:-100, right:-100, width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.1),transparent 70%)', pointerEvents:'none' }} />
                    <div style={{ position:'absolute', bottom:-80, left:-80, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.07),transparent 70%)', pointerEvents:'none' }} />
                    <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }} />

                    <div style={{ position:'relative', zIndex:1 }}>
                        <div style={{ width:60, height:60, borderRadius:20, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px', boxShadow:'0 8px 24px rgba(0,0,0,0.15)' }}>
                            <Lock size={26} color="#fff" />
                        </div>
                        <h2 style={{ fontSize:'clamp(1.8rem,4.5vw,2.8rem)', fontWeight:900, color:'#fff', letterSpacing:'-0.03em', marginBottom:16, lineHeight:1.1 }}>
                            Start detecting deepfakes today
                        </h2>
                        <p style={{ color:'rgba(255,255,255,0.72)', fontSize:'1.02rem', lineHeight:1.75, maxWidth:500, margin:'0 auto 40px' }}>
                            Join thousands of users protecting themselves from manipulated media. Free plan, no credit card needed.
                        </p>
                        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
                            <button onClick={()=>handleChoose(PLANS[1])}
                                style={{ padding:'15px 36px', borderRadius:14, border:'none', background:'#fff', color:'#6C3FF5', fontWeight:800, fontSize:'0.97rem', cursor:'pointer', display:'flex', alignItems:'center', gap:9, boxShadow:'0 6px 24px rgba(0,0,0,0.18)', transition:'all 0.22s' }}
                                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 36px rgba(0,0,0,0.25)'; }}
                                onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,0.18)'; }}
                            >
                                Get Pro — ₹999/mo <ArrowRight size={16}/>
                            </button>
                            <button onClick={()=>handleChoose(PLANS[0])}
                                style={{ padding:'15px 36px', borderRadius:14, border:'1px solid rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.1)', color:'#fff', fontWeight:700, fontSize:'0.97rem', cursor:'pointer', backdropFilter:'blur(10px)', transition:'all 0.22s' }}
                                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
                                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                            >
                                Start for Free
                            </button>
                        </div>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
