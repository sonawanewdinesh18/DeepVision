import { useState, useEffect, useRef } from 'react';
import { X, Clock, Pin, Trash2, RotateCcw, MoreVertical } from 'lucide-react';
import { detectionApi } from '@/services/api';
import './HistoryPanel.css';

const HistoryPanel = ({ isOpen, onClose, setActiveView, onSelectDetection, selectedDetectionId }) => {
  const [selectedId, setSelectedId] = useState(selectedDetectionId || null);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (selectedDetectionId) {
      setSelectedId(selectedDetectionId);
    }
  }, [selectedDetectionId]);

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
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await detectionApi.getHistory({ page: 1, limit: 50 });
      
      const items = response.data.items.map(item => ({
        id: item.id,
        file: item.file_name,
        type: item.media_type === 'image' ? 'Image' : 'Video',
        result: item.verdict.toLowerCase(),
        confidence: (item.confidence * 100).toFixed(1),
        date: new Date(item.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
      
      setHistoryItems(items);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
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
    setOpenMenuId(openMenuId === itemId ? null : itemId);
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

  if (!isOpen) return null;

  const handleItemClick = (item) => {
    setSelectedId(item.id);
    if (onSelectDetection) {
      onSelectDetection(item.id);
    } else {
      setActiveView?.('result', item.id);
      onClose();
    }
  };

  return (
    <div className="hp-panel" role="dialog" aria-label="Detection History">

      {/* Drag handle */}
      <div className="hp-drag-wrap">
        <div className="hp-drag-handle" />
      </div>

      {/* Header */}
      <div className="hp-header">
        <div className="hp-header-left">
          <Clock size={17} className="hp-header-icon" />
          <span className="hp-header-title">Detection History</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {hiddenIds.length > 0 && (
            <button 
              className="hp-restore-btn" 
              onClick={restoreHidden}
              title={`Restore ${hiddenIds.length} hidden item${hiddenIds.length > 1 ? 's' : ''}`}
            >
              <RotateCcw size={14} />
              <span>{hiddenIds.length}</span>
            </button>
          )}
          <button className="hp-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="hp-list">
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading history...
          </div>
        ) : sortedAndFilteredItems.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {historyItems.length === 0 ? 'No detection history yet' : 'All items are hidden'}
          </div>
        ) : (
          sortedAndFilteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`hp-item${selectedId === item.id ? ' hp-item-active' : ''}${pinnedIds.includes(item.id) ? ' hp-item-pinned' : ''}`}
            >
              <div className="hp-item-content">
                <p className="hp-item-title">{item.file}</p>
                <div className="hp-item-menu-wrapper" ref={openMenuId === item.id ? menuRef : null}>
                  <button
                    className="hp-menu-btn"
                    onClick={(e) => toggleMenu(item.id, e)}
                    aria-label="More options"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === item.id && (
                    <div className="hp-dropdown-menu">
                      <button
                        className="hp-menu-item"
                        onClick={(e) => togglePin(item.id, e)}
                      >
                        <Pin size={16} />
                        <span>{pinnedIds.includes(item.id) ? 'Unpin' : 'Pin'}</span>
                      </button>
                      <button
                        className="hp-menu-item hp-menu-item-danger"
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
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
