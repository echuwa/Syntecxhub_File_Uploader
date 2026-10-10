import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  RefreshCw, 
  FileBox, 
  Download, 
  Eye, 
  Trash2, 
  Copy, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { formatBytes, formatDate, getCategoryBadgeClass } from '../utils/formatters.js';

export default function FileExplorer({
  files,
  loading,
  totalFiles,
  searchQuery,
  onSearchChange,
  activeCategory,
  onSelectCategory,
  sortOption,
  onSortChange,
  pagination,
  onPageChange,
  onRefresh,
  onPreview,
  onDeleteRequest,
  showToast,
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const categories = [
    'All',
    'Image',
    'Document',
    'Video',
    'Audio',
    'Archive',
    'Code & Data',
    'Other',
  ];

  const handleCopyLink = (url, type) => {
    navigator.clipboard.writeText(url);
    showToast(`Copied ${type} URL to clipboard!`, 'success');
  };

  return (
    <div className="file-explorer-section glass-card">
      {/* Explorer Header / Controls */}
      <div className="explorer-controls-header">
        <div className="search-box-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search files by name or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
            >
              &times;
            </button>
          )}
        </div>

        <div className="filter-sort-group">
          {/* Sort Selector */}
          <div className="sort-wrapper">
            <ArrowUpDown size={14} className="sort-icon" />
            <select
              className="sort-select"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="largest">Largest Size</option>
              <option value="smallest">Smallest Size</option>
              <option value="name_asc">Name (A &rarr; Z)</option>
              <option value="name_desc">Name (Z &rarr; A)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="btn btn-ghost refresh-btn"
            onClick={onRefresh}
            title="Refresh Files"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Files Display */}
      {loading ? (
        <div className="explorer-loading-state">
          <RefreshCw size={32} className="animate-spin text-accent" />
          <p>Retrieving GridFS files and chunk pointers...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="explorer-empty-state">
          <div className="empty-icon-circle">
            <FileBox size={40} />
          </div>
          <h3 className="empty-title">No files found</h3>
          <p className="empty-description">
            {searchQuery || activeCategory !== 'All'
              ? 'No matching files found for current filters. Try resetting search or category filter.'
              : 'MongoDB GridFS bucket is currently empty. Upload your first file using the upload station above!'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="files-grid">
          {files.map((file) => (
            <div key={file._id} className="file-card glass-card">
              <div className="file-card-top">
                <span className={`badge ${getCategoryBadgeClass(file.category)}`}>
                  {file.category}
                </span>
                <span className="file-chunks-badge" title="Number of 255KB chunks stored in GridFS">
                  {file.totalChunks} chunk{file.totalChunks > 1 ? 's' : ''}
                </span>
              </div>

              {/* Visual Thumbnail or Icon */}
              <div 
                className="file-card-preview" 
                onClick={() => onPreview(file)}
              >
                {file.category === 'Image' ? (
                  <img
                    src={file.viewUrl}
                    alt={file.originalName}
                    loading="lazy"
                    className="card-thumb-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="card-generic-icon">
                    <HardDrive size={36} />
                  </div>
                )}
                <div className="preview-overlay">
                  <Eye size={20} />
                  <span>Preview</span>
                </div>
              </div>

              {/* Card Meta */}
              <div className="file-card-info">
                <h4 className="file-title" title={file.originalName}>
                  {file.originalName}
                </h4>
                <div className="file-meta-sub">
                  <span>{file.formattedSize}</span>
                  <span>&bull;</span>
                  <span>{formatDate(file.uploadDate)}</span>
                </div>
                {file.description && (
                  <p className="file-desc-text" title={file.description}>
                    {file.description}
                  </p>
                )}
                <div className="file-uploader-tag">
                  Uploaded by: <strong>{file.uploader}</strong>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="file-card-actions">
                <button
                  type="button"
                  className="btn-action btn-action-view"
                  onClick={() => onPreview(file)}
                  title="Preview / Details"
                >
                  <Eye size={15} />
                </button>
                <a
                  href={file.downloadUrl}
                  download
                  className="btn-action btn-action-download"
                  title="Download File"
                >
                  <Download size={15} />
                </a>
                <button
                  type="button"
                  className="btn-action btn-action-copy"
                  onClick={() => handleCopyLink(file.viewUrl, 'Stream')}
                  title="Copy Direct View URL"
                >
                  <Copy size={15} />
                </button>
                <button
                  type="button"
                  className="btn-action btn-action-delete"
                  onClick={() => onDeleteRequest(file)}
                  title="Delete from GridFS"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table / List View */
        <div className="table-wrapper">
          <table className="files-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Category</th>
                <th>Size</th>
                <th>Chunks</th>
                <th>Uploaded</th>
                <th>Uploader</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file._id}>
                  <td className="table-filename-cell">
                    <span 
                      className="table-filename-link" 
                      onClick={() => onPreview(file)}
                      title={file.originalName}
                    >
                      {file.originalName}
                    </span>
                    {file.description && (
                      <span className="table-sub-desc">{file.description}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getCategoryBadgeClass(file.category)}`}>
                      {file.category}
                    </span>
                  </td>
                  <td className="mono">{file.formattedSize}</td>
                  <td>
                    <span className="table-chunks-tag">{file.totalChunks}</span>
                  </td>
                  <td>{formatDate(file.uploadDate)}</td>
                  <td>{file.uploader}</td>
                  <td>
                    <div className="table-actions-cell">
                      <button
                        type="button"
                        className="btn-action btn-action-view"
                        onClick={() => onPreview(file)}
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <a
                        href={file.downloadUrl}
                        download
                        className="btn-action btn-action-download"
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        type="button"
                        className="btn-action btn-action-copy"
                        onClick={() => handleCopyLink(file.viewUrl, 'Stream')}
                        title="Copy Stream URL"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-action-delete"
                        onClick={() => onDeleteRequest(file)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination-bar">
          <span className="pagination-info">
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total files)
          </span>
          <div className="pagination-buttons">
            <button
              type="button"
              className="btn btn-secondary page-btn"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              type="button"
              className="btn btn-secondary page-btn"
              disabled={!pagination.hasMore}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
