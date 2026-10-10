import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import StorageStats from './components/StorageStats.jsx';
import FileUploadZone from './components/FileUploadZone.jsx';
import FileExplorer from './components/FileExplorer.jsx';
import FilePreviewModal from './components/FilePreviewModal.jsx';
import ApiReferenceModal from './components/ApiReferenceModal.jsx';
import DeleteConfirmModal from './components/DeleteConfirmModal.jsx';
import Toast from './components/Toast.jsx';
import './App.css';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('syntecxhub_theme') || 'dark');
  const [healthStatus, setHealthStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  // Modals & Overlays
  const [previewFile, setPreviewFile] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiDocsOpen, setApiDocsOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('syntecxhub_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch Health & Bucket ping
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data);
      }
    } catch (err) {
      console.warn('Health check unreachable:', err.message);
    }
  }, []);

  // Fetch Storage Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/files/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch storage stats:', err.message);
    }
  }, []);

  // Fetch Files
  const fetchFiles = useCallback(async (page = 1) => {
    setLoadingFiles(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);
      params.set('sort', sortOption);
      params.set('page', page.toString());
      params.set('limit', pagination.limit.toString());

      const res = await fetch(`/api/files?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve files');
      }

      const data = await res.json();
      if (data.success) {
        setFiles(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      showToast('Could not load files from GridFS.', 'error');
    } finally {
      setLoadingFiles(false);
    }
  }, [searchQuery, activeCategory, sortOption, pagination.limit, showToast]);

  // Initial Load & polling for health
  useEffect(() => {
    fetchHealth();
    fetchStats();
  }, [fetchHealth, fetchStats]);

  // Trigger file list reload on filters change
  useEffect(() => {
    fetchFiles(1);
  }, [searchQuery, activeCategory, sortOption]);

  const handlePageChange = (newPage) => {
    fetchFiles(newPage);
  };

  const handleUploadSuccess = () => {
    fetchStats();
    fetchFiles(1);
  };

  const handleDeleteFile = async (id) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete file');
      }

      showToast('File and GridFS chunks deleted successfully.', 'success');
      setFileToDelete(null);
      if (previewFile?._id === id) {
        setPreviewFile(null);
      }
      fetchStats();
      fetchFiles(pagination.page);
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.message || 'Error deleting file.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Background Atmosphere */}
      <div className="app-atmosphere">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      {/* Navigation */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        healthStatus={healthStatus}
        onOpenApiDocs={() => setApiDocsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="container main-content">
        {/* Storage Metrics & Breakdown */}
        <StorageStats
          stats={stats}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          activeCategory={activeCategory}
        />

        {/* Upload Station (Multer & GridFS) */}
        <FileUploadZone
          onUploadSuccess={handleUploadSuccess}
          showToast={showToast}
        />

        {/* File Explorer & Storage Management */}
        <FileExplorer
          files={files}
          loading={loadingFiles}
          totalFiles={pagination.total}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          sortOption={sortOption}
          onSortChange={setSortOption}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRefresh={() => {
            fetchStats();
            fetchFiles(pagination.page);
          }}
          onPreview={(file) => setPreviewFile(file)}
          onDeleteRequest={(file) => setFileToDelete(file)}
          showToast={showToast}
        />
      </main>

      {/* Footer */}
      <footer className="footer-section">
        <div className="container footer-container">
          <div className="footer-left">
            <p className="footer-brand">
              <strong>SyntecxHub Virtual Internship</strong> &bull; Task 1 (Project 3: File Uploader)
            </p>
            <p className="footer-sub">
              Repository: <code className="mono">Syntecxhub_File_Uploader</code> &bull; Multer + MongoDB GridFS Chunked Storage API
            </p>
          </div>
          <div className="footer-right">
            <button 
              type="button" 
              className="btn btn-ghost footer-docs-link"
              onClick={() => setApiDocsOpen(true)}
            >
              API Reference
            </button>
            <span className="footer-sep">&bull;</span>
            <span className="footer-copy">&copy; {new Date().getFullYear()} SyntecxHub Intern</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          showToast={showToast}
        />
      )}

      {apiDocsOpen && (
        <ApiReferenceModal
          onClose={() => setApiDocsOpen(false)}
          showToast={showToast}
        />
      )}

      {fileToDelete && (
        <DeleteConfirmModal
          file={fileToDelete}
          onConfirm={handleDeleteFile}
          onCancel={() => setFileToDelete(null)}
          deleting={isDeleting}
        />
      )}

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
