import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  Database, 
  Send, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function ApiReferenceModal({ onClose, showToast }) {
  const [activeTab, setActiveTab] = useState('endpoints');
  const [copiedKey, setCopiedKey] = useState('');

  const baseUrl = window.location.origin;

  const endpoints = [
    {
      id: 'upload-single',
      method: 'POST',
      path: '/api/files/upload',
      title: 'Upload Single File',
      desc: 'Multipart form-data upload using Multer memoryStorage streamed to MongoDB GridFS.',
      body: 'multipart/form-data: file (binary), uploader (string), description (string)',
      curl: `curl -X POST "${baseUrl}/api/files/upload" \\
  -F "file=@/path/to/sample.png" \\
  -F "uploader=SyntecxHub Intern" \\
  -F "description=Test upload"`,
      response: `{
  "success": true,
  "message": "File successfully uploaded and stored in MongoDB GridFS.",
  "file": {
    "_id": "6701f89...",
    "filename": "172815...-sample.png",
    "originalName": "sample.png",
    "size": 1048576,
    "formattedSize": "1 MB",
    "totalChunks": 5,
    "contentType": "image/png",
    "category": "Image"
  }
}`,
    },
    {
      id: 'upload-multiple',
      method: 'POST',
      path: '/api/files/upload-multiple',
      title: 'Batch Upload Multiple Files',
      desc: 'Upload up to 10 files simultaneously in a single multipart request.',
      body: 'multipart/form-data: files (multiple binaries), uploader (string)',
      curl: `curl -X POST "${baseUrl}/api/files/upload-multiple" \\
  -F "files=@file1.pdf" \\
  -F "files=@file2.jpg" \\
  -F "uploader=SyntecxHub Intern"`,
      response: `{
  "success": true,
  "count": 2,
  "message": "Successfully uploaded 2 files to MongoDB GridFS.",
  "files": [ ... ]
}`,
    },
    {
      id: 'get-all',
      method: 'GET',
      path: '/api/files?q={query}&category={cat}&sort=newest&page=1',
      title: 'List Files with Query & Filters',
      desc: 'Retrieve paginated files list with regex search, category filtering, and sorting.',
      body: 'Query Parameters: q, category, sort, page, limit',
      curl: `curl -X GET "${baseUrl}/api/files?category=Document&sort=newest&limit=10"`,
      response: `{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasMore": true
  }
}`,
    },
    {
      id: 'get-by-id',
      method: 'GET',
      path: '/api/files/:id',
      title: 'Get File Metadata',
      desc: 'Retrieve BSON metadata, chunk count, and upload timestamp by 24-char ObjectId.',
      body: 'Path Parameter: id (ObjectId)',
      curl: `curl -X GET "${baseUrl}/api/files/6701f89b1a5833ab2ab626e"`,
      response: `{
  "success": true,
  "file": {
    "_id": "6701f89b1a5833ab2ab626e",
    "filename": "...",
    "originalName": "report.pdf",
    "totalChunks": 8,
    "contentType": "application/pdf"
  }
}`,
    },
    {
      id: 'stream-view',
      method: 'GET',
      path: '/api/files/:id/view',
      title: 'Stream File Inline (Range Support)',
      desc: 'Stream raw file directly from GridFS chunks. Supports HTTP 206 Partial Content for audio/video seek.',
      body: 'Headers: Range (optional, e.g. bytes=0-1048575)',
      curl: `curl -I "${baseUrl}/api/files/6701f89b1a5833ab2ab626e/view"`,
      response: `HTTP/1.1 200 OK
Content-Type: image/png
Accept-Ranges: bytes
Content-Length: 5242880`,
    },
    {
      id: 'download-file',
      method: 'GET',
      path: '/api/files/:id/download',
      title: 'Download File as Attachment',
      desc: 'Forces browser download dialog via Content-Disposition: attachment header.',
      body: 'None',
      curl: `curl -OJ "${baseUrl}/api/files/6701f89b1a5833ab2ab626e/download"`,
      response: `Binary download stream saved with original filename`,
    },
    {
      id: 'delete-file',
      method: 'DELETE',
      path: '/api/files/:id',
      title: 'Delete File & GridFS Chunks',
      desc: 'Deletes file metadata document from uploads.files and completely purges all associated chunks from uploads.chunks.',
      body: 'None',
      curl: `curl -X DELETE "${baseUrl}/api/files/6701f89b1a5833ab2ab626e"`,
      response: `{
  "success": true,
  "message": "File \\"report.pdf\\" and its GridFS chunks were deleted successfully.",
  "deletedId": "6701f89b1a5833ab2ab626e"
}`,
    },
    {
      id: 'get-stats',
      method: 'GET',
      path: '/api/files/stats',
      title: 'Storage Utilization & Breakdown',
      desc: 'Aggregates total files count, total bytes, average file size, and per-category distributions.',
      body: 'None',
      curl: `curl -X GET "${baseUrl}/api/files/stats"`,
      response: `{
  "success": true,
  "stats": {
    "totalFiles": 15,
    "totalBytes": 48234496,
    "formattedTotalSize": "46 MB",
    "categoryCount": { "Image": 6, "Document": 4, ... }
  }
}`,
    },
    {
      id: 'health-check',
      method: 'GET',
      path: '/api/health',
      title: 'System & MongoDB Ping Check',
      desc: 'Verifies server uptime, MongoDB admin ping, and active GridFS bucket state.',
      body: 'None',
      curl: `curl -X GET "${baseUrl}/api/health"`,
      response: `{
  "status": "UP",
  "database": {
    "status": "Connected",
    "databaseName": "syntecxhub_file_uploader",
    "gridFSBucket": "uploads"
  }
}`,
    },
  ];

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-card api-docs-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-info">
            <Terminal size={20} className="text-accent" />
            <h3 className="modal-title">RESTful API Documentation &amp; cURL Console</h3>
          </div>
          <button type="button" className="btn btn-ghost modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="docs-tabs-nav">
          <button 
            type="button" 
            className={`docs-tab-btn ${activeTab === 'endpoints' ? 'active' : ''}`}
            onClick={() => setActiveTab('endpoints')}
          >
            REST Endpoints ({endpoints.length})
          </button>
          <button 
            type="button" 
            className={`docs-tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
            onClick={() => setActiveTab('architecture')}
          >
            GridFS Architecture
          </button>
        </div>

        <div className="modal-body api-docs-body">
          {activeTab === 'endpoints' ? (
            <div className="endpoints-list">
              {endpoints.map((ep) => (
                <div key={ep.id} className="endpoint-card glass-card">
                  <div className="endpoint-badge-row">
                    <span className={`method-pill method-${ep.method.toLowerCase()}`}>
                      {ep.method}
                    </span>
                    <span className="mono endpoint-path">{ep.path}</span>
                  </div>

                  <h4 className="endpoint-title">{ep.title}</h4>
                  <p className="endpoint-desc">{ep.desc}</p>

                  <div className="endpoint-code-section">
                    <div className="code-header">
                      <span className="code-label">cURL Request</span>
                      <button 
                        type="button" 
                        className="btn btn-ghost copy-snippet-btn"
                        onClick={() => handleCopy(`curl-${ep.id}`, ep.curl)}
                      >
                        {copiedKey === `curl-${ep.id}` ? <Check size={14} /> : <Copy size={14} />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="code-pre mono">{ep.curl}</pre>
                  </div>

                  <div className="endpoint-code-section">
                    <div className="code-header">
                      <span className="code-label">Response Example</span>
                      <button 
                        type="button" 
                        className="btn btn-ghost copy-snippet-btn"
                        onClick={() => handleCopy(`res-${ep.id}`, ep.response)}
                      >
                        {copiedKey === `res-${ep.id}` ? <Check size={14} /> : <Copy size={14} />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="code-pre mono json-response">{ep.response}</pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="architecture-view">
              <div className="arch-card glass-card">
                <h4 className="arch-title">
                  <Database size={18} /> How MongoDB GridFS Works
                </h4>
                <p className="arch-text">
                  Standard MongoDB BSON documents have a strict 16MB limit. To store files of any size (up to multi-gigabytes), MongoDB utilizes <strong>GridFS</strong>, an abstraction that splits files into contiguous chunks.
                </p>

                <div className="gridfs-collections-grid">
                  <div className="col-box">
                    <span className="col-tag mono">uploads.files</span>
                    <h5>Metadata Collection</h5>
                    <p>Stores file descriptor: filename, length in bytes, chunk size (255 KB default), uploadDate, contentType, and custom metadata (uploader, description, category).</p>
                  </div>
                  <div className="col-box">
                    <span className="col-tag mono">uploads.chunks</span>
                    <h5>Binary Chunk Collection</h5>
                    <p>Stores binary chunk documents with <code>files_id</code> (foreign key to files document), <code>n</code> (0-indexed sequence number), and <code>data</code> (raw BSON binary buffer).</p>
                  </div>
                </div>

                <div className="arch-card glass-card" style={{ marginTop: '16px' }}>
                  <h4 className="arch-title">
                    <ShieldCheck size={18} /> Multer Memory Streaming Pipeline
                  </h4>
                  <p className="arch-text">
                    Instead of buffering files to ephemeral disk, our Multer configuration uses <code>multer.memoryStorage()</code>. The resulting buffer is streamed directly into MongoDB via <code>bucket.openUploadStream()</code>, ensuring maximum throughput, zero disk clutter, and atomic cleanup on error.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
