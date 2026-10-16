import { useEffect, useRef, useState } from 'react';
import { DIFFICULTY_LABEL, TYPE_LABEL, isChoiceType } from '../content';
import type { Exercise } from '../content/types';
import { DATABASES } from '../db/seeds';
import { SqlAbortError, sqlClient } from '../db/sqlClient';
import type { ExecResult } from '../db/types';
import { checkExercise, isBlankSql, type CheckOutcome } from '../engine/check';
import { explainError, lintSql, type ExplainedError } from '../engine/errors';
import { dayString, outcomeFor, STATUS_LABEL, statusOf, type TaskStatus } from '../progress/model';
import { useProgress } from '../progress/ProgressContext';
import { ErrorBox, NotesBox, WrongBox } from './Feedback';
import { Markup, inline } from './Markup';
import { Modal } from './Modal';
import { ResultTable } from './ResultTable';
import { SchemaPanel, useSchema } from './SchemaPanel';
import { SqlEditor } from './SqlEditor';
import { StatusBadge } from './StatusBadge';

export type WorkspaceMode = 'lernpfad' | 'frei' | 'wiederholung';

interface Props {
  exercise: Exercise;
  mode: WorkspaceMode;
  onNext?: () => void;
  nextLabel?: string;
}

const HINT_LABELS = ['Denkanstoß', 'Passende Schlüsselwörter', 'Abfragegerüst'];

export function ExerciseWorkspace({ exercise: ex, mode, onNext, nextLabel = 'Nächste Aufgabe' }: Props) {
  const { state, dispatch } = useProgress();
  const record = state.tasks[ex.id];
  const status: TaskStatus = statusOf(state, ex.id);
  const schema = useSchema(ex.db);
  const client = sqlClient();
  const dbKey = `aufgabe:${ex.id}`;
  const isChoice = isChoiceType(ex);
  const readOnlySql = isChoice;
  /** Wissensfragen ohne SQL zeigen keinen Editor */
  const showEditor = !(ex.type === 'choice' && !ex.starterSql);

  const [sql, setSql] = useState(() => (readOnlySql ? ex.starterSql ?? '' : record?.draft ?? ex.starterSql ?? ''));
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<(ExecResult & { ok: true }) | null>(null);
  const [runError, setRunError] = useState<ExplainedError | null>(null);
  const [runNotes, setRunNotes] = useState<string[]>([]);
  const [check, setCheck] = useState<CheckOutcome | null>(null);
  const [successInfo, setSuccessInfo] = useState<TaskStatus | null>(null);
  // Heute bereits genutzte Hilfen bleiben sichtbar (sie zählen ohnehin schon).
  const [hintsShown, setHintsShown] = useState(() => (record?.hintDay === dayString() ? record.hintLevel : 0));
  const [solutionShown, setSolutionShown] = useState(() => record?.solutionDay === dayString() && !isChoice);
  const [askSolution, setAskSolution] = useState(false);
  const [askReset, setAskReset] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  // Vorhersage
  const [choice, setChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  // Erklärung
  const [note, setNote] = useState(record?.note ?? '');
  const [revealed, setRevealed] = useState(false);
  const [assessed, setAssessed] = useState<string | null>(null);

  const draftTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    dispatch({ type: 'openExercise', exId: ex.id });
    const off = client.onRestart(() =>
      setNotice('Die SQL-Umgebung wurde neu gestartet (Zeitlimit oder Abbruch). Deine Übungsdatenbank ist wieder im Ausgangszustand.'),
    );
    return () => {
      off();
      clearTimeout(draftTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  const onChange = (v: string) => {
    setSql(v);
    clearTimeout(draftTimer.current);
    if (!readOnlySql) draftTimer.current = setTimeout(() => dispatch({ type: 'draft', exId: ex.id, sql: v }), 800);
  };

  const handleAbort = (e: unknown) => {
    if (e instanceof SqlAbortError) setRunError(explainError(e.message, sql, schema));
    else setRunError({ category: 'other', title: 'Interner Fehler', explanation: ['Bitte lade die Seite neu.'], original: String(e) });
  };

  const doRun = async () => {
    if (busy) return;
    setCheck(null);
    setSuccessInfo(null);
    if (isBlankSql(sql)) {
      setRun(null);
      setRunError(null);
      setNotice('Der Editor ist leer. Schreibe zuerst eine Abfrage.');
      return;
    }
    setNotice(null);
    setBusy(true);
    dispatch({ type: 'run', exId: ex.id });
    if (!readOnlySql) dispatch({ type: 'draft', exId: ex.id, sql });
    try {
      const r = await client.exec(dbKey, ex.db, sql);
      if (r.ok) {
        setRun(r);
        setRunError(null);
        setRunNotes(lintSql(sql, schema));
      } else {
        setRun(null);
        setRunError(explainError(r.error, sql, schema));
      }
    } catch (e) {
      setRun(null);
      handleAbort(e);
    } finally {
      setBusy(false);
      setRefresh((x) => x + 1);
    }
  };

  const doCheck = async () => {
    if (busy || readOnlySql || ex.type === 'explain') return;
    setNotice(null);
    setBusy(true);
    setSuccessInfo(null);
    dispatch({ type: 'draft', exId: ex.id, sql });
    const outcomeBefore = record ? outcomeFor(record, dayString()) : 'selbststaendig';
    try {
      const res = await checkExercise(client, ex, sql, schema);
      setCheck(res);
      setRun(null);
      setRunError(null);
      if (res.status === 'correct') {
        dispatch({ type: 'checkCorrect', exId: ex.id });
        setSuccessInfo(outcomeBefore);
      } else if (res.status === 'wrong' || res.status === 'error') {
        dispatch({ type: 'checkWrong', exId: ex.id });
      }
    } catch (e) {
      handleAbort(e);
    } finally {
      setBusy(false);
    }
  };

  const showHint = () => {
    const next = Math.min(3, hintsShown + 1);
    setHintsShown(next);
    dispatch({ type: 'hint', exId: ex.id, level: next });
  };

  const confirmSolution = () => {
    setAskSolution(false);
    setSolutionShown(true);
    dispatch({ type: 'solution', exId: ex.id });
  };

  const resetTask = async () => {
    setAskReset(false);
    const start = ex.starterSql ?? '';
    if (!readOnlySql) {
      setSql(start);
      dispatch({ type: 'draft', exId: ex.id, sql: start });
    }
    setRun(null);
    setRunError(null);
    setCheck(null);
    setSuccessInfo(null);
    await client.reset(dbKey).catch(() => undefined);
    setRefresh((x) => x + 1);
    setNotice('Aufgabe zurückgesetzt: Startcode und Übungsdatenbank sind wieder im Ausgangszustand.');
  };

  const resetDb = async () => {
    await client.reset(dbKey).catch(() => undefined);
    setRun(null);
    setRefresh((x) => x + 1);
    setNotice('Übungsdatenbank zurückgesetzt. Dein Code im Editor bleibt erhalten.');
  };

  const answerPredict = () => {
    if (choice === null || !ex.choices) return;
    setAnswered(true);
    if (choice === ex.choices.correct) {
      setSuccessInfo(record ? outcomeFor(record, dayString()) : 'selbststaendig');
      dispatch({ type: 'checkCorrect', exId: ex.id });
    } else {
      dispatch({ type: 'checkWrong', exId: ex.id });
      dispatch({ type: 'solution', exId: ex.id }); // die Erklärung verrät die richtige Antwort
    }
  };

  const isQueryTask = ex.type === 'write' || ex.type === 'fix' || ex.type === 'complete';
  const dbInfo = DATABASES[ex.db];
  const resultToShow = check && (check.status === 'correct' || check.status === 'wrong') ? check.result : undefined;

  return (
    <div className="workspace">
      {/* ---------- linke Spalte: Aufgabe, Hilfen, Schema ---------- */}
      <section className="ws-left" aria-label="Aufgabe">
        <div className="card ws-task">
          <div className="ex-meta">
            <span className="badge">{TYPE_LABEL[ex.type]}</span>
            <span className={`badge diff-${ex.difficulty}`}>{DIFFICULTY_LABEL[ex.difficulty]}</span>
            <span className="badge badge-db">DB: {dbInfo.title}</span>
            {ex.guided && <span className="badge">angeleitet</span>}
            {mode === 'wiederholung' && <span className="badge badge-review">Wiederholung</span>}
          </div>
          <h2 className="ex-title">{ex.title}</h2>
          <StatusBadge status={status} />
          <Markup text={ex.prompt} className="ex-prompt" />
          {ex.expectedColumns && (
            <p className="small">
              Erwartete Spalten:{' '}
              {ex.expectedColumns.map((c) => (
                <code key={c} className="chip">
                  {c}
                </code>
              ))}
            </p>
          )}
        </div>

        {ex.type !== 'explain' && (
          <div className="card hints">
            <h3>Hilfen</h3>
            <p className="small muted">
              Versuche es zuerst selbst. Hinweise sind erlaubt – die Aufgabe zählt dann heute als „mit Hilfe gelöst“.
            </p>
            {ex.hints.slice(0, hintsShown).map((h, i) => (
              <div key={i} className="hint">
                <h4>
                  Hinweis {i + 1}: {HINT_LABELS[i]}
                </h4>
                {i === 2 ? (
                  <>
                    <pre className="code-block">{h}</pre>
                    {isQueryTask && (
                      <button type="button" className="btn btn-small" onClick={() => onChange(h)}>
                        Gerüst in den Editor übernehmen
                      </button>
                    )}
                  </>
                ) : (
                  <Markup text={h} />
                )}
              </div>
            ))}
            <div className="btn-row">
              {hintsShown < 3 && (
                <button type="button" className="btn" onClick={showHint}>
                  Hinweis {hintsShown + 1} anzeigen: {HINT_LABELS[hintsShown]}
                </button>
              )}
              {!solutionShown && (
                <button type="button" className="btn btn-ghost" onClick={() => setAskSolution(true)}>
                  {ex.type === 'choice' ? 'Lösung anzeigen …' : 'Musterlösung anzeigen …'}
                </button>
              )}
            </div>
            {solutionShown && (
              <div className="solution">
                <h4>{ex.type === 'choice' ? 'Lösung' : 'Musterlösung'}</h4>
                {ex.type !== 'choice' && <pre className="code-block">{ex.solution}</pre>}
                <Markup text={ex.solutionExplanation} />
                {isQueryTask && <p className="small muted">Andere Lösungswege sind ebenso richtig, wenn sie dasselbe Ergebnis liefern.</p>}
              </div>
            )}
          </div>
        )}

        <details className="card schema-card" open>
          <summary>
            <h3>Schema &amp; Daten</h3>
          </summary>
          <SchemaPanel db={ex.db} dbKey={dbKey} refreshToken={refresh} />
        </details>
      </section>

      {/* ---------- rechte Spalte: Editor, Ergebnis, Feedback ---------- */}
      <section className="ws-right" aria-label="Editor und Ergebnis">
        {showEditor && (
        <div className="card ws-editor">
          <div className="editor-head">
            <h3>{readOnlySql ? 'Abfrage' : ex.type === 'explain' ? 'Abfrage zum Ausprobieren' : 'Deine Abfrage'}</h3>
            <span className="badge" title="Diese App verwendet den SQL-Dialekt von SQLite">SQL-Dialekt: SQLite</span>
          </div>
          <SqlEditor
            value={sql}
            onChange={readOnlySql ? undefined : onChange}
            onRun={doRun}
            onCheck={isQueryTask ? doCheck : undefined}
            readOnly={readOnlySql}
            schema={schema}
            label="SQL-Editor"
            minHeight={readOnlySql ? '60px' : '150px'}
          />
          <div className="toolbar">
            <button type="button" className="btn" onClick={doRun} disabled={busy}>
              ▶ Ausführen
            </button>
            {isQueryTask && (
              <button type="button" className="btn btn-primary" onClick={doCheck} disabled={busy}>
                ✓ Antwort prüfen
              </button>
            )}
            {busy && (
              <button type="button" className="btn btn-danger" onClick={() => client.abort()}>
                ■ Abbrechen
              </button>
            )}
            <span className="toolbar-spacer" />
            <button type="button" className="btn btn-ghost" onClick={resetDb} disabled={busy} title="Nur die Übungsdatenbank zurücksetzen">
              Datenbank zurücksetzen
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setAskReset(true)} disabled={busy}>
              Aufgabe zurücksetzen
            </button>
          </div>
          {!readOnlySql && (
            <p className="small muted kbd-help">
              <kbd>Strg</kbd>+<kbd>Enter</kbd> Ausführen{isQueryTask && <> · <kbd>Strg</kbd>+<kbd>Umschalt</kbd>+<kbd>Enter</kbd> Antwort prüfen</>} ·{' '}
              <kbd>Esc</kbd>, dann <kbd>Tab</kbd> verlässt den Editor
            </p>
          )}
          {busy && <p className="muted" role="status">Wird ausgeführt …</p>}
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
        </div>
        )}
        {!showEditor && notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}

        {/* Vorhersage */}
        {isChoice && ex.choices && (
          <div className={showEditor ? undefined : 'ws-editor'}>
          <div className="card">
            <fieldset className="choices" disabled={answered}>
              <legend>{ex.type === 'choice' ? 'Deine Antwort' : 'Deine Vorhersage'}</legend>
              {ex.choices.options.map((o, i) => (
                <label key={i} className={answered ? (i === ex.choices!.correct ? 'choice correct' : i === choice ? 'choice wrong' : 'choice') : 'choice'}>
                  <input type="radio" name={`choice-${ex.id}`} checked={choice === i} onChange={() => setChoice(i)} /> {o}
                </label>
              ))}
            </fieldset>
            {!answered ? (
              <button type="button" className="btn btn-primary" onClick={answerPredict} disabled={choice === null}>
                ✓ Antwort prüfen
              </button>
            ) : (
              <div className={choice === ex.choices.correct ? 'feedback feedback-ok' : 'feedback feedback-wrong'} role="status">
                <p>
                  <strong>{choice === ex.choices.correct ? 'Richtig!' : 'Leider nicht richtig.'}</strong> {inline(ex.choices.explanation)}
                </p>
                {showEditor && <p className="small">Führe die Abfrage mit „Ausführen“ aus, um das tatsächliche Ergebnis zu sehen.</p>}
              </div>
            )}
          </div>
          </div>
        )}

        {/* Erklärung */}
        {ex.type === 'explain' && (
          <div className="card">
            <label htmlFor={`note-${ex.id}`}>
              <h3>Deine Erklärung</h3>
            </label>
            <textarea
              id={`note-${ex.id}`}
              className="note-input"
              rows={6}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                dispatch({ type: 'note', exId: ex.id, text: e.target.value });
              }}
              placeholder="Erkläre in eigenen Worten …"
            />
            {!revealed ? (
              <button type="button" className="btn btn-primary" disabled={note.trim().length < 20} onClick={() => setRevealed(true)}>
                Mit Musterantwort vergleichen
              </button>
            ) : (
              <div className="solution">
                <h4>Musterantwort</h4>
                <Markup text={ex.modelAnswer ?? ''} />
                <p className="small muted">
                  Freie Erklärungen werden <strong>nicht automatisch bewertet</strong>. Vergleiche selbst: Hast du die wesentlichen Punkte genannt?
                </p>
                {!assessed ? (
                  <div className="btn-row">
                    <button type="button" className="btn btn-primary" onClick={() => { setAssessed('ja'); dispatch({ type: 'selfAssess', exId: ex.id, value: 'ja' }); }}>
                      Ja, im Wesentlichen richtig
                    </button>
                    <button type="button" className="btn" onClick={() => { setAssessed('teilweise'); dispatch({ type: 'selfAssess', exId: ex.id, value: 'teilweise' }); }}>
                      Teilweise
                    </button>
                    <button type="button" className="btn" onClick={() => { setAssessed('nein'); dispatch({ type: 'selfAssess', exId: ex.id, value: 'nein' }); }}>
                      Noch nicht
                    </button>
                  </div>
                ) : (
                  <p className="feedback feedback-note" role="status">
                    Selbsteinschätzung gespeichert ({assessed === 'ja' ? 'richtig' : assessed}).{' '}
                    {assessed !== 'ja' && 'Die Aufgabe wird zur Wiederholung vorgemerkt.'}
                  </p>
                )}
              </div>
            )}
            {ex.type === 'explain' && note.trim().length < 20 && !revealed && (
              <p className="small muted">Schreibe mindestens ein, zwei Sätze, bevor du vergleichst.</p>
            )}
          </div>
        )}

        {/* Feedback der Prüfung */}
        {check?.status === 'empty' && <p className="notice">Der Editor ist leer. Schreibe zuerst eine Abfrage.</p>}
        {check?.status === 'error' && <ErrorBox error={check.error} />}
        {check?.status === 'wrong' && <WrongBox messages={check.messages} notes={check.notes} examples={check.examples} statement={ex.check?.kind === 'state'} />}
        {check?.status === 'correct' && (
          <div className="feedback feedback-ok" role="status">
            <p>
              <strong>Richtig!</strong> Dein Ergebnis stimmt mit dem erwarteten Ergebnis überein
              {ex.check?.kind === 'query' && ex.check.variants?.length ? ' – auch mit den zusätzlichen Testdaten' : ''}.
            </p>
            {successInfo && <p className="small">{successText(successInfo)}</p>}
            <NotesBox notes={check.notes} />
          </div>
        )}
        {successInfo && isChoice && answered && <p className="small muted">{successText(successInfo)}</p>}

        {(check?.status === 'correct' || (answered && isChoice) || assessed) && onNext && (
          <div className="next-row">
            <button type="button" className="btn btn-primary" onClick={onNext}>
              {nextLabel} →
            </button>
          </div>
        )}

        {/* Ausführungsergebnis */}
        {runError && <ErrorBox error={runError} />}
        {run && (
          <div className="card">
            <h3>Ergebnis</h3>
            {run.results.length === 0 && (
              <p className="muted">
                Die Anweisung wurde ausgeführt und liefert keine Ergebnistabelle.
                {run.changes > 0 && ` ${run.changes} Zeile${run.changes === 1 ? '' : 'n'} in deiner Übungsdatenbank geändert, eingefügt oder gelöscht.`}
              </p>
            )}
            {run.results.length > 0 && run.changes > 0 && (
              <p className="muted small">{run.changes} Zeile(n) in deiner Übungsdatenbank geändert. „Datenbank zurücksetzen“ stellt den Ausgangszustand her.</p>
            )}
            {run.results.slice(-5).map((r, i) => (
              <ResultTable key={i} result={r} caption={run.results.length > 1 ? `Ergebnis ${run.results.length > 5 ? run.results.length - 5 + i + 1 : i + 1}` : undefined} />
            ))}
            <NotesBox notes={runNotes} />
            {isQueryTask && <p className="small muted">„Ausführen“ zeigt nur das Ergebnis. Ob es zur Aufgabe passt, erfährst du mit „Antwort prüfen“.</p>}
          </div>
        )}
        {resultToShow && (
          <div className="card">
            <h3>{ex.check?.kind === 'state' ? 'Tabelleninhalt nach deiner Anweisung' : 'Ergebnis deiner Abfrage'}</h3>
            <ResultTable result={resultToShow} />
            {ex.check?.kind === 'state' && <p className="small muted">Geprüft wurde auf einer frischen Kopie – deine Übungsdatenbank wurde dabei nicht verändert.</p>}
          </div>
        )}
      </section>

      <Modal
        open={askSolution}
        title="Musterlösung anzeigen?"
        confirmLabel="Ja, Lösung anzeigen"
        onConfirm={confirmSolution}
        onCancel={() => setAskSolution(false)}
      >
        <p>
          Wenn du die Musterlösung ansiehst, zählt diese Aufgabe heute nicht mehr als selbstständig gelöst. Sie wird für eine Wiederholung ab morgen
          vorgemerkt.
        </p>
        {hintsShown < 3 && <p>Tipp: Probiere vorher die {hintsShown === 0 ? 'Hinweise' : 'weiteren Hinweise'} aus.</p>}
      </Modal>
      <Modal
        open={askReset}
        title="Aufgabe zurücksetzen?"
        confirmLabel="Zurücksetzen"
        onConfirm={resetTask}
        onCancel={() => setAskReset(false)}
      >
        <p>Der Editor wird auf den Startcode gesetzt und die Übungsdatenbank dieser Aufgabe auf den Ausgangszustand. Dein Lernfortschritt bleibt erhalten.</p>
      </Modal>
    </div>
  );
}

function successText(s: TaskStatus): string {
  if (s === 'selbststaendig') return `Gespeichert als „${STATUS_LABEL.selbststaendig}“.`;
  if (s === 'mit_hilfe') return `Gespeichert als „${STATUS_LABEL.mit_hilfe}“, weil du heute Hinweise genutzt hast. Die Aufgabe wird zur Wiederholung vorgemerkt.`;
  return 'Da du heute die Musterlösung angesehen hast, zählt die Aufgabe noch nicht als selbstständig gelöst. Versuche sie bei der Wiederholung ab morgen ohne Hilfe.';
}
