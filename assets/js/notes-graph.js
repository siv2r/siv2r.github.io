(function () {
  var el = document.getElementById('notes-graph')
  var dataEl = document.getElementById('graph-data')
  if (!el || !dataEl || typeof ForceGraph === 'undefined') return
  var data = JSON.parse(dataEl.textContent)
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  var COLORS = {
    'bitcoin-and-frost': '#b07a33', 'mathematics': '#4a6b52',
    'computer-science': '#5a7184', 'cryptography': '#8c5b6b',
  }
  var GHOST = 'rgba(142,136,120,0.45)'
  var LABEL_FONT = "'Overpass Mono', ui-monospace, monospace"

  // neighbor index for hover highlight
  var byId = {}; data.nodes.forEach(function (n) { byId[n.id] = n; n.neighbors = []; n.links = [] })
  data.links.forEach(function (l) {
    var s = byId[l.source] || l.source, t = byId[l.target] || l.target
    s.neighbors.push(t.id || t); t.neighbors.push(s.id || s); s.links.push(l); t.links.push(l)
  })
  // pin precomputed positions
  data.nodes.forEach(function (n) { if (n.x != null) { n.fx = n.x; n.fy = n.y } })

  var hovered = null, fitted = false
  function radius(n) { return 2 + Math.sqrt(n.degree || 0) }
  function nodeColor(n) {
    if (n.ghost) return GHOST
    if (hovered && hovered !== n && hovered.neighbors.indexOf(n.id) === -1) return 'rgba(106,99,85,0.25)'
    return COLORS[n.category] || '#6a6355'
  }

  function build() {
    var g = ForceGraph()(el)
      .graphData(data)
      .backgroundColor('rgba(0,0,0,0)')
      .nodeId('id')
      .nodeRelSize(1)
      .warmupTicks(0).cooldownTicks(0)         // pinned positions, no settle
      .autoPauseRedraw(false)
      .nodeCanvasObjectMode(function () { return 'replace' })
      .nodeCanvasObject(function (n, ctx, scale) {
        var r = radius(n)
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 2 * Math.PI)
        if (n.ghost) { ctx.setLineDash([2, 2]); ctx.strokeStyle = GHOST; ctx.lineWidth = 1 / scale; ctx.stroke(); ctx.setLineDash([]) }
        else { ctx.fillStyle = nodeColor(n); ctx.fill() }
        if (scale > 4 || (hovered && (hovered === n || hovered.neighbors.indexOf(n.id) > -1))) {
          ctx.font = (10 / scale) + 'px ' + LABEL_FONT
          ctx.fillStyle = '#2a251d'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
          ctx.fillText(n.label, n.x, n.y + r + 1)
        }
      })
      .nodePointerAreaPaint(function (n, color, ctx) {
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(n.x, n.y, radius(n) + 2, 0, 2 * Math.PI); ctx.fill()
      })
      .linkColor(function (l) {
        if (hovered) {
          var a = l.source.id || l.source, b = l.target.id || l.target
          if (a === hovered.id || b === hovered.id) return 'rgba(74,107,82,0.6)'
          return 'rgba(196,189,170,0.25)'
        }
        return 'rgba(196,189,170,0.6)'
      })
      .linkWidth(1)
      .linkDirectionalParticles(0)
      .onNodeHover(function (n) { hovered = n || null; el.style.cursor = n ? 'pointer' : '' })
      .onNodeClick(function (n) { if (!n.ghost) window.location.href = '/notes/' + n.id + '/' })
      .onEngineStop(function () { if (!fitted) { g.zoomToFit(reduced ? 0 : 400, 24); fitted = true } })

    g.d3Force('charge').strength(-60)
    g.d3Force('center', null)   // rely on zoomToFit, not centering force
    g.width(el.clientWidth).height(el.clientHeight)

    if (window.innerWidth < 640) { g.enableZoomInteraction(false); g.enablePanInteraction(false) }
    new ResizeObserver(function (entries) {
      var cr = entries[0].contentRect; g.width(cr.width).height(cr.height)
      if (fitted) g.zoomToFit(0, 24)   // re-fit to the new container size; positions are pinned
    }).observe(el)
  }

  // Lazy init when near viewport.
  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { io.disconnect(); build() }
  }, { rootMargin: '200px' })
  io.observe(el)
})()
