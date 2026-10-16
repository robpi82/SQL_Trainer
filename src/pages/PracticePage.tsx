import { useState } from 'react';
import { COURSE_LESSONS, DIFFICULTY_LABEL, EXERCISES, MODULES, TYPE_LABEL, lessonById, lessonLabel } from '../content';
import type { ExerciseType } from '../content/types';
import { StatusBadge } from '../components/StatusBadge';
import { DATABASES, DB_IDS } from '../db/seeds';
import { Link } from '../lib/router';
import { STATUS_LABEL, statusOf, type TaskStatus } from '../progress/model';
import { useProgress } from '../progress/ProgressContext';

export function PracticePage() {
  const { state } = useProgress();
  const [mod, setMod] = useState('alle');
  const [diff, setDiff] = useState('alle');
  const [type, setType] = useState('alle');
  const [status, setStatus] = useState('alle');
  const [db, setDb] = useState('alle');
  const [concept, setConcept] = useState('alle');
  const concepts = [...new Set(EXERCISES.flatMap((e) => e.concepts))].sort((a, b) => a.localeCompare(b, 'de'));

  const list = EXERCISES.filter((e) => {
    const lesson = lessonById.get(e.lessonId)!;
    return (
      (mod === 'alle' || String(lesson.moduleId) === mod) &&
      (diff === 'alle' || String(e.difficulty) === diff) &&
      (type === 'alle' || e.type === type) &&
      (status === 'alle' || statusOf(state, e.id) === status) &&
      (db === 'alle' || e.db === db) &&
      (concept === 'alle' || e.concepts.includes(concept))
    );
  });

  return (
    <div className="page">
      <h1>Freies Üben</h1>
      <p>Wähle Aufgaben nach Thema, Schwierigkeit oder Status. Der Fortschritt wird genauso gespeichert wie im Lernpfad.</p>
      <div className="card filters" role="group" aria-label="Filter">
        <label>
          Modul
          <select value={mod} onChange={(e) => setMod(e.target.value)}>
            <option value="alle">Alle Module</option>
            <optgroup label="Lernpfad">
              {MODULES.filter((m) => m.status === 'verfügbar').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}. {m.short}
                </option>
              ))}
            </optgroup>
            <optgroup label="Unterricht">
              {COURSE_LESSONS.map((l) => (
                <option key={l.id} value={l.moduleId}>
                  {l.course!.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label>
          Thema
          <select value={concept} onChange={(e) => setConcept(e.target.value)}>
            <option value="alle">Alle Themen</option>
            {concepts.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Schwierigkeit
          <select value={diff} onChange={(e) => setDiff(e.target.value)}>
            <option value="alle">Alle</option>
            {[1, 2, 3].map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Aufgabentyp
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="alle">Alle</option>
            {(Object.keys(TYPE_LABEL) as ExerciseType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="alle">Alle</option>
            {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Datenbank
          <select value={db} onChange={(e) => setDb(e.target.value)}>
            <option value="alle">Alle</option>
            {DB_IDS.map((d) => (
              <option key={d} value={d}>
                {DATABASES[d].title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="small muted" role="status">
        {list.length} Aufgabe{list.length === 1 ? '' : 'n'} gefunden.
      </p>
      <div className="table-scroll">
        <table className="list-table">
          <thead>
            <tr>
              <th scope="col">Aufgabe</th>
              <th scope="col">Lektion</th>
              <th scope="col">Typ</th>
              <th scope="col">Schwierigkeit</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link to={`/aufgabe/${e.id}?modus=frei`}>{e.title}</Link>
                  <div className="small muted">{e.concepts.join(' · ')}</div>
                </td>
                <td>{lessonLabel(lessonById.get(e.lessonId)!)}</td>
                <td>{TYPE_LABEL[e.type]}</td>
                <td>
                  <span className={`badge diff-${e.difficulty}`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                </td>
                <td>
                  <StatusBadge status={statusOf(state, e.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
