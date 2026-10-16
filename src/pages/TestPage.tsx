import { useState } from 'react';
import { DIFFICULTY_LABEL, EXERCISES, MODULES, TYPE_LABEL, lessonById } from '../content';
import type { Exercise } from '../content/types';
import { ErrorBox, WrongBox } from '../components/Feedback';
import { Markup, inline } from '../components/Markup';
import { Modal } from '../components/Modal';
import { ResultTable } from '../components/ResultTable';
import { SchemaPanel, useSchema } from '../components/SchemaPanel';
import { SqlEditor } from '../components/SqlEditor';
import { SqlAbortError, sqlClient } from '../db/sqlClient';
import type { ExecResult } from '../db/types';
import { checkExercise, type CheckOutcome } from '../engine/check';
import { explainError, type ExplainedError } from '../engine/errors';
import { useProgress } from '../progress/ProgressContext';

type Answer = { sql?: string; choice?: number };
type Phase = 'setup' | 'running' | 'evaluating' | 'result';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TestPage() {
  const { state, dispatch } = useProgress();
  const available = MODULES.filter((m) => m.status === 'verfügbar');
  const [mods, setMods] = useState<number[]>(() => available.map((m) => m.id));
  const [count, setCount] = useState(8);
  const [withPredict, setWithPredict] = useState(true);
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [idx, setIdx] = useState(0);
  const [askFinish, setAskFinish] = useState(false);
  const [results, setResults] = useState<Record<string, { correct: boolean; outcome?: CheckOutcome }>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const pool = EXERCISES.filter(
    (e) =>
      mods.includes(lessonById.get(e.lessonId)!.moduleId) &&
      e.type !== 'explain' &&
      (withPredict || e.type !== 'predict'),
  );

  const start = () => {
    // Mischung aus allen Schwierigkeiten; zuvor fehlerhafte Aufgaben etwas bevorzugen
    const hadErrors = (e: Exercise) => ((state.tasks[e.id]?.wrong ?? 0) > 0 ? 1 : 0);
    const weighted = shuffle(pool).sort((a, b) => hadErrors(b) - hadErrors(a));
    const qs = shuffle(weighted.slice(0, Math.min(count, pool.length)));
    setQuestions(qs);
    setAnswers(Object.fromEntries(qs.map((q) => [q.id, q.type === 'predict' ? {} : { sql: q.starterSql ?? '' }])));
    setIdx(0);
    setResults({});
    setRevealed({});
    setPhase('running');
  };

  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return q.type === 'predict' ? a?.choice !== undefined : !!a?.sql?.trim() && a.sql !== q.starterSql;
  }).length;

  const finish = async () => {
    setAskFinish(false);
    setPhase('evaluating');
    const res: Record<string, { correct: boolean; outcome?: CheckOutcome }> = {};
    const correctIds: string[] = [];
    for (const q of questions) {
      const a = answers[q.id] ?? {};
      let correct = false;
      let outcome: CheckOutcome | undefined;
      if (q.type === 'predict') correct = a.choice === q.choices?.correct;
      else {
        try {
          outcome = await checkExercise(sqlClient(), q, a.sql ?? '');
          correct = outcome.status === 'correct';
        } catch (e) {
          outcome = { status: 'error', error: explainError(e instanceof Error ? e.message : String(e), a.sql ?? '') };
        }
      }
      res[q.id] = { correct, outcome };
      if (correct) {
        correctIds.push(q.id);
        dispatch({ type: 'checkCorrect', exId: q.id });
      } else {
        dispatch({ type: 'checkWrong', exId: q.id, scheduleReview: true });
      }
    }
    dispatch({ type: 'testFinished', record: { at: new Date().toISOString(), total: questions.length, correct: correctIds.length, exerciseIds: questions.map((q) => q.id), correctIds } });
    setResults(res);
    setPhase('result');
  };

  if (phase === 'setup') {
    return (
      <div className="page">
        <h1>Wissenstest</h1>
        <p>
          Gemischte Aufgaben aus den gewählten Modulen. Während des Tests gibt es <strong>keine Hinweise und keine Prüfung</strong> – du kannst deine
          Abfragen aber ausführen. Die Auswertung erfolgt erst am Ende. Falsch beantwortete Aufgaben kommen in die Wiederholung.
        </p>
        <div className="card">
          <fieldset className="mod-choice">
            <legend>Module</legend>
            <div className="btn-row">
              <button type="button" className="btn btn-small" onClick={() => setMods(available.map((m) => m.id))}>
                Alle
              </button>
              <button type="button" className="btn btn-small" onClick={() => setMods([])}>
                Keine
              </button>
            </div>
            {available.map((m) => (
              <label key={m.id} className="check">
                <input
                  type="checkbox"
                  checked={mods.includes(m.id)}
                  onChange={(e) => setMods(e.target.checked ? [...mods, m.id] : mods.filter((x) => x !== m.id))}
                />{' '}
                {m.id}. {m.title}
              </label>
            ))}
          </fieldset>
          <label className="inline-field">
            Anzahl Aufgaben{' '}
            <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[5, 8, 10, 15].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={withPredict} onChange={(e) => setWithPredict(e.target.checked)} /> Vorhersage-Aufgaben (Auswahl) einbeziehen
          </label>
          <p className="small muted">{pool.length} passende Aufgaben im Pool.</p>
          <button type="button" className="btn btn-primary" disabled={pool.length === 0} onClick={start}>
            Test starten
          </button>
        </div>
        {state.tests.length > 0 && (
          <section className="card">
            <h2>Bisherige Tests</h2>
            <ul>
              {[...state.tests].reverse().slice(0, 10).map((t, i) => (
                <li key={i}>
                  {new Date(t.at).toLocaleString('de-DE')}: {t.correct} von {t.total} richtig ({Math.round((t.correct / t.total) * 100)} %)
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  if (phase === 'evaluating') return <div className="page"><h1>Wissenstest</h1><p role="status">Wird ausgewertet …</p></div>;

  if (phase === 'result') {
    const correct = questions.filter((q) => results[q.id]?.correct).length;
    return (
      <div className="page">
        <h1>Auswertung</h1>
        <div className="card highlight">
          <p className="big">
            {correct} von {questions.length} Aufgaben richtig ({Math.round((correct / questions.length) * 100)} %)
          </p>
          <p className="small muted">Richtige Antworten zählen wie eine Prüfung im Lernpfad. Falsche Antworten werden ab morgen zur Wiederholung vorgeschlagen.</p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={() => setPhase('setup')}>
              Neuen Test starten
            </button>
          </div>
        </div>
        {questions.map((q, i) => {
          const r = results[q.id];
          const a = answers[q.id] ?? {};
          return (
            <section key={q.id} className={`card test-result ${r?.correct ? 'ok' : 'bad'}`}>
              <h2>
                {i + 1}. {q.title} <span className={r?.correct ? 'tag-ok' : 'tag-bad'}>{r?.correct ? '✓ richtig' : '✗ nicht richtig'}</span>
              </h2>
              <Markup text={q.prompt} className="small" />
              {q.type === 'predict' ? (
                <p>
                  Deine Antwort: <strong>{a.choice !== undefined ? q.choices!.options[a.choice] : '– keine –'}</strong>
                  {!r?.correct && <><br />{inline(q.choices!.explanation)}</>}
                </p>
              ) : (
                <>
                  <h3 className="h-small">Deine Abfrage</h3>
                  <pre className="code-block">{a.sql?.trim() ? a.sql : '– leer –'}</pre>
                  {r?.outcome?.status === 'wrong' && <WrongBox messages={r.outcome.messages} notes={r.outcome.notes} examples={r.outcome.examples} />}
                  {r?.outcome?.status === 'error' && <ErrorBox error={r.outcome.error} />}
                  {r?.outcome?.status === 'empty' && <p className="muted">Keine Abfrage eingegeben.</p>}
                </>
              )}
              {!r?.correct && q.type !== 'predict' && (
                revealed[q.id] ? (
                  <div className="solution">
                    <h4>Musterlösung</h4>
                    <pre className="code-block">{q.solution}</pre>
                    <Markup text={q.solutionExplanation} />
                  </div>
                ) : (
                  <button type="button" className="btn btn-ghost" onClick={() => { setRevealed({ ...revealed, [q.id]: true }); dispatch({ type: 'solution', exId: q.id }); }}>
                    Musterlösung anzeigen
                  </button>
                )
              )}
            </section>
          );
        })}
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="page page-wide">
      <h1>Wissenstest</h1>
      <nav className="test-nav" aria-label="Fragen">
        {questions.map((qq, i) => {
          const a = answers[qq.id];
          const done = qq.type === 'predict' ? a?.choice !== undefined : !!a?.sql?.trim() && a.sql !== qq.starterSql;
          return (
            <button key={qq.id} type="button" className={`dot ${i === idx ? 'current' : ''} ${done ? 'done' : ''}`} aria-current={i === idx} aria-label={`Frage ${i + 1}${done ? ', bearbeitet' : ''}`} onClick={() => setIdx(i)}>
              {i + 1}
            </button>
          );
        })}
        <span className="small muted">
          {answeredCount} von {questions.length} bearbeitet
        </span>
      </nav>
      <TestQuestion key={q.id} q={q} answer={answers[q.id] ?? {}} onAnswer={(a) => setAnswers({ ...answers, [q.id]: a })} />
      <div className="pager">
        <button type="button" className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          ← Zurück
        </button>
        {idx < questions.length - 1 ? (
          <button type="button" className="btn" onClick={() => setIdx(idx + 1)}>
            Weiter →
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-primary" onClick={() => setAskFinish(true)}>
          Test beenden und auswerten
        </button>
      </div>
      <Modal open={askFinish} title="Test auswerten?" confirmLabel="Auswerten" onConfirm={finish} onCancel={() => setAskFinish(false)}>
        <p>
          Du hast {answeredCount} von {questions.length} Aufgaben bearbeitet. {answeredCount < questions.length && 'Unbearbeitete Aufgaben werden als nicht richtig gewertet.'}
        </p>
      </Modal>
    </div>
  );
}

function TestQuestion({ q, answer, onAnswer }: { q: Exercise; answer: Answer; onAnswer: (a: Answer) => void }) {
  const schema = useSchema(q.db);
  const [run, setRun] = useState<(ExecResult & { ok: true }) | null>(null);
  const [err, setErr] = useState<ExplainedError | null>(null);
  const [busy, setBusy] = useState(false);
  const dbKey = `test:${q.id}`;
  const sql = q.type === 'predict' ? q.starterSql ?? '' : answer.sql ?? '';

  const doRun = async () => {
    if (busy || !sql.trim()) return;
    setBusy(true);
    try {
      const r = await sqlClient().exec(dbKey, q.db, sql);
      if (r.ok) {
        setRun(r);
        setErr(null);
      } else {
        setRun(null);
        setErr(explainError(r.error, sql, schema));
      }
    } catch (e) {
      setRun(null);
      setErr(explainError(e instanceof SqlAbortError ? e.message : String(e), sql, schema));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="workspace">
      <section className="ws-left">
        <div className="card ws-task">
          <div className="ex-meta">
            <span className="badge">{TYPE_LABEL[q.type]}</span>
            <span className={`badge diff-${q.difficulty}`}>{DIFFICULTY_LABEL[q.difficulty]}</span>
          </div>
          <h2 className="ex-title">{q.title}</h2>
          <Markup text={q.prompt} />
          {q.expectedColumns && (
            <p className="small">
              Erwartete Spalten:{' '}
              {q.expectedColumns.map((c) => (
                <code key={c} className="chip">
                  {c}
                </code>
              ))}
            </p>
          )}
        </div>
        <details className="card schema-card">
          <summary>
            <h3>Schema &amp; Daten</h3>
          </summary>
          <SchemaPanel db={q.db} dbKey={dbKey} />
        </details>
      </section>
      <section className="ws-right">
        <div className="card ws-editor">
          <SqlEditor
            value={sql}
            onChange={q.type === 'predict' ? undefined : (v) => onAnswer({ sql: v })}
            onRun={doRun}
            readOnly={q.type === 'predict'}
            schema={schema}
            label="SQL-Editor (Test)"
            minHeight={q.type === 'predict' ? '60px' : '150px'}
          />
          <div className="toolbar">
            <button type="button" className="btn" onClick={doRun} disabled={busy}>
              ▶ Ausführen
            </button>
            {busy && (
              <button type="button" className="btn btn-danger" onClick={() => sqlClient().abort()}>
                ■ Abbrechen
              </button>
            )}
            <span className="toolbar-spacer" />
            {q.type !== 'predict' && (
              <button type="button" className="btn btn-ghost" onClick={() => onAnswer({ sql: q.starterSql ?? '' })}>
                Zurücksetzen
              </button>
            )}
          </div>
        </div>
        {q.type === 'predict' && q.choices && (
          <fieldset className="card choices">
            <legend>Deine Vorhersage</legend>
            {q.choices.options.map((o, i) => (
              <label key={i} className="choice">
                <input type="radio" name={`t-${q.id}`} checked={answer.choice === i} onChange={() => onAnswer({ choice: i })} /> {o}
              </label>
            ))}
          </fieldset>
        )}
        {err && <ErrorBox error={err} />}
        {run && (
          <div className="card">
            <h3>Ergebnis</h3>
            {run.results.length === 0 && <p className="muted">Keine Ergebnistabelle ({run.changes} Zeilen geändert).</p>}
            {run.results.slice(-3).map((r, i) => (
              <ResultTable key={i} result={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
