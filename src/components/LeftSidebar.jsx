import React from 'react';
import CitationMap from './CitationMap';

export default function LeftSidebar({ 
  activeTab, 
  setActiveTab, 
  selectedFolder, 
  setSelectedFolder, 
  counts,
  documents,
  searchQuery,
  isCollapsed,
  setIsCollapsed,
  theme = 'light'
}) {
  
  // Folders list definition
  const folders = [
    { id: 'All', name: 'All Documents', icon: '📁' },
    { id: 'AI Logic', name: 'AI Logic', icon: '🤖' },
    { id: 'Security', name: 'Security & Auth', icon: '🔒' },
    { id: 'Database', name: 'Database Connect', icon: '💾' },
    { id: 'Cloud', name: 'Cloud Infrastructure', icon: '☁️' }
  ];

  const handleFolderClick = (folderId) => {
    setSelectedFolder(folderId);
    if (activeTab === 'bin' || activeTab === 'starred' || activeTab === 'recent') {
      setActiveTab('all');
    }
  };

  return (
    <aside className={`left-sidebar ${isCollapsed ? 'collapsed' : ''}`} id="app-left-sidebar">
      
      {/* Skewed Parallelogram Toggle Ribbon (Projecting to the right) */}
      <div 
        className="toggle-tab-left" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Show Sidebar" : "Hide Sidebar"}
        id="left-sidebar-toggle-tab"
      >
        <div className="toggle-text-container">
          {isCollapsed ? (
            <>
              <span>S</span>
              <span>H</span>
              <span>O</span>
              <span>W</span>
            </>
          ) : (
            <>
              <span>H</span>
              <span>I</span>
              <span>D</span>
              <span>E</span>
            </>
          )}
          <span className="toggle-tab-star">✦</span>
        </div>
      </div>

      {/* Content wrapper that fades/hides on collapse */}
      <div className="sidebar-inner">
        {/* 1. Top Section: For You, Recent, Starred */}
        <div className="sidebar-group">
          <button
            className={`sidebar-btn ${activeTab === 'for-you' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('for-you');
              setSelectedFolder('All');
            }}
            id="sidebar-btn-for-you"
          >
            <div className="sidebar-btn-label">
              <svg className="sidebar-btn-icon" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>For You</span>
            </div>
            {counts.forYou > 0 && <span className="sidebar-badge">{counts.forYou}</span>}
          </button>

          <button
            className={`sidebar-btn ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('recent');
              setSelectedFolder('All');
            }}
            id="sidebar-btn-recent"
          >
            <div className="sidebar-btn-label">
              <svg className="sidebar-btn-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Recent</span>
            </div>
            {counts.recent > 0 && <span className="sidebar-badge">{counts.recent}</span>}
          </button>

          <button
            className={`sidebar-btn ${activeTab === 'starred' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('starred');
              setSelectedFolder('All');
            }}
            id="sidebar-btn-starred"
          >
            <div className="sidebar-btn-label">
              <svg className="sidebar-btn-icon" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Starred</span>
            </div>
            {counts.starred > 0 && <span className="sidebar-badge">{counts.starred}</span>}
          </button>

          <button
            className={`sidebar-btn ${activeTab === 'graph-view' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('graph-view');
              setSelectedFolder('All');
            }}
            id="sidebar-btn-graph-view"
          >
            <div className="sidebar-btn-label">
              <svg className="sidebar-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Citation Map</span>
            </div>
            {documents.filter(d => !d.inBin).length > 0 && (
              <span className="sidebar-badge">{documents.filter(d => !d.inBin).length}</span>
            )}
          </button>
        </div>

        {/* 2. Middle Section: Keyword Folders */}
        <div className="sidebar-divider" />
        <div className="sidebar-section-title">Keyword Folders</div>
        
        <div className="sidebar-group">
          {folders.map((folder) => {
            const isFolderActive = selectedFolder === folder.id && activeTab !== 'bin' && activeTab !== 'starred' && activeTab !== 'recent';
            return (
              <button
                key={folder.id}
                className={`sidebar-btn folder-btn ${isFolderActive ? 'active' : ''}`}
                onClick={() => handleFolderClick(folder.id)}
                id={`sidebar-folder-btn-${folder.id.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="sidebar-btn-label">
                  <span className="sidebar-folder-emoji">{folder.icon}</span>
                  <span>{folder.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. Shifted Citation Map Panel */}
        <div className="sidebar-divider" />
        <div 
          className="sidebar-section-title" 
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          onClick={() => setActiveTab('graph-view')}
          title="Open Fullscreen Graph"
          id="sidebar-citation-graph-header"
        >
          <span>Citation Graph</span>
          <span style={{ fontSize: '0.75rem', textTransform: 'none', color: 'var(--neon-blue)' }}>Open ↗</span>
        </div>
        <div 
          style={{ padding: '0 4px', overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => setActiveTab('graph-view')}
          title="Open Fullscreen Graph"
          id="sidebar-citation-graph-canvas-container"
        >
          <CitationMap documents={documents} searchQuery={searchQuery} theme={theme} />
        </div>

        {/* 4. Bottom Section: Bin */}
        <div className="sidebar-divider" style={{ marginTop: 'auto' }} />
        
        <div className="sidebar-group">
          <button
            className={`sidebar-btn ${activeTab === 'bin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('bin');
              setSelectedFolder('All');
            }}
            id="sidebar-btn-bin"
          >
            <div className="sidebar-btn-label">
              <svg className="sidebar-btn-icon" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Bin</span>
            </div>
            {counts.bin > 0 && <span className="sidebar-badge">{counts.bin}</span>}
          </button>
        </div>
      </div>

    </aside>
  );
}
