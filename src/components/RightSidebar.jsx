import React from 'react';

export default function RightSidebar({ 
  isCollapsed, 
  setIsCollapsed, 
  indexerState, 
  securityLogs, 
  balancerState 
}) {
  return (
    <div className={`right-sidebar ${isCollapsed ? 'collapsed' : ''}`} id="app-right-sidebar">
      
      {/* Skewed Parallelogram Toggle Ribbon (Projecting to the left) */}
      <div 
        className="toggle-tab-right" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Show Operations Feed" : "Hide Operations Feed"}
        id="right-sidebar-toggle-tab"
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
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <h3 className="sidebar-title">
            <svg className="sidebar-title-icon" viewBox="0 0 24 24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Real-Time Operations
          </h3>
        </div>

        {/* Main Operations Panels */}
        <div className="processes-container">
          
          {/* Background Indexer */}
          <div className="process-card" id="background-indexer-card">
            <div className="process-header">
              <span className="process-title">Background Indexer</span>
              <span className={`process-status ${indexerState.status === 'Idle' ? 'idle' : ''}`}>
                {indexerState.status}
              </span>
            </div>
            <div className="indexer-progress-wrapper">
              <div className="indexer-file">
                <span className={`pulse-indicator ${indexerState.status === 'Idle' ? 'gray' : 'green'}`} />
                {indexerState.currentFile ? indexerState.currentFile : 'Waiting for uploads...'}
              </div>
              <div className="progress-track">
                <div 
                  className="progress-bar" 
                  style={{ width: `${indexerState.progress}%` }} 
                />
              </div>
            </div>
          </div>

          {/* File Security Checker */}
          <div className="process-card" id="security-checker-card">
            <div className="process-header">
              <span className="process-title">File Security Checker</span>
              <span className="process-status secure">Active</span>
            </div>
            <div className="security-logs">
              {securityLogs.map((log, index) => (
                <div key={index} className={`security-log-line ${log.type}`}>
                  {log.text}
                </div>
              ))}
            </div>
          </div>

          {/* Search Data Balancer */}
          <div className="process-card" id="data-balancer-card">
            <div className="process-header">
              <span className="process-title">Search Data Balancer</span>
              <span className="process-status">Balanced</span>
            </div>
            <div className="balancer-servers">
              {balancerState.map((server, index) => (
                <div key={index} className="balancer-server">
                  <div className="server-info">
                    <span className="server-name">{server.name}</span>
                    <span className="server-load">{server.load}%</span>
                  </div>
                  <div className="server-track">
                    <div 
                      className={`server-bar ${index % 2 === 0 ? 'blue' : ''}`} 
                      style={{ width: `${server.load}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
