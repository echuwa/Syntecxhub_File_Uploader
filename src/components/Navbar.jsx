import React from 'react';
import { 
  HardDrive, 
  Database, 
  Terminal, 
  Sun, 
  Moon, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

function GithubIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
  );
}

export default function Navbar({ 
  theme, 
  onToggleTheme, 
  healthStatus, 
  onOpenApiDocs 
}) {
  const isConnected = healthStatus?.status === 'UP' && healthStatus?.database?.status === 'Connected';

  return (
    <header className="navbar-wrapper">
      <div className="container navbar-container">
        {/* Brand / Logo */}
        <div className="brand-group">
          <div className="brand-icon-box">
            <HardDrive className="brand-icon" size={24} />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-title">SyntecxHub</h1>
              <span className="brand-badge">GridFS Uploader</span>
            </div>
            <p className="brand-subtitle">Multer Middleware & MongoDB Chunked Storage</p>
          </div>
        </div>

        {/* Status Pill & Action Tools */}
        <div className="nav-actions">
          {/* Health Pill */}
          <div 
            className={`status-pill ${isConnected ? 'status-connected' : 'status-degraded'}`}
            title={isConnected ? `Connected to ${healthStatus?.database?.databaseName || 'MongoDB'}` : 'Connecting...'}
          >
            {isConnected ? (
              <>
                <span className="status-dot-pulse"></span>
                <span className="status-label">GridFS Active</span>
              </>
            ) : (
              <>
                <AlertCircle size={14} />
                <span className="status-label">Connecting...</span>
              </>
            )}
          </div>

          {/* API Docs Button */}
          <button 
            type="button" 
            className="btn btn-secondary nav-btn"
            onClick={onOpenApiDocs}
            title="Inspect REST API Endpoints & cURL commands"
          >
            <Terminal size={16} />
            <span className="hide-mobile">API Docs & cURL</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="btn btn-ghost theme-btn"
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost github-link"
            title="GitHub Repository: Syntecxhub_File_Uploader"
          >
            <GithubIcon size={18} />
          </a>
        </div>
      </div>
    </header>
  );
}
