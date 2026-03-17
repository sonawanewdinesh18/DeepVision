import React, { useState } from 'react';
import { Search, Filter, Trash2, Eye } from 'lucide-react';
import ResultBadge from './ResultBadge';

const DetectionHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('all');

  const historyData = [
    { id: 1, file: 'video_sample_01.mp4', type: 'Video', result: 'authentic', confidence: 98.5, date: '2026-03-10 14:30' },
    { id: 2, file: 'image_test_02.jpg', type: 'Image', result: 'deepfake', confidence: 87.3, date: '2026-03-10 13:15' },
    { id: 3, file: 'portrait_03.png', type: 'Image', result: 'authentic', confidence: 95.2, date: '2026-03-10 11:45' },
    { id: 4, file: 'video_clip_04.mp4', type: 'Video', result: 'deepfake', confidence: 92.8, date: '2026-03-09 16:20' },
    { id: 5, file: 'selfie_05.jpg', type: 'Image', result: 'authentic', confidence: 97.1, date: '2026-03-09 10:30' },
    { id: 6, file: 'interview_06.mp4', type: 'Video', result: 'deepfake', confidence: 89.4, date: '2026-03-08 15:10' },
  ];

  const filteredData = historyData.filter(item => {
    const matchesSearch = item.file.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterResult === 'all' || item.result === filterResult;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-24">
      <div className="page-title">
        <h1>Detection History</h1>
        <p>View and manage all your previous detection records</p>
      </div>

      <div className="card table-card">
        <div className="table-controls flex-between mb-6">
          <div className="search-wrapper relative flex-1" style={{ maxWidth: '400px' }}>
            <Search size={18} className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input w-full pl-10"
            />
          </div>

          <div className="filter-wrapper flex items-center gap-2">
            <Filter size={18} className="text-secondary" />
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="form-select"
            >
              <option value="all">All Results</option>
              <option value="authentic">Authentic</option>
              <option value="deepfake">Deepfake</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper border border-card rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface border-b border-color">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">File Name</th>
                <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">Media Type</th>
                <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">Detection Result</th>
                <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">Confidence Score</th>
                <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">Date & Time</th>
                <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-color hover-bg-surface transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">{item.file}</td>
                    <td className="py-3 px-4 text-sm text-secondary">{item.type}</td>
                    <td className="py-3 px-4">
                      <ResultBadge result={item.result} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-sm font-bold">{item.confidence}%</td>
                    <td className="py-3 px-4 text-sm text-secondary">{item.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="btn btn-icon btn-ghost" title="View details">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-icon btn-ghost text-error" title="Delete record">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-secondary">
                    No detection records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DetectionHistory;
