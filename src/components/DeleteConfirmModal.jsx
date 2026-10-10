import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { formatBytes } from '../utils/formatters.js';

export default function DeleteConfirmModal({ file, onConfirm, onCancel, deleting }) {
  if (!file) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div 
        className="modal-content glass-card delete-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-icon-circle">
          <AlertTriangle size={32} className="text-rose" />
        </div>

        <h3 className="delete-modal-title">Delete File from GridFS?</h3>
        
        <p className="delete-modal-desc">
          Are you sure you want to delete <strong>"{file.originalName}"</strong> ({file.formattedSize})?
        </p>

        <div className="delete-impact-box">
          <p>
            This action will permanently delete the file document and all{' '}
            <strong>{file.totalChunks} BSON chunk{file.totalChunks > 1 ? 's' : ''}</strong> from the{' '}
            <span className="mono">uploads.chunks</span> collection. This operation cannot be undone.
          </p>
        </div>

        <div className="modal-footer delete-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={() => onConfirm(file._id)}
            disabled={deleting}
          >
            {deleting ? (
              <>Deleting...</>
            ) : (
              <>
                <Trash2 size={16} /> Delete Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
