"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Slide data – add / edit slides here                                */
/* ------------------------------------------------------------------ */

export interface Slide {
  id: number;
  content: ReactNode;
}

const slides: Slide[] = [
  /* -------- Slide 1 – Title -------- */
  {
    id: 1,
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-8 px-12 text-center">
        <p className="text-lg tracking-widest uppercase text-muted">
          Introducing
        </p>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight text-primary">
          ISCO Skills &amp; Opportunity
          <br />
          Infrastructure Layer
        </h1>
        <p className="max-w-2xl text-xl text-muted mt-4">
          A semantic engine that connects workforce skills to real‑world
          labour‑market opportunities — powered by ESCO, ILO econometrics, and
          AI embeddings.
        </p>
        <div className="flex gap-3 mt-6">
          <span className="px-4 py-2 rounded-full bg-accent text-sm font-medium text-foreground">ESCO v1.2</span>
          <span className="px-4 py-2 rounded-full bg-secondary text-sm font-medium text-foreground">ILO Data</span>
          <span className="px-4 py-2 rounded-full bg-primary/15 text-sm font-medium text-primary">AI Embeddings</span>
        </div>
      </div>
    ),
  },

  /* -------- Slide 2 – Conversation Skill Discovery Engine -------- */
  {
    id: 2,
    content: (
      <div className="flex flex-col items-center justify-center h-full px-16 py-12 gap-4">
        <h2 className="text-3xl md:text-4xl font-bold text-primary font-mono">
          Conversational Skill Discovery Engine
        </h2>

        {/* UML-style diagram */}
        <div className="flex flex-col items-center w-full max-w-4xl mt-1 font-mono text-sm">

          {/* Start node */}
          <div className="w-7 h-7 rounded-full bg-foreground" />
          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 1 */}
          <div className="w-full border-2 border-foreground rounded-lg bg-card px-5 py-2.5 mt-1">
            <span className="text-foreground font-semibold">1 &nbsp;LLM Chat — Data Collection</span>
          </div>

          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 2 */}
          <div className="w-full border-2 border-foreground rounded-lg bg-card px-5 py-2.5 mt-1">
            <span className="text-foreground font-semibold">2 &nbsp;LLM Analysis — Skill Extraction</span>
          </div>

          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 3 with DB */}
          <div className="flex items-center w-full gap-0 mt-1">
            <div className="flex-1 border-2 border-foreground rounded-lg bg-card px-5 py-2.5">
              <span className="text-foreground font-semibold">3 &nbsp;Semantic Grounding — ESCO Mapping</span>
            </div>
            <div className="hidden md:flex flex-col items-center ml-3 shrink-0">
              <div className="w-16 h-2 bg-secondary border border-foreground rounded-t-full" />
              <div className="w-16 h-8 bg-secondary border-x border-b border-foreground flex items-center justify-center">
                <span className="text-[9px] text-foreground leading-tight text-center">ESCO<br/>Supabase</span>
              </div>
              <div className="w-16 h-2 bg-secondary border-x border-b border-foreground rounded-b-full" />
            </div>
          </div>

          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 4 */}
          <div className="w-full border-2 border-foreground rounded-lg bg-card px-5 py-2.5 mt-1">
            <span className="text-foreground font-semibold">4 &nbsp;Similarity Scoring — Best-Fit Selection</span>
          </div>

          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 5 — output */}
          <div className="w-full border-[3px] border-double border-primary rounded-lg bg-accent/30 px-5 py-2.5 mt-1">
            <span className="text-primary font-bold">5 &nbsp;Final Skill Profile</span>
          </div>

          {/* End node */}
          <div className="w-px h-3 bg-foreground mt-1" />
          <div className="w-7 h-7 rounded-full bg-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background" />
        </div>
      </div>
    ),
  },

  /* -------- Slide 3 – Opportunity Analyzer -------- */
  {
    id: 3,
    content: (
      <div className="flex flex-col items-center justify-center h-full px-16 py-12 gap-4">
        <h2 className="text-3xl md:text-4xl font-bold text-primary font-mono">
          Opportunity Analyzer
        </h2>

        <div className="flex flex-col items-center w-full max-w-4xl mt-1 font-mono text-sm">

          {/* Start node */}
          <div className="w-7 h-7 rounded-full bg-foreground" />
          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 1 */}
          <div className="w-full border-2 border-foreground rounded-lg bg-card px-5 py-2.5 mt-1">
            <span className="text-foreground font-semibold">1 &nbsp;Get Fitting ESCO Occupations from Skills</span>
          </div>

          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 2 — with side reference */}
          <div className="flex items-center w-full gap-0 mt-1">
            <div className="flex-1 border-2 border-foreground rounded-lg bg-card px-5 py-2.5">
              <span className="text-foreground font-semibold">2 &nbsp;Custom Locational Dataplane Analysis</span>
            </div>
            <div className="hidden md:flex items-center ml-3 shrink-0 border border-primary/40 bg-primary/10 rounded px-3 py-1.5">
              <span className="text-[10px] text-primary">→ see next slide</span>
            </div>
          </div>

          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 3 — output */}
          <div className="w-full border-[3px] border-double border-primary rounded-lg bg-accent/30 px-5 py-2.5 mt-1">
            <span className="text-primary font-bold">3 &nbsp;Consolidate &amp; Select Best-Fit Opportunity</span>
          </div>

          {/* End node */}
          <div className="w-px h-3 bg-foreground mt-1" />
          <div className="w-7 h-7 rounded-full bg-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background" />
        </div>
      </div>
    ),
  },

  /* -------- Slide 4 – Custom Locational Dataplane -------- */
  {
    id: 4,
    content: (
      <div className="flex flex-col items-center justify-center h-full px-16 py-12 gap-4">
        <h2 className="text-3xl md:text-4xl font-bold text-primary font-mono">
          Custom Locational Dataplane
        </h2>

        <div className="flex flex-col items-center w-full max-w-4xl mt-1 font-mono text-sm">

          {/* Start node */}
          <div className="w-7 h-7 rounded-full bg-foreground" />
          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 1 */}
          <div className="w-full border-2 border-foreground rounded-lg bg-card px-5 py-2.5 mt-1">
            <span className="text-foreground font-semibold">1 &nbsp;Mapping Based on ISCO Occupation Codes</span>
          </div>

          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 2 */}
          <div className="w-full border-2 border-foreground rounded-lg bg-card px-5 py-2.5 mt-1">
            <span className="text-foreground font-semibold">2 &nbsp;Users Customize Signal &amp; Trend Data</span>
          </div>

          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 3 */}
          <div className="w-full border-2 border-foreground rounded-lg bg-card px-5 py-2.5 mt-1">
            <span className="text-foreground font-semibold">3 &nbsp;System Auto-Generates Data Analytics Query</span>
          </div>

          <div className="w-px h-3 bg-foreground" />
          <svg className="w-3 h-3 text-foreground -mt-px" viewBox="0 0 12 8" fill="currentColor"><polygon points="6,8 0,0 12,0" /></svg>

          {/* Step 4 — output feeds back */}
          <div className="flex items-center w-full gap-0 mt-1">
            <div className="flex-1 border-[3px] border-double border-primary rounded-lg bg-accent/30 px-5 py-2.5">
              <span className="text-primary font-bold">4 &nbsp;Analysis Feeds Into Opportunity Analyzer</span>
            </div>
            <div className="hidden md:flex items-center ml-3 shrink-0 border border-primary/40 bg-primary/10 rounded px-3 py-1.5">
              <span className="text-[10px] text-primary">← slide 3</span>
            </div>
          </div>

          {/* End node */}
          <div className="w-px h-3 bg-foreground mt-1" />
          <div className="w-7 h-7 rounded-full bg-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background" />
        </div>
      </div>
    ),
  },

  /* -------- Slide 5 – Blank -------- */
  {
    id: 5,
    content: (
      <div className="flex items-center justify-center h-full">
        <p className="text-3xl text-muted italic">Slide 5 — coming soon</p>
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Deck component – keyboard + click navigation                      */
/* ------------------------------------------------------------------ */

export default function Deck() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(
    () => setCurrent((i) => Math.min(i + 1, slides.length - 1)),
    []
  );
  const prev = useCallback(
    () => setCurrent((i) => Math.max(i - 1, 0)),
    []
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="relative w-screen h-screen select-none overflow-hidden bg-background">
      {/* Slide area */}
      <div className="w-full h-full transition-opacity duration-500">
        {slides[current].content}
      </div>

      {/* Navigation overlay – left / right click zones */}
      <button
        aria-label="Previous slide"
        onClick={prev}
        className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize focus:outline-none"
      />
      <button
        aria-label="Next slide"
        onClick={next}
        className="absolute inset-y-0 right-0 w-2/3 cursor-e-resize focus:outline-none"
      />

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#d8cabe]">
        <div
          className="h-full bg-gradient-to-r from-primary to-gold transition-all duration-300"
          style={{ width: `${((current + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Slide counter */}
      <span className="absolute bottom-3 right-4 text-xs text-muted font-mono">
        {current + 1} / {slides.length}
      </span>
    </div>
  );
}
