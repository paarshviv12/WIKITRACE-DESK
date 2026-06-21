import React, { useState, useEffect, useRef } from 'react';

export default function CitationMap({ documents, searchQuery, theme = 'light' }) {
  const [startNode, setStartNode] = useState('WT-01');
  const [endNode, setEndNode] = useState('WT-06');
  const [shortestPath, setShortestPath] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  const draggedNodeRef = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [physicsEnabled, setPhysicsEnabled] = useState(true);

  // Physics Parameters for sidebar graph
  const repulsionStrength = 70;
  const repulsionRadius = 65;
  const springStrength = 0.04;
  const restLength = 55;
  const gravityStrength = 0.025;
  const friction = 0.86;

  // React Ref to hold physics states
  const nodesRef = useRef([]);

  // Generate active nodes dynamically (nodes not in the recycling bin)
  const activeDocs = documents.filter(d => !d.inBin);

  // Synchronize physics nodes Ref array when documents list changes
  useEffect(() => {
    // 1. Remove nodes of binned documents
    nodesRef.current = nodesRef.current.filter((node) => activeDocs.some(d => d.id === node.id));

    // 2. Add new active nodes if they aren't in nodesRef
    activeDocs.forEach((doc) => {
      const exists = nodesRef.current.some(n => n.id === doc.id);
      if (!exists) {
        // Place near the center of the canvas with a random offset
        nodesRef.current.push({
          id: doc.id,
          x: 120 + (Math.random() - 0.5) * 50,
          y: 110 + (Math.random() - 0.5) * 50,
          vx: 0,
          vy: 0,
          radius: 9,
          label: doc.id
        });
      }
    });

    // Make sure start/end selector exists in active documents
    if (activeDocs.length > 0) {
      if (!activeDocs.some(d => d.id === startNode)) {
        setStartNode(activeDocs[0].id);
      }
      if (!activeDocs.some(d => d.id === endNode)) {
        setEndNode(activeDocs[activeDocs.length - 1].id);
      }
    }
  }, [documents]);

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

  // Helper BFS graph traversal
  const findShortestPath = () => {
    setHasSearched(true);
    if (startNode === endNode) {
      setShortestPath([startNode]);
      return;
    }

    const adj = {};
    activeDocs.forEach(doc => {
      adj[doc.id] = [];
    });

    edges.forEach(edge => {
      if (adj[edge.from] && adj[edge.to]) {
        adj[edge.from].push(edge.to);
        adj[edge.to].push(edge.from); // undirected traversal for pathfinder
      }
    });

    const queue = [[startNode]];
    const visited = new Set([startNode]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current === endNode) {
        setShortestPath(path);
        return;
      }

      const neighbors = adj[current] || [];
      for (let neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    setShortestPath([]);
  };

  const isEdgeInPath = (from, to) => {
    if (shortestPath.length < 2) return false;
    for (let i = 0; i < shortestPath.length - 1; i++) {
      const p1 = shortestPath[i];
      const p2 = shortestPath[i + 1];
      if ((p1 === from && p2 === to) || (p1 === to && p2 === from)) {
        return true;
      }
    }
    return false;
  };

  // Canvas Drawing & Physics loop
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

      // D. Apply Drag, Friction, and Positions Update
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
        } else {
          node.vx = 0;
          node.vy = 0;
        }

        // Keep inside canvas boundaries
        node.x = Math.max(node.radius + 6, Math.min(width - node.radius - 6, node.x));
        node.y = Math.max(node.radius + 6, Math.min(height - node.radius - 6, node.y));
      });

      // --- 2. Drawing Stage ---
      // Draw Edges
      edges.forEach((edge) => {
        const start = nodes.find(n => n.id === edge.from);
        const end = nodes.find(n => n.id === edge.to);
        if (!start || !end) return;

        const inPath = isEdgeInPath(edge.from, edge.to);
        const startHovered = hoveredNodeId === edge.from;
        const endHovered = hoveredNodeId === edge.to;
        const activeHover = startHovered || endHovered;

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);

        ctx.shadowBlur = 0;
        if (inPath) {
          ctx.strokeStyle = '#7c4dff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = 'rgba(124, 77, 255, 0.4)';
          ctx.shadowBlur = 8;
        } else if (activeHover) {
          ctx.strokeStyle = '#0099cc';
          ctx.lineWidth = 2.0;
          ctx.shadowColor = 'rgba(0, 153, 204, 0.4)';
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = theme === 'dark'
            ? (hoveredNodeId ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.12)')
            : (hoveredNodeId ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.08)');
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      });

      // Draw Nodes & Labels
      nodes.forEach((node) => {
        const doc = documents.find(d => d.id === node.id);
        if (!doc) return;

        const isHovered = hoveredNodeId === node.id;
        const isSelected = shortestPath.includes(node.id);
        
        const matchesSearch = searchQuery && searchQuery.trim() && 
          (doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           doc.content.toLowerCase().includes(searchQuery.toLowerCase()));

        let radius = node.radius;
        if (isHovered) radius = node.radius + 3;
        else if (matchesSearch) radius = node.radius + 2;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

        ctx.shadowBlur = 0;
        if (isHovered) {
          ctx.fillStyle = '#0099cc';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.shadowColor = 'rgba(0, 153, 204, 0.6)';
          ctx.shadowBlur = 10;
        } else if (matchesSearch) {
          ctx.fillStyle = '#0099cc';
          ctx.strokeStyle = '#7c4dff';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = 'rgba(0, 153, 204, 0.8)';
          ctx.shadowBlur = 12;
        } else if (isSelected) {
          ctx.fillStyle = '#7c4dff';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = 'rgba(124, 77, 255, 0.5)';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = theme === 'dark' ? '#1a1b24' : '#ffffff';
          ctx.strokeStyle = theme === 'dark'
            ? (hoveredNodeId ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.22)')
            : (hoveredNodeId ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.18)');
          ctx.lineWidth = 1.5;
        }
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = (isHovered || isSelected)
          ? '#ffffff'
          : (theme === 'dark' ? '#ffffff' : '#1e202c');
        ctx.font = 'bold 8.5px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label.replace('WT-', ''), node.x, node.y);

        if (isHovered) {
          const tooltipText = doc.title;
          ctx.font = '500 10px var(--font-sans)';
          const textWidth = ctx.measureText(tooltipText).width;
          
          const paddingX = 8;
          const paddingY = 5;
          const boxWidth = textWidth + paddingX * 2;
          const boxHeight = 20;
          const boxX = Math.max(8, Math.min(width - boxWidth - 8, node.x - boxWidth / 2));
          const boxY = node.y - radius - 26;

          ctx.fillStyle = '#1e202c';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 5);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(tooltipText, boxX + paddingX, boxY + paddingY);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [shortestPath, hoveredNodeId, documents, searchQuery]);

  // Handle Mouse Hover Check and Repositioning
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

  const handleMouseLeave = () => {
    setHoveredNodeId(null);
    draggedNodeRef.current = null;
  };

  const handleCanvasClick = (e) => {
    if (hoveredNodeId && !draggedNodeRef.current) {
      if (startNode === hoveredNodeId) {
        // do nothing
      } else {
        setEndNode(hoveredNodeId);
      }
    }
  };

  const getReadablePathSteps = () => {
    if (shortestPath.length < 2) return null;
    const steps = [];
    for (let i = 0; i < shortestPath.length - 1; i++) {
      const currentId = shortestPath[i];
      const nextId = shortestPath[i + 1];
      const currentDoc = activeDocs.find(d => d.id === currentId);
      const nextDoc = activeDocs.find(d => d.id === nextId);
      if (currentDoc && nextDoc) {
        steps.push({
          fromTitle: currentDoc.title,
          fromId: currentId,
          toTitle: nextDoc.title,
          toId: nextId
        });
      }
    }
    return steps;
  };

  return (
    <div className="citation-map-card" id="citation-link-hub-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Simplified Explanation Guide for Newcomers */}
      <div style={{
        background: 'rgba(0, 153, 204, 0.04)',
        border: '1px solid var(--border-blue)',
        borderRadius: '12px',
        padding: '12px 14px',
        fontSize: '0.82rem',
        lineHeight: '1.4',
        color: 'var(--text-main)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }} id="newcomer-guide-banner">
        <div style={{ fontWeight: '700', color: 'var(--neon-blue)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>💡 Connection Explorer Guide</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#5b5d6e' }}>
          This map shows how your workspace files mention and reference each other. <strong>Circles</strong> represent files, and <strong>lines</strong> show links. Hover over any circle to see its title!
        </p>
        <div style={{ display: 'flex', gap: '14px', marginTop: '2px', fontSize: '0.78rem', color: '#8c8f9f', fontWeight: '600' }}>
          <span>🔵 Circle = Document</span>
          <span>➖ Line = Mention Link</span>
        </div>
      </div>

      <div className="citation-layout" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div 
          className="canvas-container" 
          ref={containerRef}
          style={{ height: '220px', cursor: draggedNodeRef.current ? 'grabbing' : (hoveredNodeId ? 'grab' : 'default'), borderRadius: '12px', overflow: 'hidden', position: 'relative' }}
        >
          {/* Floating Physics Toggle Controls */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 30,
            display: 'flex',
            gap: '6px'
          }}>
            <button
              onClick={() => setPhysicsEnabled(!physicsEnabled)}
              style={{
                background: 'rgba(30, 32, 44, 0.85)',
                border: '1px solid var(--border-blue)',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '0.7rem',
                fontWeight: '700',
                color: physicsEnabled ? 'var(--neon-blue)' : '#8c8f9f',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
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
            onClick={handleCanvasClick}
          />
        </div>

        <div className="finder-form" id="quick-reference-finder-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
          <div className="finder-title" style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>Find Link Trail</div>

          <div className="finder-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="finder-select-group">
              <label className="finder-label">Start File</label>
              <select
                className="finder-select"
                value={startNode}
                onChange={(e) => setStartNode(e.target.value)}
                id="path-start-node"
              >
                {activeDocs.map(d => (
                  <option key={d.id} value={d.id}>{d.id} ({d.title.split(' ')[0]})</option>
                ))}
              </select>
            </div>

            <div className="finder-select-group">
              <label className="finder-label">Target File</label>
              <select
                className="finder-select"
                value={endNode}
                onChange={(e) => setEndNode(e.target.value)}
                id="path-end-node"
              >
                {activeDocs.map(d => (
                  <option key={d.id} value={d.id}>{d.id} ({d.title.split(' ')[0]})</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            className={`finder-btn ${startNode !== endNode ? 'active' : ''}`}
            onClick={findShortestPath}
            id="calculate-path-btn"
            style={{ padding: '8px 16px', borderRadius: '10px' }}
          >
            Trace Connections
          </button>

          <div className="path-result-box" id="path-result-display" style={{ padding: '12px', minHeight: '60px' }}>
            {hasSearched ? (
              shortestPath.length > 0 ? (
                <div>
                  <div className="finder-label" style={{ textAlign: 'center', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.78rem', color: '#8c8f9f' }}>
                    🔗 Trail Path ({shortestPath.length - 1} step{shortestPath.length - 1 > 1 ? 's' : ''})
                  </div>
                  
                  {/* Detailed Human-Readable Explanation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                    {getReadablePathSteps() && getReadablePathSteps().map((step, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '0.8rem', 
                        background: 'rgba(0,0,0,0.015)',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)'
                      }}>
                        <span style={{ fontWeight: '700', color: 'var(--neon-blue)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }} title={step.fromTitle}>
                          {step.fromTitle}
                        </span>
                        <span style={{ color: '#8c8f9f', fontSize: '0.74rem', fontStyle: 'italic' }}>mentions</span>
                        <span style={{ fontWeight: '700', color: 'var(--lavender)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }} title={step.toTitle}>
                          {step.toTitle}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Badges Path */}
                  <div className="path-route" style={{ marginTop: '12px', justifyContent: 'center' }}>
                    {shortestPath.map((nodeId, idx) => (
                      <React.Fragment key={nodeId}>
                        <span className={`path-node-badge ${idx === 0 ? 'start' : ''}`} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                          {nodeId.replace('WT-', '')}
                        </span>
                        {idx < shortestPath.length - 1 && <span className="path-arrow" style={{ fontSize: '0.85rem' }}>→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="path-empty-msg">No references connect these files.</div>
              )
            ) : (
              <div className="path-empty-msg" style={{ fontSize: '0.75rem' }}>Select start/target and trace how they relate.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
