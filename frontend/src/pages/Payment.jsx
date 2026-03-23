import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowLeft, CreditCard, Copy, Clock, X, ArrowRight, Lock, Shield, QrCode, Zap } from 'lucide-react';

/* ─── SVG Brand Logos ─── */
const GPay = ({ size = 36 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
    <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.83l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);
const PhonePe = ({ size = 36 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    <rect width="48" height="48" rx="12" fill="#5F259F"/>
    <path fill="#fff" d="M33.5 14h-5.8l-9.2 9.5V14H13v20h5.5v-5.5l2.2-2.2 6.3 7.7H33l-8.5-10.5L33.5 14z"/>
  </svg>
);
const Paytm = ({ size = 36 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    <rect width="48" height="48" rx="12" fill="#002970"/>
    <rect x="6" y="18" width="36" height="12" rx="2" fill="#00BAF2"/>
    <text x="24" y="28" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="900" fontFamily="Arial,sans-serif">PAYTM</text>
  </svg>
);
const BHIM = ({ size = 36 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    <rect width="48" height="48" rx="12" fill="#fff"/>
    <rect x="0" y="0" width="48" height="16" rx="12" fill="#FF9933"/>
    <rect x="0" y="16" width="48" height="16" fill="#fff"/>
    <rect x="0" y="32" width="48" height="16" rx="12" fill="#138808"/>
    <text x="24" y="28" textAnchor="middle" fill="#000080" fontSize="11" fontWeight="900" fontFamily="Arial,sans-serif">BHIM</text>
  </svg>
);
const AmazonPay = ({ size = 36 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    <rect width="48" height="48" rx="12" fill="#232F3E"/>
    <text x="24" y="22" textAnchor="middle" fill="#FF9900" fontSize="8" fontWeight="900" fontFamily="Arial,sans-serif">amazon</text>
    <text x="24" y="33" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="Arial,sans-serif">pay</text>
  </svg>
);
const Mobikwik = ({ size = 36 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    <rect width="48" height="48" rx="12" fill="#E91E8C"/>
    <text x="24" y="30" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="900" fontFamily="Arial,sans-serif">MobiKwik</text>
  </svg>
);

const fmt4   = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
const fmtExp = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length >= 3 ? d.slice(0,2)+'/'+d.slice(2) : d; };

const UPI_APPS = [
  { name:'GPay',    color:'#4285F4', Logo: GPay    },
  { name:'PhonePe', color:'#5F259F', Logo: PhonePe },
  { name:'Paytm',   color:'#00BAF2', Logo: Paytm   },
  { name:'BHIM',    color:'#FF9933', Logo: BHIM    },
];
const WALLETS = [
  { name:'Paytm Wallet', balance:'₹240', color:'#00BAF2', Logo: Paytm      },
  { name:'Amazon Pay',   balance:'₹85',  color:'#FF9900', Logo: AmazonPay  },
  { name:'Mobikwik',     balance:'₹0',   color:'#E91E8C', Logo: Mobikwik   },
];
const MOCK_HISTORY = [
  { id:'TXN8821', plan:'Pro',  amount:'₹999', method:'UPI',    date:'Mar 20, 2026', status:'Success' },
  { id:'TXN7743', plan:'Free', amount:'₹0',   method:'Card',   date:'Feb 14, 2026', status:'Success' },
  { id:'TXN6612', plan:'Pro',  amount:'₹999', method:'Wallet', date:'Jan 10, 2026', status:'Success' },
];

export default function Payment() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const plan = state?.plan || { name:'Pro', price:'₹999', period:'/mo', perks:['Unlimited detections','Priority AI processing','Full analytics dashboard','Detection history & export','Email support'] };

  const [tab, setTab]                   = useState('upi');
  const [upiId, setUpiId]               = useState('');
  const [upiVerified, setUpiVerified]   = useState(null);
  const [verifying, setVerifying]       = useState(false);
  const [selectedApp, setSelectedApp]   = useState(null);
  const [scanning, setScanning]         = useState(false);
  const [scanResult, setScanResult]     = useState(null);
  const [card, setCard]                 = useState({ name:'', number:'', expiry:'', cvv:'' });
  const [cardErrors, setCardErrors]     = useState({});
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [txnId]                         = useState('TXN' + Math.floor(Math.random()*90000+10000));
  const [showHistory, setShowHistory]   = useState(false);
  const [copied, setCopied]             = useState(false);
  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const pc = plan.name==='Free' ? '#06b6d4' : plan.name==='Enterprise' ? '#f59e0b' : '#7c3aed';
  const pcLight = plan.name==='Free' ? '#67e8f9' : plan.name==='Enterprise' ? '#fcd34d' : '#a78bfa';
  const gst   = plan.price==='₹0' ? 0 : Math.round(parseInt(plan.price.replace('₹','')) * 0.18);
  const total = plan.price==='₹0' ? '₹0' : '₹' + (parseInt(plan.price.replace('₹','')) + gst);

  const startScan = async () => {
    setScanning(true); setScanResult(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      setTimeout(() => { stopScan(); setScanResult({ upi:'merchant@okhdfc', name:'DeepVision Payments' }); setUpiId('merchant@okhdfc'); setUpiVerified({ name:'DeepVision Payments' }); }, 3000);
    } catch { setScanning(false); alert('Camera permission denied.'); }
  };
  const stopScan = () => { streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; setScanning(false); };
  useEffect(() => () => stopScan(), []);

  const verifyUpi = async () => {
    if (!upiId.includes('@')) return;
    setVerifying(true); setUpiVerified(null);
    await new Promise(r => setTimeout(r, 1400));
    const map = { 'rahul@okaxis':'Rahul Sharma','test@upi':'Test User','merchant@okhdfc':'DeepVision Payments' };
    setUpiVerified({ name: map[upiId.toLowerCase()] || upiId.split('@')[0].replace(/^./,c=>c.toUpperCase())+' (Verified)' });
    setVerifying(false);
  };

  const validateCard = () => {
    const e = {};
    if (!card.name.trim()) e.name = 'Required';
    if (card.number.replace(/\s/g,'').length < 16) e.number = 'Enter 16-digit number';
    if (card.expiry.length < 5) e.expiry = 'MM/YY';
    if (card.cvv.length < 3) e.cvv = 'Invalid';
    setCardErrors(e); return !Object.keys(e).length;
  };

  const handlePay = async () => {
    if (tab==='card' && !validateCard()) return;
    if (tab==='upi' && !upiVerified && !selectedApp) return;
    if (tab==='wallet' && !selectedWallet) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 2200));
    setLoading(false); setSuccess(true);
  };

  const copyTxn = () => { navigator.clipboard.writeText(txnId); setCopied(true); setTimeout(()=>setCopied(false), 2000); };
  const canPay = tab==='upi' ? !!(upiVerified||selectedApp) : tab==='card' ? true : !!selectedWallet;

  /* ─── SUCCESS SCREEN ─── */
  if (success) return (
    <div style={{ minHeight:'100vh', background:'#06060f', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 80% 60% at 50% 0%, ${pc}22 0%, transparent 60%)`, pointerEvents:'none' }}/>
      <motion.div initial={{ opacity:0, y:32, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
        style={{ width:'100%', maxWidth:440, position:'relative', zIndex:1 }}>
        <div style={{ background:'#0f0f1e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:28, overflow:'hidden', boxShadow:'0 60px 120px rgba(0,0,0,0.7)' }}>
          {/* top accent */}
          <div style={{ height:4, background:`linear-gradient(90deg,${pc},${pcLight},${pc})` }}/>
          <div style={{ padding:'44px 40px 40px', textAlign:'center' }}>
            <motion.div initial={{ scale:0, rotate:-20 }} animate={{ scale:1, rotate:0 }} transition={{ delay:0.2, type:'spring', stiffness:160, damping:12 }}
              style={{ width:80, height:80, borderRadius:'50%', background:`linear-gradient(135deg,#10b981,#059669)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 0 0 16px rgba(16,185,129,0.1), 0 16px 48px rgba(16,185,129,0.4)' }}>
              <CheckCircle size={40} color="#fff" strokeWidth={2}/>
            </motion.div>
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
              <div style={{ fontSize:'0.62rem', fontWeight:900, letterSpacing:'0.2em', color:'#10b981', textTransform:'uppercase', marginBottom:8 }}>Payment Confirmed</div>
              <div style={{ fontSize:'2.6rem', fontWeight:900, color:'#fff', letterSpacing:'-0.05em', lineHeight:1, marginBottom:6 }}>{total}</div>
              <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.4)', marginBottom:32 }}>
                <span style={{ color:pcLight, fontWeight:700 }}>{plan.name} Plan</span> is now active
              </div>
              {/* receipt */}
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, overflow:'hidden', marginBottom:24, textAlign:'left' }}>
                {[['Transaction ID',txnId,true],['Plan',`${plan.name} ${plan.period||'/mo'}`],['Subtotal',plan.price],['GST (18%)','₹'+gst],['Total Paid',total],['Status','✓ Confirmed']].map(([k,v,isTxn],i,arr)=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 18px', borderBottom: i<arr.length-1?'1px solid rgba(255,255,255,0.05)':'none', background: k==='Total Paid'?'rgba(255,255,255,0.03)':'transparent' }}>
                    <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.35)', fontWeight:500 }}>{k}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:'0.84rem', fontWeight:700, color: k==='Status'?'#10b981': k==='Total Paid'?'#fff':'rgba(255,255,255,0.8)', fontFamily:isTxn?'monospace':'inherit', letterSpacing:isTxn?'0.04em':'normal' }}>{v}</span>
                      {isTxn && <button onClick={copyTxn} style={{ background:'none', border:'none', cursor:'pointer', color:copied?'#10b981':'rgba(255,255,255,0.25)', display:'flex', padding:2, transition:'color 0.2s' }}><Copy size={12}/></button>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <button onClick={()=>navigate('/dashboard')} style={{ padding:'15px', borderRadius:14, border:'none', background:`linear-gradient(135deg,${pc},${pcLight})`, color:'#fff', fontWeight:800, fontSize:'0.95rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:9, boxShadow:`0 8px 32px ${pc}50` }}>
                  Go to Dashboard <ArrowRight size={16}/>
                </button>
                <button onClick={()=>setShowHistory(true)} style={{ padding:'13px', borderRadius:14, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.5)', fontWeight:600, fontSize:'0.88rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Clock size={14}/> View Payment History
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setShowHistory(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99, padding:20 }}>
            <motion.div initial={{ scale:0.92, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.92, y:20 }} onClick={e=>e.stopPropagation()}
              style={{ width:'100%', maxWidth:480, background:'#0f0f1e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, overflow:'hidden' }}>
              <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontWeight:800, color:'#fff', fontSize:'0.95rem' }}>Payment History</div>
                <button onClick={()=>setShowHistory(false)} style={{ background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, padding:6, cursor:'pointer', color:'rgba(255,255,255,0.5)', display:'flex' }}><X size={15}/></button>
              </div>
              <div style={{ padding:'12px 16px 20px', display:'flex', flexDirection:'column', gap:8 }}>
                {[{id:txnId,plan:plan.name,amount:plan.price,method:tab.toUpperCase(),date:new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),status:'Success'},...MOCK_HISTORY].map(h=>(
                  <div key={h.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'13px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.86rem', color:'#fff', marginBottom:3 }}>{h.plan} — {h.amount}</div>
                      <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>{h.id} · {h.method} · {h.date}</div>
                    </div>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#10b981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', padding:'3px 10px', borderRadius:999 }}>{h.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ─── MAIN PAYMENT PAGE ─── */
  return (
    <div style={{ minHeight:'100vh', background:'#06060f', display:'flex', flexDirection:'column', position:'relative' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .pi{width:100%;padding:13px 16px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.04);color:#fff;font-size:0.9rem;outline:none;font-family:inherit;box-sizing:border-box;transition:border-color 0.2s,box-shadow 0.2s;}
        .pi:focus{border-color:rgba(124,58,237,0.7);box-shadow:0 0 0 3px rgba(124,58,237,0.12);}
        .pi::placeholder{color:rgba(255,255,255,0.18);}
        .pi-err{border-color:#ef4444 !important;}
      `}</style>

      {/* ── NAV BAR ── */}
      <nav style={{ padding:'0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(6,6,15,0.9)', backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:50 }}>
        <button onClick={()=>navigate(-1)} style={{ display:'flex', alignItems:'center', gap:7, background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:'0.85rem', fontWeight:600, padding:'8px 0', transition:'color 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.5)'}>
          <ArrowLeft size={16}/> Back
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:`linear-gradient(135deg,${pc},${pcLight})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 16px ${pc}50` }}>
            <Shield size={16} color="#fff"/>
          </div>
          <span style={{ fontWeight:800, fontSize:'0.95rem', color:'#fff', letterSpacing:'-0.01em' }}>DeepVision <span style={{ color:pcLight }}>Pay</span></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981', animation:'pulse 2s infinite' }}/>
          <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.35)', fontWeight:600 }}>Secured · 256-bit SSL</span>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'48px 24px 80px', gap:28 }}>

        {/* ════ ORDER SUMMARY (left) ════ */}
        <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
          style={{ width:340, flexShrink:0, position:'sticky', top:88 }}>

          {/* plan card */}
          <div style={{ borderRadius:24, overflow:'hidden', marginBottom:16, position:'relative' }}>
            <div style={{ background: plan.name==='Free'?'linear-gradient(145deg,#0c1a2e,#0f2744)': plan.name==='Enterprise'?'linear-gradient(145deg,#1c1007,#3d2200)':'linear-gradient(145deg,#1e0a3c,#3b0764,#5b21b6)', padding:'28px 26px', border:`1px solid ${pc}25`, borderRadius:24, position:'relative', overflow:'hidden', boxShadow:`0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${pc}15` }}>
              <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:`radial-gradient(circle,${pc}30,transparent 70%)`, pointerEvents:'none' }}/>
              <div style={{ position:'absolute', bottom:-40, left:-40, width:150, height:150, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.04),transparent 70%)', pointerEvents:'none' }}/>
              <div style={{ position:'relative' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:999, background:`${pc}20`, border:`1px solid ${pc}35`, marginBottom:16 }}>
                  <Zap size={10} color={pcLight} fill={pcLight}/>
                  <span style={{ fontSize:'0.62rem', fontWeight:900, color:pcLight, letterSpacing:'0.14em', textTransform:'uppercase' }}>{plan.name} Plan</span>
                </div>
                <div style={{ display:'flex', alignItems:'flex-end', gap:4, marginBottom:18 }}>
                  <span style={{ fontSize:'2.8rem', fontWeight:900, color:'#fff', letterSpacing:'-0.05em', lineHeight:1 }}>{plan.price}</span>
                  <span style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.4)', marginBottom:6 }}>{plan.period}</span>
                </div>
                <div style={{ height:1, background:'rgba(255,255,255,0.1)', marginBottom:16 }}/>
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  {plan.perks.map(p=>(
                    <div key={p} style={{ display:'flex', alignItems:'center', gap:9, fontSize:'0.82rem', color:'rgba(255,255,255,0.72)' }}>
                      <div style={{ width:16, height:16, borderRadius:'50%', background:`${pc}25`, border:`1px solid ${pc}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <CheckCircle size={9} color={pcLight} strokeWidth={3}/>
                      </div>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* order total */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, overflow:'hidden', marginBottom:14 }}>
            {[['Subtotal',plan.price],['GST (18%)','₹'+gst]].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'12px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:'0.83rem' }}>
                <span style={{ color:'rgba(255,255,255,0.38)' }}>{k}</span>
                <span style={{ color:'rgba(255,255,255,0.7)', fontWeight:600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 18px', fontSize:'1rem', fontWeight:900 }}>
              <span style={{ color:'rgba(255,255,255,0.6)' }}>Total</span>
              <span style={{ color:'#fff' }}>{total}</span>
            </div>
          </div>

          {/* badges */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[['🔒','SSL Encrypted'],['⚡','Instant Access'],['↩','Cancel Anytime'],['🇮🇳','RBI Approved']].map(([ic,lb])=>(
              <div key={lb} style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'10px 12px', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:'0.9rem' }}>{ic}</span>
                <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.38)', fontWeight:600 }}>{lb}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ════ PAYMENT FORM (right) ════ */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.08, ease:[0.22,1,0.36,1] }}
          style={{ flex:1, maxWidth:520 }}>

          <div style={{ background:'#0f0f1e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:28, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.5)' }}>
            {/* top color bar */}
            <div style={{ height:3, background:`linear-gradient(90deg,${pc},${pcLight},${pc})` }}/>

            <div style={{ padding:'32px 32px 36px' }}>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#fff', letterSpacing:'-0.03em', marginBottom:4 }}>Complete Payment</h2>
              <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.35)', marginBottom:28 }}>Choose a payment method to continue</p>

              {/* ── METHOD TABS ── */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, background:'rgba(0,0,0,0.4)', borderRadius:16, padding:5, marginBottom:28, border:'1px solid rgba(255,255,255,0.06)' }}>
                {[['upi','UPI / QR'],['card','Card'],['wallet','Wallet']].map(([t,lb])=>(
                  <button key={t} onClick={()=>setTab(t)}
                    style={{ padding:'11px', borderRadius:12, border:'none', cursor:'pointer', fontSize:'0.82rem', fontWeight:700, transition:'all 0.22s',
                      background: tab===t ? `linear-gradient(135deg,${pc},${pcLight})` : 'transparent',
                      color: tab===t ? '#fff' : 'rgba(255,255,255,0.35)',
                      boxShadow: tab===t ? `0 4px 20px ${pc}50` : 'none',
                    }}>
                    {lb}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* ── UPI ── */}
                {tab==='upi' && (
                  <motion.div key="upi" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.18 }}>
                    <p style={{ fontSize:'0.7rem', fontWeight:800, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:14 }}>Pay with App</p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
                      {UPI_APPS.map(({ name, color, Logo }) => (
                        <button key={name} onClick={()=>{ setSelectedApp(name); setUpiVerified(null); setUpiId(''); }}
                          style={{ padding:'16px 6px 12px', borderRadius:16, border: selectedApp===name ? `2px solid ${color}` : '1.5px solid rgba(255,255,255,0.08)', background: selectedApp===name ? `${color}15` : 'rgba(255,255,255,0.03)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, transition:'all 0.22s',
                            boxShadow: selectedApp===name ? `0 6px 24px ${color}35` : 'none',
                            transform: selectedApp===name ? 'translateY(-3px)' : 'none' }}>
                          <Logo size={34}/>
                          <span style={{ fontSize:'0.66rem', fontWeight:700, color: selectedApp===name ? color : 'rgba(255,255,255,0.4)', letterSpacing:'0.02em' }}>{name}</span>
                        </button>
                      ))}
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
                      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
                      <span style={{ fontSize:'0.64rem', color:'rgba(255,255,255,0.2)', fontWeight:700, letterSpacing:'0.1em' }}>OR ENTER UPI ID</span>
                      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
                    </div>

                    <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                      <input className="pi" value={upiId} onChange={e=>{ setUpiId(e.target.value); setUpiVerified(null); setSelectedApp(null); }} placeholder="yourname@upi" style={{ flex:1 }}/>
                      <button onClick={verifyUpi} disabled={!upiId.includes('@')||verifying}
                        style={{ padding:'13px 18px', borderRadius:12, border:'none', fontWeight:700, fontSize:'0.82rem', cursor: upiId.includes('@')?'pointer':'not-allowed', whiteSpace:'nowrap', transition:'all 0.2s',
                          background: upiId.includes('@') ? `linear-gradient(135deg,${pc},${pcLight})` : 'rgba(255,255,255,0.05)',
                          color: upiId.includes('@') ? '#fff' : 'rgba(255,255,255,0.2)',
                          boxShadow: upiId.includes('@') ? `0 4px 16px ${pc}40` : 'none' }}>
                        {verifying ? '…' : 'Verify'}
                      </button>
                    </div>
                    <AnimatePresence>
                      {upiVerified && (
                        <motion.div initial={{ opacity:0, y:4, height:0 }} animate={{ opacity:1, y:0, height:'auto' }} exit={{ opacity:0, height:0 }}
                          style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.78rem', color:'#10b981', fontWeight:700, padding:'9px 14px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:11, marginBottom:14, overflow:'hidden' }}>
                          <CheckCircle size={13}/> {upiVerified.name}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* QR Scanner */}
                    <div style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <QrCode size={15} color={pcLight}/>
                          <span style={{ fontSize:'0.8rem', fontWeight:700, color:'rgba(255,255,255,0.55)' }}>Scan QR Code</span>
                        </div>
                        <button onClick={scanning?stopScan:startScan}
                          style={{ padding:'6px 13px', borderRadius:9, border: scanning?'1px solid rgba(239,68,68,0.3)':'1px solid rgba(255,255,255,0.1)', background: scanning?'rgba(239,68,68,0.08)':'rgba(255,255,255,0.04)', color: scanning?'#ef4444':'rgba(255,255,255,0.5)', fontWeight:700, fontSize:'0.73rem', cursor:'pointer' }}>
                          {scanning ? 'Stop' : 'Open Camera'}
                        </button>
                      </div>
                      <AnimatePresence>
                        {scanning && (
                          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:160 }} exit={{ opacity:0, height:0 }} style={{ marginTop:12, borderRadius:12, overflow:'hidden', position:'relative' }}>
                            <video ref={videoRef} style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} muted playsInline/>
                            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                              <div style={{ width:110, height:110, border:`2px solid ${pcLight}`, borderRadius:12, boxShadow:`0 0 0 9999px rgba(0,0,0,0.5), 0 0 20px ${pc}80` }}/>
                            </div>
                            <div style={{ position:'absolute', bottom:8, left:0, right:0, textAlign:'center', fontSize:'0.68rem', color:'rgba(255,255,255,0.6)', fontWeight:600 }}>Scanning…</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <AnimatePresence>
                        {scanResult && !scanning && (
                          <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                            style={{ marginTop:10, display:'flex', alignItems:'center', gap:7, fontSize:'0.78rem', color:'#10b981', fontWeight:700, padding:'9px 14px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:11 }}>
                            <CheckCircle size={13}/> {scanResult.name} ({scanResult.upi})
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {/* ── CARD ── */}
                {tab==='card' && (
                  <motion.div key="card" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.18 }}>
                    {/* live card preview */}
                    <div style={{ borderRadius:20, padding:'22px 22px 20px', marginBottom:20, position:'relative', overflow:'hidden', background:`linear-gradient(135deg,${plan.name==='Free'?'#0c4a6e,#0891b2':plan.name==='Enterprise'?'#78350f,#d97706':'#1e1b4b,#4c1d95'})`, boxShadow:`0 16px 48px ${pc}40, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
                      <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
                      <div style={{ position:'absolute', bottom:-50, left:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, position:'relative' }}>
                        <CreditCard size={26} color="rgba(255,255,255,0.6)"/>
                        <div style={{ display:'flex', gap:4 }}>
                          {[0,1,2,3].map(i=><div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i<2?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.3)' }}/>)}
                        </div>
                      </div>
                      <div style={{ fontSize:'1.05rem', fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:'0.22em', fontFamily:'monospace', marginBottom:18, position:'relative' }}>
                        {card.number || '•••• •••• •••• ••••'}
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', position:'relative' }}>
                        <div>
                          <div style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em', marginBottom:3 }}>CARDHOLDER</div>
                          <div style={{ fontSize:'0.8rem', fontWeight:700, color:'rgba(255,255,255,0.85)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{card.name||'YOUR NAME'}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em', marginBottom:3 }}>EXPIRES</div>
                          <div style={{ fontSize:'0.8rem', fontWeight:700, color:'rgba(255,255,255,0.85)', fontFamily:'monospace' }}>{card.expiry||'MM/YY'}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      {[{k:'name',l:'Cardholder Name',p:'Name on card',t:'text',full:true},{k:'number',l:'Card Number',p:'0000 0000 0000 0000',t:'text',full:true},{k:'expiry',l:'Expiry',p:'MM/YY',t:'text',full:false},{k:'cvv',l:'CVV',p:'•••',t:'password',full:false}].reduce((rows,f)=>{
                        if(f.full||!rows.length||rows[rows.length-1].full) rows.push({items:[f],full:f.full});
                        else rows[rows.length-1].items.push(f);
                        return rows;
                      },[]).map((row,ri)=>(
                        <div key={ri} style={{ display:'grid', gridTemplateColumns:row.full?'1fr':'1fr 1fr', gap:12 }}>
                          {row.items.map(f=>(
                            <div key={f.k}>
                              <label style={{ display:'block', fontSize:'0.67rem', fontWeight:800, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:7 }}>{f.l}</label>
                              <input className={`pi${cardErrors[f.k]?' pi-err':''}`} type={f.t} value={card[f.k]} placeholder={f.p}
                                onChange={e=>{ let v=e.target.value; if(f.k==='number')v=fmt4(v); if(f.k==='expiry')v=fmtExp(v); if(f.k==='cvv')v=v.replace(/\D/g,'').slice(0,4); setCard(c=>({...c,[f.k]:v})); setCardErrors(er=>({...er,[f.k]:null})); }}/>
                              {cardErrors[f.k]&&<div style={{ fontSize:'0.68rem', color:'#ef4444', marginTop:4, fontWeight:600 }}>{cardErrors[f.k]}</div>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:11, marginTop:14 }}>
                      <Lock size={12} color="#10b981"/>
                      <span style={{ fontSize:'0.71rem', color:'rgba(255,255,255,0.35)' }}>Card details are encrypted. Never stored on our servers.</span>
                    </div>
                  </motion.div>
                )}

                {/* ── WALLET ── */}
                {tab==='wallet' && (
                  <motion.div key="wallet" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.18 }}
                    style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {WALLETS.map(({ name, balance, color, Logo }) => (
                      <button key={name} onClick={()=>setSelectedWallet(name)}
                        style={{ padding:'16px 18px', borderRadius:16, border: selectedWallet===name?`2px solid ${color}`:'1.5px solid rgba(255,255,255,0.08)', background: selectedWallet===name?`${color}10`:'rgba(255,255,255,0.025)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all 0.22s',
                          boxShadow: selectedWallet===name?`0 6px 24px ${color}25`:'none',
                          transform: selectedWallet===name?'translateY(-2px)':'none' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                          <Logo size={36}/>
                          <div style={{ textAlign:'left' }}>
                            <div style={{ fontSize:'0.88rem', fontWeight:700, color:'#fff' }}>{name}</div>
                            <div style={{ fontSize:'0.73rem', color:'rgba(255,255,255,0.35)', marginTop:2 }}>
                              Balance: <span style={{ color: parseInt(balance.replace('₹',''))>0?'#10b981':'rgba(255,255,255,0.3)', fontWeight:700 }}>{balance}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ width:20, height:20, borderRadius:'50%', border: selectedWallet===name?`2px solid ${color}`:'2px solid rgba(255,255,255,0.15)', background: selectedWallet===name?color:'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0 }}>
                          {selectedWallet===name && <div style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }}/>}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── PAY BUTTON ── */}
              <motion.button onClick={handlePay} disabled={!canPay||loading}
                whileHover={canPay&&!loading?{ scale:1.015, y:-2 }:{}}
                whileTap={canPay&&!loading?{ scale:0.985 }:{}}
                style={{ width:'100%', marginTop:28, padding:'17px', borderRadius:16, border:'none',
                  cursor: canPay&&!loading?'pointer':'not-allowed',
                  fontWeight:900, fontSize:'1rem', letterSpacing:'0.01em',
                  background: canPay&&!loading ? `linear-gradient(135deg,${pc},${pcLight})` : 'rgba(255,255,255,0.05)',
                  color: canPay&&!loading ? '#fff' : 'rgba(255,255,255,0.2)',
                  boxShadow: canPay&&!loading ? `0 12px 40px ${pc}55, inset 0 1px 0 rgba(255,255,255,0.2)` : 'none',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.25s',
                }}>
                {loading
                  ? <><span style={{ width:18, height:18, border:'2.5px solid rgba(255,255,255,0.25)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/> Processing…</>
                  : <>{plan.price==='₹0' ? 'Activate Free Plan' : `Pay ${total} Securely`} <ArrowRight size={17}/></>
                }
              </motion.button>

              <div style={{ marginTop:14, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <Lock size={11} color="rgba(255,255,255,0.18)"/>
                <span style={{ fontSize:'0.69rem', color:'rgba(255,255,255,0.2)', fontWeight:500 }}>Powered by Razorpay · PCI DSS Level 1 Certified</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
