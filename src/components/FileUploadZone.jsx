import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileUp, 
  X, 
  Check, 
  AlertCircle, 
  Layers, 
  Sparkles,
  User,
  AlignLeft,
  FileText
} from 'lucide-react';
import { formatBytes } from '../utils/formatters.js';

export default function FileUploadZone({ onUploadSuccess, showToast }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [uploader, setUploader] = useState(() => localStorage.getItem('syntecxhub_uploader') || 'SyntecxHub Intern');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    // Check restricted executable formats
    const restrictedExts = ['.exe', '.bat', '.sh', '.cmd', '.msi', '.vbs', '.com'];
    const invalid = newFiles.filter((f) => 
      restrictedExts.some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    if (invalid.length > 0) {
      showToast(
        `Executable files are restricted: ${invalid.map((f) => f.name).join(', ')}`,
        'error'
      );
      return;
    }

    // Check size limit (50MB)
    const tooLarge = newFiles.filter((f) => f.size > 50 * 1024 * 1024);
    if (tooLarge.length > 0) {
      showToast(
        `File exceeds 50MB limit: ${tooLarge.map((f) => f.name).join(', ')}`,
        'error'
      );
      return;
    }

    // Merge and cap at 10 files
    setSelectedFiles((prev) => {
      const merged = [...prev, ...newFiles];
      if (merged.length > 10) {
        showToast('Maximum 10 files per batch upload.', 'warning');
        return merged.slice(0, 10);
      }
      return merged;
    });
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setSelectedFiles([]);
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      showToast('Please select at least one file to upload.', 'warning');
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      localStorage.setItem('syntecxhub_uploader', uploader);

      const isSingle = selectedFiles.length === 1;
      const endpoint = isSingle ? '/api/files/upload' : '/api/files/upload-multiple';
      const formData = new FormData();

      if (isSingle) {
        formData.append('file', selectedFiles[0]);
      } else {
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
      }

      if (description) formData.append('description', description);
      if (uploader) formData.append('uploader', uploader);

      setUploadProgress(50);

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(85);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadProgress(100);
      showToast(
        isSingle 
          ? `File "${selectedFiles[0].name}" uploaded to GridFS!` 
          : `Batch upload of ${selectedFiles.length} files completed!`,
        'success'
      );

      clearQueue();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Upload Error:', err);
      showToast(err.message || 'Error occurred during file upload.', 'error');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 400);
    }
  };

  return (
    <div className="upload-zone-section glass-card">
      <div className="upload-card-header">
        <div className="upload-card-title-group">
          <FileUp className="upload-header-icon" size={20} />
          <div>
            <h2 className="upload-card-title">Multer & GridFS Upload Station</h2>
            <p className="upload-card-subtitle">
              Multipart streams directly buffered to MongoDB chunked storage
            </p>
          </div>
        </div>
        <div className="upload-limits-badge">
          <span>Max: 50MB / file &bull; Up to 10 files</span>
        </div>
      </div>

      <form onSubmit={handleUpload}>
        {/* Drag & Drop Area */}
        <div
          className={`dropzone-container ${dragOver ? 'dropzone-active' : ''} ${selectedFiles.length > 0 ? 'dropzone-has-files' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            style={{ display: 'none' }}
          />

          <div className="dropzone-inner">
            <div className="dropzone-icon-circle">
              <UploadCloud size={32} className="dropzone-cloud-icon" />
            </div>
            <div className="dropzone-text-group">
              <p className="dropzone-main-text">
                <strong>Click to browse</strong> or drag &amp; drop files here
              </p>
              <p className="dropzone-sub-text">
                Supports Images, Documents, Audio, Video, Archives, Code &amp; Data
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files Preview List */}
        {selectedFiles.length > 0 && (
          <div className="selected-files-list">
            <div className="selected-header">
              <span className="selected-count">
                Queue ({selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} &bull;{' '}
                {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))})
              </span>
              <button
                type="button"
                className="btn btn-ghost clear-queue-btn"
                onClick={clearQueue}
                disabled={uploading}
              >
                Clear All
              </button>
            </div>

            <div className="files-pill-container">
              {selectedFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="file-chip">
                  <FileText size={14} className="file-chip-icon" />
                  <span className="file-chip-name" title={file.name}>
                    {file.name}
                  </span>
                  <span className="file-chip-size">({formatBytes(file.size)})</span>
                  <button
                    type="button"
                    className="file-chip-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    disabled={uploading}
                    title="Remove file"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Inputs */}
        <div className="upload-metadata-grid">
          <div className="meta-field">
            <label className="meta-label">
              <User size={14} /> Uploader Identifier
            </label>
            <input
              type="text"
              className="meta-input"
              value={uploader}
              onChange={(e) => setUploader(e.target.value)}
              placeholder="e.g. SyntecxHub Intern"
              disabled={uploading}
            />
          </div>

          <div className="meta-field">
            <label className="meta-label">
              <AlignLeft size={14} /> Description (Optional Metadata)
            </label>
            <input
              type="text"
              className="meta-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Architecture diagram or monthly dataset"
              disabled={uploading}
            />
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="upload-progress-wrapper animate-fade-in">
            <div className="progress-info">
              <span>Streaming to MongoDB GridFS...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="upload-actions">
          <button
            type="submit"
            className="btn btn-primary submit-upload-btn"
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? (
              <>
                <span className="animate-spin">&bull;</span> Uploading to GridFS...
              </>
            ) : (
              <>
                <FileUp size={16} /> 
                {selectedFiles.length > 1
                  ? `Upload ${selectedFiles.length} Files (Batch)`
                  : 'Upload File to GridFS'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
