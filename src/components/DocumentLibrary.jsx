import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import pdfToText from 'react-pdftotext';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export default function DocumentLibrary({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  documents,
  selectedFolder,
  setSelectedFolder,
  historyStack,
  undoLastState,
  onIgnoreUndo,
  onToggleStar,
  onDeleteDoc,
  onRestoreDoc,
  onTriggerSecurityCheck,
  onCreateDoc,
  onUpdateDoc,
  addToast,
  userName
}) {
  // Creator Form States
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocFolder, setNewDocFolder] = useState('AI Logic');
  const [newDocRefs, setNewDocRefs] = useState([]);
  
  // Conflict File Upload States & Handlers
  const [conflictFile, setConflictFile] = useState(null);

  const handleReplaceConflict = () => {
    if (conflictFile) {
      onUpdateDoc({
        id: conflictFile.existingId,
        title: conflictFile.title,
        content: conflictFile.text,
        tags: [conflictFile.folder, 'All'],
        references: conflictFile.matchedRefs,
        recent: true
      });
      addToast(`Replaced document "${conflictFile.title}" successfully!`, 'green');
      setConflictFile(null);
    }
  };

  const handleCancelConflict = () => {
    addToast('File upload cancelled.', 'yellow');
    setConflictFile(null);
  };
  
  // Drag and Drop States
  const [dragActive, setDragActive] = useState(false);

  // Link Editor State
  const [editingLinksDocId, setEditingLinksDocId] = useState(null);

  // Document Drawer States
  const [activeDetailsDocId, setActiveDetailsDocId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editFolder, setEditFolder] = useState('AI Logic');

  const activeDetailsDoc = documents.find(d => d.id === activeDetailsDocId);

  // Synchronize drawer fields when selected document changes
  useEffect(() => {
    if (activeDetailsDoc) {
      setEditTitle(activeDetailsDoc.title);
      setEditContent(activeDetailsDoc.content);
      setEditFolder(activeDetailsDoc.tags.find(t => t !== 'All') || 'AI Logic');
    }
  }, [activeDetailsDocId, activeDetailsDoc]);

  // Folders definition matching the tags
  const folders = [
    { id: 'All', name: 'All Documents', icon: '📁' },
    { id: 'AI Logic', name: 'AI Logic', icon: '🤖' },
    { id: 'Security', name: 'Security & Auth', icon: '🔒' },
    { id: 'Database', name: 'Database Connect', icon: '💾' },
    { id: 'Cloud', name: 'Cloud Infrastructure', icon: '☁️' }
  ];

  // Helper to count word occurrences for Relevance Sorter (Feature e)
  const countOccurrences = (text, term) => {
    if (!text || !term) return 0;
    const cleanText = text.toLowerCase();
    const cleanTerm = term.toLowerCase();
    const parts = cleanText.split(cleanTerm);
    return parts.length - 1;
  };

  // Scroll to and pulse highlight card
  const scrollToCard = (id) => {
    const el = document.getElementById(`doc-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('glow-pulse');
      setTimeout(() => {
        el.classList.remove('glow-pulse');
      }, 2000);
    }
  };

  // Get active documents that reference a particular doc
  const getReferrers = (docId) => {
    return documents
      .filter((d) => !d.inBin && d.references && d.references.includes(docId))
      .map((d) => d.id);
  };

  // Handle Form Submission
  const handleSubmitNewDoc = () => {
    if (!newDocTitle.trim()) {
      addToast('Please enter a document title.', 'yellow');
      return;
    }
    onCreateDoc({
      title: newDocTitle,
      content: newDocContent,
      tags: [newDocFolder, 'All'],
      references: newDocRefs
    });
    // Reset form
    setNewDocTitle('');
    setNewDocContent('');
    setNewDocRefs([]);
    setShowNewDocForm(false);
  };

  // Handle drag and drop file uploads
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileRead(e.target.files[0]);
    }
  };

  const handleFileRead = async (file) => {
    const nameLower = file.name.toLowerCase();
    const isDocx = nameLower.endsWith('.docx');
    const isPdf = nameLower.endsWith('.pdf');
    const isText = nameLower.endsWith('.txt') || nameLower.endsWith('.md') || nameLower.endsWith('.json');

    if (!isDocx && !isPdf && !isText) {
      addToast('Supported formats: .txt, .md, .json, .docx, .pdf', 'yellow');
      return;
    }

    const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const existingDoc = documents.find(
      (d) => d.title.toLowerCase() === title.toLowerCase() && !d.inBin
    );

    addToast(`Reading file "${file.name}"...`, 'blue');

    const processTextContent = (text) => {
      let folder = 'AI Logic';
      const lowerText = text.toLowerCase();
      if (lowerText.includes('security') || lowerText.includes('auth') || lowerText.includes('hash') || lowerText.includes('crypt')) {
        folder = 'Security';
      } else if (lowerText.includes('database') || lowerText.includes('sql') || lowerText.includes('schema') || lowerText.includes('query')) {
        folder = 'Database';
      } else if (lowerText.includes('cloud') || lowerText.includes('network') || lowerText.includes('server') || lowerText.includes('balancer')) {
        folder = 'Cloud';
      }

      const matchedRefs = [];
      documents.forEach((d) => {
        if (lowerText.includes(d.id.toLowerCase())) {
          matchedRefs.push(d.id);
        }
      });

      if (existingDoc) {
        setConflictFile({
          existingId: existingDoc.id,
          title,
          text,
          folder,
          matchedRefs
        });
      } else {
        onCreateDoc({
          title: title,
          content: text,
          tags: [folder, 'All'],
          references: matchedRefs
        });
        addToast(`Successfully indexed: "${title}" in ${folder}!`, 'green');
      }
    };

    if (isText) {
      const reader = new FileReader();
      reader.onload = (event) => {
        processTextContent(event.target.result);
      };
      reader.readAsText(file);
    } else if (isDocx) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          processTextContent(result.value);
        } catch (err) {
          console.error(err);
          addToast('Failed to read content from Word (.docx) file.', 'red');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (isPdf) {
      try {
        const text = await pdfToText(file);
        processTextContent(text);
      } catch (err) {
        console.error(err);
        addToast('Failed to read content from PDF (.pdf) file.', 'red');
      }
    }
  };

  const handleGmailForward = async () => {
    if (!activeDetailsDoc) return;
    try {
      // 1. Generate the DOCX file in memory
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: activeDetailsDoc.title, bold: true, size: 32 }),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Document ID: ${activeDetailsDoc.id}`, italics: true, size: 20 }),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Folder Category: ${activeDetailsDoc.tags.find(t => t !== 'All') || 'General'}`, size: 20 }),
              ]
            }),
            new Paragraph({ text: "" }), // Spacing
            new Paragraph({
              children: [
                new TextRun({ text: activeDetailsDoc.content, size: 22 }),
              ]
            })
          ]
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      
      // 2. Download the file
      saveAs(blob, `${activeDetailsDoc.title}.docx`);
      addToast(`Downloaded "${activeDetailsDoc.title}.docx"! Please attach it in Gmail.`, 'green');
      
      // 3. Open Gmail compose
      const su = encodeURIComponent(`WikiTrace Document: ${activeDetailsDoc.title} (${activeDetailsDoc.id})`);
      const body = encodeURIComponent(`Hi,\n\nPlease find the attached document: ${activeDetailsDoc.title}.docx (which has been downloaded to your computer).\n\nBest regards,\n${userName || 'WikiTrace User'}`);
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${su}&body=${body}`;
      window.open(gmailUrl, '_blank');
    } catch (err) {
      console.error(err);
      addToast('Failed to generate DOCX file.', 'red');
    }
  };

  // Filter and Sort documents based on folder, search query, and tab
  const getProcessedDocuments = () => {
    // 1. Filter by Tab
    let filtered = documents.filter((doc) => {
      if (activeTab === 'starred') return doc.starred && !doc.inBin;
      if (activeTab === 'bin') return doc.inBin;
      if (activeTab === 'recent') return doc.recent && !doc.inBin;
      if (activeTab === 'for-you') return doc.recommended && !doc.inBin;
      return !doc.inBin;
    });

    // 2. Filter by Folder
    if (selectedFolder !== 'All') {
      filtered = filtered.filter((doc) => doc.tags.includes(selectedFolder));
    }

    // 3. Search and Relevance Ranking
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      
      const scoredDocs = filtered.map((doc) => {
        let score = 0;
        score += countOccurrences(doc.title, query) * 5;
        doc.tags.forEach(tag => {
          score += countOccurrences(tag, query) * 3;
        });
        score += countOccurrences(doc.content, query) * 1;
        
        return { ...doc, searchScore: score };
      });

      return scoredDocs
        .filter((doc) => doc.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore);
    }

    return filtered;
  };

  const showTabs = ['recent', 'for-you', 'starred'].includes(activeTab) && selectedFolder === 'All';
  const displayedDocs = getProcessedDocuments();

  return (
    <div className="dashboard-grid">
      
      {/* Conflict File Dialog Modal */}
      {conflictFile && (
        <div className="onboarding-overlay" style={{ zIndex: 3000 }}>
          <div className="popup-card" style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--neon-blue)' }}>
              File Already Exists
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
              A document with the name <strong>"{conflictFile.title}"</strong> already exists in your workspace. Do you want to replace it?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
              <button 
                className="restore-all-btn" 
                style={{ 
                  background: 'rgba(0, 0, 0, 0.05)', 
                  color: 'var(--text-main)', 
                  border: '1px solid var(--border-light)',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                onClick={handleCancelConflict}
              >
                Cancel
              </button>
              <button 
                className="undo-btn" 
                style={{ 
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                onClick={handleReplaceConflict}
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Settings Undo Bar (Feature b) */}
      {historyStack.length > 0 && (
        <div className="undo-bar" id="search-settings-undo-bar">
          <div className="undo-info">
            <svg className="undo-icon" viewBox="0 0 24 24">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <polyline points="3 3 3 8 8 8" />
            </svg>
            <span>
              Search preferences changed. You can undo your last action.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="undo-btn" onClick={undoLastState} id="undo-button">
              Undo Update
            </button>
            <button 
              className="restore-all-btn" 
              onClick={onIgnoreUndo} 
              id="ignore-undo-button"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: '600',
                borderRadius: '8px'
              }}
            >
              Ignore
            </button>
          </div>
        </div>
      )}

      {/* Main Exploration Section: Full-Width Document List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="topic-section">
            <span className="topic-caption">
              {['recent', 'for-you', 'starred'].includes(activeTab) && selectedFolder === 'All' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Pick where you left</span>
                  <button 
                    onClick={() => {
                      if (setActiveTab) setActiveTab('all');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--neon-blue)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'none',
                      letterSpacing: 'normal',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="View all workspace documents"
                  >
                    (See All Documents ➔)
                  </button>
                </span>
              ) : activeTab === 'bin' ? (
                <span>Trash Bin</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>ALL DOCUMENTS</span>
                  <button 
                    onClick={() => {
                      if (setActiveTab) {
                        setActiveTab('recent');
                        setSelectedFolder('All');
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--neon-blue)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'none',
                      letterSpacing: 'normal',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="View recently active documents"
                  >
                    (Show Last Seen ➔)
                  </button>
                </span>
              )}
            </span>
            <h2 className="topic-title">
              {activeTab === 'for-you' && 'Recommended for You'}
              {activeTab === 'recent' && 'Recently Viewed'}
              {activeTab === 'starred' && 'Starred References'}
              {activeTab === 'bin' && 'Recycle Bin'}
              {activeTab === 'all' || (!['for-you','recent','starred','bin'].includes(activeTab))
                ? (selectedFolder !== 'All' ? `${selectedFolder} Folder` : 'Workspace Library')
                : ''}
            </h2>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab !== 'bin' && (
              <button 
                className="restore-all-btn"
                onClick={() => setShowNewDocForm(!showNewDocForm)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{showNewDocForm ? '✕ Close Creator' : '＋ New Document'}</span>
              </button>
            )}

            {activeTab === 'bin' && displayedDocs.length > 0 && (
              <button 
                className="restore-all-btn"
                onClick={() => {
                  documents.forEach(d => {
                    if (d.inBin) onRestoreDoc(d.id);
                  });
                }}
                id="restore-all-bin-btn"
              >
                Restore All Files
              </button>
            )}
          </div>
        </div>

        {/* Collapsible New Document Creator & Dropzone Uploader */}
        {showNewDocForm && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
            
            {/* 1. Custom Text input form */}
            <div className="new-doc-form-card" style={{
              background: 'var(--white)',
              border: '1.5px solid var(--border-blue-active)',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: 'var(--glow-blue)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--neon-blue)', marginBottom: '4px' }}>
                ＋ Create New Wiki Document
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#5b5d6e' }}>Document Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Memory Load Optimizer"
                    value={newDocTitle} 
                    onChange={(e) => setNewDocTitle(e.target.value)} 
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#5b5d6e' }}>Primary Folder</label>
                  <select 
                    value={newDocFolder} 
                    onChange={(e) => setNewDocFolder(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.95rem',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="AI Logic">AI Logic 🤖</option>
                    <option value="Security">Security & Auth 🔒</option>
                    <option value="Database">Database Connect 💾</option>
                    <option value="Cloud">Cloud Infrastructure ☁️</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#5b5d6e' }}>Content Description</label>
                <textarea 
                  rows="3" 
                  placeholder="Write a brief overview of the guidelines or spec requirements..."
                  value={newDocContent} 
                  onChange={(e) => setNewDocContent(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#5b5d6e' }}>
                  Link References (Outward Citations):
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                  gap: '6px',
                  background: 'rgba(0,0,0,0.015)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  padding: '10px',
                  maxHeight: '90px',
                  overflowY: 'auto'
                }}>
                  {documents.filter(d => !d.inBin).map(d => (
                    <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={newDocRefs.includes(d.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewDocRefs([...newDocRefs, d.id]);
                          } else {
                            setNewDocRefs(newDocRefs.filter(id => id !== d.id));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span><strong>{d.id}</strong></span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                className="undo-btn" 
                onClick={handleSubmitNewDoc}
                style={{ alignSelf: 'flex-start', marginTop: '6px' }}
              >
                Add Document to Wiki
              </button>
            </div>

            {/* 2. Drag & Drop FileReader dropzone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '2px dashed var(--neon-blue)' : '2px dashed var(--border-lavender)',
                background: dragActive ? 'rgba(0, 153, 204, 0.04)' : 'rgba(124, 77, 255, 0.01)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: dragActive ? 'var(--glow-blue)' : 'none'
              }}
              onClick={() => document.getElementById('dropzone-file-input').click()}
            >
              <input 
                id="dropzone-file-input"
                type="file"
                multiple={false}
                onChange={handleFileInput}
                style={{ display: 'none' }}
                accept=".txt,.md,.json,.docx,.pdf"
              />
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{
                  width: '40px',
                  height: '40px',
                  color: dragActive ? 'var(--neon-blue)' : 'var(--lavender)',
                  marginBottom: '12px',
                  transition: 'transform 0.3s ease',
                  transform: dragActive ? 'translateY(-4px)' : 'none'
                }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <h4 style={{ fontSize: '0.98rem', fontWeight: '700', color: '#1e202c', marginBottom: '6px' }}>
                Drag & Drop Document
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#8c8f9f', lineHeight: '1.45' }}>
                Select a file (<strong>.txt, .md, .docx, .pdf</strong>). It will be indexed and linked dynamically!
              </p>
            </div>

          </div>
        )}

        <div 
          className="document-grid" 
          id="document-cards-container"
          style={{
            paddingBottom: showTabs ? '70vh' : '2rem'
          }}
        >
          {displayedDocs.length > 0 ? (
            displayedDocs.map((doc, index) => {
              const tabWidth = 100 / displayedDocs.length;
              return (
                <div 
                  key={doc.id} 
                  className="doc-scroll-card" 
                  id={`doc-card-${doc.id}`}
                  style={{
                    zIndex: index + 1,
                    position: showTabs ? 'sticky' : 'relative',
                    height: showTabs ? '60vh' : 'auto',
                    minHeight: showTabs ? '480px' : 'auto',
                    marginBottom: showTabs ? '0' : '1.5rem',
                    top: showTabs ? '1.5rem' : 'auto'
                  }}
                >
                  <div className="doc-card-inner">
                    {/* Card Header (Horizontal Tab / Full Header) */}
                    <div 
                      className="doc-header"
                      style={{
                        width: showTabs ? `${tabWidth}%` : '100%',
                        marginLeft: showTabs ? `${index * tabWidth}%` : '0',
                        background: index % 2 === 0 ? 'var(--neon-blue)' : 'var(--lavender)',
                        color: 'white',
                        borderBottom: 'none',
                        borderRadius: '16px 16px 0 0',
                        padding: '12px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.05)',
                        pointerEvents: 'auto'
                      }}
                      onClick={() => scrollToCard(doc.id)}
                    >
                      <div className="doc-title-group" style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>
                        <h4 className="doc-title" title={doc.title} style={{ color: '#ffffff', fontSize: '0.92rem', fontWeight: '700', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {index + 1}. {doc.title}
                        </h4>
                        <span className="doc-id" style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '0.72rem' }}>{doc.id}</span>
                      </div>
                      {!doc.inBin && (
                        <button
                          className={`star-btn ${doc.starred ? 'starred' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(doc.id);
                          }}
                          title={doc.starred ? 'Unstar file' : 'Star file'}
                          id={`star-btn-${doc.id}`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: doc.starred ? '#ffb800' : 'rgba(255, 255, 255, 0.65)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <svg className="star-icon" viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Card Content Area */}
                    <div 
                      className="doc-card-body"
                      style={{
                        border: index % 2 === 0 ? '2px solid var(--neon-blue)' : '2px solid var(--lavender)',
                        borderTop: 'none',
                        borderBottomLeftRadius: '16px',
                        borderBottomRightRadius: '16px',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
                        overflowY: showTabs ? 'auto' : 'visible',
                        minHeight: showTabs ? 'auto' : '150px'
                      }}
                    >
                      {/* Card Content */}
                      <p className="doc-content" onClick={() => setActiveDetailsDocId(doc.id)} style={{ cursor: 'pointer' }}>
                        {doc.content}
                      </p>

                      {/* Card Tags */}
                      <div className="doc-tags">
                        {doc.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="doc-tag" 
                            onClick={() => setSelectedFolder(tag)}
                            id={`doc-tag-pill-${doc.id}-${tag.replace(/\s+/g, '-').toLowerCase()}`}
                            style={{
                              background: index % 2 === 0 ? 'rgba(0, 153, 204, 0.08)' : 'rgba(124, 77, 255, 0.08)',
                              color: index % 2 === 0 ? 'var(--neon-blue)' : 'var(--lavender)',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* References Linkages Section */}
                      <div className="card-links-section" style={{
                        borderTop: '1px solid var(--border-light)',
                        paddingTop: '8px',
                        marginTop: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        {/* Outward references */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#8c8f9f', width: '85px' }}>
                            References:
                          </span>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {doc.references && doc.references.filter(refId => documents.some(d => d.id === refId && !d.inBin)).length > 0 ? (
                              doc.references
                                .filter(refId => documents.some(d => d.id === refId && !d.inBin))
                                .map(refId => (
                                  <span 
                                    key={refId} 
                                    className="ref-badge outgoing"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      scrollToCard(refId);
                                    }}
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      background: 'rgba(0, 153, 204, 0.05)',
                                      border: '1px solid rgba(0, 153, 204, 0.15)',
                                      color: 'var(--neon-blue)',
                                      cursor: 'pointer',
                                      fontWeight: '600',
                                      transition: 'all 0.2s ease'
                                    }}
                                    title={`Jump to ${refId}`}
                                  >
                                    → {refId}
                                  </span>
                                ))
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#b2b5c2', fontStyle: 'italic' }}>None</span>
                            )}
                          </div>
                        </div>

                        {/* Inward references (Referenced by) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#8c8f9f', width: '85px' }}>
                            Linked By:
                          </span>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {getReferrers(doc.id).length > 0 ? (
                              getReferrers(doc.id).map(refId => (
                                <span 
                                  key={refId} 
                                  className="ref-badge incoming"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    scrollToCard(refId);
                                  }}
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    background: 'rgba(124, 77, 255, 0.05)',
                                    border: '1px solid rgba(124, 77, 255, 0.15)',
                                    color: 'var(--lavender)',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                  }}
                                  title={`Jump to ${refId}`}
                                >
                                  ← {refId}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#b2b5c2', fontStyle: 'italic' }}>None</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* References link editing has been removed to enforce read-only retrieval */}

                      {/* Card Footer */}
                      <div className="doc-footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                        {doc.searchScore !== undefined && searchQuery.trim() ? (
                          <div className="relevance-indicator" id={`relevance-${doc.id}`}>
                            <svg className="relevance-icon" viewBox="0 0 24 24">
                              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                              <polyline points="17 6 23 6 23 12" />
                            </svg>
                            <span>Relevance: {doc.searchScore}pt</span>
                          </div>
                        ) : (
                          <div style={{ flex: 1 }} />
                        )}

                        <div className="doc-actions">
                          {doc.inBin ? (
                            <button
                              className="doc-action-btn"
                              onClick={() => onRestoreDoc(doc.id)}
                              title="Restore document"
                              id={`restore-btn-${doc.id}`}
                            >
                              <svg className="action-icon" viewBox="0 0 24 24">
                                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                <path d="M21 3v5h-5" />
                                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                                <path d="M3 21v-5h5" />
                              </svg>
                            </button>
                          ) : (
                            <>
                              {/* Reference link editing option removed */}

                              {/* File Security Checker Manual Verification */}
                              <button
                                className="doc-action-btn"
                                onClick={() => onTriggerSecurityCheck(doc.id, doc.title)}
                                title="Verify File Integrity"
                                id={`verify-btn-${doc.id}`}
                              >
                                <svg className="action-icon" viewBox="0 0 24 24">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                              </button>
                              
                              {/* Delete Action */}
                              <button
                                className="doc-action-btn delete"
                                onClick={() => onDeleteDoc(doc.id)}
                                title="Move to Bin"
                                id={`delete-btn-${doc.id}`}
                              >
                                <svg className="action-icon" viewBox="0 0 24 24">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-library">
              <svg className="empty-icon" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
                <line x1="9" y1="11" x2="15" y2="11" />
              </svg>
              <div className="empty-text">No documents found matching the criteria.</div>
            </div>
          )}
        </div>

      </div>

      {/* Slide-over Document Detail Drawer overlay */}
      {activeDetailsDoc && (
        <div 
          className="drawer-overlay" 
          onClick={() => setActiveDetailsDocId(null)} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(30, 32, 44, 0.15)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div 
            className="drawer-panel" 
            onClick={(e) => e.stopPropagation()} 
            style={{
              width: '450px',
              height: '100%',
              background: 'var(--white)',
              boxShadow: '-10px 0 30px rgba(30, 32, 44, 0.08)',
              borderLeft: '1px solid var(--border-light)',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#8c8f9f', fontWeight: '600' }}>
                  {activeDetailsDoc.id}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e202c' }}>Document Explorer</h3>
              </div>
              <button 
                onClick={() => setActiveDetailsDocId(null)}
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

            {/* Document Details Block (Read-only Explorer) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#8c8f9f', textTransform: 'uppercase' }}>Title</label>
                <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', padding: '4px 0' }}>
                  {activeDetailsDoc.title}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#8c8f9f', textTransform: 'uppercase' }}>Folder Category</label>
                <div style={{ display: 'flex', gap: '6px', padding: '4px 0' }}>
                  <span style={{
                    background: 'rgba(124, 77, 255, 0.08)',
                    color: 'var(--lavender)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    #{activeDetailsDoc.tags.find(t => t !== 'All') || 'AI Logic'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#8c8f9f', textTransform: 'uppercase' }}>Content Guideline</label>
                <div style={{ 
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.015)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  maxHeight: '350px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-main)'
                }}>
                  {activeDetailsDoc.content}
                </div>
              </div>
            </div>

            {/* Dynamic Linkages inside Drawer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#8c8f9f', textTransform: 'uppercase' }}>Link Connections</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#5b5d6e' }}>References:</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {activeDetailsDoc.references && activeDetailsDoc.references.filter(refId => documents.some(d => d.id === refId && !d.inBin)).length > 0 ? (
                    activeDetailsDoc.references
                      .filter(refId => documents.some(d => d.id === refId && !d.inBin))
                      .map(refId => (
                        <span 
                          key={refId} 
                          className="ref-badge outgoing"
                          onClick={() => {
                            scrollToCard(refId);
                            setActiveDetailsDocId(refId);
                          }}
                        >
                          → {refId}
                        </span>
                      ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#b2b5c2', fontStyle: 'italic' }}>None</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#5b5d6e' }}>Linked By:</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {getReferrers(activeDetailsDoc.id).length > 0 ? (
                    getReferrers(activeDetailsDoc.id).map(refId => (
                      <span 
                        key={refId} 
                        className="ref-badge incoming"
                        onClick={() => {
                          scrollToCard(refId);
                          setActiveDetailsDocId(refId);
                        }}
                      >
                        ← {refId}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#b2b5c2', fontStyle: 'italic' }}>None</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
              <button 
                onClick={handleGmailForward}
                className="undo-btn"
                style={{ 
                  flex: 1.2, 
                  padding: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>Forward via Gmail</span>
              </button>
              
              <button 
                onClick={() => {
                  onTriggerSecurityCheck(activeDetailsDoc.id, activeDetailsDoc.title);
                }}
                className="restore-all-btn"
                style={{ flex: 0.8, fontSize: '0.88rem' }}
              >
                Audit File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
