// DreamGraph.js — Obsidian-inspired keyword relationship graph (canvas)
// Optimized: Top 30 keywords, dynamic canvas, better force layout

const MAX_NODES = 30;

export function createDreamGraph(dreams, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'graph-section';
    wrapper.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Dream Graph</h2>
      <p class="section-desc">Your top recurring symbols form constellations</p>
    </div>
    <div class="graph-container">
      <canvas id="dream-graph-canvas"></canvas>
    </div>
  `;
    container.appendChild(wrapper);

    // Build graph data from dreams
    const keywordCount = {};
    const edgeMap = {};

    dreams.forEach(dream => {
        const kws = dream.keywords || [];
        kws.forEach(kw => {
            keywordCount[kw] = (keywordCount[kw] || 0) + 1;
        });
        for (let i = 0; i < kws.length; i++) {
            for (let j = i + 1; j < kws.length; j++) {
                const key = [kws[i], kws[j]].sort().join('||');
                edgeMap[key] = (edgeMap[key] || 0) + 1;
            }
        }
    });

    // Get Top N keywords by frequency
    const allKeywords = Object.entries(keywordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_NODES);

    const topKeywordSet = new Set(allKeywords.map(([kw]) => kw));
    const keywords = allKeywords.map(([kw]) => kw);

    if (keywords.length === 0) {
        wrapper.querySelector('.graph-container').innerHTML = `
      <div class="graph-empty">
        <span>🌑</span>
        <p>Record some dreams to see your constellation form</p>
      </div>
    `;
        return;
    }

    // Filter edges to only include Top N keywords
    const filteredEdgeMap = {};
    Object.entries(edgeMap).forEach(([key, weight]) => {
        const [a, b] = key.split('||');
        if (topKeywordSet.has(a) && topKeywordSet.has(b)) {
            filteredEdgeMap[key] = weight;
        }
    });

    // Show count info
    const totalKeywords = Object.keys(keywordCount).length;
    if (totalKeywords > MAX_NODES) {
        const info = document.createElement('div');
        info.className = 'graph-info';
        info.textContent = `Showing top ${MAX_NODES} of ${totalKeywords} keywords`;
        wrapper.querySelector('.graph-container').prepend(info);
    }

    setTimeout(() => initGraph(wrapper, keywords, keywordCount, filteredEdgeMap), 100);
}

function initGraph(wrapper, keywords, keywordCount, edgeMap) {
    const canvas = wrapper.querySelector('#dream-graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const graphContainer = wrapper.querySelector('.graph-container');

    const containerWidth = graphContainer.clientWidth || 440;
    // Dynamic height based on node count
    const nodeCount = keywords.length;
    const w = containerWidth;
    const h = Math.max(320, Math.min(520, 200 + nodeCount * 10));

    canvas.width = w * 2;
    canvas.height = h * 2;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(2, 2);

    // Find max count for normalization
    const maxCount = Math.max(...keywords.map(kw => keywordCount[kw]));

    // Position nodes — spiral layout for better initial spread
    const nodes = keywords.map((kw, i) => {
        const angle = (i / keywords.length) * Math.PI * 2 * 2.5; // More spiral
        const spiralR = 60 + (i / keywords.length) * Math.min(w, h) * 0.3;
        const normCount = keywordCount[kw] / maxCount;
        return {
            label: kw,
            count: keywordCount[kw],
            x: w / 2 + Math.cos(angle) * spiralR,
            y: h / 2 + Math.sin(angle) * spiralR,
            vx: 0,
            vy: 0,
            radius: Math.min(4 + normCount * 10, 14),
        };
    });

    const edges = Object.entries(edgeMap).map(([key, weight]) => {
        const [a, b] = key.split('||');
        return {
            source: nodes.find(n => n.label === a),
            target: nodes.find(n => n.label === b),
            weight,
        };
    }).filter(e => e.source && e.target);

    // Force simulation — more iterations for better convergence with many nodes
    const iterations = Math.min(120, 60 + nodeCount * 2);
    const repulsionStrength = nodeCount > 20 ? 800 : 600;

    for (let iter = 0; iter < iterations; iter++) {
        const decay = 1 - (iter / iterations) * 0.5; // Cooling

        // Repulsion between all nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = repulsionStrength / (dist * dist);
                const fx = (dx / dist) * force * decay;
                const fy = (dy / dist) * force * decay;
                nodes[i].vx -= fx;
                nodes[i].vy -= fy;
                nodes[j].vx += fx;
                nodes[j].vy += fy;
            }
        }

        // Attraction along edges
        edges.forEach(edge => {
            const dx = edge.target.x - edge.source.x;
            const dy = edge.target.y - edge.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const idealDist = nodeCount > 20 ? 100 : 80;
            const force = (dist - idealDist) * 0.015 * edge.weight * decay;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            edge.source.vx += fx;
            edge.source.vy += fy;
            edge.target.vx -= fx;
            edge.target.vy -= fy;
        });

        // Center gravity + bounds
        const padding = 55;
        nodes.forEach(node => {
            node.vx += (w / 2 - node.x) * 0.004;
            node.vy += (h / 2 - node.y) * 0.004;
            node.x += node.vx * 0.25;
            node.y += node.vy * 0.25;
            node.vx *= 0.75;
            node.vy *= 0.75;
            node.x = Math.max(padding, Math.min(w - padding, node.x));
            node.y = Math.max(padding, Math.min(h - padding, node.y));
        });
    }

    // Draw the graph
    ctx.clearRect(0, 0, w, h);

    // Draw edges
    edges.forEach(edge => {
        const alpha = Math.min(0.12 + edge.weight * 0.12, 0.55);
        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);
        ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
        ctx.lineWidth = 0.5 + edge.weight * 0.6;
        ctx.stroke();
    });

    // Draw nodes — larger nodes (higher frequency) drawn on top
    const sortedNodes = [...nodes].sort((a, b) => a.count - b.count);

    sortedNodes.forEach(node => {
        const normCount = node.count / maxCount;

        // Outer glow — stronger for frequent keywords
        const glowRadius = node.radius * (2.5 + normCount);
        const glow = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, glowRadius
        );
        glow.addColorStop(0, `rgba(167, 139, 250, ${0.15 + normCount * 0.15})`);
        glow.addColorStop(1, `rgba(167, 139, 250, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        const fill = ctx.createRadialGradient(
            node.x - node.radius * 0.3, node.y - node.radius * 0.3, 0,
            node.x, node.y, node.radius
        );
        fill.addColorStop(0, '#c4b5fd');
        fill.addColorStop(1, '#7c3aed');
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.strokeStyle = 'rgba(196, 181, 253, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label — font size scales with importance
        const fontSize = Math.max(9, Math.min(13, 9 + normCount * 4));
        ctx.font = `500 ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = `rgba(232, 232, 240, ${0.7 + normCount * 0.3})`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 14);

        // Show count badge for keywords appearing 3+ times
        if (node.count >= 3) {
            const badgeX = node.x + node.radius + 2;
            const badgeY = node.y - node.radius - 2;
            ctx.font = '600 8px Inter, sans-serif';
            ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
            ctx.fillText(`×${node.count}`, badgeX, badgeY);
        }
    });
}
