import { useRef, useState } from 'react';
import { EXERCISES, MODULES } from '../content';
import { Modal } from '../components/Modal';
import { ProgressBar } from '../components/ProgressBar';
import { REVIEW_INTERVALS, STATUS_LABEL, STATUS_POINTS, dayString, validateImport, type ProgressState, type TaskStatus } from '../progress/model';
import { useProgress } from '../progress/ProgressContext';
import { moduleProgress, overallProgress } from '../progress/stats';

export function ProgressPage() {
  const { state, dispatch, storageOk } = useProgress();
  const overall = overallProgress(state);
  const mods = moduleProgress(state);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<ProgressState | null>(null);
  const [askReset, setAskReset] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);

  const exportJson = () => {
    const data = { app: 'sql-lernapp', exportiertAm: new Date().toISOString(), fortschritt: state };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sql-lernfortschritt-${dayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: 'Sicherung wurde als JSON-Datei heruntergeladen.' });
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const parsed = validateImport(JSON.parse(await f.text()));
      setPendingImport(parsed);
    } catch (e) {
      setMessage({ ok: false, text: `Import fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const statuses: TaskStatus[] = ['selbststaendig', 'mit_hilfe', 'loesung_angesehen', 'in_bearbeitung', 'nicht_begonnen'];

  return (
    <div className="page">
      <h1>Fortschritt &amp; Daten</h1>
      {!storageOk && (
        <p className="feedback feedback-error" role="alert">
          Der Browser erlaubt gerade kein dauerhaftes Speichern (z. B. privater Modus). Sichere deinen Fortschritt per Export.
        </p>
      )}

      <section className="card">
        <h2>So wird dein Fortschritt berechnet</h2>
        <p>Jede Aufgabe hat genau einen Status. Gezählt werden nur Aufgaben, die du tatsächlich bearbeitet hast:</p>
        <table className="list-table">
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">Wann?</th>
              <th scope="col">Punkte</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{STATUS_LABEL.nicht_begonnen}</td>
              <td>Aufgabe noch nicht ausgeführt oder geprüft. Das bloße Öffnen einer Lektion oder Aufgabe ändert nichts.</td>
              <td>0</td>
            </tr>
            <tr>
              <td>{STATUS_LABEL.in_bearbeitung}</td>
              <td>Du hast ausgeführt, geprüft oder einen Hinweis geöffnet, aber noch nicht richtig gelöst.</td>
              <td>0</td>
            </tr>
            <tr>
              <td>{STATUS_LABEL.loesung_angesehen}</td>
              <td>Die Musterlösung wurde angezeigt, bevor die Aufgabe gelöst war – oder du hast am selben Tag nach dem Ansehen gelöst.</td>
              <td>{STATUS_POINTS.loesung_angesehen}</td>
            </tr>
            <tr>
              <td>{STATUS_LABEL.mit_hilfe}</td>
              <td>Richtig gelöst, nachdem du am selben Tag mindestens einen Hinweis genutzt hast. Bei Erklär-Aufgaben: Selbsteinschätzung „teilweise“.</td>
              <td>{STATUS_POINTS.mit_hilfe}</td>
            </tr>
            <tr>
              <td>{STATUS_LABEL.selbststaendig}</td>
              <td>
                Richtig gelöst, ohne am selben Tag Hinweise oder die Musterlösung genutzt zu haben. Fehlversuche sind erlaubt. Bei Erklär-Aufgaben beruht
                dies auf deiner Selbsteinschätzung „im Wesentlichen richtig“.
              </td>
              <td>{STATUS_POINTS.selbststaendig}</td>
            </tr>
          </tbody>
        </table>
        <ul>
          <li>Fortschritt eines Moduls = erreichte Punkte ÷ Anzahl der Aufgaben des Moduls. Der Gesamtfortschritt rechnet genauso über alle Aufgaben.</li>
          <li>Ein Status wird nie schlechter. Eine später (frühestens am nächsten Tag) selbstständig gelöste Aufgabe steigt auf „selbstständig gelöst“.</li>
          <li>
            Aufgaben mit Hilfe, Musterlösung oder Fehlversuchen werden nach {REVIEW_INTERVALS.join(', ')} Tagen zur Wiederholung vorgeschlagen.
          </li>
          <li>Automatisch geprüft werden SQL-Ergebnisse und Auswahlantworten. Freie Erklärungen werden nicht automatisch bewertet.</li>
          <li>Geplante Module fließen nicht in die Berechnung ein.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Deine Zahlen</h2>
        <ProgressBar percent={overall.percent} label="Gesamtfortschritt" />
        <p>
          {overall.points.toLocaleString('de-DE')} von {overall.total} möglichen Punkten.
        </p>
        <div className="table-scroll">
          <table className="list-table">
            <thead>
              <tr>
                <th scope="col">Modul</th>
                {statuses.map((s) => (
                  <th key={s} scope="col">
                    {STATUS_LABEL[s]}
                  </th>
                ))}
                <th scope="col">Fortschritt</th>
              </tr>
            </thead>
            <tbody>
              {mods.map((p) => (
                <tr key={p.moduleId}>
                  <td>
                    {p.moduleId}. {MODULES.find((m) => m.id === p.moduleId)?.short}
                  </td>
                  {statuses.map((s) => (
                    <td key={s}>{p.counts[s]}</td>
                  ))}
                  <td>{p.percent} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">
          Aufgaben gesamt: {EXERCISES.length} · Ausführungen gesamt: {Object.values(state.tasks).reduce((a, t) => a + t.runs, 0)} · Prüfungen gesamt:{' '}
          {Object.values(state.tasks).reduce((a, t) => a + t.checks, 0)}
        </p>
      </section>

      <section className="card">
        <h2>Sicherung</h2>
        <p>
          Der Fortschritt wird automatisch im lokalen Speicher dieses Browsers abgelegt – getrennt von den Übungsdatenbanken. Er geht verloren, wenn du die
          Browserdaten löschst oder einen anderen Browser nutzt. Sichere ihn deshalb regelmäßig als JSON-Datei.
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={exportJson}>
            Fortschritt exportieren (JSON)
          </button>
          <label className="btn">
            Fortschritt importieren …
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
        {message && (
          <p className={message.ok ? 'feedback feedback-ok' : 'feedback feedback-error'} role="status">
            {message.text}
          </p>
        )}
      </section>

      <section className="card danger-zone">
        <h2>Fortschritt zurücksetzen</h2>
        <p>Löscht alle Status, Wiederholungspläne, Entwürfe und Testergebnisse in diesem Browser. Das kann nicht rückgängig gemacht werden.</p>
        <button type="button" className="btn btn-danger" onClick={() => { setResetConfirmed(false); setAskReset(true); }}>
          Gesamten Fortschritt zurücksetzen …
        </button>
      </section>

      <Modal
        open={!!pendingImport}
        title="Fortschritt importieren?"
        confirmLabel="Importieren und ersetzen"
        onConfirm={() => {
          dispatch({ type: 'import', state: pendingImport! });
          setMessage({ ok: true, text: `Import erfolgreich: ${Object.keys(pendingImport!.tasks).length} Aufgabeneinträge übernommen.` });
          setPendingImport(null);
        }}
        onCancel={() => setPendingImport(null)}
      >
        <p>
          Die Datei enthält {pendingImport ? Object.keys(pendingImport.tasks).length : 0} Aufgabeneinträge. Dein aktueller Fortschritt wird dabei{' '}
          <strong>ersetzt</strong>.
        </p>
      </Modal>

      <Modal
        open={askReset}
        title="Wirklich alles zurücksetzen?"
        confirmLabel="Ja, endgültig löschen"
        danger
        onConfirm={() => {
          if (!resetConfirmed) return;
          dispatch({ type: 'reset' });
          setAskReset(false);
          setMessage({ ok: true, text: 'Der Fortschritt wurde zurückgesetzt.' });
        }}
        onCancel={() => setAskReset(false)}
      >
        <p>Tipp: Exportiere vorher eine Sicherung.</p>
        <label className="check">
          <input type="checkbox" checked={resetConfirmed} onChange={(e) => setResetConfirmed(e.target.checked)} /> Ich möchte meinen gesamten Lernfortschritt
          unwiderruflich löschen.
        </label>
        {!resetConfirmed && <p className="small muted">Bitte bestätige zuerst das Kontrollkästchen.</p>}
      </Modal>
    </div>
  );
}
