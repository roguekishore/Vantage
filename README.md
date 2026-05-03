<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>VANTAGE — Level Up Your DSA Skills</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #09090b;
    --bg2: #111113;
    --bg3: #1a1a1e;
    --acc: #EDFF66;
    --acc2: #c8e040;
    --text: #f0f0f0;
    --muted: #666;
    --border: rgba(237,255,102,0.15);
    --border-strong: rgba(237,255,102,0.35);
    --font-display: 'Bebas Neue', sans-serif;
    --font-body: 'Syne', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.7;
    overflow-x: hidden;
  }

  /* ── SCANLINE OVERLAY ── */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.04) 2px,
      rgba(0,0,0,0.04) 4px
    );
    pointer-events: none;
    z-index: 9999;
  }

  /* ── HERO ── */
  #hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 2rem;
  }

  #particle-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 900px;
  }

  .hero-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.25em;
    color: var(--acc);
    text-transform: uppercase;
    margin-bottom: 1.5rem;
    opacity: 0;
    animation: fadeUp 0.6s 0.3s forwards;
  }

  .hero-label::before {
    content: '> ';
    color: var(--muted);
  }

  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(7rem, 18vw, 14rem);
    line-height: 0.9;
    letter-spacing: 0.02em;
    color: var(--acc);
    position: relative;
    opacity: 0;
    animation: fadeUp 0.7s 0.5s forwards;
  }

  .hero-title.glitch {
    animation: fadeUp 0.7s 0.5s forwards, glitchLoop 8s 2s infinite;
  }

  .hero-subtitle {
    font-family: var(--font-body);
    font-size: clamp(1rem, 2.5vw, 1.4rem);
    font-weight: 400;
    color: var(--muted);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-top: 1rem;
    opacity: 0;
    animation: fadeUp 0.6s 0.8s forwards;
  }

  .hero-desc {
    font-size: 1.05rem;
    color: rgba(240,240,240,0.65);
    max-width: 560px;
    margin: 2rem auto 0;
    opacity: 0;
    animation: fadeUp 0.6s 1s forwards;
  }

  .hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: center;
    margin-top: 2.5rem;
    opacity: 0;
    animation: fadeUp 0.6s 1.2s forwards;
  }

  .badge {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    padding: 0.3rem 0.8rem;
    border: 1px solid var(--border-strong);
    color: var(--acc);
    text-transform: uppercase;
    background: rgba(237,255,102,0.05);
    transition: background 0.2s, border-color 0.2s;
  }
  .badge:hover {
    background: rgba(237,255,102,0.12);
    border-color: var(--acc);
  }

  .hero-scroll-hint {
    position: absolute;
    bottom: 2.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-transform: uppercase;
    opacity: 0;
    animation: fadeIn 1s 2s forwards;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    z-index: 2;
  }

  .scroll-line {
    width: 1px;
    height: 40px;
    background: linear-gradient(to bottom, var(--acc), transparent);
    animation: scrollPulse 2s ease-in-out infinite;
  }

  /* ── DIVIDER ── */
  .ticker-bar {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
    overflow: hidden;
    padding: 0.8rem 0;
    white-space: nowrap;
  }

  .ticker-inner {
    display: inline-block;
    animation: ticker 30s linear infinite;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-transform: uppercase;
  }

  .ticker-inner span {
    color: var(--acc);
    margin: 0 1.5rem;
  }

  /* ── SECTIONS ── */
  .section {
    max-width: 1100px;
    margin: 0 auto;
    padding: 5rem 2rem;
  }

  .section-header {
    display: flex;
    align-items: baseline;
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .section-num {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--acc);
    letter-spacing: 0.2em;
    flex-shrink: 0;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    line-height: 1;
    color: var(--text);
    letter-spacing: 0.02em;
  }

  .section-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* ── REVEAL ANIMATION ── */
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }
  .reveal-delay-4 { transition-delay: 0.4s; }

  /* ── OVERVIEW GRID ── */
  .why-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .why-card {
    border: 1px solid var(--border);
    background: var(--bg2);
    padding: 2rem;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s, transform 0.3s;
  }

  .why-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px;
    height: 0;
    background: var(--acc);
    transition: height 0.4s ease;
  }

  .why-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-3px);
  }
  .why-card:hover::before { height: 100%; }

  .why-icon {
    font-size: 1.4rem;
    margin-bottom: 0.8rem;
    display: block;
  }

  .why-card h3 {
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 700;
    color: var(--acc);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }

  .why-card p {
    font-size: 0.9rem;
    color: rgba(240,240,240,0.6);
    line-height: 1.6;
  }

  /* ── FEATURES ── */
  .feature-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    margin-bottom: 5rem;
    padding-bottom: 5rem;
    border-bottom: 1px solid var(--border);
  }

  .feature-block:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .feature-block.reverse { direction: rtl; }
  .feature-block.reverse > * { direction: ltr; }

  .feature-visual {
    background: var(--bg2);
    border: 1px solid var(--border);
    aspect-ratio: 16/10;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .feature-visual canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .feature-visual-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-transform: uppercase;
    position: absolute;
    bottom: 1rem;
    right: 1rem;
  }

  .feature-text h3 {
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 5vw, 3.5rem);
    line-height: 1;
    color: var(--text);
    margin-bottom: 1rem;
  }

  .feature-text h3 em {
    color: var(--acc);
    font-style: normal;
  }

  .feature-text p {
    color: rgba(240,240,240,0.6);
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
  }

  .feature-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .feature-list li {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: rgba(240,240,240,0.7);
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .feature-list li::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--acc);
    flex-shrink: 0;
    display: inline-block;
  }

  /* ── ALGO TABLE ── */
  .algo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0;
    border: 1px solid var(--border);
  }

  .algo-cell {
    padding: 1rem 1.2rem;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
    cursor: default;
    transition: background 0.2s;
  }

  .algo-cell:hover { background: rgba(237,255,102,0.04); }

  .algo-cell-cat {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: var(--acc);
    text-transform: uppercase;
    margin-bottom: 0.3rem;
  }

  .algo-cell-items {
    font-size: 0.8rem;
    color: rgba(240,240,240,0.5);
    line-height: 1.5;
  }

  /* ── STATS BAR ── */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border: 1px solid var(--border);
    margin: 4rem 0;
  }

  .stat-block {
    padding: 2.5rem 2rem;
    border-right: 1px solid var(--border);
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: background 0.3s;
  }

  .stat-block:last-child { border-right: none; }
  .stat-block:hover { background: rgba(237,255,102,0.04); }

  .stat-num {
    font-family: var(--font-display);
    font-size: 4rem;
    line-height: 1;
    color: var(--acc);
    display: block;
    counter-increment: none;
  }

  .stat-num.counting { transition: none; }

  .stat-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-transform: uppercase;
    margin-top: 0.4rem;
    display: block;
  }

  /* ── GAMIFICATION ── */
  .xp-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    margin-top: 2rem;
  }

  .xp-table th {
    text-align: left;
    padding: 0.7rem 1rem;
    border-bottom: 1px solid var(--border);
    color: var(--acc);
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .xp-table td {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid rgba(237,255,102,0.06);
    color: rgba(240,240,240,0.7);
    vertical-align: middle;
  }

  .xp-table tr:hover td { background: rgba(237,255,102,0.03); }

  .diff-pill {
    display: inline-block;
    padding: 0.2rem 0.7rem;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .diff-basic { border: 1px solid #444; color: #888; }
  .diff-easy { border: 1px solid #3a7a3a; color: #6dbf6d; }
  .diff-medium { border: 1px solid #7a6a20; color: #d4ae40; }
  .diff-hard { border: 1px solid #7a2a2a; color: #d46060; }

  .xp-bar-wrap {
    width: 100px;
    height: 4px;
    background: rgba(255,255,255,0.08);
    position: relative;
    overflow: hidden;
  }

  .xp-bar {
    height: 100%;
    background: var(--acc);
    animation: fillBar 1s ease forwards;
    transform-origin: left;
    transform: scaleX(0);
  }

  /* ── ARCH DIAGRAM ── */
  .arch-diagram {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: rgba(240,240,240,0.5);
    background: var(--bg2);
    border: 1px solid var(--border);
    padding: 2.5rem;
    line-height: 1.7;
    overflow-x: auto;
    position: relative;
  }

  .arch-diagram .acc { color: var(--acc); }
  .arch-diagram .dim { color: rgba(255,255,255,0.2); }
  .arch-diagram .hi { color: rgba(240,240,240,0.9); }

  /* ── SERVICES ── */
  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    margin-top: 2rem;
  }

  .service-card {
    background: var(--bg);
    padding: 1.5rem 1.2rem;
    position: relative;
    transition: background 0.2s;
  }

  .service-card:hover { background: var(--bg2); }

  .service-port {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--acc);
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }

  .service-name {
    font-weight: 700;
    font-size: 0.95rem;
    margin-bottom: 0.3rem;
  }

  .service-desc {
    font-size: 0.78rem;
    color: rgba(240,240,240,0.45);
    line-height: 1.5;
  }

  /* ── SETUP ── */
  .setup-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 0;
    border-bottom: 1px solid var(--border);
  }

  .tab-btn {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 0.8rem 1.5rem;
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    transition: color 0.2s;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .tab-btn:hover { color: var(--text); }
  .tab-btn.active { color: var(--acc); border-bottom-color: var(--acc); }

  .tab-content { display: none; }
  .tab-content.active { display: block; }

  pre {
    background: var(--bg2);
    border: 1px solid var(--border);
    padding: 1.5rem 2rem;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: rgba(240,240,240,0.75);
    overflow-x: auto;
    line-height: 1.8;
    position: relative;
  }

  pre .comment { color: var(--muted); }
  pre .cmd { color: var(--acc); }
  pre .str { color: #a8c26b; }
  pre .num { color: #d4ae40; }
  pre .copy-btn {
    position: absolute;
    top: 0.8rem;
    right: 0.8rem;
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    background: none;
    border: 1px solid var(--border-strong);
    color: var(--muted);
    padding: 0.25rem 0.6rem;
    cursor: pointer;
    font-family: var(--font-mono);
    transition: color 0.2s, border-color 0.2s;
  }
  pre .copy-btn:hover { color: var(--acc); border-color: var(--acc); }

  /* ── FOOTER ── */
  #footer {
    position: relative;
    border-top: 1px solid var(--border);
    overflow: hidden;
    padding: 5rem 2rem 3rem;
    text-align: center;
  }

  #footer-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    opacity: 0.4;
  }

  .footer-content {
    position: relative;
    z-index: 2;
  }

  .footer-title {
    font-family: var(--font-display);
    font-size: clamp(4rem, 12vw, 9rem);
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1px rgba(237,255,102,0.3);
    letter-spacing: 0.05em;
    margin-bottom: 1.5rem;
    animation: strokePulse 4s ease-in-out infinite;
  }

  .footer-tagline {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.25em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 3rem;
  }

  .footer-tagline span { color: var(--acc); }

  .footer-links {
    display: flex;
    gap: 2rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 3rem;
  }

  .footer-links a {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .footer-links a:hover { color: var(--acc); }

  .footer-copy {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.1em;
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes ticker {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  @keyframes scrollPulse {
    0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
    50% { opacity: 1; transform: scaleY(1); }
  }

  @keyframes fillBar {
    to { transform: scaleX(1); }
  }

  @keyframes glitchLoop {
    0%, 97%, 100% { transform: none; filter: none; text-shadow: none; }
    97.5% {
      transform: translate(-2px, 0);
      text-shadow: 2px 0 #ff0044, -2px 0 #00aaff;
    }
    98% {
      transform: translate(2px, 1px) skew(-1deg);
      text-shadow: -2px 0 #ff0044, 2px 0 #00aaff;
      filter: brightness(1.3);
    }
    98.5% {
      transform: translate(-1px, -1px);
      text-shadow: 1px 0 #ff0044, -1px 0 #00aaff;
    }
    99% { transform: none; text-shadow: none; filter: none; }
    99.5% {
      transform: translate(3px, 0) skew(0.5deg);
      text-shadow: -3px 0 #ff0044, 3px 0 #00aaff;
      filter: brightness(1.5);
    }
  }

  @keyframes strokePulse {
    0%, 100% { -webkit-text-stroke-color: rgba(237,255,102,0.3); }
    50% { -webkit-text-stroke-color: rgba(237,255,102,0.6); }
  }

  @keyframes countUp {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ── BATTLE VIZ ── */
  .battle-viz {
    background: var(--bg2);
    border: 1px solid var(--border);
    padding: 2rem;
  }

  .vs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .player-name {
    font-family: var(--font-display);
    font-size: 1.8rem;
    color: var(--text);
  }

  .vs-badge {
    font-family: var(--font-display);
    font-size: 2.5rem;
    color: var(--acc);
  }

  .battle-progress {
    margin-bottom: 1rem;
  }

  .battle-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 0.4rem;
    display: flex;
    justify-content: space-between;
  }

  .progress-track {
    height: 3px;
    background: rgba(255,255,255,0.08);
    position: relative;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--acc);
    transition: width 1s ease;
  }

  .progress-fill.p2 { background: #ff6b6b; }

  .battle-meta {
    display: flex;
    gap: 2rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .meta-item {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .meta-item strong {
    display: block;
    font-size: 1.1rem;
    color: var(--acc);
    margin-top: 0.2rem;
  }

  /* ── STREAK VIZ ── */
  .streak-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-top: 1.5rem;
  }

  .streak-day {
    aspect-ratio: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(237,255,102,0.06);
    transition: background 0.3s, border-color 0.3s;
  }

  .streak-day.active {
    background: rgba(237,255,102,0.2);
    border-color: rgba(237,255,102,0.4);
  }

  .streak-day.max {
    background: var(--acc);
    border-color: var(--acc);
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .feature-block {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    .feature-block.reverse { direction: ltr; }
    .stats-row {
      grid-template-columns: repeat(2, 1fr);
    }
    .stat-block:nth-child(2) { border-right: none; }
    .stat-block:nth-child(3) { border-top: 1px solid var(--border); }
    .stat-block:nth-child(4) { border-top: 1px solid var(--border); border-right: none; }
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════ HERO ═══════════════════════════════ -->
<section id="hero">
  <canvas id="particle-canvas"></canvas>

  <div class="hero-content">
    <p class="hero-label">Competitive DSA Platform v2.0</p>
    <h1 class="hero-title glitch">VANTAGE</h1>
    <p class="hero-subtitle">Level Up Your DSA Skills</p>
    <p class="hero-desc">
      A gamified competitive programming platform with real-time battles,
      algorithm visualizers, and LeetCode sync.
    </p>
    <div class="hero-badges">
      <span class="badge">React 19</span>
      <span class="badge">Spring Boot 4</span>
      <span class="badge">Tailwind CSS</span>
      <span class="badge">Docker</span>
      <span class="badge">WebSocket</span>
      <span class="badge">Node.js Judge</span>
    </div>
  </div>

  <div class="hero-scroll-hint">
    <span>Scroll</span>
    <div class="scroll-line"></div>
  </div>
</section>

<!-- ═══════════════════════════════ TICKER ═══════════════════════════════ -->
<div class="ticker-bar">
  <div class="ticker-inner">
    <span>⬡</span> ALGORITHM VISUALIZERS <span>⬡</span> 1v1 BATTLE ARENA <span>⬡</span> GROUP BATTLES <span>⬡</span> LEETCODE SYNC <span>⬡</span> ELO RATING SYSTEM <span>⬡</span> XP & LEVELING <span>⬡</span> DSA CONQUEST MAP <span>⬡</span> STREAK SHIELDS <span>⬡</span> CHROME EXTENSION <span>⬡</span> ALGORITHM VISUALIZERS <span>⬡</span> 1v1 BATTLE ARENA <span>⬡</span> GROUP BATTLES <span>⬡</span> LEETCODE SYNC <span>⬡</span> ELO RATING SYSTEM <span>⬡</span> XP & LEVELING <span>⬡</span> DSA CONQUEST MAP <span>⬡</span> STREAK SHIELDS <span>⬡</span> CHROME EXTENSION <span>⬡</span>
  </div>
</div>

<!-- ═══════════════════════════════ OVERVIEW ═══════════════════════════════ -->
<div class="section">
  <div class="section-header reveal">
    <span class="section-num">01 —</span>
    <h2 class="section-title">OVERVIEW</h2>
    <div class="section-line"></div>
  </div>

  <div class="why-grid">
    <div class="why-card reveal reveal-delay-1">
      <span class="why-icon">⚔</span>
      <h3>Gamified Learning</h3>
      <p>Earn XP, accumulate coins, maintain streaks, and unlock achievements. Turn grinding into conquest.</p>
    </div>
    <div class="why-card reveal reveal-delay-2">
      <span class="why-icon">📡</span>
      <h3>Real Competitions</h3>
      <p>1v1 ranked battles with ELO rating. Climb the competitive ladder against real opponents in real-time.</p>
    </div>
    <div class="why-card reveal reveal-delay-3">
      <span class="why-icon">◈</span>
      <h3>Visual Learning</h3>
      <p>75+ algorithm visualizers across 21 categories. Watch Dijkstra traverse, see AVL trees balance.</p>
    </div>
    <div class="why-card reveal reveal-delay-4">
      <span class="why-icon">↻</span>
      <h3>Auto-Track Progress</h3>
      <p>Chrome extension silently syncs your LeetCode accepted solutions to Vantage in real-time.</p>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-row reveal">
    <div class="stat-block">
      <span class="stat-num" data-target="75">0</span>
      <span class="stat-label">Visualizers</span>
    </div>
    <div class="stat-block">
      <span class="stat-num" data-target="21">0</span>
      <span class="stat-label">Algo Categories</span>
    </div>
    <div class="stat-block">
      <span class="stat-num" data-target="210">0</span>
      <span class="stat-label">DSA Problems</span>
    </div>
    <div class="stat-block">
      <span class="stat-num" data-target="10">0</span>
      <span class="stat-label">Players / Battle</span>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════ FEATURES ═══════════════════════════════ -->
<div class="section">
  <div class="section-header reveal">
    <span class="section-num">02 —</span>
    <h2 class="section-title">FEATURES</h2>
    <div class="section-line"></div>
  </div>

  <!-- VISUALIZER -->
  <div class="feature-block reveal">
    <div class="feature-visual">
      <canvas id="sort-canvas"></canvas>
      <span class="feature-visual-label">Live: Bubble Sort</span>
    </div>
    <div class="feature-text">
      <h3><em>Algorithm</em> Visualizers</h3>
      <p>Experience algorithms come to life with 75+ interactive visualizers. Watch sorting, searching, trees, and graphs in real-time with adjustable speed and step-by-step execution.</p>
      <ul class="feature-list">
        <li>Adjustable speed controls</li>
        <li>Step-by-step pause &amp; resume</li>
        <li>Color-coded element states</li>
        <li>Always-visible complexity footer</li>
        <li>Integrated code editor per algorithm</li>
      </ul>
    </div>
  </div>

  <!-- ALGO CATEGORIES -->
  <div class="algo-grid reveal" style="margin-bottom:5rem;">
    <div class="algo-cell">
      <div class="algo-cell-cat">Sorting</div>
      <div class="algo-cell-items">Bubble · Quick · Merge · Heap · Radix · Bucket · Shell</div>
    </div>
    <div class="algo-cell">
      <div class="algo-cell-cat">Searching</div>
      <div class="algo-cell-items">Linear · Binary · Jump · Interpolation · Exponential</div>
    </div>
    <div class="algo-cell">
      <div class="algo-cell-cat">Trees</div>
      <div class="algo-cell-items">BST · AVL Rotations · Red-Black · Traversals</div>
    </div>
    <div class="algo-cell">
      <div class="algo-cell-cat">Graphs</div>
      <div class="algo-cell-items">BFS · DFS · Dijkstra · Bellman-Ford · Kruskal · Prim</div>
    </div>
    <div class="algo-cell">
      <div class="algo-cell-cat">Dynamic Programming</div>
      <div class="algo-cell-items">LCS · Knapsack · Matrix Chain · Coin Change · Edit Distance</div>
    </div>
    <div class="algo-cell">
      <div class="algo-cell-cat">And More</div>
      <div class="algo-cell-items">Backtracking · Sliding Window · Two Pointers · Bit Manipulation</div>
    </div>
  </div>

  <!-- BATTLE -->
  <div class="feature-block reverse reveal">
    <div class="feature-text">
      <h3><em>Battle</em> Arena</h3>
      <p>Enter the arena and prove your skills. Challenge random opponents or friends to head-to-head coding battles with real-time WebSocket sync.</p>
      <ul class="feature-list">
        <li>Casual &amp; Ranked (ELO) modes</li>
        <li>Live opponent progress tracking</li>
        <li>C++ and Java support</li>
        <li>Auto-submit on timer expiry</li>
        <li>Post-match analysis &amp; rating changes</li>
      </ul>
    </div>
    <div class="feature-visual" style="overflow:visible;">
      <div class="battle-viz" style="width:100%;">
        <div class="vs-header">
          <span class="player-name">KISHORE</span>
          <span class="vs-badge">VS</span>
          <span class="player-name">OPPONENT</span>
        </div>
        <div class="battle-progress">
          <div class="battle-label">
            <span>Problem 2/3</span>
            <span id="p1-pct">72%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="p1-bar" style="width:0%"></div>
          </div>
        </div>
        <div class="battle-progress">
          <div class="battle-label">
            <span>Opponent</span>
            <span id="p2-pct">48%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill p2" id="p2-bar" style="width:0%"></div>
          </div>
        </div>
        <div class="battle-meta">
          <div class="meta-item">Mode<strong>RANKED</strong></div>
          <div class="meta-item">Time<strong id="timer">18:43</strong></div>
          <div class="meta-item">Lang<strong>C++</strong></div>
        </div>
      </div>
    </div>
  </div>

  <!-- GAMIFICATION -->
  <div class="feature-block reveal">
    <div style="flex:1;">
      <h3 style="font-family:var(--font-display);font-size:clamp(2.2rem,5vw,3.5rem);line-height:1;margin-bottom:1rem;">
        <em style="color:var(--acc);font-style:normal;">Gamification</em> System
      </h3>
      <p style="color:rgba(240,240,240,0.6);font-size:0.95rem;margin-bottom:1.5rem;">Every problem solved, every battle won — it all counts. XP, coins, streak multipliers, badges, and a world conquest map.</p>

      <table class="xp-table">
        <thead>
          <tr>
            <th>Difficulty</th>
            <th>Coins</th>
            <th>XP</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="diff-pill diff-basic">Basic</span></td>
            <td>+3</td>
            <td>+5</td>
            <td><div class="xp-bar-wrap"><div class="xp-bar" style="width:10%"></div></div></td>
          </tr>
          <tr>
            <td><span class="diff-pill diff-easy">Easy</span></td>
            <td>+5</td>
            <td>+10</td>
            <td><div class="xp-bar-wrap"><div class="xp-bar" style="width:20%"></div></div></td>
          </tr>
          <tr>
            <td><span class="diff-pill diff-medium">Medium</span></td>
            <td>+15</td>
            <td>+25</td>
            <td><div class="xp-bar-wrap"><div class="xp-bar" style="width:50%"></div></div></td>
          </tr>
          <tr>
            <td><span class="diff-pill diff-hard">Hard</span></td>
            <td>+30</td>
            <td>+50</td>
            <td><div class="xp-bar-wrap"><div class="xp-bar" style="width:100%"></div></div></td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:2rem;">
        <div style="font-family:var(--font-mono);font-size:0.65rem;letter-spacing:0.2em;color:var(--muted);text-transform:uppercase;margin-bottom:0.8rem;">30-Day Streak</div>
        <div class="streak-grid" id="streak-grid"></div>
      </div>
    </div>
  </div>

</div>

<!-- ═══════════════════════════════ ARCHITECTURE ═══════════════════════════════ -->
<div class="section">
  <div class="section-header reveal">
    <span class="section-num">03 —</span>
    <h2 class="section-title">ARCHITECTURE</h2>
    <div class="section-line"></div>
  </div>

  <div class="arch-diagram reveal">
<pre style="background:none;border:none;padding:0;overflow-x:auto;">
<span class="dim">┌──────────────────────────────────────────────────────────────────────────┐</span>
<span class="dim">│</span>                              <span class="acc">VANTAGE</span>                                      <span class="dim">│</span>
<span class="dim">├──────────────────────────────────────────────────────────────────────────┤</span>
<span class="dim">│</span>                                                                          <span class="dim">│</span>
<span class="dim">│</span>  <span class="dim">┌──────────────┐</span>  <span class="dim">┌──────────────┐</span>  <span class="dim">┌──────────────┐</span>  <span class="dim">┌──────────────┐</span>  <span class="dim">│</span>
<span class="dim">│</span>  <span class="dim">│</span>  <span class="acc">REACT</span>        <span class="dim">│</span>  <span class="dim">│</span>  <span class="acc">SPRING</span>       <span class="dim">│</span>  <span class="dim">│</span>  <span class="acc">JUDGE</span>        <span class="dim">│</span>  <span class="dim">│</span>  <span class="acc">EXTENSION</span>    <span class="dim">│</span>  <span class="dim">│</span>
<span class="dim">│</span>  <span class="dim">│</span>  <span class="hi">FRONTEND</span>     <span class="dim">│◄─►</span><span class="dim">│</span>  <span class="hi">BACKEND</span>      <span class="dim">│◄─►</span><span class="dim">│</span>  <span class="hi">SERVICE</span>      <span class="dim">│</span>  <span class="dim">│</span>  <span class="hi">CHROME</span>       <span class="dim">│</span>  <span class="dim">│</span>
<span class="dim">│</span>  <span class="dim">│</span>              <span class="dim">│</span>  <span class="dim">│</span>              <span class="dim">│</span>  <span class="dim">│</span>              <span class="dim">│</span>  <span class="dim">│</span>              <span class="dim">│</span>  <span class="dim">│</span>
<span class="dim">│</span>  <span class="dim">│</span> Zustand      <span class="dim">│</span>  <span class="dim">│</span> REST API      <span class="dim">│</span>  <span class="dim">│</span> Docker        <span class="dim">│</span>  <span class="dim">│</span> MV3           <span class="dim">│</span>  <span class="dim">│</span>
<span class="dim">│</span>  <span class="dim">│</span> Three.js     <span class="dim">│</span>  <span class="dim">│</span> WebSocket     <span class="dim">│</span>  <span class="dim">│</span> C++/Java      <span class="dim">│</span>  <span class="dim">│</span> Auto-sync     <span class="dim">│</span>  <span class="dim">│</span>
<span class="dim">│</span>  <span class="dim">│</span> GSAP         <span class="dim">│</span>  <span class="dim">│</span> PostgreSQL    <span class="dim">│</span>  <span class="dim">│</span> Sandbox       <span class="dim">│</span>  <span class="dim">│</span> Bulk import   <span class="dim">│</span>  <span class="dim">│</span>
<span class="dim">│</span>  <span class="dim">│</span> Monaco       <span class="dim">│</span>  <span class="dim">│</span> Redis         <span class="dim">│</span>  <span class="dim">│</span> Worker pool   <span class="dim">│</span>  <span class="dim">│</span>               <span class="dim">│</span>  <span class="dim">│</span>
<span class="dim">│</span>  <span class="dim">└──────────────┘</span>  <span class="dim">└──────────────┘</span>  <span class="dim">└──────────────┘</span>  <span class="dim">└──────────────┘</span>  <span class="dim">│</span>
<span class="dim">│</span>         <span class="dim">└──────────────────────┴──────────────────────┘</span>                  <span class="dim">│</span>
<span class="dim">│</span>                                   <span class="dim">│</span>                                         <span class="dim">│</span>
<span class="dim">│</span>                    <span class="dim">┌──────────────▼──────────────┐</span>                        <span class="dim">│</span>
<span class="dim">│</span>                    <span class="dim">│</span>       <span class="acc">DOCKER COMPOSE</span>         <span class="dim">│</span>                        <span class="dim">│</span>
<span class="dim">│</span>                    <span class="dim">│</span>   Production Deployment    <span class="dim">│</span>                        <span class="dim">│</span>
<span class="dim">│</span>                    <span class="dim">└─────────────────────────────┘</span>                        <span class="dim">│</span>
<span class="dim">└──────────────────────────────────────────────────────────────────────────┘</span></pre>
  </div>

  <div class="services-grid reveal">
    <div class="service-card">
      <div class="service-port">:3000</div>
      <div class="service-name">React App</div>
      <div class="service-desc">Frontend SPA with visualizers and battle UI</div>
    </div>
    <div class="service-card">
      <div class="service-port">:8080</div>
      <div class="service-name">Spring Boot</div>
      <div class="service-desc">REST API, auth, gamification, battles</div>
    </div>
    <div class="service-card">
      <div class="service-port">:4000</div>
      <div class="service-name">Judge Service</div>
      <div class="service-desc">Code execution with Docker sandboxes</div>
    </div>
    <div class="service-card">
      <div class="service-port">:5432</div>
      <div class="service-name">PostgreSQL</div>
      <div class="service-desc">Primary database</div>
    </div>
    <div class="service-card">
      <div class="service-port">:6379</div>
      <div class="service-name">Redis</div>
      <div class="service-desc">Session caching and real-time state</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════ SETUP ═══════════════════════════════ -->
<div class="section">
  <div class="section-header reveal">
    <span class="section-num">04 —</span>
    <h2 class="section-title">SETUP</h2>
    <div class="section-line"></div>
  </div>

  <div class="reveal">
    <div class="setup-tabs">
      <button class="tab-btn active" data-tab="frontend">Frontend</button>
      <button class="tab-btn" data-tab="backend">Backend</button>
      <button class="tab-btn" data-tab="judge">Judge</button>
      <button class="tab-btn" data-tab="extension">Extension</button>
      <button class="tab-btn" data-tab="docker">Docker</button>
    </div>

    <div id="tab-frontend" class="tab-content active">
      <pre><button class="copy-btn" data-target="frontend-code">COPY</button><code id="frontend-code"><span class="comment"># Navigate to react app</span>
<span class="cmd">cd</span> reactapp

<span class="comment"># Install dependencies</span>
<span class="cmd">npm</span> install

<span class="comment"># Create environment file</span>
<span class="cmd">cp</span> .env.example .env

<span class="comment"># Configure your .env</span>
REACT_APP_API_URL=<span class="str">http://localhost:8080</span>
REACT_APP_JUDGE_URL=<span class="str">http://localhost:4000</span>

<span class="comment"># Start development server</span>
<span class="cmd">npm</span> start
<span class="comment"># → http://localhost:3000</span></code></pre>
    </div>

    <div id="tab-backend" class="tab-content">
      <pre><button class="copy-btn" data-target="backend-code">COPY</button><code id="backend-code"><span class="comment"># Navigate to spring app</span>
<span class="cmd">cd</span> springapp

<span class="comment"># Build the project</span>
./mvnw clean install <span class="str">-DskipTests</span>

<span class="comment"># Configure application.properties</span>
<span class="comment"># → Database connection, JWT secret, Firebase credentials</span>

<span class="comment"># Run the application</span>
./mvnw spring-boot:run
<span class="comment"># → http://localhost:8080</span></code></pre>
    </div>

    <div id="tab-judge" class="tab-content">
      <pre><button class="copy-btn" data-target="judge-code">COPY</button><code id="judge-code"><span class="comment"># Navigate to judge directory</span>
<span class="cmd">cd</span> judge

<span class="comment"># Install dependencies</span>
<span class="cmd">npm</span> install

<span class="comment"># Local development (no Docker)</span>
<span class="str">MODE</span>=host <span class="cmd">npm</span> start

<span class="comment"># Production (with Docker sandboxes)</span>
<span class="cmd">docker-compose</span> up -d
<span class="comment"># Workers: cpp × 3, java × 3</span></code></pre>
    </div>

    <div id="tab-extension" class="tab-content">
      <pre><button class="copy-btn" data-target="ext-code">COPY</button><code id="ext-code"><span class="comment"># Load in Chrome</span>
<span class="num">1.</span> Open chrome://extensions/
<span class="num">2.</span> Enable <span class="str">"Developer mode"</span>
<span class="num">3.</span> Click <span class="str">"Load unpacked"</span>
<span class="num">4.</span> Select the extension/ folder

<span class="comment"># The extension will:</span>
<span class="comment"># → Auto-sync submissions on LeetCode</span>
<span class="comment"># → Bulk import all past solutions</span>
<span class="comment"># → Keep Vantage progress updated</span></code></pre>
    </div>

    <div id="tab-docker" class="tab-content">
      <pre><button class="copy-btn" data-target="docker-code">COPY</button><code id="docker-code"><span class="comment"># Full stack deployment from root</span>
<span class="cmd">docker-compose</span> -f docker-compose.yml up -d

<span class="comment"># Starts all services:</span>
<span class="comment"># ✓ PostgreSQL database</span>
<span class="comment"># ✓ Redis cache</span>
<span class="comment"># ✓ Spring Boot backend</span>
<span class="comment"># ✓ Judge service + workers</span>
<span class="comment"># ✓ React app (production build)</span></code></pre>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════ FOOTER ═══════════════════════════════ -->
<footer id="footer">
  <canvas id="footer-canvas"></canvas>
  <div class="footer-content">
    <div class="footer-title">VANTAGE</div>
    <p class="footer-tagline">Built with <span>♥</span> for competitive programmers</p>
    <div class="footer-links">
      <a href="#">Explore Features</a>
      <a href="#">View Demo</a>
      <a href="#">Setup Guide</a>
      <a href="#">Architecture</a>
      <a href="#">Contributing</a>
    </div>
    <p class="footer-copy">MIT License — Star this repo if you find it useful</p>
  </div>
</footer>

<script>
// ── PARTICLE GRID (HERO) ──────────────────────────────────────────────────
(function() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles, mouse = { x: -9999, y: -9999 };

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 160 }, makeParticle);
  }

  function drawGrid() {
    const gap = 60;
    ctx.strokeStyle = 'rgba(237,255,102,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += gap) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += gap) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();

    // connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.strokeStyle = `rgba(237,255,102,${0.08 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // particles
    particles.forEach(p => {
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      const glow = mdist < 120 ? (1 - mdist / 120) : 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + glow * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(237,255,102,${p.alpha + glow * 0.5})`;
      ctx.fill();

      // update
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });

    requestAnimationFrame(draw);
  }

  canvas.parentElement.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });

  window.addEventListener('resize', resize);
  init();
  draw();
})();

// ── SORT VISUALIZER (FEATURE) ─────────────────────────────────────────────
(function() {
  const canvas = document.getElementById('sort-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, bars, step = 0, i = 0, j = 0, phase = 'sort';

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function initBars() {
    const n = 30;
    bars = Array.from({ length: n }, (_, k) => ({
      val: Math.random() * 0.8 + 0.1,
      state: 'idle'
    }));
    i = 0; j = 0;
  }

  function bubbleStep() {
    const n = bars.length;
    bars.forEach(b => b.state = 'idle');
    if (i < n - 1) {
      if (j < n - 1 - i) {
        bars[j].state = 'compare';
        bars[j + 1].state = 'compare';
        if (bars[j].val > bars[j + 1].val) {
          [bars[j].val, bars[j + 1].val] = [bars[j + 1].val, bars[j].val];
          bars[j].state = 'swap'; bars[j + 1].state = 'swap';
        }
        j++;
      } else {
        bars[n - 1 - i].state = 'sorted';
        j = 0; i++;
      }
    } else {
      bars.forEach(b => b.state = 'sorted');
      setTimeout(() => { initBars(); }, 1200);
    }
  }

  function draw() {
    if (!canvas.offsetWidth) { requestAnimationFrame(draw); return; }
    if (W !== canvas.offsetWidth || H !== canvas.offsetHeight) {
      resize();
      if (!bars) initBars();
    }

    ctx.clearRect(0, 0, W, H);
    if (!bars) { requestAnimationFrame(draw); return; }

    const bw = W / bars.length;
    bars.forEach((b, idx) => {
      const bh = b.val * H * 0.85;
      const x = idx * bw + 1;
      const y = H - bh;
      const colors = {
        idle: 'rgba(237,255,102,0.25)',
        compare: 'rgba(237,255,102,0.9)',
        swap: '#EDFF66',
        sorted: 'rgba(237,255,102,0.5)',
      };
      ctx.fillStyle = colors[b.state] || colors.idle;
      ctx.fillRect(x, y, bw - 2, bh);
    });

    bubbleStep();
    setTimeout(() => requestAnimationFrame(draw), 40);
  }

  resize();
  initBars();
  draw();
})();

// ── FOOTER LINES ──────────────────────────────────────────────────────────
(function() {
  const canvas = document.getElementById('footer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const lines = 8;
    for (let i = 0; i < lines; i++) {
      const y = (i / lines) * H;
      const amp = 20 + i * 5;
      const freq = 0.01 + i * 0.003;
      const phase = t + i * 0.5;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const yy = y + Math.sin(x * freq + phase) * amp;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = `rgba(237,255,102,${0.03 + (i / lines) * 0.04})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    t += 0.015;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

// ── REVEAL ON SCROLL ──────────────────────────────────────────────────────
(function() {
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
})();

// ── COUNT UP STATS ────────────────────────────────────────────────────────
(function() {
  const nums = document.querySelectorAll('.stat-num[data-target]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target);
      let start = 0;
      const dur = 1200;
      const t0 = performance.now();
      function step(now) {
        const prog = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - prog, 3);
        el.textContent = Math.round(eased * target) + (target >= 100 ? '+' : '');
        if (prog < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach(n => obs.observe(n));
})();

// ── TABS ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── COPY BUTTONS ─────────────────────────────────────────────────────────
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const code = document.getElementById(btn.dataset.target);
    if (code) navigator.clipboard.writeText(code.textContent.replace(/^\s+/gm, '')).then(() => {
      btn.textContent = 'COPIED';
      setTimeout(() => btn.textContent = 'COPY', 1800);
    });
  });
});

// ── BATTLE TIMER ─────────────────────────────────────────────────────────
(function() {
  let secs = 18 * 60 + 43;
  const el = document.getElementById('timer');
  setInterval(() => {
    if (secs > 0) secs--;
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    if (el) el.textContent = m + ':' + s;
  }, 1000);

  // Animate progress bars
  setTimeout(() => {
    const p1 = document.getElementById('p1-bar');
    const p2 = document.getElementById('p2-bar');
    if (p1) p1.style.width = '72%';
    if (p2) p2.style.width = '48%';
  }, 400);
})();

// ── STREAK GRID ───────────────────────────────────────────────────────────
(function() {
  const grid = document.getElementById('streak-grid');
  if (!grid) return;
  const streakData = [
    1,1,1,0,1,1,1,
    1,0,1,1,1,1,1,
    1,1,1,1,0,1,1,
    2,1,1,1,1,1,0,
  ];
  streakData.forEach(v => {
    const d = document.createElement('div');
    d.className = 'streak-day' + (v === 2 ? ' max' : v === 1 ? ' active' : '');
    grid.appendChild(d);
  });
})();
</script>
</body>
</html>