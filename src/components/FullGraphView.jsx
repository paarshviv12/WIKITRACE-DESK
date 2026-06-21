import React, { useState, useEffect, useRef } from 'react';

export default function FullGraphView({
  documents,
  historyStack,
  searchQuery,
  onCreateDoc,
  onUpdateDoc,
  theme = 'light'
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [activePanelTab, setActivePanelTab] = useState('linker'); // 'linker' or 'history'
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  
  // Linker Sidebar states
  const [selectedEditorDocId, setSelectedEditorDocId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newFolder, setNewFolder] = useState('AI Logic');

  // Physics Parameters
  const repulsionStrength = 220;
  const repulsionRadius = 150;
  const springStrength = 0.04;
  const restLength = 110;
  const gravityStrength = 0.015;
  const friction = 0.88;

  // React Ref to hold physics states
  const nodesRef = useRef([]);

  const draggedNodeRef = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Generate active documents (not in the recycling bin)
  const activeDocs = documents.filter(d => !d.inBin);

  // Synchronize physics nodes Ref array when documents list changes
  useEffect(() => {
    // 1. Remove nodes of binned documents
    nodesRef.current = nodesRef.current.filter((node) => activeDocs.some(d => d.id === node.id));

    // 2. Add new active nodes if they aren't in nodesRef
    activeDocs.forEach((doc) => {
      const exists = nodesRef.current.some(n => n.id === doc.id);
      if (!exists) {
        // Place dynamically near the center of the canvas with a random offset
        nodesRef.current.push({
          id: doc.id,
          x: 300 + (Math.random() - 0.5) * 150,
          y: 200 + (Math.random() - 0.5) * 100,
          vx: 0,
          vy: 0,
          radius: 14,
          label: doc.id
        });
      }
    });

    // Make sure a default is selected for references editor
    if (activeDocs.length > 0 && (!selectedEditorDocId || !activeDocs.some(d => d.id === selectedEditorDocId))) {
      setSelectedEditorDocId(activeDocs[0].id);
    }
  }, [documents]);

  // Automatically switch references editor target to hovered node for extreme convenience
  useEffect(() => {
    if (hoveredNodeId) {
      setSelectedEditorDocId(hoveredNodeId);
    }
  }, [hoveredNodeId]);

  // Build edges dynamically based on references inside document properties
  const edges = [];
  activeDocs.forEach((doc) => {
    if (doc.references) {
      doc.references.forEach((refId) => {
        const targetDoc = activeDocs.find(d => d.id === refId);
        if (targetDoc) {
          edges.push({ from: doc.id, to: refId });
        }
      });
    }
  });

  const handleCreateNode = () => {
    if (!newTitle.trim()) {
      alert('Please enter a document title.');
      return;
    }
    onCreateDoc({
      title: newTitle,
      content: 'Added via Interactive Graph Link Editor.',
      tags: [newFolder, 'All'],
      references: []
    });
    setNewTitle('');
  };

  // Helper to check if a node is connected to the hovered node
  const isConnectedToHovered = (nodeId) => {
    if (!hoveredNodeId) return false;
    if (nodeId === hoveredNodeId) return true;
    return edges.some(edge => 
      (edge.from === hoveredNodeId && edge.to === nodeId) ||
      (edge.to === hoveredNodeId && edge.from === nodeId)
    );
  };

  // Helper to determine if a node matches the selected history item query or folder tag
  const matchesHistoryFilter = (nodeId, item) => {
    if (!item) return false;
    const doc = documents.find(d => d.id === nodeId);
    if (!doc) return false;

    // Check query match
    if (item.query && item.query.trim()) {
      const q = item.query.trim().toLowerCase();
      if (doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q)) {
        return true;
      }
    }
    // Check folder match
    if (item.folder && item.folder !== 'All') {
      if (doc.tags.includes(item.folder)) {
        return true;
      }
    }
    return false;
  };

  // Canvas Physics and Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const centerX = width / 2;
      const centerY = height / 2;

      // --- 1. Physics Calculations ---
      if (physicsEnabled) {
        // A. Center Gravity
        nodes.forEach((node) => {
          node.vx += (centerX - node.x) * gravityStrength;
          node.vy += (centerY - node.y) * gravityStrength;
        });

        // B. Electrostatic Repulsion
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i];
            const nodeB = nodes[j];
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < repulsionRadius) {
              const force = ((repulsionRadius - dist) / repulsionRadius) * repulsionStrength * 0.05;
              const forceX = (dx / dist) * force;
              const forceY = (dy / dist) * force;

              nodeA.vx -= forceX;
              nodeA.vy -= forceY;
              nodeB.vx += forceX;
              nodeB.vy += forceY;
            }
          }
        }

        // C. Spring Attraction along Edges
        edges.forEach((edge) => {
          const start = nodes.find(n => n.id === edge.from);
          const end = nodes.find(n => n.id === edge.to);
          if (!start || !end) return;

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - restLength) * springStrength;
          const forceX = (dx / dist) * force;
          const forceY = (dy / dist) * force;

          start.vx += forceX;
          start.vy += forceY;
          end.vx -= forceX;
          end.vy -= forceY;
        });
      }

      // D. Apply Drag, Friction, and Update Positions
      nodes.forEach((node) => {
        if (draggedNodeRef.current && draggedNodeRef.current.id === node.id) {
          node.x = mousePosRef.current.x;
          node.y = mousePosRef.current.y;
          node.vx = 0;
          node.vy = 0;
        } else if (physicsEnabled) {
          node.vx *= friction;
          node.vy *= friction;
          node.x += node.vx;
          node.y += node.vy;

          node.x = Math.max(node.radius + 10, Math.min(width - node.radius - 10, node.x));
          node.y = Math.max(node.radius + 10, Math.min(height - node.radius - 10, node.y));
        } else {
          node.vx = 0;
          node.vy = 0;
        }
      });

      // --- 2. Drawing Stage ---
      // Draw Connections (Edges)
      edges.forEach((edge) => {
        const start = nodes.find(n => n.id === edge.from);
        const end = nodes.find(n => n.id === edge.to);
        if (!start || !end) return;

        const isDirectConnection = hoveredNodeId && (edge.from === hoveredNodeId || edge.to === hoveredNodeId);
        const startHistoryMatched = selectedHistoryItem && matchesHistoryFilter(edge.from, selectedHistoryItem);
        const endHistoryMatched = selectedHistoryItem && matchesHistoryFilter(edge.to, selectedHistoryItem);
        const historyMatchedConnection = startHistoryMatched && endHistoryMatched;

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);

        ctx.shadowBlur = 0;
        if (hoveredNodeId) {
          if (isDirectConnection) {
            ctx.strokeStyle = edge.from === hoveredNodeId ? '#0099cc' : '#7c4dff';
            ctx.lineWidth = 3.0;
            ctx.shadowColor = edge.from === hoveredNodeId ? 'rgba(0, 153, 204, 0.4)' : 'rgba(124, 77, 255, 0.4)';
            ctx.shadowBlur = 8;
          } else {
            ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.015)';
            ctx.lineWidth = 0.5;
          }
        } else if (historyMatchedConnection) {
          ctx.strokeStyle = '#7c4dff';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = 'rgba(124, 77, 255, 0.5)';
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = theme === 'dark'
            ? (selectedHistoryItem ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.15)')
            : (selectedHistoryItem ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.07)');
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();
      });

      // Draw Nodes
      nodes.forEach((node) => {
        const doc = documents.find(d => d.id === node.id);
        if (!doc) return;
        
        const isHovered = hoveredNodeId === node.id;
        const isHistoryMatched = selectedHistoryItem && matchesHistoryFilter(node.id, selectedHistoryItem);
        const isConnected = hoveredNodeId && isConnectedToHovered(node.id);
        
        const isSearchMatched = searchQuery && searchQuery.trim() && 
          (doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           doc.content.toLowerCase().includes(searchQuery.toLowerCase()));

        let alpha = 1.0;
        if (hoveredNodeId && !isConnected && !isHovered) {
          alpha = 0.15;
        }

        let drawRadius = node.radius;
        if (isHovered) drawRadius = node.radius + 4;
        else if (isHistoryMatched || isSearchMatched || isConnected) drawRadius = node.radius + 2;

        ctx.beginPath();
        ctx.arc(node.x, node.y, drawRadius, 0, Math.PI * 2);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = alpha;

        if (isHovered) {
          ctx.fillStyle = '#0099cc';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.shadowColor = 'rgba(0, 153, 204, 0.6)';
          ctx.shadowBlur = 15;
        } else if (isConnected) {
          const isOutgoing = edges.some(e => e.from === hoveredNodeId && e.to === node.id);
          ctx.fillStyle = isOutgoing ? '#0099cc' : '#7c4dff';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = isOutgoing ? 'rgba(0, 153, 204, 0.4)' : 'rgba(124, 77, 255, 0.4)';
          ctx.shadowBlur = 10;
        } else if (isHistoryMatched) {
          ctx.fillStyle = '#7c4dff';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = 'rgba(124, 77, 255, 0.7)';
          ctx.shadowBlur = 18;
        } else if (isSearchMatched) {
          ctx.fillStyle = '#0099cc';
          ctx.strokeStyle = '#7c4dff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = 'rgba(0, 153, 204, 0.8)';
          ctx.shadowBlur = 18;
        } else {
          ctx.fillStyle = theme === 'dark' ? '#1a1b24' : '#ffffff';
          ctx.strokeStyle = theme === 'dark'
            ? ((hoveredNodeId || selectedHistoryItem || searchQuery) ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.22)')
            : ((hoveredNodeId || selectedHistoryItem || searchQuery) ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.2)');
          ctx.lineWidth = 2;
        }
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = (isHovered || isHistoryMatched || isSearchMatched || isConnected)
          ? '#ffffff'
          : (theme === 'dark' ? '#ffffff' : '#1e202c');
        
        if (hoveredNodeId && !isHovered && !isConnected) {
          ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(30, 32, 44, 0.1)';
        }

        ctx.font = 'bold 11px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);

        ctx.globalAlpha = 1.0;

        if (isHovered) {
          ctx.font = '500 11px var(--font-sans)';
          const textWidth = ctx.measureText(doc.title).width;
          const paddingX = 10;
          const paddingY = 6;
          
          const boxWidth = textWidth + paddingX * 2;
          const boxHeight = 24;
          const boxX = Math.max(10, Math.min(width - boxWidth - 10, node.x - boxWidth / 2));
          const boxY = node.y - drawRadius - 32;

          ctx.fillStyle = '#1e202c';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(doc.title, boxX + paddingX, boxY + paddingY);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [selectedHistoryItem, hoveredNodeId, documents, searchQuery]);

  // Mouse Handlers for Dragging and Hovering
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mousePosRef.current = { x, y };

    if (draggedNodeRef.current) {
      return;
    }

    let matchedId = null;
    nodesRef.current.forEach((node) => {
      const dx = x - node.x;
      const dy = y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < node.radius + 6) {
        matchedId = node.id;
      }
    });

    setHoveredNodeId(matchedId);
  };

  const handleMouseDown = (e) => {
    if (hoveredNodeId) {
      const matchedNode = nodesRef.current.find(n => n.id === hoveredNodeId);
      if (matchedNode) {
        draggedNodeRef.current = matchedNode;
      }
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
  };

  const validHistory = historyStack.filter(item => item.query.trim() || (item.folder && item.folder !== 'All'));

  return (
    <div className="citation-map-card" style={{ marginTop: '0', flex: 1, display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <div className="topic-section">
          <span className="topic-caption">Interactive Explorer</span>
          <h2 className="topic-title">Interactive Connection Graph</h2>
        </div>
        
        {selectedHistoryItem && (
          <button 
            className="restore-all-btn" 
            onClick={() => setSelectedHistoryItem(null)}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            Clear History Filter
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: '1.5rem', flex: 1 }}>
        
        <div 
          className="canvas-container" 
          ref={containerRef}
          style={{ height: '520px', cursor: draggedNodeRef.current ? 'grabbing' : (hoveredNodeId ? 'grab' : 'default'), position: 'relative' }}
        >
          {/* Floating Physics Toggle Controls */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 30,
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => setPhysicsEnabled(!physicsEnabled)}
              style={{
                background: 'rgba(30, 32, 44, 0.85)',
                border: '1px solid var(--border-blue)',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: '700',
                color: physicsEnabled ? 'var(--neon-blue)' : '#8c8f9f',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
              title="Toggle Force-Directed Physics layout"
            >
              <span>{physicsEnabled ? '⚛️ Physics ON' : '📌 Physics OFF (Fixed)'}</span>
            </button>
          </div>

          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', color: '#ffffff', pointerEvents: 'none' }}>
            🖱️ Drag nodes • Hover for Focus Highlight
          </div>
        </div>

        <div className="finder-form" style={{ height: '520px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Session History Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--neon-blue)' }}>🕒 Search Sessions</span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.6)', lineHeight: '1.4' }}>
              Select a past search preferences state. The graph will highlight connections matched during that session.
            </p>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
              {validHistory.length > 0 ? (
                validHistory.map((item, idx) => {
                  const isActive = selectedHistoryItem === item;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedHistoryItem(item)}
                      style={{
                        background: isActive ? 'rgba(124, 77, 255, 0.08)' : 'rgba(0,0,0,0.015)',
                        border: isActive ? '1px solid var(--lavender)' : '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--lavender)', fontWeight: '700' }}>
                          Search Session #{validHistory.length - idx}
                        </span>
                        {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--lavender)' }} />}
                      </div>
                      {item.query && (
                        <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#1e202c' }}>
                          Query: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-blue)' }}>"{item.query}"</span>
                        </div>
                      )}
                      {item.folder && item.folder !== 'All' && (
                        <div style={{ fontSize: '0.82rem', color: '#5b5d6e' }}>
                          Folder: <span style={{ fontWeight: '600' }}>{item.folder}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1rem', color: '#8c8f9f', fontSize: '0.82rem', border: '1px dashed rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                  No past search logs found.<br />Search or change folders to create session histories.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
