import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Database, 
  Layers, 
  Calendar, 
  User, 
  FileText, 
  HardDrive, 
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { formatBytes, formatDate, getCategoryBadgeClass } from '../utils/formatters.js';

export default function FilePreviewModal({ file, onClose, showToast }) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!file) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(file._id);
    setCopiedId(true);
    showToast('GridFS ObjectId copied!', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const curlCommand = `curl -O "${window.location.origin}${file.downloadUrl}"`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    showToast('cURL command copied to clipboard!', 'success');
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-card preview-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <span className={`badge ${getCategoryBadgeClass(file.category)}`}>
              {file.category}
            </span>
            <h3 className="modal-title" title={file.originalName}>
              {file.originalName}
            </h3>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost modal-close-btn" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body preview-modal-body">
          {/* Preview Viewport */}
          <div className="preview-viewport">
            {file.category === 'Image' ? (
              <div className="image-preview-box">
                <img 
                  src={file.viewUrl} 
                  alt={file.originalName} 
                  className="preview-full-img" 
                />
              </div>
            ) : file.category === 'Video' ? (
              <div className="media-preview-box">
                <video 
                  src={file.viewUrl} 
                  controls 
                  className="preview-video"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : file.category === 'Audio' ? (
              <div className="audio-preview-box">
                <audio 
                  src={file.viewUrl} 
                  controls 
                  className="preview-audio"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : file.contentType?.includes('pdf') ? (
              <div className="pdf-preview-box">
                <iframe 
                  src={`${file.viewUrl}#toolbar=0`} 
                  title="PDF Preview"
                  className="pdf-preview-frame"
                />
              </div>
            ) : (
              <div className="generic-preview-fallback">
                <HardDrive size={64} className="fallback-icon" />
                <p className="fallback-title">Standard File Stream</p>
                <p className="fallback-subtitle">
                  MIME: <span className="mono">{file.contentType}</span>
                </p>
                <div className="fallback-cta-row">
                  <a 
                    href={file.downloadUrl} 
                    download 
                    className="btn btn-primary"
                  >
                    <Download size={16} /> Download {file.formattedSize}
                  </a>
                  <a 
                    href={file.viewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary"
                  >
                    <ExternalLink size={16} /> Open Raw in New Tab
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Technical GridFS Details */}
          <div className="gridfs-details-card">
            <h4 className="details-heading">
              <Database size={16} /> MongoDB GridFS Storage Specification
            </h4>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">GridFS _id (BSON)</span>
                <div className="detail-value-copy">
                  <span className="mono detail-id">{file._id}</span>
                  <button 
                    type="button" 
                    className="copy-mini-btn" 
                    onClick={handleCopyId}
                    title="Copy ID"
                  >
                    {copiedId ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">Total File Size</span>
                <span className="detail-value">
                  {file.formattedSize} ({file.length?.toLocaleString()} bytes)
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">GridFS BSON Chunks</span>
                <span className="detail-value">
                  {file.totalChunks} chunks ({formatBytes(file.chunkSize || 261120)} each)
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">MIME Content-Type</span>
                <span className="detail-value mono">{file.contentType}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Upload Timestamp</span>
                <span className="detail-value">{formatDate(file.uploadDate)}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Uploader</span>
                <span className="detail-value">{file.uploader || 'Anonymous'}</span>
              </div>
            </div>

            {file.description && (
              <div className="detail-desc-box">
                <span className="detail-label">Description Note</span>
                <p className="detail-desc-content">{file.description}</p>
              </div>
            )}

            {/* cURL Snippet */}
            <div className="detail-curl-box">
              <div className="curl-header">
                <span className="curl-title">
                  <Terminal size={14} /> cURL Download Command
                </span>
                <button 
                  type="button" 
                  className="btn btn-ghost copy-curl-btn" 
                  onClick={handleCopyCurl}
                >
                  {copiedCurl ? <Check size={14} /> : <Copy size={14} />}
                  <span>Copy cURL</span>
                </button>
              </div>
              <pre className="curl-code mono">{curlCommand}</pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            Close
          </button>
          <a 
            href={file.downloadUrl} 
            download 
            className="btn btn-primary"
          >
            <Download size={16} /> Download File ({file.formattedSize})
          </a>
        </div>
      </div>
    </div>
  );
}
