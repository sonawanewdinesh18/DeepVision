import { useState, useEffect, useRef } from 'react';
import { ChevronUp, MoreVertical, Pin, Trash2, RotateCcw } from 'lucide-react';
import { detectionApi } from '@/services/api';
import { InlineLoader } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import './Sidebar.css';

const menuItems = [
  { 
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  { 
    id: 'upload',
    label: 'Upload Media',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    )
  },
  { 
    id: 'result',
    label: 'Detection Results',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    )
  },
];

const Sidebar = ({ isOpen, activeView, setActiveView }) => {
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const [pinnedIds, setPinnedIds] = useState(() => {
    const saved = localStorage.getItem('pinnedDetections');
    return saved ? JSON.parse(saved) : [];
  });
  const [hiddenIds, setHiddenIds] = useState(() => {
    const saved = localStorage.getItem('hiddenDetections');
    return saved ? JSON.parse(saved) : [];
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (historyOpen && historyItems.length === 0) {
      fetchHistory();
    }
  }, [historyOpen]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await detectionApi.getHistory({ page: 1, limit: 10 });
      const items = response.data.items.map(item => ({
        id: item.id,
        file: item.file_name,
        type: item.media_type === 'image' ? 'Image' : 'Video',
        result: item.verdict.toLowerCase(),
        confidence: (item.confidence * 100).toFixed(1),
        date: new Date(item.created_at).toLocaleString()
      }));
      setHistoryItems(items);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (item) => {
    setSelectedId(item.id);
    setActiveView('result');
  };

  const togglePin = (itemId, e) => {
    e.stopPropagation();
    const newPinnedIds = pinnedIds.includes(itemId)
      ? pinnedIds.filter(id => id !== itemId)
      : [...pinnedIds, itemId];
    setPinnedIds(newPinnedIds);
    localStorage.setItem('pinnedDetections', JSON.stringify(newPinnedIds));
    setOpenMenuId(null);
  };

  const hideItem = (itemId, e) => {
    e.stopPropagation();
    const newHiddenIds = [...hiddenIds, itemId];
    setHiddenIds(newHiddenIds);
    localStorage.setItem('hiddenDetections', JSON.stringify(newHiddenIds));
    setOpenMenuId(null);
  };

  const toggleMenu = (itemId, e) => {
    e.stopPropagation();
    if (openMenuId === itemId) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(itemId);
      // Position menu to the right of sidebar
      setTimeout(() => {
        if (menuRef.current) {
          const button = e.currentTarget;
          const buttonRect = button.getBoundingClientRect();
          menuRef.current.style.top = `${buttonRect.top}px`;
          menuRef.current.style.left = `${buttonRect.right}px`;
        }
      }, 0);
    }
  };

  const restoreHidden = () => {
    setHiddenIds([]);
    localStorage.removeItem('hiddenDetections');
  };

  const sortedAndFilteredItems = historyItems
    .filter(item => !hiddenIds.includes(item.id))
    .sort((a, b) => {
      const aIsPinned = pinnedIds.includes(a.id);
      const bIsPinned = pinnedIds.includes(b.id);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0;
    });

  return (
    <aside className={`user-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">

        {/* ── Nav menu ── */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>

            {menuItems.map(({ icon, label, id }) => {
              const isActive = activeView === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">
                    {icon}
                  </span>
                  <span className="nav-label">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Inline history list (ChatGPT style) ── */}
        <div className="sb-history-section">
          <div className="sb-history-header">
            <div className="sb-history-label">Your History</div>
            {hiddenIds.length > 0 && (
              <button 
                className="sb-restore-btn" 
                onClick={restoreHidden}
                title={`Restore ${hiddenIds.length} hidden item${hiddenIds.length > 1 ? 's' : ''}`}
              >
                <RotateCcw size={12} />
                <span>{hiddenIds.length}</span>
              </button>
            )}
          </div>
          <div className="sb-history-list">
            {loading ? (
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                <InlineLoader size="sm" />
              </div>
            ) : sortedAndFilteredItems.length > 0 ? (
              sortedAndFilteredItems.map((item) => {
                const isPinned = pinnedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`sb-history-item ${selectedId === item.id ? 'sb-history-item-active' : ''}`}
                    onClick={() => handleHistoryClick(item)}
                  >
                    <div className="sb-hi-content">
                      <span className="sb-hi-name">{item.file}</span>
                      <div className="sb-hi-icons">
                        {isPinned && (
                          <Pin size={14} className="sb-pin-icon" />
                        )}
                        <div className="sb-hi-menu-wrapper" ref={openMenuId === item.id ? menuRef : null}>
                          <button
                            className="sb-menu-btn"
                            onClick={(e) => toggleMenu(item.id, e)}
                            aria-label="More options"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === item.id && (
                            <div className="sb-dropdown-menu">
                              <button
                                className="sb-menu-item"
                                onClick={(e) => togglePin(item.id, e)}
                              >
                                <Pin size={16} />
                                <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                              </button>
                              <button
                                className="sb-menu-item sb-menu-item-danger"
                                onClick={(e) => hideItem(item.id, e)}
                              >
                                <Trash2 size={16} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                {historyItems.length === 0 ? 'No detections yet' : 'All items are hidden'}
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
