import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Lock, CheckCircle, Play, ZoomIn, ZoomOut,
  MapPin, ChevronRight, Trophy,
  Target, ArrowLeft,
  ExternalLink, Code2, Layers, ChevronUp, ChevronDown,
  Crosshair, Swords,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as Map } from './world.svg';
import useProgressStore, {
  STAGES,
  STAGE_ORDER,
  FULL_ROADMAP,
  COUNTRY_NAME_TO_CODE,
  CODE_TO_COUNTRY_NAME,
  getProblemsByStage,
  getProblemForCountry,
  getCountryForProblem,
  getLeetCodeUrlForProblem,
  hasJudgeProblem,
  getJudgeRoute,
} from './useProgressStore';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { buildApiUrl } from '@/services/realtimeUrls';
import useUserStore from '@/stores/useUserStore';
import './WorldMap.css';

/* ─── status config ─── */
const STATUS_CFG = {
  completed: { icon: CheckCircle, label: 'Conquered',  color: '#34d399', ringColor: 'rgba(52,211,153,0.35)'  },
  current:   { icon: Crosshair,   label: 'Active',     color: '#EDFF66', ringColor: 'rgba(237,255,102,0.35)' },
  available: { icon: Swords,      label: 'Available',  color: '#c4b5fd', ringColor: 'rgba(196,181,253,0.25)' },
  locked:    { icon: Lock,        label: 'Locked',     color: '#52525b', ringColor: 'rgba(82,82,91,0.2)'     },
};

const MAP_QUALITY_TIP_DISMISS_KEY = 'vantage.map.qualityTip.dismissed';

/* ═══════════════════════════════════════════════
   WORLD MAP - COMMAND CENTER REDESIGN
   ═══════════════════════════════════════════════ */
const WorldMap = () => {
  const navigate        = useNavigate();
  const transformRef    = useRef(null);
  const mapContainerRef = useRef(null);
  const popupAnchorRafRef = useRef(null);

  const [selectedProblem, setSelectedProblem]             = useState(null);
  const [selectedCountryAnchor, setSelectedCountryAnchor] = useState(null);
  const [popupDisplayAnchor, setPopupDisplayAnchor]       = useState(null);
  const [tooltip, setTooltip]                             = useState({ visible: false, x: 0, y: 0, content: '' });
  const [currentPositionMarker, setCurrentPositionMarker] = useState(null);
  const [isHighRes, setIsHighRes]                         = useState(false);
  const [stagesOpen, setStagesOpen]                       = useState(false);
  const [hudCollapsed, setHudCollapsed]                   = useState(false);
  const [showQualityTip, setShowQualityTip]               = useState(false);
  const [dontShowQualityTipAgain, setDontShowQualityTipAgain] = useState(false);
  const [storyContent, setStoryContent]                   = useState({ loading: false, story: null, description: null });

  const toggleResolution = useCallback(() => setIsHighRes(p => !p), []);

  const dismissQualityTip = useCallback(() => {
    if (dontShowQualityTipAgain) {
      try {
        localStorage.setItem(MAP_QUALITY_TIP_DISMISS_KEY, '1');
      } catch { /* ignore localStorage errors */ }
    }
    setShowQualityTip(false);
  }, [dontShowQualityTipAgain]);

  /* ── store ── */
  const completedProblems        = useProgressStore(s => s.completedProblems);
  const getProblemState          = useProgressStore(s => s.getProblemState);
  const getCurrentRoadmapProblem = useProgressStore(s => s.getCurrentRoadmapProblem);
  const getRoadmapIndex          = useProgressStore(s => s.getRoadmapIndex);
  const getStageProgress         = useProgressStore(s => s.getStageProgress);
  const getTotalProgress         = useProgressStore(s => s.getTotalProgress);
  const loadProgress             = useProgressStore(s => s.loadProgress);
  const subscribeToLiveUpdates   = useProgressStore(s => s.subscribeToLiveUpdates);
  const user                     = useUserStore(s => s.user);

  useEffect(() => {
    let sseCleanup;
    async function init() {
      try {
        if (!user?.uid) return;
        const res = await fetch(buildApiUrl(`/users/${user.uid}`));
        if (!res.ok) return;
        loadProgress(user.uid);
        sseCleanup = subscribeToLiveUpdates(user.uid);
      } catch { /* silent */ }
    }
    init();
    return () => sseCleanup?.();
  }, [user?.uid, loadProgress, subscribeToLiveUpdates]);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(MAP_QUALITY_TIP_DISMISS_KEY) === '1';
      if (!dismissed) setShowQualityTip(true);
    } catch {
      setShowQualityTip(true);
    }
  }, []);

  /* ── country helpers (ALL UNCHANGED) ── */
  const getCountryId = useCallback((path) => {
    const id = path.getAttribute('id');
    if (id && id.length >= 2 && id.length <= 3) return id;
    const originalClass = path.dataset.originalClass;
    if (originalClass && COUNTRY_NAME_TO_CODE[originalClass]) return COUNTRY_NAME_TO_CODE[originalClass];
    const className = path.getAttribute('class');
    if (className && COUNTRY_NAME_TO_CODE[className]) return COUNTRY_NAME_TO_CODE[className];
    const name = path.getAttribute('name');
    if (name && COUNTRY_NAME_TO_CODE[name]) return COUNTRY_NAME_TO_CODE[name];
    return id || className || null;
  }, []);

  const getCountryCenter = useCallback((countryId) => {
    const svg = mapContainerRef.current?.querySelector('svg');
    if (!svg) return null;
    const paths      = svg.querySelectorAll('path');
    let element      = null;
    const countryName = CODE_TO_COUNTRY_NAME[countryId];
    for (const path of paths) {
      const pathId = path.getAttribute('id');
      if (pathId === countryId) { element = path; break; }
      const oc = path.dataset.originalClass || path.getAttribute('class');
      if (oc) {
        if (countryName && oc === countryName) { element = path; break; }
        if (COUNTRY_NAME_TO_CODE[oc] === countryId) { element = path; break; }
      }
    }
    if (!element) return null;
    const viewBox = svg.viewBox.baseVal;
    const svgRect = svg.getBoundingClientRect();
    const bbox    = element.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;
    return { x: cx * (svgRect.width / viewBox.width), y: cy * (svgRect.height / viewBox.height), svgX: cx, svgY: cy };
  }, []);

  const getPopupAnchorForCountry = useCallback((countryId) => {
    const svg = mapContainerRef.current?.querySelector('svg');
    if (!svg) return null;
    let el = null;
    const countryName = CODE_TO_COUNTRY_NAME[countryId];
    for (const p of svg.querySelectorAll('path')) {
      if (p.getAttribute('id') === countryId) { el = p; break; }
      const pc = p.getAttribute('class');
      if (pc && (pc === countryName || COUNTRY_NAME_TO_CODE[pc] === countryId)) { el = p; break; }
    }
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    return {
      x,
      y,
      side: x > window.innerWidth * 0.68 ? 'left' : 'right',
      placeAbove: y > window.innerHeight * 0.72,
    };
  }, []);

  const refreshSelectedPopupAnchor = useCallback(() => {
    if (!selectedProblem?.countryId) return;
    const nextAnchor = getPopupAnchorForCountry(selectedProblem.countryId);
    if (!nextAnchor) return;
    setSelectedCountryAnchor(prev => {
      if (!prev) return nextAnchor;
      const changed =
        Math.abs(prev.x - nextAnchor.x) > 0.5 ||
        Math.abs(prev.y - nextAnchor.y) > 0.5 ||
        prev.side !== nextAnchor.side ||
        prev.placeAbove !== nextAnchor.placeAbove;
      return changed ? nextAnchor : prev;
    });
  }, [selectedProblem?.countryId, getPopupAnchorForCountry]);

  const schedulePopupAnchorRefresh = useCallback(() => {
    if (!selectedProblem?.countryId) return;
    if (popupAnchorRafRef.current) return;
    popupAnchorRafRef.current = requestAnimationFrame(() => {
      popupAnchorRafRef.current = null;
      refreshSelectedPopupAnchor();
    });
  }, [selectedProblem?.countryId, refreshSelectedPopupAnchor]);

  const updatePositionMarker = useCallback(() => {
    const cur = getCurrentRoadmapProblem();
    if (!cur) { setCurrentPositionMarker(null); return; }
    const cid = getCountryForProblem(cur.id);
    if (!cid) { setCurrentPositionMarker(null); return; }
    const coords = getCountryCenter(cid);
    if (!coords) { setCurrentPositionMarker(null); return; }
    setCurrentPositionMarker({ x: coords.svgX, y: coords.svgY, problem: cur, countryId: cid });
  }, [getCurrentRoadmapProblem, getCountryCenter]);

  /* ── SVG class painter - COMPLETELY UNCHANGED ── */
  const applyCountryStyles = useCallback(() => {
    const svg = mapContainerRef.current?.querySelector('svg');
    if (!svg) return;
    svg.querySelectorAll('path').forEach((path) => {
      if (!path.dataset.originalClass) {
        const oc = path.getAttribute('class');
        if (oc) path.dataset.originalClass = oc;
      }
      const countryId = getCountryId(path);
      if (!countryId) return;
      const problem = getProblemForCountry(countryId);
      path.classList.remove('country-completed', 'country-current', 'country-available', 'country-locked', 'country-placeholder');
      if (!problem) { path.classList.add('country-placeholder'); return; }
      const state = getProblemState(problem.id);
      path.style.setProperty('--topic-color', STAGES[problem.stage]?.color || '#6366f1');
      path.classList.add(`country-${state}`);
    });
  }, [getCountryId, getProblemState, completedProblems]);

  useEffect(() => { applyCountryStyles(); const t = setTimeout(applyCountryStyles, 100); return () => clearTimeout(t); }, [applyCountryStyles]);
  useEffect(() => { updatePositionMarker(); }, [completedProblems, updatePositionMarker]);
  useEffect(() => {
    if (!selectedProblem?.countryId) return;
    refreshSelectedPopupAnchor();
    const onResize = () => schedulePopupAnchorRefresh();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [selectedProblem?.countryId, refreshSelectedPopupAnchor, schedulePopupAnchorRefresh]);

  useEffect(() => () => {
    if (popupAnchorRafRef.current) cancelAnimationFrame(popupAnchorRafRef.current);
  }, []);

  useEffect(() => {
    if (!selectedCountryAnchor) {
      setPopupDisplayAnchor(null);
      return;
    }

    setPopupDisplayAnchor(prev => prev || selectedCountryAnchor);

    let rafId;
    const lerp = 0.22;

    const animate = () => {
      setPopupDisplayAnchor(prev => {
        const current = prev || selectedCountryAnchor;
        const target = selectedCountryAnchor;
        const nx = current.x + (target.x - current.x) * lerp;
        const ny = current.y + (target.y - current.y) * lerp;
        const done = Math.abs(target.x - nx) < 0.4 && Math.abs(target.y - ny) < 0.4;

        if (done) return target;
        return { ...target, x: nx, y: ny };
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [selectedCountryAnchor]);

  useEffect(() => {
    const check = () => {
      const svg = mapContainerRef.current?.querySelector('svg');
      if (svg && svg.querySelectorAll('path').length > 0) { applyCountryStyles(); updatePositionMarker(); return true; }
      return false;
    };
    if (check()) return;
    const ts = [100, 300, 500, 1000].map(d => setTimeout(check, d));
    return () => ts.forEach(clearTimeout);
  }, [applyCountryStyles, updatePositionMarker]);

  /* ── zoom helpers - UNCHANGED ── */
  const zoomToCountry = useCallback((countryId, scale = 4) => {
    if (!transformRef.current || !mapContainerRef.current) return;
    const svg = mapContainerRef.current.querySelector('svg');
    if (!svg) return;
    let el = null;
    const countryName = CODE_TO_COUNTRY_NAME[countryId];
    for (const p of svg.querySelectorAll('path')) {
      if (p.getAttribute('id') === countryId) { el = p; break; }
      const pc = p.getAttribute('class');
      if (pc && (pc === countryName || COUNTRY_NAME_TO_CODE[pc] === countryId)) { el = p; break; }
    }
    if (el) transformRef.current.zoomToElement(el, scale, 400, 'easeOut');
  }, []);

  const handleMapClick = useCallback((e) => {
    const path = e.target.closest('path');
    if (!path) return;
    const countryId = getCountryId(path);
    if (!countryId) return;
    const problem = getProblemForCountry(countryId);
    if (!problem) {
      setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: 'No problem mapped here' });
      setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 2000);
      return;
    }
    const state = getProblemState(problem.id);
    if (state === 'locked') {
      setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: 'Complete previous problems first' });
      setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 2000);
      return;
    }
    setSelectedProblem({ ...problem, state, countryId });
    setSelectedCountryAnchor(getPopupAnchorForCountry(countryId));
    setHudCollapsed(true);
    zoomToCountry(countryId, 5);
    setTimeout(() => setSelectedCountryAnchor(getPopupAnchorForCountry(countryId)), 420);
    setStagesOpen(false);
  }, [getCountryId, getProblemState, getPopupAnchorForCountry, zoomToCountry]);

  const goToJudge    = useCallback(() => { if (selectedProblem?.judgeId)  navigate(`/problem/${selectedProblem.judgeId}`); }, [selectedProblem, navigate]);
  const goToProblem  = useCallback(() => { if (selectedProblem)           navigate(selectedProblem.route); }, [selectedProblem, navigate]);
  const goToLeetCode = useCallback(() => {
    if (selectedProblem?.lcSlug) window.open(`https://leetcode.com/problems/${selectedProblem.lcSlug}`, '_blank', 'noopener,noreferrer');
  }, [selectedProblem]);

  const resetZoom            = useCallback(() => transformRef.current?.resetTransform(500, 'easeOut'), []);
  const jumpToCurrentProblem = useCallback(() => {
    const cur = getCurrentRoadmapProblem();
    if (!cur) return;
    const cid = getCountryForProblem(cur.id);
    if (cid) zoomToCountry(cid, 5);
  }, [getCurrentRoadmapProblem, zoomToCountry]);

  /* ── derived ── */
  const totalProgress         = getTotalProgress();
  const roadmapIndex          = getRoadmapIndex();
  const currentRoadmapProblem = getCurrentRoadmapProblem();
  const pct = totalProgress.percentage;

  /* ─── Scan stages for a summary ─── */
  const stagesSummary = STAGE_ORDER.slice(0, 4).map(key => ({
    key,
    stage: STAGES[key],
    prog: getStageProgress(key),
  }));

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */
  return (
    <div
      className={cn('skill-tree-wrapper relative w-full h-screen overflow-hidden', isHighRes && 'high-res-mode')}
      style={{ background: '#07070a' }}
    >

      {/* ── Scanline / grain overlay ── */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '256px' }}
      />

      {/* ── Grid overlay ── */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, white 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, white 30%, transparent 100%)',
        }}
      />

      {/* ══════════ MAP CANVAS - full bleed ══════════ */}
      <TransformWrapper
        ref={transformRef}
        initialScale={1} minScale={0.5} maxScale={10}
        limitToBounds={false} centerOnInit
        wheel={{ step: 0.08, smoothStep: 0.004 }}
        panning={{ velocityDisabled: true }}
        doubleClick={{ disabled: true }}
        alignmentAnimation={{ disabled: true }}
        velocityAnimation={{ disabled: true }}
        onTransformed={schedulePopupAnchorRefresh}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          <div ref={mapContainerRef} className="map-container relative z-[1]" onClick={handleMapClick}>
            <Map className="world-svg" />
            {currentPositionMarker && (
              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
                viewBox="0 0 2000 857" preserveAspectRatio="xMidYMid meet"
              >
                <circle cx={currentPositionMarker.x} cy={currentPositionMarker.y} r="12" fill="rgba(237,255,102,0.22)" className="pulse-ring" />
                <circle cx={currentPositionMarker.x} cy={currentPositionMarker.y} r="5" fill="#EDFF66" stroke="#3d2fff" strokeWidth="2" />
              </svg>
            )}

          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* ══════════ LEFT SIDEBAR - vertical command strip ══════════ */}
      <aside
        className="absolute top-0 left-0 h-full w-[60px] z-[100] flex flex-col items-center justify-between py-4"
        style={{ background: 'linear-gradient(180deg, rgba(7,7,10,0.97) 0%, rgba(7,7,10,0.85) 100%)', borderRight: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
      >
        {/* Top group */}
        <div className="flex flex-col items-center gap-3">
          {/* Back */}
          <button
            onClick={() => navigate('/')}
            title="Back"
            className="wm-sidebar-btn"
          >
            <ArrowLeft size={15} />
          </button>

          {/* Divider */}
          <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

          {/* Zoom in */}
          <button onClick={() => transformRef.current?.zoomIn()} title="Zoom in" className="wm-sidebar-btn">
            <ZoomIn size={15} />
          </button>

          {/* Reset */}
          <button onClick={resetZoom} title="Reset view" className="wm-sidebar-btn">
            <Target size={15} />
          </button>

          {/* Zoom out */}
          <button onClick={() => transformRef.current?.zoomOut()} title="Zoom out" className="wm-sidebar-btn">
            <ZoomOut size={15} />
          </button>

          {/* Divider */}
          <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

          {/* Jump to current */}
          <button
            onClick={jumpToCurrentProblem}
            title="Jump to current problem"
            className="wm-sidebar-btn wm-sidebar-btn--accent"
          >
            <MapPin size={15} />
          </button>

          {/* Stages */}
          <button
            onClick={() => { setStagesOpen(o => !o); }}
            title="Stages"
            className={cn('wm-sidebar-btn', stagesOpen && 'wm-sidebar-btn--active')}
          >
            <Layers size={15} />
          </button>
        </div>

        {/* Bottom group */}
        <div className="flex flex-col items-center gap-3">
          {/* HD toggle */}
          <button
            onClick={toggleResolution}
            title={isHighRes ? 'Switch to SD' : 'Switch to HD'}
            className="wm-sidebar-btn wm-sidebar-btn--text"
            style={{ background: '#EDFF66', borderColor: 'rgba(237,255,102,0.75)' }}
          >
            <span className="text-[9px] font-black tracking-widest" style={{ color: '#111217' }}>{isHighRes ? 'HD' : 'SD'}</span>
          </button>
        </div>
      </aside>

      {/* ══════════ TOP-RIGHT HUD ══════════ */}
      <div
        className="absolute top-4 right-4 z-[100]"
        style={{ width: '220px' }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(7,7,10,0.92)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          {/* HUD header */}
          <button
            onClick={() => setHudCollapsed(c => !c)}
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ borderBottom: hudCollapsed ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-2">
              <div className="wm-hud-dot" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Conquest HUD
              </span>
            </div>
            {hudCollapsed
              ? <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
              : <ChevronUp   size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
            }
          </button>

          {!hudCollapsed && (
            <div className="px-4 pb-4 pt-3 space-y-4">
              {/* Big progress number */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black tabular-nums text-white leading-none">{pct}<span className="text-base" style={{ color: 'rgba(255,255,255,0.3)' }}>%</span></p>
                  <p className="text-[10px] mt-1 tabular-nums" style={{ color: 'rgba(255,255,255,0.3)' }}>{totalProgress.completed} / {totalProgress.total}</p>
                </div>
                {/* Mini arc progress */}
                <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle cx="22" cy="22" r="17" fill="none"
                    stroke="url(#hud-grad)" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 17}`}
                    strokeDashoffset={`${2 * Math.PI * 17 * (1 - pct / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                  <defs>
                    <linearGradient id="hud-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#EDFF66" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* XP bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Progress</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #EDFF66)', boxShadow: '0 0 8px rgba(237,255,102,0.3)' }} />
                </div>
              </div>

              {/* Active next problem */}
              {currentRoadmapProblem && (
                <button
                  onClick={jumpToCurrentProblem}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group"
                  style={{ background: 'rgba(237,255,102,0.05)', border: '1px solid rgba(237,255,102,0.12)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(237,255,102,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(237,255,102,0.12)'}
                >
                  <MapPin size={11} style={{ color: '#EDFF66', marginTop: 1, flexShrink: 0 }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(237,255,102,0.6)' }}>Next target</p>
                    <p className="text-[11px] font-bold text-white truncate mt-0.5">{currentRoadmapProblem.title}</p>
                  </div>
                  <ChevronRight size={11} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: 2 }} />
                </button>
              )}

              {/* Stage mini-bars */}
              <div className="space-y-2">
                {stagesSummary.map(({ key, stage, prog }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-[9px] truncate flex-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{stage.name}</span>
                    <div className="w-16 h-0.5 rounded-full overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${prog.percentage}%`, backgroundColor: prog.isComplete ? stage.color : 'rgba(255,255,255,0.2)' }} />
                    </div>
                    <span className="text-[9px] tabular-nums shrink-0 font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{prog.completed}/{prog.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ QUALITY TIP ══════════ */}
      {showQualityTip && (
        <div
          className="absolute z-[130]"
          style={{ left: 76, bottom: 16, maxWidth: 340 }}
        >
          <div
            style={{
              background: 'rgba(7,7,10,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: '12px 12px 10px',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(237,255,102,0.85)', marginBottom: 5 }}>
                  Quick tip
                </div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: 'rgba(255,255,255,0.78)' }}>
                  Click the <strong style={{ color: '#EDFF66' }}>HD/SD</strong> button on the left sidebar to switch map quality.
                </p>
              </div>
              <button
                onClick={dismissQualityTip}
                aria-label="Close quality tip"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={12} />
              </button>
            </div>

            <label style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.62)', userSelect: 'none', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dontShowQualityTipAgain}
                onChange={(e) => setDontShowQualityTipAgain(e.target.checked)}
                style={{ accentColor: '#EDFF66' }}
              />
              Don't show again
            </label>
          </div>
        </div>
      )}

      {/* ══════════ STAGES MODAL ══════════ */}
      {stagesOpen && (
        <div className="fixed inset-0 z-[500] grid place-items-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setStagesOpen(false)}>
          <div className="w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.25)' }}>Conquest Map</p>
                <h3 className="text-sm font-black text-white mt-0.5">All Stages</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.25)' }}>{totalProgress.completed}/{totalProgress.total} total</span>
                <button onClick={() => setStagesOpen(false)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <ScrollArea className="max-h-[56vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pr-3">
                {STAGE_ORDER.map((key) => {
                  const stage = STAGES[key];
                  const prog  = getStageProgress(key);
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        const problems = getProblemsByStage(key);
                        if (problems.length) {
                          const cid = getCountryForProblem(problems[0].id);
                          if (cid) zoomToCountry(cid, 3);
                        }
                        setStagesOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                      style={{
                        background: prog.isComplete ? 'rgba(196,181,253,0.07)' : 'rgba(255,255,255,0.03)',
                        border: prog.isComplete ? '1px solid rgba(196,181,253,0.2)' : '1px solid rgba(255,255,255,0.07)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = prog.isComplete ? 'rgba(196,181,253,0.35)' : 'rgba(255,255,255,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = prog.isComplete ? 'rgba(196,181,253,0.2)' : 'rgba(255,255,255,0.07)'}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                      <span className="flex-1 truncate text-[11px] font-bold" style={{ color: prog.isComplete ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}>
                        {stage.name}
                      </span>
                      <span className="text-[9px] font-black tabular-nums shrink-0" style={{ color: prog.isComplete ? '#c4b5fd' : 'rgba(255,255,255,0.25)' }}>
                        {prog.completed}/{prog.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* ══════════ COUNTRY POPUP ══════════ */}
      {selectedProblem && selectedCountryAnchor && popupDisplayAnchor && (() => {
        const cfg       = STATUS_CFG[selectedProblem.state] || STATUS_CFG.locked;
        const CfgIcon   = cfg.icon;
        const stageInfo = STAGES[selectedProblem.stage];
        const isDone    = selectedProblem.state === 'completed';

        return (
          <div
            className="fixed z-[220] w-[320px] max-w-[calc(100vw-24px)] rounded-2xl overflow-hidden"
            style={{
              left: `${popupDisplayAnchor.x}px`,
              top: `${popupDisplayAnchor.y}px`,
              transform: `translate(${selectedCountryAnchor.side === 'right' ? '18px' : 'calc(-100% - 18px)'}, ${selectedCountryAnchor.placeAbove ? 'calc(-100% - 14px)' : '-20px'})`,
              background: 'rgba(7,7,10,0.92)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
            }}
          >
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stageInfo?.color }} />
                <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{stageInfo?.name}</span>
                <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                  style={{ background: cfg.ringColor, border: `1px solid ${cfg.ringColor}` }}>
                  <CfgIcon size={9} style={{ color: cfg.color }} />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
                <button
                  onClick={() => { setSelectedProblem(null); setSelectedCountryAnchor(null); }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center ml-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
                >
                  <X size={12} />
                </button>
              </div>

              <h3 className="text-sm font-black text-white leading-tight">{selectedProblem.title}</h3>

              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}>
                  #{selectedProblem.order}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}>
                  Map #{FULL_ROADMAP.findIndex(p => p.id === selectedProblem.id) + 1}
                </span>
                {selectedProblem.lcNumber && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(237,255,102,0.08)', border: '1px solid rgba(237,255,102,0.18)', color: '#EDFF66' }}>LC #{selectedProblem.lcNumber}</span>
                )}
              </div>
            </div>

            <div className="px-4 py-3 space-y-2.5">
              {selectedProblem.judgeId && (
                <button onClick={goToJudge}
                  className="w-full h-9 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #c7d93f, #EDFF66)', color: '#111217' }}>
                  <Code2 size={13} /> {isDone ? 'Solve Again' : 'Solve It'}
                </button>
              )}

              {selectedProblem.lcSlug && (
                <button onClick={goToLeetCode}
                  className="w-full h-9 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: 'rgba(237,255,102,0.08)', border: '1px solid rgba(237,255,102,0.25)', color: '#EDFF66' }}>
                  <ExternalLink size={13} /> LeetCode
                </button>
              )}

              {selectedProblem.hasVisualizer && (
                <button onClick={goToProblem}
                  className="w-full h-9 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff' }}>
                  <Play size={13} /> {isDone ? 'Review' : 'Visualize'}
                </button>
              )}

              {!selectedProblem.judgeId && !selectedProblem.lcSlug && !selectedProblem.hasVisualizer && (
                <div className="px-3 py-2 rounded-xl text-[10px] font-bold text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                  Content coming soon
                </div>
              )}

              {isDone && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(237,255,102,0.05)', border: '1px solid rgba(237,255,102,0.1)' }}>
                  <Trophy size={11} style={{ color: '#EDFF66' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'rgba(237,255,102,0.75)' }}>Challenge conquered!</span>
                </div>
              )}
            </div>

            <ScrollArea className="max-h-[200px] px-4">
              <div className="py-3 text-sm text-zinc-400 leading-relaxed story-panel">
                {storyContent.loading && (
                  <p className="italic text-zinc-500">Loading story...</p>
                )}
                {storyContent.story && (
                  <p className="mb-3 italic">{storyContent.story}</p>
                )}
                {storyContent.description && (
                  <p>{storyContent.description}</p>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })()}

      {/* ══════════ TOOLTIP ══════════ */}
      {tooltip.visible && (
        <div
          className="fixed z-[1000] px-3 py-1.5 rounded-xl text-[11px] font-bold pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14, background: 'rgba(9,9,12,0.97)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
        >
          {tooltip.content}
        </div>
      )}

    </div>
  );
};

export default WorldMap;