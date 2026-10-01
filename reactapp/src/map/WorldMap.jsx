import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft, ZoomIn, ZoomOut, Target, MapPin, Layers,
  ChevronDown, ChevronRight, Code2, Play, ExternalLink, X,
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

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  ErrorState,
  IconButton,
  OfflineState,
  Panel,
  Progress,
  Stat,
  Tooltip,
} from '@/components/ds';
import { cn } from '@/lib/utils';
import { buildApiUrl } from '@/services/realtimeUrls';
import useUserStore from '@/stores/useUserStore';
import './WorldMap.css';

/* ─── status vocabulary (matches the legend) ─── */
const STATUS_CFG = {
  completed: { label: 'Completed', tone: 'outline', className: 'border-accent-ink text-accent-ink' },
  current:   { label: 'Current',   tone: 'accent' },
  available: { label: 'Available', tone: 'outline' },
  locked:    { label: 'Locked',    tone: 'neutral' },
};

const LEGEND = [
  { state: 'locked',    label: 'Locked' },
  { state: 'available', label: 'Available' },
  { state: 'current',   label: 'Current' },
  { state: 'completed', label: 'Completed' },
];

const LABEL = 'font-mono text-label uppercase';
const MICRO = 'font-mono text-micro uppercase tabular-nums';

/* HD keeps every path un-contained (crisper, heavier to pan). Pick it on a
   fine pointer with plenty of cores; the HD/SD button still overrides. */
const prefersHighRes = () => {
  try {
    return window.matchMedia('(pointer: fine)').matches && (navigator.hardwareConcurrency || 4) >= 8;
  } catch {
    return false;
  }
};

const isPhone = () => {
  try {
    return window.matchMedia('(max-width: 767px)').matches;
  } catch {
    return false;
  }
};

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/* Square 44px tool-rail button with a tooltip (the label is also the
   accessible name, so the native title is suppressed). */
function RailButton({ label, ...props }) {
  return (
    <Tooltip content={label} side="right">
      <IconButton size="lg" aria-label={label} title="" {...props} />
    </Tooltip>
  );
}

function StatusBadge({ state, className }) {
  const cfg = STATUS_CFG[state] || STATUS_CFG.locked;
  return (
    <Badge tone={cfg.tone} className={cn(cfg.className, className)}>
      {cfg.label}
    </Badge>
  );
}

/* ═══════════════════════════════════════════════
   WORLD MAP
   ═══════════════════════════════════════════════ */
const WorldMap = () => {
  const navigate        = useNavigate();
  const transformRef    = useRef(null);
  const mapContainerRef = useRef(null);
  const popupAnchorRafRef = useRef(null);
  const popupDisplayRef   = useRef(null);
  const tipTimerRef       = useRef(null);
  const anchorTimerRef    = useRef(null);
  const hoverTipRef       = useRef(null);
  const hoverPathRef      = useRef(null);

  const [selectedProblem, setSelectedProblem]             = useState(null);
  const [selectedCountryAnchor, setSelectedCountryAnchor] = useState(null);
  const [popupDisplayAnchor, setPopupDisplayAnchor]       = useState(null);
  const [tooltip, setTooltip]                             = useState({ visible: false, x: 0, y: 0, content: '' });
  const [hover, setHover]                                 = useState(null);
  const [currentPositionMarker, setCurrentPositionMarker] = useState(null);
  const [isHighRes, setIsHighRes]                         = useState(prefersHighRes);
  const [stagesOpen, setStagesOpen]                       = useState(false);
  const [hudCollapsed, setHudCollapsed]                   = useState(isPhone);
  const [storyContent, setStoryContent]                   = useState({ loading: false, story: null, description: null });
  const [syncError, setSyncError]                         = useState(null); // null | 'offline' | 'error'
  const [retryKey, setRetryKey]                           = useState(0);

  const toggleResolution = useCallback(() => setIsHighRes(p => !p), []);

  /* ── store ── */
  const completedProblems        = useProgressStore(s => s.completedProblems);
  const isLoading                = useProgressStore(s => s.isLoading);
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
        if (!res.ok) { setSyncError('error'); return; }
        setSyncError(null);
        loadProgress(user.uid);
        sseCleanup = subscribeToLiveUpdates(user.uid);
      } catch { setSyncError('offline'); }
    }
    init();
    return () => sseCleanup?.();
  }, [user?.uid, loadProgress, subscribeToLiveUpdates, retryKey]);

  const retrySync = useCallback(() => setRetryKey(k => k + 1), []);

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

  /* ── SVG class painter (state classes only; colours live in WorldMap.css) ── */
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
      path.classList.add(`country-${state}`);
      path.style.setProperty('--topic-color', STAGES[problem.stage]?.color || 'var(--wm-stage-3)');
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
    clearTimeout(tipTimerRef.current);
    clearTimeout(anchorTimerRef.current);
  }, []);

  /* Popup follows its country with a short ease, then stops: the rAF loop
     ends once the popup has settled on the anchor. */
  useEffect(() => {
    if (!selectedCountryAnchor) {
      popupDisplayRef.current = null;
      setPopupDisplayAnchor(null);
      return;
    }

    const target = selectedCountryAnchor;
    if (!popupDisplayRef.current || prefersReducedMotion()) {
      popupDisplayRef.current = target;
      setPopupDisplayAnchor(target);
      return;
    }

    let rafId = 0;
    const lerp = 0.22;
    const step = () => {
      const current = popupDisplayRef.current || target;
      const nx = current.x + (target.x - current.x) * lerp;
      const ny = current.y + (target.y - current.y) * lerp;
      const done = Math.abs(target.x - nx) < 0.4 && Math.abs(target.y - ny) < 0.4;
      const next = done ? target : { ...target, x: nx, y: ny };
      popupDisplayRef.current = next;
      setPopupDisplayAnchor(next);
      if (!done) rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
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

  /* ── selected country outline (.country-selected) ── */
  const selectedCountryId = selectedProblem?.countryId || null;
  useEffect(() => {
    const svg = mapContainerRef.current?.querySelector('svg');
    if (!svg) return undefined;
    svg.querySelectorAll('path.country-selected').forEach(p => p.classList.remove('country-selected'));
    if (!selectedCountryId) return undefined;
    svg.querySelectorAll('path').forEach((p) => {
      if (getCountryId(p) === selectedCountryId) p.classList.add('country-selected');
    });
    return () => {
      svg.querySelectorAll('path.country-selected').forEach(p => p.classList.remove('country-selected'));
    };
  }, [selectedCountryId, getCountryId]);

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

  /* Transient click message; one timer at a time, cleared on unmount. */
  const showTip = useCallback((x, y, content) => {
    clearTimeout(tipTimerRef.current);
    setTooltip({ visible: true, x, y, content });
    tipTimerRef.current = setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 2000);
  }, []);

  const closePopup = useCallback(() => {
    setSelectedProblem(null);
    setSelectedCountryAnchor(null);
  }, []);

  const handleMapClick = useCallback((e) => {
    const path = e.target.closest('path');
    if (!path) return;
    const countryId = getCountryId(path);
    if (!countryId) return;
    const problem = getProblemForCountry(countryId);
    if (!problem) {
      showTip(e.clientX, e.clientY, 'No problem mapped here');
      return;
    }
    const state = getProblemState(problem.id);
    if (state === 'locked') {
      showTip(e.clientX, e.clientY, 'Complete previous problems first');
      return;
    }
    setSelectedProblem({ ...problem, state, countryId });
    setSelectedCountryAnchor(getPopupAnchorForCountry(countryId));
    setHudCollapsed(true);
    zoomToCountry(countryId, 5);
    clearTimeout(anchorTimerRef.current);
    anchorTimerRef.current = setTimeout(() => setSelectedCountryAnchor(getPopupAnchorForCountry(countryId)), 420);
    setStagesOpen(false);
  }, [getCountryId, getProblemState, getPopupAnchorForCountry, zoomToCountry, showTip]);

  /* ── hover tooltip (mouse only; position follows the pointer via a ref) ── */
  const handleMapPointerOver = useCallback((e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const path = e.target.closest?.('path') || null;
    if (path === hoverPathRef.current) return;
    hoverPathRef.current = path;
    if (!path) { setHover(null); return; }
    const countryId = getCountryId(path);
    if (!countryId) { setHover(null); return; }
    const name = CODE_TO_COUNTRY_NAME[countryId] || path.dataset.originalClass || path.getAttribute('name') || countryId;
    const problem = getProblemForCountry(countryId);
    setHover({
      x: e.clientX,
      y: e.clientY,
      name,
      title: problem?.title || null,
      state: problem ? getProblemState(problem.id) : null,
    });
  }, [getCountryId, getProblemState]);

  const handleMapPointerMove = useCallback((e) => {
    const el = hoverTipRef.current;
    if (el) el.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 16}px)`;
  }, []);

  const handleMapPointerLeave = useCallback(() => {
    hoverPathRef.current = null;
    setHover(null);
  }, []);

  /* Esc closes the country popup. */
  useEffect(() => {
    if (!selectedProblem) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !stagesOpen) closePopup(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedProblem, stagesOpen, closePopup]);

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
  const roadmapIndex          = getRoadmapIndex(); // eslint-disable-line no-unused-vars
  const currentRoadmapProblem = getCurrentRoadmapProblem();
  const pct = totalProgress.percentage;

  /* ─── Scan stages for a summary ─── */
  const stagesSummary = STAGE_ORDER.slice(0, 4).map(key => ({
    key,
    stage: STAGES[key],
    prog: getStageProgress(key),
  }));

  /* The SVG has ~1000 paths: keep the element stable so hover/HUD renders
     never reconcile it. */
  const mapSvg = useMemo(() => <Map className="world-svg" role="img" aria-label="World map. Each country is one problem on the roadmap." focusable="false" />, []);

  const hasStory = storyContent.loading || storyContent.story || storyContent.description;

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */
  return (
    <main
      id="main"
      className={cn('skill-tree-wrapper relative w-full overflow-hidden font-mono', isHighRes && 'high-res-mode')}
    >
      {/* ── Background grid ── */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <pattern id="wm-grid-pattern" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0H0V64" className="wm-grid-line" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wm-grid-pattern)" />
      </svg>

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
          <div
            ref={mapContainerRef}
            className="map-container relative"
            onClick={handleMapClick}
            onPointerOver={handleMapPointerOver}
            onPointerMove={handleMapPointerMove}
            onPointerLeave={handleMapPointerLeave}
          >
            {mapSvg}
            {currentPositionMarker && (
              <svg className="wm-marker" viewBox="0 0 2000 857" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <rect
                  className="wm-marker-ring"
                  x={currentPositionMarker.x - 12} y={currentPositionMarker.y - 12}
                  width="24" height="24"
                />
                <rect
                  className="wm-marker-core"
                  x={currentPositionMarker.x - 5} y={currentPositionMarker.y - 5}
                  width="10" height="10"
                />
              </svg>
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* ══════════ TOOL RAIL ══════════ */}
      <nav
        aria-label="Map tools"
        className="absolute left-0 top-0 z-raised flex max-h-[calc(100%-64px)] flex-col justify-between gap-2 overflow-y-auto border-b border-r border-border bg-surface p-2 md:bottom-0 md:max-h-none md:border-b-0"
      >
        <div className="flex flex-col gap-2">
          <RailButton icon={ArrowLeft} label="Back to home" onClick={() => navigate('/')} />
          <span aria-hidden="true" className="h-px w-full bg-border" />
          <RailButton icon={ZoomIn} label="Zoom in" onClick={() => transformRef.current?.zoomIn()} />
          <RailButton icon={Target} label="Reset view" onClick={resetZoom} />
          <RailButton icon={ZoomOut} label="Zoom out" onClick={() => transformRef.current?.zoomOut()} />
          <span aria-hidden="true" className="h-px w-full bg-border" />
          <RailButton icon={MapPin} label="Jump to current problem" onClick={jumpToCurrentProblem} />
          <RailButton
            icon={Layers}
            label="Stages"
            aria-haspopup="dialog"
            aria-expanded={stagesOpen}
            className={cn(stagesOpen && 'border-border-strong bg-elevated')}
            onClick={() => { setStagesOpen(o => !o); }}
          />
        </div>

        <Tooltip content={isHighRes ? 'Map quality: HD. Switch to SD' : 'Map quality: SD. Switch to HD'} side="right">
          <Button
            variant="ghost"
            size="lg"
            iconOnly
            aria-pressed={isHighRes}
            aria-label={isHighRes ? 'Map quality HD, switch to SD' : 'Map quality SD, switch to HD'}
            onClick={toggleResolution}
          >
            {isHighRes ? 'HD' : 'SD'}
          </Button>
        </Tooltip>
      </nav>

      {/* ══════════ HUD (top-right panel; bottom sheet on phones) ══════════ */}
      <section
        aria-labelledby="wm-title"
        className="absolute right-4 top-4 z-raised w-[288px] border border-border bg-surface text-fg max-md:inset-x-0 max-md:bottom-0 max-md:right-0 max-md:top-auto max-md:w-full max-md:border-x-0 max-md:border-b-0 max-md:border-border-strong"
      >
        <div className={cn('flex min-h-11 items-center gap-3 px-4 py-2', !hudCollapsed && 'border-b border-border')}>
          <h1 id="wm-title" className="font-display text-h2 uppercase text-fg" style={{ fontSynthesis: 'none' }}>
            Map
          </h1>
          {syncError ? <Badge tone="warn">{syncError === 'offline' ? 'Offline' : 'Not synced'}</Badge> : null}
          <span className="ml-auto font-mono text-small tabular-nums text-fg-muted">
            {totalProgress.completed}/{totalProgress.total}
          </span>
          <IconButton
            size="sm"
            aria-label={hudCollapsed ? 'Expand progress panel' : 'Collapse progress panel'}
            aria-expanded={!hudCollapsed}
            aria-controls="wm-hud-body"
            onClick={() => setHudCollapsed(c => !c)}
          >
            <ChevronDown aria-hidden="true" className={cn(hudCollapsed ? 'max-md:rotate-180' : 'md:rotate-180')} />
          </IconButton>
        </div>

        {!hudCollapsed && (
          <div id="wm-hud-body" className="grid min-w-0 grid-cols-[minmax(0,1fr)] max-h-[calc(100vh-96px)] gap-4 overflow-y-auto p-4 max-md:max-h-[55vh]">
            {syncError === 'offline' && (
              <OfflineState
                onRetry={retrySync}
                description="Progress isn't synced. The map still works; solved countries appear once the API is back."
                className="border-0 px-0 py-4"
              />
            )}
            {syncError === 'error' && (
              <ErrorState
                title="Couldn't load your progress"
                description="The API answered with an error, so solved countries aren't shown."
                onRetry={retrySync}
                className="border-0 px-0 py-4"
              />
            )}

            <div className="grid min-w-0 gap-2">
              <Stat label="Progress" value={`${pct}%`} hint={`${totalProgress.completed} of ${totalProgress.total} solved`} />
              <Progress value={isLoading ? undefined : pct} label={isLoading ? 'Loading progress' : 'Map progress'} />
            </div>

            {currentRoadmapProblem && (
              <Panel
                as="button"
                type="button"
                variant="interactive"
                padded={false}
                onClick={jumpToCurrentProblem}
                className="flex w-full min-w-0 items-center gap-3 px-3 py-2"
              >
                <MapPin size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-accent-ink" />
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className={cn(LABEL, 'text-accent-ink')}>Next target</span>
                  <span className="truncate text-small text-fg">{currentRoadmapProblem.title}</span>
                </span>
                <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-fg-dim" />
              </Panel>
            )}

            <div className="grid min-w-0 gap-2">
              <p className={cn(LABEL, 'text-fg-muted')}>Stages</p>
              <ul className="grid min-w-0 gap-2">
                {stagesSummary.map(({ key, stage, prog }) => (
                  <li key={key} className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className="wm-stage-dot shrink-0" style={{ '--topic-color': stage.color }} />
                    <span className="min-w-0 flex-1 truncate text-small text-fg-muted">{stage.name}</span>
                    <Progress value={prog.percentage} label={`${stage.name} progress`} className="w-12 shrink-0" />
                    <span className={cn(MICRO, 'w-10 shrink-0 text-right text-fg-dim')}>{prog.completed}/{prog.total}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid min-w-0 gap-2">
              <p className={cn(LABEL, 'text-fg-muted')}>Legend</p>
              <ul className="grid grid-cols-2 gap-2">
                {LEGEND.map(({ state, label }) => (
                  <li key={state} className="flex items-center gap-2 text-small text-fg-muted">
                    <span aria-hidden="true" className={cn('wm-swatch', `wm-swatch--${state}`)} />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ══════════ STAGES DIALOG ══════════ */}
      <Dialog open={stagesOpen} onOpenChange={setStagesOpen}>
        <DialogContent
          size="lg"
          title="Stages"
          description={`${totalProgress.completed} of ${totalProgress.total} problems solved`}
        >
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STAGE_ORDER.map((key) => {
              const stage = STAGES[key];
              const prog  = getStageProgress(key);
              return (
                <li key={key}>
                  <Panel
                    as="button"
                    type="button"
                    variant="interactive"
                    padded={false}
                    onClick={() => {
                      const problems = getProblemsByStage(key);
                      if (problems.length) {
                        const cid = getCountryForProblem(problems[0].id);
                        if (cid) zoomToCountry(cid, 3);
                      }
                      setStagesOpen(false);
                    }}
                    className={cn('grid w-full gap-2 px-3 py-2', prog.isComplete && 'border-accent-ink')}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="wm-stage-dot" style={{ '--topic-color': stage.color }} />
                      <span className={cn('min-w-0 flex-1 truncate text-small', prog.isComplete ? 'text-fg' : 'text-fg-muted')}>
                        {stage.name}
                      </span>
                      <span className={cn(MICRO, 'shrink-0', prog.isComplete ? 'text-accent-ink' : 'text-fg-dim')}>
                        {prog.completed}/{prog.total}
                      </span>
                    </span>
                    <Progress value={prog.percentage} label={`${stage.name} progress`} />
                  </Panel>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>

      {/* ══════════ COUNTRY POPUP ══════════ */}
      {selectedProblem && selectedCountryAnchor && popupDisplayAnchor && (() => {
        const stageInfo = STAGES[selectedProblem.stage];
        const isDone    = selectedProblem.state === 'completed';
        const hasSecondary = selectedProblem.hasVisualizer || selectedProblem.lcSlug;

        return (
          <Panel
            as="section"
            aria-labelledby="wm-popup-title"
            padded={false}
            className="wm-popup z-sticky border-border-strong"
            style={{
              '--wm-pop-x': `${popupDisplayAnchor.x}px`,
              '--wm-pop-y': `${popupDisplayAnchor.y}px`,
              '--wm-pop-tx': selectedCountryAnchor.side === 'right' ? '16px' : 'calc(-100% - 16px)',
              '--wm-pop-ty': selectedCountryAnchor.placeAbove ? 'calc(-100% - 16px)' : '-24px',
            }}
          >
            <div className="flex items-center gap-2 border-b border-border py-1 pl-4 pr-1">
              <span aria-hidden="true" className="wm-stage-dot" style={{ '--topic-color': stageInfo?.color }} />
              <span className={cn(LABEL, 'min-w-0 flex-1 truncate text-fg-muted')}>{stageInfo?.name}</span>
              <StatusBadge state={selectedProblem.state} className="shrink-0" />
              <IconButton icon={X} size="md" aria-label="Close" onClick={closePopup} />
            </div>

            <div className="grid gap-4 p-4">
              <div className="grid gap-2">
                <h2 id="wm-popup-title" className="font-mono text-h3 text-fg">{selectedProblem.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">#{selectedProblem.order}</Badge>
                  <Badge tone="neutral">Map #{FULL_ROADMAP.findIndex(p => p.id === selectedProblem.id) + 1}</Badge>
                  {selectedProblem.lcNumber && <Badge tone="outline">LC #{selectedProblem.lcNumber}</Badge>}
                </div>
              </div>

              {(selectedProblem.judgeId || hasSecondary) && (
                <div className="grid gap-2">
                  {selectedProblem.judgeId && (
                    <Button variant="primary" className="w-full" onClick={goToJudge}>
                      <Code2 aria-hidden="true" /> {isDone ? 'Solve again' : 'Solve'}
                    </Button>
                  )}
                  {hasSecondary && (
                    <div className="flex gap-2">
                      {selectedProblem.hasVisualizer && (
                        <Button variant="secondary" className="flex-1" onClick={goToProblem}>
                          <Play aria-hidden="true" /> {isDone ? 'Review' : 'Visualize'}
                        </Button>
                      )}
                      {selectedProblem.lcSlug && (
                        <Button variant="ghost" className="flex-1" onClick={goToLeetCode}>
                          <ExternalLink aria-hidden="true" /> LeetCode
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {hasStory && (
                <div className="story-panel grid max-h-[200px] gap-3 overflow-y-auto border-t border-border pt-4 text-body text-fg-muted">
                  {storyContent.loading && <p className="text-fg-dim">Loading story</p>}
                  {storyContent.story && <p>{storyContent.story}</p>}
                  {storyContent.description && <p>{storyContent.description}</p>}
                </div>
              )}
            </div>
          </Panel>
        );
      })()}

      {/* ══════════ HOVER TOOLTIP ══════════ */}
      {hover && !tooltip.visible && (
        <div
          ref={hoverTipRef}
          role="presentation"
          className="pointer-events-none fixed left-0 top-0 z-tooltip grid max-w-xs gap-1 bg-fg px-2 py-1 text-bg"
          style={{ transform: `translate(${hover.x + 16}px, ${hover.y + 16}px)` }}
        >
          <span className={MICRO}>{hover.name}</span>
          {hover.title ? (
            <span className="text-small">
              {hover.title}
              <span className={cn(MICRO, 'ml-2')}>{(STATUS_CFG[hover.state] || STATUS_CFG.locked).label}</span>
            </span>
          ) : (
            <span className="text-small">No problem mapped</span>
          )}
        </div>
      )}

      {/* ══════════ CLICK MESSAGE ══════════ */}
      {tooltip.visible && (
        <div
          role="status"
          className="pointer-events-none fixed z-tooltip bg-fg px-2 py-1 text-small text-bg"
          style={{ left: tooltip.x + 16, top: tooltip.y + 16 }}
        >
          {tooltip.content}
        </div>
      )}
    </main>
  );
};

export default WorldMap;
