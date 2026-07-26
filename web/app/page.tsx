"use client";

import { useMemo, useState } from "react";
import {
  EXAMPLES,
  type DemoResult,
  type Role,
  runGuardrailPipeline,
} from "../lib/guardrails";

const INITIAL_PROMPT = EXAMPLES[0].prompt;

function StatusIcon({ status }: { status: "pass" | "block" | "idle" }) {
  return (
    <span className={`status-icon status-icon--${status}`} aria-hidden="true">
      {status === "pass" ? "✓" : status === "block" ? "×" : "·"}
    </span>
  );
}

function TraceCard({
  index,
  title,
  detail,
  status,
}: {
  index: string;
  title: string;
  detail: string;
  status: "pass" | "block" | "idle";
}) {
  return (
    <article className={`trace-card trace-card--${status}`}>
      <div className="trace-index">{index}</div>
      <div className="trace-copy">
        <div className="trace-title-row">
          <h3>{title}</h3>
          <StatusIcon status={status} />
        </div>
        <p>{detail}</p>
      </div>
    </article>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState(INITIAL_PROMPT);
  const [role, setRole] = useState<Role>("Engineering");
  const [result, setResult] = useState<DemoResult | null>(null);

  const characterCount = prompt.length;
  const stateLabel = useMemo(() => {
    if (!result) return "Ready for a prompt";
    return result.input.isSafe ? "Checks complete" : "Prompt blocked";
  }, [result]);

  function runDemo() {
    setResult(runGuardrailPipeline(prompt, role));
  }

  function chooseExample(exampleIndex: number) {
    const example = EXAMPLES[exampleIndex];
    setPrompt(example.prompt);
    setRole(example.role);
    setResult(null);
  }

  return (
    <main>
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Guardrails Lab home">
          <span className="brand-mark" aria-hidden="true">
            G
          </span>
          <span>Guardrails Lab</span>
        </a>
        <a className="github-link" href="https://github.com/imorti/guardrails">
          View source
          <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span />
            Interactive safety demo
          </p>
          <h1>
            See every safety decision
            <span> before the answer ships.</span>
          </h1>
          <p className="hero-description">
            Test a transparent guardrail pipeline that screens prompts, enforces
            role-based access, and sanitizes model output—all before a response
            reaches the user.
          </p>
          <div className="hero-tags" aria-label="Demo attributes">
            <span>03 policy stages</span>
            <span>Synthetic data</span>
            <span>No API key</span>
          </div>
        </div>
        <aside className="principle-card">
          <div className="guardian-sigil" aria-hidden="true">
            <span>G</span>
          </div>
          <p className="principle-label">Core principle</p>
          <blockquote>
            Authorization happens <em>before</em> retrieval, never after.
          </blockquote>
          <div className="principle-flow" aria-label="Safety pipeline">
            <span>Prompt</span>
            <i />
            <span>Policy</span>
            <i />
            <span>Answer</span>
          </div>
        </aside>
      </section>

      <section className="lab" aria-labelledby="lab-heading">
        <div className="lab-heading-row">
          <div>
            <p className="section-kicker">Live sandbox</p>
            <h2 id="lab-heading">Run the pipeline</h2>
          </div>
          <p className="simulation-note">
            <span aria-hidden="true">◇</span>
            Roles and documents are simulated for this public demo.
          </p>
        </div>

        <div className="lab-grid">
          <section className="composer" aria-label="Prompt controls">
            <div className="field-heading">
              <label htmlFor="role">Simulated role</label>
              <span>Controls document access</span>
            </div>
            <div className="segmented-control">
              {(["Engineering", "Human Resources"] as Role[]).map((option) => (
                <button
                  className={role === option ? "active" : ""}
                  key={option}
                  onClick={() => {
                    setRole(option);
                    setResult(null);
                  }}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="field-heading prompt-heading">
              <label htmlFor="prompt">Prompt</label>
              <span>{characterCount} / 500</span>
            </div>
            <textarea
              id="prompt"
              maxLength={500}
              onChange={(event) => {
                setPrompt(event.target.value);
                setResult(null);
              }}
              placeholder="Ask about the synthetic company documents…"
              value={prompt}
            />

            <div className="example-area">
              <p>Try a scenario</p>
              <div className="example-buttons">
                {EXAMPLES.map((example, index) => (
                  <button
                    key={example.label}
                    onClick={() => chooseExample(index)}
                    type="button"
                  >
                    <span>{example.icon}</span>
                    {example.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="run-button"
              disabled={!prompt.trim()}
              onClick={runDemo}
              type="button"
            >
              Run guardrails
              <span aria-hidden="true">→</span>
            </button>
          </section>

          <section className="results" aria-live="polite">
            <div className="results-header">
              <div>
                <p className="section-kicker">Decision trace</p>
                <h2>{stateLabel}</h2>
              </div>
              <span
                className={`result-pill ${
                  result
                    ? result.input.isSafe
                      ? "result-pill--pass"
                      : "result-pill--block"
                    : ""
                }`}
              >
                {result
                  ? result.input.isSafe
                    ? "Complete"
                    : "Blocked"
                  : "Waiting"}
              </span>
            </div>

            <div className="trace-stack">
              <TraceCard
                detail={
                  result
                    ? result.input.reason
                    : "Checks for restricted terms and known injection patterns."
                }
                index="01"
                status={
                  !result ? "idle" : result.input.isSafe ? "pass" : "block"
                }
                title="Input screening"
              />
              <TraceCard
                detail={
                  result
                    ? result.input.isSafe
                      ? `${result.retrievedCount} authorized document${
                          result.retrievedCount === 1 ? "" : "s"
                        } matched for ${role}.`
                      : "Skipped because the input policy blocked this prompt."
                    : "Filters documents by role before checking relevance."
                }
                index="02"
                status={
                  !result || !result.input.isSafe
                    ? "idle"
                    : result.retrievedCount > 0
                      ? "pass"
                      : "block"
                }
                title="Authorized retrieval"
              />
              <TraceCard
                detail={
                  result
                    ? result.outputStatus === "skipped"
                      ? "No output was generated for a blocked prompt."
                      : result.outputStatus === "redacted"
                        ? "Sensitive data was detected and redacted."
                        : "Response passed redaction and support checks."
                    : "Redacts structured PII and checks selected claims."
                }
                index="03"
                status={
                  !result || result.outputStatus === "skipped"
                    ? "idle"
                    : "pass"
                }
                title="Output verification"
              />
            </div>

            <div className={`final-answer ${result ? "final-answer--ready" : ""}`}>
              <div className="final-answer-heading">
                <p>Final response</p>
                {result?.outputStatus === "redacted" && (
                  <span>PII redacted</span>
                )}
              </div>
              <p>
                {result
                  ? result.finalResponse
                  : "The policy-approved response will appear here."}
              </p>
            </div>
          </section>
        </div>
      </section>

      <section className="how-it-works">
        <p className="section-kicker">Under the hood</p>
        <div className="how-heading">
          <h2>Small controls. Clear boundaries.</h2>
          <p>
            A deliberately legible reference implementation—not a claim that
            regex alone can secure an AI system.
          </p>
        </div>
        <div className="feature-grid">
          <article>
            <span>01</span>
            <h3>Screen early</h3>
            <p>
              Normalize input and reject explicit policy violations before any
              data or model call is involved.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Retrieve narrowly</h3>
            <p>
              Apply server-derived permissions first, then search only the
              documents the identity can access.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Verify last</h3>
            <p>
              Redact structured personal data and compare critical claims with
              approved source context.
            </p>
          </article>
        </div>
      </section>

      <footer>
        <p>
          Guardrails Lab <span>·</span> A synthetic educational demo
        </p>
        <p>Never use client-selected roles as production authorization.</p>
      </footer>
    </main>
  );
}
