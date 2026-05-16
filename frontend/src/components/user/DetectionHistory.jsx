import { useState, useEffect } from 'react';
import { detectionApi } from '@/services/api';
import { Clock, AlertTriangle } from 'lucide-react';
import { InlineLoader } from '@/components/common/LoadingSpinner';

const DetectionHistory = ({ setActiveView }) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await detectionApi.getHistory({ page: 1, limit: 1000 });
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
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    setActiveView('result', item.id);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <InlineLoader message="Loading history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        gap: '16px'
      }}>
        <AlertTriangle size={48} color="var(--error)" />
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button 
          onClick={fetchHistory}
          style={{
            padding: '10px 22px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg,#4361ee 0%,#a855f7 100%)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Clock size={24} color="#4361ee" />
        <h1 style={{ 
          fontSize: '1.8rem', 
          fontWeight: 700,
          margin: 0,
          background: 'linear-gradient(135deg, #4361ee 0%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Detection History
        </h1>
        <span style={{
          padding: '4px 12px',
          background: 'rgba(67, 97, 238, 0.1)',
          color: '#4361ee',
          borderRadius: '999px',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          {historyItems.length} items
        </span>
      </div>

      {/* History Grid */}
      {historyItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Detection History</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Upload your first media file to get started!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {historyItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4361ee';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(67, 97, 238, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 8px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.file}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  margin: 0
                }}>
                  {item.type}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: item.result === 'real' 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'rgba(239, 68, 68, 0.1)',
                  color: item.result === 'real' ? '#10b981' : '#ef4444'
                }}>
                  {item.result === 'real' ? 'Authentic' : 'Deepfake'}
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}>
                  {item.confidence}%
                </span>
              </div>

              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color)'
              }}>
                {item.date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetectionHistory;
