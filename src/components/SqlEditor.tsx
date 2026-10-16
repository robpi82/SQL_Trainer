import { useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLite } from '@codemirror/lang-sql';
import { keymap, EditorView } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import type { TableInfo } from '../db/types';
import { useDark } from '../lib/theme';

interface Props {
  value: string;
  onChange?: (v: string) => void;
  onRun?: () => void;
  onCheck?: () => void;
  readOnly?: boolean;
  schema?: TableInfo[];
  minHeight?: string;
  label: string;
}

/**
 * SQL-Editor mit Syntaxhervorhebung (CodeMirror 6, Dialekt SQLite) und Autovervollständigung aus dem Schema.
 * Tastatur: Strg+Enter = Ausführen, Strg+Umschalt+Enter = Antwort prüfen.
 * Tab rückt NICHT ein, damit man mit Tab aus dem Editor heraus navigieren kann.
 */
export function SqlEditor({ value, onChange, onRun, onCheck, readOnly, schema, minHeight = '140px', label }: Props) {
  const dark = useDark();
  const runRef = useRef(onRun);
  const checkRef = useRef(onCheck);
  runRef.current = onRun;
  checkRef.current = onCheck;

  const extensions = useMemo(() => {
    const sch = schema ? Object.fromEntries(schema.map((t) => [t.name, t.columns.map((c) => c.name)])) : undefined;
    return [
      sql({ dialect: SQLite, schema: sch, upperCaseKeywords: true }),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': label }),
      Prec.highest(
        keymap.of([
          { key: 'Mod-Enter', run: () => (runRef.current?.(), true) },
          { key: 'Mod-Shift-Enter', run: () => (checkRef.current?.(), true) },
        ]),
      ),
    ];
  }, [schema, label]);

  return (
    <div className={readOnly ? 'editor readonly' : 'editor'}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={dark ? 'dark' : 'light'}
        readOnly={readOnly}
        editable={!readOnly}
        indentWithTab={false}
        minHeight={minHeight}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: !readOnly, autocompletion: !readOnly }}
      />
    </div>
  );
}
