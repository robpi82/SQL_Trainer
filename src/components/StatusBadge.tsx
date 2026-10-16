import { STATUS_LABEL, type TaskStatus } from '../progress/model';

const ICON: Record<TaskStatus, string> = {
  nicht_begonnen: '○',
  in_bearbeitung: '◐',
  loesung_angesehen: '◇',
  mit_hilfe: '◑',
  selbststaendig: '●',
};

export function StatusBadge({ status, compact }: { status: TaskStatus; compact?: boolean }) {
  return (
    <span className={`status status-${status}`} title={STATUS_LABEL[status]}>
      <span aria-hidden="true">{ICON[status]}</span>
      {compact ? <span className="sr-only">{STATUS_LABEL[status]}</span> : ` ${STATUS_LABEL[status]}`}
    </span>
  );
}
