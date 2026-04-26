"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";

export interface Slide {
  id: number;
  content: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  SVG UML Activity Diagram renderer                                  */
/*  Renders proper UML 2.x activity diagram elements:                  */
/*  - Filled circle = initial node                                     */
/*  - Bullseye = activity final node                                   */
/*  - Rounded rectangle = action / activity                            */
/*  - Diamond = decision / guard                                       */
/*  - Cylinder = datastore                                             */
/*  - Dog-ear rectangle = note                                         */
/*  - Solid arrow with filled arrowhead = control flow                 */
/*  - Dashed line = dependency / note anchor                           */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#f7efe6",
  fg: "#2b241e",
  primary: "#a44e3b",
  card: "#fffaf4",
  accent: "#d9e7d3",
  secondary: "#dcedf2",
  muted: "#675c50",
  border: "#d8cabe",
  gold: "#c98c3e",
};

type ActivityStep =
  | { type: "action"; label: string }
  | { type: "action-bold"; label: string }
  | { type: "decision"; label: string }
  | { type: "datastore"; label: string; actionLabel: string }
  | { type: "note"; actionLabel: string; noteText: string };

function ActivityDiagram({
  steps,
  width = 720,
}: {
  steps: ActivityStep[];
  width?: number;
}) {
  const actionW = 420;
  const actionH = 38;
  const actionR = 12; // UML rounded corners
  const arrowLen = 30;
  const decisionSize = 28;
  const startR = 9;
  const endOuterR = 13;
  const endInnerR = 8;
  const dsW = 64;
  const dsH = 38;
  const noteW = 110;
  const noteH = 36;
  const cx = width / 2;

  // layout pass
  let y = 30;
  const positions: { y: number; h: number }[] = [];

  // start node
  const startY = y;
  y += startR * 2 + arrowLen;

  for (const step of steps) {
    const posY = y;
    if (step.type === "decision") {
      positions.push({ y: posY, h: decisionSize * 2 });
      y += decisionSize * 2 + arrowLen;
    } else {
      positions.push({ y: posY, h: actionH });
      y += actionH + arrowLen;
    }
  }

  // end node
  const endY = y;
  y += endOuterR * 2 + 20;
  const totalH = y;

  const els: ReactNode[] = [];

  // defs: arrowhead marker
  els.push(
    <defs key="defs">
      <marker id="ah" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill={C.fg} />
      </marker>
    </defs>
  );

  // --- Initial node (UML filled circle) ---
  els.push(<circle key="start" cx={cx} cy={startY + startR} r={startR} fill={C.fg} />);
  // arrow from start to first step
  const firstStepY = positions[0]?.y ?? endY;
  els.push(
    <line key="start-arr" x1={cx} y1={startY + startR * 2} x2={cx} y2={firstStepY}
      stroke={C.fg} strokeWidth={1.5} markerEnd="url(#ah)" />
  );

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const pos = positions[i];
    const nextY = i < steps.length - 1 ? positions[i + 1].y : endY;
    const k = `s${i}`;

    if (step.type === "action" || step.type === "action-bold") {
      const bold = step.type === "action-bold";
      els.push(
        <text key={`${k}-t`} x={cx} y={pos.y + actionH / 2 + 5}
          textAnchor="middle" fontSize={13} fontWeight={bold ? 700 : 400}
          fill={bold ? C.primary : C.fg} fontFamily="Inter, system-ui, sans-serif">
          {step.label}
        </text>
      );
      // arrow to next
      els.push(
        <line key={`${k}-a`} x1={cx} y1={pos.y + actionH} x2={cx} y2={nextY}
          stroke={C.fg} strokeWidth={1.5} markerEnd="url(#ah)" />
      );

    } else if (step.type === "decision") {
      // UML decision diamond
      const dcy = pos.y + decisionSize;
      els.push(
        <polygon key={`${k}-d`}
          points={`${cx},${pos.y} ${cx + decisionSize},${dcy} ${cx},${pos.y + decisionSize * 2} ${cx - decisionSize},${dcy}`}
          fill={C.card} stroke={C.fg} strokeWidth={1.5} />
      );
      els.push(
        <text key={`${k}-t`} x={cx + decisionSize + 8} y={dcy + 4}
          textAnchor="start" fontSize={11} fill={C.muted}
          fontFamily="Inter, system-ui, sans-serif" fontStyle="italic">
          [{step.label}]
        </text>
      );
      // arrow down from diamond
      els.push(
        <line key={`${k}-a`} x1={cx} y1={pos.y + decisionSize * 2} x2={cx} y2={nextY}
          stroke={C.fg} strokeWidth={1.5} markerEnd="url(#ah)" />
      );

    } else if (step.type === "datastore") {
      const bx = cx - actionW / 2;
      els.push(
        <text key={`${k}-t`} x={cx} y={pos.y + actionH / 2 + 5}
          textAnchor="middle" fontSize={13} fill={C.fg}
          fontFamily="Inter, system-ui, sans-serif">
          {step.actionLabel}
        </text>
      );

      // UML datastore cylinder
      const dsX = bx + actionW + 30;
      const dsY = pos.y + (actionH - dsH) / 2;
      const ell = 7; // ellipse ry for cylinder caps
      // body (rect between ellipses)
      els.push(
        <rect key={`${k}-ds-body`} x={dsX} y={dsY + ell} width={dsW} height={dsH - ell * 2}
          fill={C.secondary} stroke={C.fg} strokeWidth={1} />
      );
      // top cap
      els.push(
        <ellipse key={`${k}-ds-top`} cx={dsX + dsW / 2} cy={dsY + ell} rx={dsW / 2} ry={ell}
          fill={C.secondary} stroke={C.fg} strokeWidth={1} />
      );
      // bottom cap
      els.push(
        <path key={`${k}-ds-bot`}
          d={`M ${dsX} ${dsY + dsH - ell} A ${dsW / 2} ${ell} 0 0 0 ${dsX + dsW} ${dsY + dsH - ell}`}
          fill={C.secondary} stroke={C.fg} strokeWidth={1} />
      );
      // hide top line of body behind filled top cap
      els.push(
        <line key={`${k}-ds-hide`} x1={dsX + 1} y1={dsY + ell} x2={dsX + dsW - 1} y2={dsY + ell}
          stroke={C.secondary} strokeWidth={1.5} />
      );
      // label
      els.push(
        <text key={`${k}-ds-lbl`} x={dsX + dsW / 2} y={dsY + dsH / 2 + 3}
          textAnchor="middle" fontSize={9} fontWeight={600} fill={C.fg}
          fontFamily="Inter, system-ui, sans-serif">
          {step.label}
        </text>
      );
      // dashed connector
      els.push(
        <line key={`${k}-ds-conn`} x1={bx + actionW} y1={pos.y + actionH / 2}
          x2={dsX} y2={dsY + dsH / 2}
          stroke={C.muted} strokeWidth={1} strokeDasharray="5 3" />
      );

      // arrow to next
      els.push(
        <line key={`${k}-a`} x1={cx} y1={pos.y + actionH} x2={cx} y2={nextY}
          stroke={C.fg} strokeWidth={1.5} markerEnd="url(#ah)" />
      );

    } else if (step.type === "note") {
      const bx = cx - actionW / 2;
      els.push(
        <text key={`${k}-t`} x={cx} y={pos.y + actionH / 2 + 5}
          textAnchor="middle" fontSize={13} fill={C.fg}
          fontFamily="Inter, system-ui, sans-serif">
          {step.actionLabel}
        </text>
      );

      // UML note (dog-ear)
      const nX = bx + actionW + 30;
      const nY = pos.y + (actionH - noteH) / 2;
      const ear = 12;
      els.push(
        <polygon key={`${k}-note-bg`}
          points={`${nX},${nY} ${nX + noteW - ear},${nY} ${nX + noteW},${nY + ear} ${nX + noteW},${nY + noteH} ${nX},${nY + noteH}`}
          fill={C.card} stroke={C.fg} strokeWidth={1} />
      );
      els.push(
        <polyline key={`${k}-note-ear`}
          points={`${nX + noteW - ear},${nY} ${nX + noteW - ear},${nY + ear} ${nX + noteW},${nY + ear}`}
          fill="none" stroke={C.fg} strokeWidth={1} />
      );
      els.push(
        <text key={`${k}-note-txt`} x={nX + noteW / 2} y={nY + noteH / 2 + 4}
          textAnchor="middle" fontSize={10} fill={C.muted}
          fontFamily="Inter, system-ui, sans-serif">
          {step.noteText}
        </text>
      );
      // dashed connector
      els.push(
        <line key={`${k}-note-conn`} x1={bx + actionW} y1={pos.y + actionH / 2}
          x2={nX} y2={nY + noteH / 2}
          stroke={C.muted} strokeWidth={1} strokeDasharray="5 3" />
      );

      // arrow to next
      els.push(
        <line key={`${k}-a`} x1={cx} y1={pos.y + actionH} x2={cx} y2={nextY}
          stroke={C.fg} strokeWidth={1.5} markerEnd="url(#ah)" />
      );
    }
  }

  // --- Activity final node (UML bullseye) ---
  els.push(
    <circle key="end-ring" cx={cx} cy={endY + endOuterR} r={endOuterR}
      fill="none" stroke={C.fg} strokeWidth={2} />
  );
  els.push(
    <circle key="end-dot" cx={cx} cy={endY + endOuterR} r={endInnerR}
      fill={C.fg} />
  );

  return (
    <svg viewBox={`0 0 ${width} ${totalH}`} width="100%"
      style={{ maxWidth: width, maxHeight: "62vh" }}
      role="img" aria-label="UML Activity Diagram">
      {els}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide definitions                                                  */
/* ------------------------------------------------------------------ */

const slide2Steps: ActivityStep[] = [
  { type: "action", label: "LLM Chat — collect user data" },
  { type: "decision", label: "conversation complete" },
  { type: "action", label: "LLM Analysis — extract candidate skills" },
  { type: "decision", label: "for each candidateSkill" },
  { type: "datastore", actionLabel: "Semantic search — ESCO grounding (pgvector)", label: "ESCO DB" },
  { type: "decision", label: "similarity ≥ threshold" },
  { type: "action", label: "Rank by cosine similarity — select best fits" },
  { type: "action-bold", label: "OUTPUT: SkillProfile" },
];

const slide3Steps: ActivityStep[] = [
  { type: "action", label: "Match SkillProfile → ESCO occupations" },
  { type: "note", actionLabel: "Custom Locational Dataplane analysis", noteText: "detail → slide 4" },
  { type: "action-bold", label: "Consolidate & select best-fit opportunity" },
];

const slide4Steps: ActivityStep[] = [
  { type: "datastore", actionLabel: "Map occupations → ISCO-08 codes", label: "ISCO reg." },
  { type: "action", label: "User customizes signal & trend data sources" },
  { type: "decision", label: "config saved" },
  { type: "action", label: "System auto-generates econometric query" },
  { type: "action-bold", label: "Return analysis → Opportunity Analyzer" },
];

const slides: Slide[] = [
  {
    id: 1,
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-12 text-center">
        <p className="text-base tracking-widest uppercase text-muted">Introducing</p>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight text-primary">
          ISCO Skills &amp; Opportunity
          <br />
          Infrastructure Layer
        </h1>
        <p className="max-w-2xl text-lg text-muted mt-2">
          A semantic engine that connects workforce skills to real-world
          labour-market opportunities — powered by ESCO, ILO econometrics,
          and AI embeddings.
        </p>
        <div className="flex gap-3 mt-4">
          <span className="px-4 py-2 rounded-full bg-accent text-sm font-medium text-foreground">ESCO v1.2</span>
          <span className="px-4 py-2 rounded-full bg-secondary text-sm font-medium text-foreground">ILO Data</span>
          <span className="px-4 py-2 rounded-full bg-primary/15 text-sm font-medium text-primary">AI Embeddings</span>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    content: (
      <div className="flex flex-col items-center justify-center h-full px-8 py-6">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
          Conversational Skill Discovery Engine
        </h2>
        <ActivityDiagram steps={slide2Steps} />
      </div>
    ),
  },
  {
    id: 3,
    content: (
      <div className="flex flex-col items-center justify-center h-full px-8 py-6">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
          Opportunity Analyzer
        </h2>
        <ActivityDiagram steps={slide3Steps} />
      </div>
    ),
  },
  {
    id: 4,
    content: (
      <div className="flex flex-col items-center justify-center h-full px-8 py-6">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
          Custom Locational Dataplane
        </h2>
        <ActivityDiagram steps={slide4Steps} />
      </div>
    ),
  },
  {
    id: 5,
    content: (
      <div className="flex items-center justify-center h-full">
        <span className="text-xl text-muted">Slide 5 — coming soon</span>
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Deck                                                               */
/* ------------------------------------------------------------------ */

export default function Deck() {
  const [current, setCurrent] = useState(0);
  const next = useCallback(() => setCurrent((i) => Math.min(i + 1, slides.length - 1)), []);
  const prev = useCallback(() => setCurrent((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="relative w-screen h-screen select-none overflow-hidden bg-background">
      <div className="w-full h-full">{slides[current].content}</div>
      <button aria-label="Previous slide" onClick={prev}
        className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize focus:outline-none" />
      <button aria-label="Next slide" onClick={next}
        className="absolute inset-y-0 right-0 w-2/3 cursor-e-resize focus:outline-none" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-border">
        <div className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((current + 1) / slides.length) * 100}%` }} />
      </div>
      <span className="absolute bottom-3 right-4 text-xs text-muted font-mono">
        {current + 1} / {slides.length}
      </span>
    </div>
  );
}
