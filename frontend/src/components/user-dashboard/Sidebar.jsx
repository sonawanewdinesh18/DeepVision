import { useState } from 'react';
import { LayoutDashboard, Upload, FileCheck, Clock, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',         id: 'dashboard' },
  { icon: Upload,          label: 'Upload Media',      id: 'upload'    },
  { icon: FileCheck,       label: 'Detection Results', id: 'result'    },
];

const historyItems = [
  { id: 1, file: 'video_sample_01.mp4', type: 'Video', result: 'authentic', confidence: 98.5, date: '2026-03-10 14:30' },
  { id: 2, file: 'image_test_02.jpg',   type: 'Image', result: 'deepfake',  confidence: 87.3, date: '2026-03-10 13:15' },
  { id: 3, file: 'portrait_03.png',     type: 'Image', result: 'authentic', confidence: 95.2, date: '2026-03-10 11:45' },
  { id: 4, file: 'video_clip_04.mp4',   type: 'Video', result: 'deepfake',  confidence: 92.8, date: '2026-03-09 16:20' },
  { id: 5, file: 'selfie_05.jpg',       type: 'Image', result: 'authentic', confidence: 97.1, date: '2026-03-09 10:30' },
  { id: 6, file: 'interview_06.mp4',    type: 'Video', result: 'deepfake',  confidence: 89.4, date: '2026-03-08 15:10' },
  { id: 7, file: 'presentation_07.mp4', type: 'Video', result: 'authentic', confidence: 96.3, date: '2026-03-08 09:45' },
  { id: 8, file: 'photo_08.png',        type: 'Image', result: 'deepfake',  confidence: 91.7, date: '2026-03-07 18:20' },
];

const Sidebar = ({ isOpen, activeView, setActiveView }) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedId, setSelectedId]   = useState(null);

  const handleHistoryClick = (item) => {
    setSelectedId(item.id);
    setActiveView('result');
  };

  return (
    <aside className={`user-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">

        {/* ── Nav menu ── */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>

            {menuItems.map(({ icon: Icon, label, id }) => {
              const isActive = activeView === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <span className="nav-label">{label}</span>
                </button>
              );
            })}

            {/* Detection History toggle */}
            <button
              className={`nav-item ${historyOpen ? 'active' : ''}`}
              onClick={() => setHistoryOpen(v => !v)}
            >
              <span className="nav-icon">
                <Clock size={20} strokeWidth={2} />
              </span>
              <span className="nav-label">Detection History</span>
              <ChevronUp
                size={14}
                className="nav-chevron"
                style={{ transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
              />
            </button>
          </div>
        </nav>

        {/* ── Inline history list (ChatGPT style) ── */}
        {historyOpen && (
          <div className="sb-history-section">
            <div className="sb-history-label">Recent</div>
            <div className="sb-history-list">
              {historyItems.map((item) => {
                const isAuth = item.result === 'authentic';
                return (
                  <button
                    key={item.id}
                    className={`sb-history-item ${selectedId === item.id ? 'sb-history-item-active' : ''}`}
                    onClick={() => handleHistoryClick(item)}
                  >
                    <div className="sb-hi-top">
                      <span className="sb-hi-name">{item.file}</span>
                      <span className="sb-hi-conf">{item.confidence}%</span>
                    </div>
                    <div className="sb-hi-meta">
                      <span className="sb-hi-type">{item.type}</span>
                      <span className={`sb-hi-badge ${isAuth ? 'badge-auth' : 'badge-fake'}`}>
                        {isAuth
                          ? <><CheckCircle size={10} /> Authentic</>
                          : <><AlertTriangle size={10} /> Deepfake</>
                        }
                      </span>
                    </div>
                    <span className="sb-hi-date">{item.date}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};

export default Sidebar;
