import React from 'react';

export default function Navbar({ searchQuery, setSearchQuery, userName, onOpenSettings, isSettingsOpen, onOpenCitationMap }) {
  return (
    <nav className="navbar" id="app-navbar">
      {/* Left: Enhanced Owl Logo */}
      {/* Left: Enhanced Owl Logo (Standalone Vector) */}
      <div className="nav-left">
        <div className="logo-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="WikiTrace Logo" 
            className="nav-logo-img"
            style={{ height: '80px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>
      </div>

      {/* Middle: Search Bar (Relevance Sorter Target) */}
      <div className="nav-center">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search documents by keywords or content (ranks by relevance)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="global-search-bar"
          />
          <svg className="search-icon" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Right: Editable Profile Box, Map Trigger & Quick Settings Trigger */}
      <div className="nav-right" style={{ display: 'flex', alignItems: 'center' }}>
        <button 
          className="restore-all-btn"
          onClick={onOpenCitationMap}
          title="Explore document connections"
          id="navbar-citation-map-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginRight: '12px',
            fontSize: '0.82rem',
            padding: '8px 14px',
            borderRadius: '10px'
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '15px', height: '15px', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Connection Map</span>
        </button>

        <button 
          className={`settings-gear-btn ${isSettingsOpen ? 'active' : ''}`}
          onClick={onOpenSettings}
          title="Open layout settings"
          id="navbar-settings-toggle"
        >
          <svg className="gear-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <div className="profile-box">
          <div className="profile-avatar">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <span 
            className="profile-name-display"
            style={{
              color: 'var(--text-main)',
              fontWeight: '600',
              fontSize: '0.9rem',
              padding: '0 8px'
            }}
          >
            {userName || 'User'}
          </span>
        </div>
      </div>
    </nav>
  );
}
