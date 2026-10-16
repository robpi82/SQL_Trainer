import { medals, streak, longestStreak, totalXp, XP_PER_STATUS } from '../game/rewards';
import { useProgress } from '../progress/ProgressContext';

export function MedalsPage() {
  const { state } = useProgress();
  const list = medals(state);
  const earned = list.filter((m) => m.earned);
  return (
    <div className="page">
      <h1>Medaillen</h1>
      <p>
        {earned.length} von {list.length} Medaillen verdient · {totalXp(state).toLocaleString('de-DE')} XP · aktuelle Serie {streak(state)} Tag(e), längste Serie{' '}
        {longestStreak(state)} Tag(e).
      </p>
      <ul className="medal-grid">
        {list.map((m) => (
          <li key={m.id} className={m.earned ? 'medal earned' : 'medal'}>
            <span className="medal-icon" aria-hidden="true">
              {m.icon}
            </span>
            <span className="medal-title">{m.title}</span>
            <span className="medal-desc small">{m.description}</span>
            <span className="medal-state small">{m.earned ? 'Verdient' : m.progress ? `Fortschritt: ${m.progress}` : 'Noch offen'}</span>
          </li>
        ))}
      </ul>
      <section className="card">
        <h2>So entstehen XP, Serie und Medaillen</h2>
        <ul>
          <li>
            <strong>XP</strong> je Aufgabe: selbstständig gelöst {XP_PER_STATUS.selbststaendig} XP, mit Hilfe gelöst {XP_PER_STATUS.mit_hilfe} XP, Musterlösung
            angesehen 0 XP. Es zählt der beste Status einer Aufgabe – mehrfaches Lösen bringt keine zusätzlichen XP.
          </li>
          <li>
            <strong>Serie</strong>: aufeinanderfolgende Tage, an denen du mindestens eine Aufgabe richtig gelöst hast. Ein Tag ohne Lösung beendet die Serie; heute
            zählt, sobald du die erste Aufgabe löst.
          </li>
          <li>
            <strong>Medaillen</strong> folgen festen Kriterien (siehe oben). Es gibt keine Ranglisten und keinen Vergleich mit anderen – nur deinen eigenen
            Fortschritt.
          </li>
        </ul>
      </section>
    </div>
  );
}
