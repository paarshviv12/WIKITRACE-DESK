import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import DocumentLibrary from './components/DocumentLibrary';
import CitationMap from './components/CitationMap';
import FullGraphView from './components/FullGraphView';


// Initial Mock Documents (with tags, references, and attributes)
const INITIAL_DOCUMENTS = [
  {
    id: 'WT-01',
    title: 'WikiTrace UI Design',
    content: 'User interface design guidelines for WikiTrace. Follows a cerulean neon blue, lavender, and white color scheme. Outlines glassmorphism panels, dark mode backdrops, and collapsible widgets for real-time operation feeds.',
    tags: ['AI Logic', 'All'],
    starred: false,
    inBin: false,
    recent: true,
    recommended: true,
    references: ['WT-02', 'WT-03']
  },
  {
    id: 'WT-02',
    title: 'Background Indexing Spec',
    content: 'Technical specifications for the background file indexing worker. Explains how uploaded documents are queued in FIFO order to extract keywords and populate the search cluster balanced partitions.',
    tags: ['Cloud', 'All'],
    starred: true,
    inBin: false,
    recent: true,
    recommended: false,
    references: ['WT-06']
  },
  {
    id: 'WT-03',
    title: 'Server Balancing Architecture',
    content: 'Details the Search Data Balancer algorithm, which splits the search index data and stores it evenly across Server-01, Server-02, and Server-03 to optimize queries and avoid resource starvation.',
    tags: ['Cloud', 'All'],
    starred: false,
    inBin: false,
    recent: false,
    recommended: true,
    references: ['WT-04', 'WT-05']
  },
  {
    id: 'WT-04',
    title: 'ID Hashing & Verification',
    content: 'Security protocol outlining the File Security Checker. When a document is accessed, its unique hash signature is instantly validated to verify the file has not been altered or tampered with.',
    tags: ['Security', 'All'],
    starred: false,
    inBin: false,
    recent: false,
    recommended: false,
    references: ['WT-05']
  },
  {
    id: 'WT-05',
    title: 'Frequency Sorter Alg',
    content: 'Implementation guidelines for the Relevance Sorter. Explains the count-based scoring mechanism that analyzes how many times a query keyword appears in titles and descriptions to sort search results.',
    tags: ['AI Logic', 'All'],
    starred: false,
    inBin: false,
    recent: false,
    recommended: false,
    references: ['WT-06']
  },
  {
    id: 'WT-06',
    title: 'Tag & Folder View Schema',
    content: 'Relational database schema for the Keyword Folder View. Allows documents to be organized into folders dynamically based on keyword matching and tags rather than strict physical directory structures.',
    tags: ['Database', 'All'],
    starred: false,
    inBin: false,
    recent: false,
    recommended: true,
    references: []
  },
  {
    id: 'WT-07',
    title: 'React UI Architecture',
    content: 'React is a JavaScript library for building component-driven user interfaces. It is based on a declarative programming paradigm, where developers describe what the UI should look like for a given state, and React handles updating the DOM efficiently via its virtual rendering loops. This component-based model allows for modular, testable, and reusable UI nodes.',
    tags: ['AI Logic', 'All'],
    starred: false,
    inBin: false,
    recent: true,
    recommended: true,
    references: ['WT-08', 'WT-09']
  },
  {
    id: 'WT-08',
    title: 'Understanding JSX Compiles',
    content: 'JSX is a syntax extension to JavaScript that resembles HTML. It allows developers to write XML-like tag structures directly within JavaScript source files. React compilers transform JSX down to standard React.createElement calls, which construct Virtual DOM nodes. JSX makes UI markup readable while maintaining full programming flexibility.',
    tags: ['AI Logic', 'All'],
    starred: false,
    inBin: false,
    recent: false,
    recommended: false,
    references: ['WT-13']
  },
  {
    id: 'WT-09',
    title: 'Lifecycle & Fiber Engine',
    content: 'Components are the base modules of a React application. Functional components utilize hooks to manage state and rendering side-effects. The rendering lifecycle involves mounting, updating, and unmounting states. React uses a Virtual DOM reconciliation engine (Fiber) to compute incremental tree diffs and apply minimal updates to the layout.',
    tags: ['Database', 'All'],
    starred: true,
    inBin: false,
    recent: false,
    recommended: true,
    references: ['WT-10', 'WT-11']
  },
  {
    id: 'WT-10',
    title: 'React State Management Flow',
    content: 'State represents the local data of a component that can change over time. When state updates, React automatically schedules a recursive re-render of the component tree. Simple state is managed using the useState hook, while complex modular states can be delegated to useReducer, Context API, or external stores.',
    tags: ['Database', 'All'],
    starred: false,
    inBin: false,
    recent: true,
    recommended: false,
    references: ['WT-14', 'WT-15']
  },
  {
    id: 'WT-11',
    title: 'React Hooks Specification',
    content: 'Introduced in React 16.8, Hooks are functions that let functional components tap into React state and lifecycle features. They eliminate the need for complex class components and helper patterns. Hooks follow strict execution rules: they must only be called at the top level and only from React functional wrappers.',
    tags: ['Security', 'All'],
    starred: false,
    inBin: false,
    recent: false,
    recommended: false,
    references: ['WT-12', 'WT-15', 'WT-16']
  },
  {
    id: 'WT-12',
    title: 'useEffect & Side Effects',
    content: 'The useEffect Hook handles side effects such as data fetching, subscriptions, manual DOM manipulation, and timers in functional components. It runs after render execution by default, but accepts a dependency array to optimize execution. Returning a cleanup function from useEffect ensures resource disposal on component unmount.',
    tags: ['Cloud', 'All'],
    starred: false,
    inBin: false,
    recent: false,
    recommended: true,
    references: ['WT-16']
  },
  {
    id: 'WT-13',
    title: 'Reconciliation & Virtual DOM Diffing',
    content: 'Reconciliation is the algorithm React uses to diff one Virtual DOM tree with another to determine which parts of the real DOM need to change. React uses heuristics (such as unique key attributes on list items) to perform this diffing in O(n) time. By utilizing an in-memory Virtual DOM, React avoids direct, expensive layout updates.',
    tags: ['Cloud', 'All'],
    starred: false,
    inBin: false,
    recent: false,
    recommended: false,
    references: ['WT-09']
  },
  {
    id: 'WT-14',
    title: 'React Context API Providers',
    content: 'The Context API provides a way to pass data through the component tree without having to pass props down manually at every level (known as prop drilling). It is ideal for sharing global settings like themes, user authentication status, or language preferences. It consists of a Context Provider and the useContext hook.',
    tags: ['Security', 'All'],
    starred: false,
    inBin: false,
    recent: false,
    recommended: false,
    references: ['WT-11']
  },
  {
    id: 'WT-15',
    title: 'useMemo & useCallback Optimizers',
    content: 'React provides specialized hooks like useMemo and useCallback to optimize rendering performance. useMemo caches the result of an expensive calculation between renders, while useCallback caches the callback function reference. These tools prevent unnecessary re-renders of child components that rely on referential equality.',
    tags: ['AI Logic', 'All'],
    starred: false,
    inBin: false,
    recent: false,
    recommended: true,
    references: ['WT-13']
  },
  {
    id: 'WT-16',
    title: 'Designing Custom Hooks',
    content: 'Custom Hooks allow developers to extract component logic into reusable functions. By naming a function starting with "use", it can call other React hooks. Custom hooks make it easy to share stateful logic—such as fetching data, tracking window width, or handling form state—across multiple components without duplicate code.',
    tags: ['AI Logic', 'All'],
    starred: true,
    inBin: false,
    recent: true,
    recommended: false,
    references: ['WT-12']
  }
];

export default function App() {
  // --- Onboarding & Customizations States ---
  const [isOnboarded, setIsOnboarded] = useState(() => {
    return localStorage.getItem('wikitrace_onboarded') === 'true';
  });
  const [setupStep, setSetupStep] = useState(1);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('wikitrace_theme') || 'light';
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('wikitrace_fontsize') || 'small';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCitationMapOpen, setIsCitationMapOpen] = useState(false);

  // --- UI Layout States (Synced with URL Search Parameters) ---
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'recent';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  const [selectedFolder, setSelectedFolder] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('folder') || 'All';
  });
  const [userName, setUserName] = useState(() => {
    const local = localStorage.getItem('wikitrace_username');
    if (local) return local;
    return '';
  });
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // --- Document Data State (Persisted in Local Storage with Auto-Merge) ---
  const [documents, setDocuments] = useState(() => {
    const local = localStorage.getItem('wikitrace_docs');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        const existingIds = new Set(parsed.map(d => d.id));
        const missingDocs = INITIAL_DOCUMENTS.filter(d => !existingIds.has(d.id));
        if (missingDocs.length > 0) {
          const merged = [...parsed, ...missingDocs];
          localStorage.setItem('wikitrace_docs', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing stored docs, resetting", e);
        return INITIAL_DOCUMENTS;
      }
    }
    return INITIAL_DOCUMENTS;
  });

  // --- Toast Notification System ---
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'blue') => {
    const id = Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Sync Documents to Local Storage
  useEffect(() => {
    localStorage.setItem('wikitrace_docs', JSON.stringify(documents));
  }, [documents]);

  // Sync Username to Local Storage
  useEffect(() => {
    localStorage.setItem('wikitrace_username', userName);
  }, [userName]);

  // Sync Theme to Local Storage and document body
  useEffect(() => {
    localStorage.setItem('wikitrace_theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    }
  }, [theme]);

  // Sync Font Size to Local Storage
  useEffect(() => {
    localStorage.setItem('wikitrace_fontsize', fontSize);
  }, [fontSize]);

  // Sync Onboarding state to Local Storage
  useEffect(() => {
    localStorage.setItem('wikitrace_onboarded', isOnboarded ? 'true' : 'false');
  }, [isOnboarded]);

  const handleSignOut = () => {
    localStorage.removeItem('wikitrace_username');
    localStorage.removeItem('wikitrace_onboarded');
    setUserName('');
    setIsOnboarded(false);
    addToast('Successfully signed out.', 'blue');
  };

  // Sync State to URL Search Parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('tab', activeTab);
    if (selectedFolder !== 'All') params.set('folder', selectedFolder);
    if (searchQuery.trim()) params.set('q', searchQuery);

    const searchString = params.toString();
    const newUrl = `${window.location.pathname}${searchString ? '?' + searchString : ''}`;
    
    if (window.location.search !== (searchString ? '?' + searchString : '')) {
      window.history.pushState(null, '', newUrl);
    }
  }, [activeTab, selectedFolder, searchQuery]);

  // Listen for back/forward browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTab(params.get('tab') || 'recent');
      setSelectedFolder(params.get('folder') || 'All');
      setSearchQuery(params.get('q') || '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- Undo History Stack (Feature b) ---
  const [historyStack, setHistoryStack] = useState([]);
  const lastStateRef = useRef({ query: '', folder: 'All' });

  // --- Real-time Indexer State (Feature c) ---
  const [indexerState, setIndexerState] = useState({
    status: 'Idle',
    currentFile: '',
    progress: 0
  });

  // --- Real-time Security Checker State (Feature d) ---
  const [securityLogs, setSecurityLogs] = useState([
    { text: '[17:10:02] Security Shield initialized.', type: 'gray' },
    { text: '[17:10:03] Registry verification: SECURE', type: 'green' }
  ]);

  // --- Real-time Data Balancer State (Feature h) ---
  const [balancerState, setBalancerState] = useState([
    { name: 'Server-01', load: 33 },
    { name: 'Server-02', load: 34 },
    { name: 'Server-03', load: 33 }
  ]);

  // --- Track History Stack for Undo ---
  // Save search query/folder changes to history stack when user finishes action
  const pushHistory = (query, folder) => {
    // Prevent duplicate entries on stack
    if (
      lastStateRef.current.query === query &&
      lastStateRef.current.folder === folder
    ) {
      return;
    }
    setHistoryStack((prev) => [
      ...prev,
      { query: lastStateRef.current.query, folder: lastStateRef.current.folder }
    ]);
    lastStateRef.current = { query, folder };
  };

  const undoLastState = () => {
    if (historyStack.length === 0) return;
    const previousStates = [...historyStack];
    const undone = previousStates.pop();
    
    // Disable logging this change as a new history entry
    lastStateRef.current = { query: undone.query, folder: undone.folder };
    
    setSearchQuery(undone.query);
    setSelectedFolder(undone.folder);
    setHistoryStack(previousStates);

    // Log the undo action to security logger
    addSecurityLog(`Undo action executed. Restored search settings.`, 'blue');
  };

  const handleIgnoreUndo = () => {
    setHistoryStack([]);
    addSecurityLog(`Undo history dismissed.`, 'gray');
  };

  // Push history on folder change
  const handleSetFolder = (newFolder) => {
    pushHistory(searchQuery, selectedFolder);
    setSelectedFolder(newFolder);
  };

  // Push history when search changes (debounced or on blur conceptually, but let's push before query changes if the old query was empty or different)
  useEffect(() => {
    const timer = setTimeout(() => {
      pushHistory(searchQuery, selectedFolder);
    }, 1000); // Wait 1s after typing stops to push history
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Real-time Activity Logs Helpers ---
  const addSecurityLog = (text, type = 'gray') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSecurityLogs((prev) => [
      { text: `[${time}] ${text}`, type },
      ...prev.slice(0, 19) // keep last 20 logs
    ]);
  };

  // --- Background Indexer Simulator (Feature c) ---
  useEffect(() => {
    const simulatedFiles = [
      'AuthService.java',
      'ConfigSchema.json',
      'SearchIndexer.cpp',
      'CitationsGraph.js',
      'DataBalancer.py',
      'WikiRegistry.db'
    ];

    let progressInterval;
    const mainTimer = setInterval(() => {
      // Choose a file to index
      const randomFile = simulatedFiles[Math.floor(Math.random() * simulatedFiles.length)];
      setIndexerState({
        status: 'Indexing...',
        currentFile: randomFile,
        progress: 0
      });

      // Simulate Progress tick
      let progress = 0;
      progressInterval = setInterval(() => {
        progress += 10;
        setIndexerState((prev) => ({
          ...prev,
          progress: progress
        }));

        if (progress >= 100) {
          clearInterval(progressInterval);
          // Complete Indexing
          setTimeout(() => {
            setIndexerState({
              status: 'Idle',
              currentFile: '',
              progress: 0
            });
            addSecurityLog(`Background Indexer: Indexed ${randomFile}`, 'blue');
          }, 300);
        }
      }, 200);

    }, 9000); // Run every 9 seconds

    return () => {
      clearInterval(mainTimer);
      clearInterval(progressInterval);
    };
  }, []);

  // --- Background Security Checker Simulator (Feature d) ---
  useEffect(() => {
    const mainTimer = setInterval(() => {
      // Pick a random document to audit in the background
      const randomDoc = documents[Math.floor(Math.random() * documents.length)];
      if (randomDoc) {
        addSecurityLog(`Auto auditing ${randomDoc.id}...`, 'gray');
        setTimeout(() => {
          const mockHash = Math.random().toString(36).substring(2, 8).toUpperCase();
          addSecurityLog(`${randomDoc.id} Verified: SECURE (Hash: ${mockHash})`, 'green');
        }, 1000);
      }
    }, 13000); // Run every 13 seconds

    return () => clearInterval(mainTimer);
  }, [documents]);

  // --- Background Data Balancer Simulator (Feature h) ---
  useEffect(() => {
    const mainTimer = setInterval(() => {
      // Shift loads slightly keeping total sum 100%
      setBalancerState((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const newServer1 = Math.max(25, Math.min(45, prev[0].load + delta));
        // Distribute remaining
        const diff = 100 - newServer1;
        const newServer2 = Math.floor(diff / 2) + (diff % 2);
        const newServer3 = Math.floor(diff / 2);
        
        return [
          { name: 'Server-01', load: newServer1 },
          { name: 'Server-02', load: newServer2 },
          { name: 'Server-03', load: newServer3 }
        ];
      });
    }, 6000); // Run every 6 seconds

    return () => clearInterval(mainTimer);
  }, []);

  // --- Manual Actions ---
  const triggerManualSecurityCheck = (docId, title) => {
    addSecurityLog(`Manual Integrity check for ${docId} (${title}) started.`, 'blue');
    addToast(`Auditing registry signature for ${docId}...`, 'blue');
    setTimeout(() => {
      const mockHash = 'SHA-' + Math.random().toString(16).substring(2, 10).toUpperCase();
      addSecurityLog(`${docId} verification: SUCCESS. Registry hash matches: ${mockHash}`, 'green');
      addToast(`Integrity check for ${docId}: SECURE`, 'green');
    }, 600);
  };

  const handleToggleStar = (docId) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, starred: !doc.starred } : doc))
    );
    // Find doc title after state update schedule
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      addSecurityLog(`${doc.starred ? 'Unstarred' : 'Starred'} file ${docId}`, 'gray');
      addToast(`${doc.starred ? 'Removed star from' : 'Starred'} ${docId}`, 'purple');
    }
  };

  const handleDeleteDoc = (docId) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, inBin: true } : doc))
    );
    addSecurityLog(`Moved ${docId} to Bin`, 'gray');
    addToast(`Moved ${docId} to Recycle Bin`, 'yellow');
  };

  const handleRestoreDoc = (docId) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, inBin: false } : doc))
    );
    addSecurityLog(`Restored ${docId} from Bin`, 'green');
    addToast(`Restored ${docId} to workspace`, 'green');
  };

  // --- Dynamic Document Creation & Reference Updates ---
  const handleCreateDoc = (newDoc) => {
    // Generate a unique ID (e.g. WT-07, WT-08) if not provided
    let finalId = newDoc.id;
    if (!finalId) {
      const activeIds = documents.map(d => {
        const num = parseInt(d.id.replace('WT-', ''));
        return isNaN(num) ? 0 : num;
      });
      const nextNum = activeIds.length > 0 ? Math.max(...activeIds) + 1 : 7;
      finalId = `WT-${nextNum.toString().padStart(2, '0')}`;
    }
    
    const docWithDefaults = {
      id: finalId,
      title: newDoc.title || 'Untitled Document',
      content: newDoc.content || '',
      tags: newDoc.tags || ['All'],
      starred: false,
      inBin: false,
      recent: true,
      recommended: false,
      references: newDoc.references || []
    };

    setDocuments((prev) => [...prev, docWithDefaults]);
    addSecurityLog(`Created document: ${finalId} - "${docWithDefaults.title}"`, 'green');
    addToast(`Created document ${finalId}: "${docWithDefaults.title}"`, 'green');
  };

  const handleUpdateDoc = (updatedDoc) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === updatedDoc.id ? { ...doc, ...updatedDoc } : doc))
    );
    addSecurityLog(`Modified references/properties for ${updatedDoc.id}`, 'blue');
    addToast(`Updated references for ${updatedDoc.id}`, 'blue');
  };

  // Helper counts for tabs badge
  const getCounts = () => {
    return {
      forYou: documents.filter(d => d.recommended && !d.inBin).length,
      recent: documents.filter(d => d.recent && !d.inBin).length,
      starred: documents.filter(d => d.starred && !d.inBin).length,
      bin: documents.filter(d => d.inBin).length
    };
  };

  return (
    <div className={`app-container theme-${theme} font-${fontSize}`}>
      
      {/* 1. Onboarding Setup Overlay */}
      {!isOnboarded && (
        <div className="onboarding-overlay">
          
          {setupStep === 1 && (
            <div className="popup-card">
              <div className="onboarding-title-group">
                <span className="onboarding-step-indicator">Step 1 of 3</span>
                <h2 className="onboarding-title">Identify Yourself</h2>
                <p className="onboarding-subtitle">Please enter your username to log in and initialize your WikiTrace workspace.</p>
              </div>
              
              <div className="onboarding-input-wrapper">
                <label className="onboarding-label">Username</label>
                <input 
                  type="text" 
                  className="onboarding-text-input" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  placeholder="e.g. Alex Carter"
                  maxLength={12}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userName.trim()) {
                      setSetupStep(2);
                    }
                  }}
                />
              </div>
              
              <div className="setup-actions-bar">
                <button 
                  className="setup-primary-btn" 
                  disabled={!userName.trim()}
                  onClick={() => setSetupStep(2)}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {setupStep === 2 && (
            <div className="popup-card">
              <div className="onboarding-title-group">
                <span className="onboarding-step-indicator">Step 2 of 3</span>
                <h2 className="onboarding-title">Select Workspace Theme</h2>
                <p className="onboarding-subtitle">Choose a theme aesthetic that fits your workflow environment.</p>
              </div>
              
              <div className="setup-option-list">
                <div 
                  className={`setup-option-btn ${theme === 'light' ? 'selected' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <div className="setup-option-info">
                    <span className="setup-option-label">Cerulean Light Theme ☀️</span>
                    <span className="setup-option-desc">Vibrant colors with high contrast white layout.</span>
                  </div>
                  <div className="setup-radio">
                    <span className="setup-radio-dot" />
                  </div>
                </div>
                
                <div 
                  className={`setup-option-btn ${theme === 'dark' ? 'selected' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <div className="setup-option-info">
                    <span className="setup-option-label">Midnight Dark Theme 🌙</span>
                    <span className="setup-option-desc">Low fatigue layout with neon indicator glows.</span>
                  </div>
                  <div className="setup-radio">
                    <span className="setup-radio-dot" />
                  </div>
                </div>
              </div>
              
              <div className="setup-actions-bar">
                <button className="setup-secondary-btn" onClick={() => setSetupStep(1)}>
                  Back
                </button>
                <button className="setup-primary-btn" onClick={() => setSetupStep(3)}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {setupStep === 3 && (
            <div className="popup-card">
              <div className="onboarding-title-group">
                <span className="onboarding-step-indicator">Step 3 of 3</span>
                <h2 className="onboarding-title">Choose Text Size</h2>
                <p className="onboarding-subtitle">Customize the overall typography sizing for the interface.</p>
              </div>
              
              <div className="setup-option-list">
                <div 
                  className={`setup-option-btn ${fontSize === 'small' ? 'selected' : ''}`}
                  onClick={() => setFontSize('small')}
                >
                  <div className="setup-option-info">
                    <span className="setup-option-label">Small Sizing (Default)</span>
                    <span className="setup-option-desc">Standard layout density, ideal for small screens.</span>
                  </div>
                  <div className="setup-radio">
                    <span className="setup-radio-dot" />
                  </div>
                </div>
                
                <div 
                  className={`setup-option-btn ${fontSize === 'medium' ? 'selected' : ''}`}
                  onClick={() => setFontSize('medium')}
                >
                  <div className="setup-option-info">
                    <span className="setup-option-label">Medium Sizing</span>
                    <span className="setup-option-desc">Increased text readability with soft spacing scales.</span>
                  </div>
                  <div className="setup-radio">
                    <span className="setup-radio-dot" />
                  </div>
                </div>

                <div 
                  className={`setup-option-btn ${fontSize === 'large' ? 'selected' : ''}`}
                  onClick={() => setFontSize('large')}
                >
                  <div className="setup-option-info">
                    <span className="setup-option-label">Large Sizing</span>
                    <span className="setup-option-desc">Maximum legibility for large displays.</span>
                  </div>
                  <div className="setup-radio">
                    <span className="setup-radio-dot" />
                  </div>
                </div>
              </div>
              
              <div className="setup-actions-bar">
                <button className="setup-secondary-btn" onClick={() => setSetupStep(2)}>
                  Back
                </button>
                <button 
                  className="setup-primary-btn" 
                  onClick={() => {
                    setIsOnboarded(true);
                    addToast(`Welcome to WikiTrace, ${userName}!`, 'green');
                  }}
                >
                  Finish Setup
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 2. Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userName={userName}
        setUserName={setUserName}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSettingsOpen={isSettingsOpen}
        onOpenCitationMap={() => setIsCitationMapOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* 3. Main Content (Left Sidebar + Content Workspace + Collapsible Right Sidebar) */}
      <div className="main-wrapper">
        
        {/* Left Side Navigation Panel */}
        <LeftSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedFolder={selectedFolder}
          setSelectedFolder={handleSetFolder}
          counts={getCounts()}
          documents={documents}
          searchQuery={searchQuery}
          isCollapsed={isLeftCollapsed}
          setIsCollapsed={setIsLeftCollapsed}
        />

        {/* Middle Main Workspace */}
        <main className="middle-content">
          
          {activeTab === 'graph-view' ? (
            <FullGraphView
              documents={documents}
              historyStack={historyStack}
              searchQuery={searchQuery}
              onCreateDoc={handleCreateDoc}
              onUpdateDoc={handleUpdateDoc}
            />
          ) : (
            /* Main Documents Library Grid */
            <DocumentLibrary
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              documents={documents}
              selectedFolder={selectedFolder}
              setSelectedFolder={handleSetFolder}
              historyStack={historyStack}
              undoLastState={undoLastState}
              onIgnoreUndo={handleIgnoreUndo}
              onToggleStar={handleToggleStar}
              onDeleteDoc={handleDeleteDoc}
              onRestoreDoc={handleRestoreDoc}
              onTriggerSecurityCheck={triggerManualSecurityCheck}
              onCreateDoc={handleCreateDoc}
              onUpdateDoc={handleUpdateDoc}
              addToast={addToast}
              userName={userName}
            />
          )}
        </main>

        {/* Right Collapsible Processes Sidebar */}
        <RightSidebar
          isCollapsed={isRightCollapsed}
          setIsCollapsed={setIsRightCollapsed}
          indexerState={indexerState}
          securityLogs={securityLogs}
          balancerState={balancerState}
        />

      </div>

      {/* 4. Quick Settings Modal Card Overlay */}
      {isSettingsOpen && (
        <div className="settings-modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="popup-card settings-popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="onboarding-title-group" style={{ textAlign: 'left' }}>
              <h3 className="onboarding-title" style={{ fontSize: '1.5rem' }}>Workspace Preferences</h3>
              <p className="onboarding-subtitle" style={{ fontSize: '0.85rem' }}>Modify layout theme, font-size scales, and your profile details.</p>
            </div>

            <div className="onboarding-input-wrapper">
              <label className="onboarding-label">Username</label>
              <input 
                type="text" 
                className="onboarding-text-input" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)} 
                placeholder="Guest"
                maxLength={12}
                disabled={isOnboarded && !!userName}
                style={{ 
                  padding: '10px 14px', 
                  fontSize: '0.95rem',
                  opacity: isOnboarded && userName ? 0.6 : 1,
                  cursor: isOnboarded && userName ? 'not-allowed' : 'text'
                }}
              />
            </div>

            <div>
              <label className="onboarding-label" style={{ marginBottom: '8px', display: 'block' }}>Color Theme</label>
              <div className="settings-option-grid two-cols">
                <button 
                  className={`settings-pill-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  Light Mode ☀️
                </button>
                <button 
                  className={`settings-pill-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  Dark Mode 🌙
                </button>
              </div>
            </div>

            <div>
              <label className="onboarding-label" style={{ marginBottom: '8px', display: 'block' }}>Display Font Scale</label>
              <div className="settings-option-grid">
                <button 
                  className={`settings-pill-btn ${fontSize === 'small' ? 'active' : ''}`}
                  onClick={() => setFontSize('small')}
                >
                  Small
                </button>
                <button 
                  className={`settings-pill-btn ${fontSize === 'medium' ? 'active' : ''}`}
                  onClick={() => setFontSize('medium')}
                >
                  Medium
                </button>
                <button 
                  className={`settings-pill-btn ${fontSize === 'large' ? 'active' : ''}`}
                  onClick={() => setFontSize('large')}
                >
                  Large
                </button>
              </div>
            </div>

            <div className="setup-actions-bar" style={{ marginTop: '10px' }}>
              <button 
                className="setup-primary-btn" 
                style={{ padding: '10px 20px', borderRadius: '10px' }}
                onClick={() => {
                  setIsSettingsOpen(false);
                  addToast('Workspace preferences updated.', 'purple');
                }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Simplified Connection Explorer Modal */}
      {isCitationMapOpen && (
        <div className="settings-modal-overlay" onClick={() => setIsCitationMapOpen(false)} style={{ zIndex: 9600 }}>
          <div 
            className="popup-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--neon-blue)' }}>Wiki Connection Explorer</h3>
                <p style={{ fontSize: '0.82rem', color: '#8c8f9f', margin: '2px 0 0 0' }}>Explore references and connections between your wiki documents.</p>
              </div>
              <button 
                onClick={() => setIsCitationMapOpen(false)}
                style={{
                  background: 'rgba(0,0,0,0.03)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#5b5d6e',
                  transition: 'background 0.2s'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, minHeight: '350px' }}>
              <CitationMap documents={documents} searchQuery={searchQuery} theme={theme} />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="toast-container" style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-alert toast-${toast.type}`}
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'var(--white)',
              border: '1.5px solid var(--border-light)',
              boxShadow: 'var(--shadow-main)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.92rem',
              fontWeight: '500',
              animation: 'slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1), fadeOutToast 0.3s ease 3.2s forwards'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: toast.type === 'green' ? '#34c759' : 
                          toast.type === 'yellow' ? '#ff9500' :
                          toast.type === 'purple' ? 'var(--lavender)' : 'var(--neon-blue)'
            }} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
