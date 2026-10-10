import React from 'react';
import { 
  Database, 
  Layers, 
  HardDrive, 
  PieChart, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  Code2, 
  FileQuestion 
} from 'lucide-react';

export default function StorageStats({ stats, onSelectCategory, activeCategory }) {
  if (!stats) return null;

  const {
    totalFiles = 0,
    formattedTotalSize = '0 Bytes',
    totalBytes = 0,
    categoryCount = {},
    categoryBytes = {},
    averageFileSize = '0 Bytes',
  } = stats;

  const totalChunks = Math.ceil(totalBytes / 261120);

  const categories = [
    { key: 'Image', label: 'Images', icon: ImageIcon, color: '#38bdf8' },
    { key: 'Document', label: 'Documents', icon: FileText, color: '#60a5fa' },
    { key: 'Video', label: 'Videos', icon: Film, color: '#fb7185' },
    { key: 'Audio', label: 'Audio', icon: Music, color: '#c084fc' },
    { key: 'Archive', label: 'Archives', icon: Archive, color: '#fbbf24' },
    { key: 'Code & Data', label: 'Code & Data', icon: Code2, color: '#34d399' },
    { key: 'Other', label: 'Other', icon: FileQuestion, color: '#94a3b8' },
  ];

  return (
    <div className="stats-section">
      <div className="stats-grid">
        {/* Total Files Card */}
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper stat-icon-blue">
            <Database size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Files Stored</span>
            <div className="stat-value">{totalFiles.toLocaleString()}</div>
            <span className="stat-subtext">Across all GridFS buckets</span>
          </div>
        </div>

        {/* Total Size Card */}
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper stat-icon-cyan">
            <HardDrive size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total GridFS Storage</span>
            <div className="stat-value">{formattedTotalSize}</div>
            <span className="stat-subtext">Avg: {averageFileSize} / file</span>
          </div>
        </div>

        {/* Total Chunks Card */}
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <Layers size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">GridFS BSON Chunks</span>
            <div className="stat-value">{totalChunks.toLocaleString()}</div>
            <span className="stat-subtext">255 KB per chunk slice</span>
          </div>
        </div>

        {/* Categories Count Card */}
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper stat-icon-purple">
            <PieChart size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active Categories</span>
            <div className="stat-value">
              {Object.values(categoryCount).filter(c => c > 0).length} of {categories.length}
            </div>
            <span className="stat-subtext">Intelligent MIME mapping</span>
          </div>
        </div>
      </div>

      {/* Visual Category Distribution Bar */}
      {totalBytes > 0 && (
        <div className="glass-card category-breakdown-card">
          <div className="breakdown-header">
            <span className="breakdown-title">Storage Breakdown by MIME Category</span>
            <span className="breakdown-total">{formattedTotalSize} used</span>
          </div>

          <div className="breakdown-bar">
            {categories.map((cat) => {
              const bytes = categoryBytes[cat.key]?.bytes || 0;
              const percentage = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0;
              if (percentage < 0.5) return null;

              return (
                <div
                  key={cat.key}
                  className="breakdown-segment"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: cat.color,
                  }}
                  title={`${cat.label}: ${categoryBytes[cat.key]?.formatted || '0 Bytes'} (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          <div className="category-pills-row">
            {categories.map((cat) => {
              const count = categoryCount[cat.key] || 0;
              const formatted = categoryBytes[cat.key]?.formatted || '0 B';
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.key;

              return (
                <button
                  type="button"
                  key={cat.key}
                  className={`category-pill-btn ${isSelected ? 'pill-active' : ''}`}
                  onClick={() => onSelectCategory(isSelected ? 'All' : cat.key)}
                >
                  <span className="pill-dot" style={{ backgroundColor: cat.color }} />
                  <Icon size={14} style={{ color: cat.color }} />
                  <span className="pill-label">{cat.label}</span>
                  <span className="pill-count">({count})</span>
                  <span className="pill-size">{formatted}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
