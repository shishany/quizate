'use client';

import { useMemo, useState } from 'react';
import { Badge, Button, Card, Notice } from '@/components/ui';
import { useT } from '@/i18n';
import { ADMIN_USERS, adminName } from '@/lib/sample';
import { questionActionAllowed, useStore } from '@/lib/store';
import type { Question, QuestionAction } from '@/lib/types';
import type { BiText, Category } from '@/data/questions';
import { QuestionImage } from '@/components/QuestionImage';

const STATUS_TONE = {
  draft: 'neutral',
  in_review: 'warn',
  published: 'ok',
  retired: 'bad',
} as const;
const CHECKS = [
  'check_accuracy',
  'check_source',
  'check_language',
  'check_policy',
  'check_bias',
] as const;

/** FR-12 to FR-14: question bank, two-step review with a checklist, reports, retire and void. */
export default function QuestionsPage() {
  const { state } = useStore();
  const { d, fill, num, pick } = useT();
  const [status, setStatus] = useState<'all' | Question['status']>('all');
  const [difficulty, setDifficulty] = useState<'all' | Question['difficulty']>('all');
  const [category, setCategory] = useState<'all' | Category>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const canCreate = state.adminRole === 'content_editor' || state.adminRole === 'super_admin';

  const list = useMemo(
    () =>
      state.questions.filter(
        (q) =>
          (status === 'all' || q.status === status) &&
          (difficulty === 'all' || q.difficulty === difficulty) &&
          (category === 'all' || q.category === category) &&
          (!search || `${q.text.ar} ${q.text.en}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [state.questions, status, difficulty, category, search],
  );
  const open = state.questions.find((q) => q.id === openId) ?? null;
  const select = 'rounded-xl border border-line bg-white px-3 py-2 text-sm';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{d.questions.title}</h1>
        {canCreate && <Button onClick={() => setCreating(true)}>{d.questions.newDraft}</Button>}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className={`${select} min-w-48 flex-1`}
          placeholder={d.questions.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={d.questions.search}
        />
        <select
          className={select}
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          aria-label={d.questions.status}
        >
          <option value="all">
            {d.questions.status}: {d.questions.all}
          </option>
          {(Object.keys(d.questions.statuses) as Question['status'][]).map((s) => (
            <option key={s} value={s}>
              {d.questions.statuses[s]}
            </option>
          ))}
        </select>
        <select
          className={select}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
          aria-label={d.questions.difficulty}
        >
          <option value="all">
            {d.questions.difficulty}: {d.questions.all}
          </option>
          {(Object.keys(d.questions.difficulties) as Question['difficulty'][]).map((s) => (
            <option key={s} value={s}>
              {d.questions.difficulties[s]}
            </option>
          ))}
        </select>
        <select
          className={select}
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
          aria-label={d.questions.category}
        >
          <option value="all">
            {d.questions.category}: {d.questions.all}
          </option>
          {(Object.keys(d.questions.categories) as Category[]).map((s) => (
            <option key={s} value={s}>
              {d.questions.categories[s]}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-muted">{fill(d.questions.count, { n: num(list.length) })}</p>

      <Card className="p-0 sm:p-0">
        <ul className="divide-y divide-line">
          {list.map((q) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => setOpenId(q.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-page"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{pick(q.text)}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-muted">
                    <span>{d.questions.categories[q.category]}</span>·
                    <span>{d.questions.difficulties[q.difficulty]}</span>·
                    <span className="tabular">v{num(q.version)}</span>
                    {q.reports > 0 && (
                      <span className="text-warn">
                        · {d.questions.reports}: {num(q.reports)}
                      </span>
                    )}
                  </div>
                </div>
                {q.sponsored && <Badge tone="gold">{d.common.sponsored}</Badge>}
                <Badge tone={STATUS_TONE[q.status]}>{d.questions.statuses[q.status]}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {open && <QuestionPanel q={open} onClose={() => setOpenId(null)} />}
      {creating && <DraftForm onClose={() => setCreating(false)} />}
    </div>
  );
}

function Panel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { d } = useT();
  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-navy/30"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} autoFocus>
            {d.common.close}
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function QuestionPanel({ q, onClose }: { q: Question; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { d, num, date, locale } = useT();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const me = state.adminRole ? ADMIN_USERS[state.adminRole].id : '';
  const allowed = (a: QuestionAction) => questionActionAllowed(state, q, a);
  const reviewerRole = state.adminRole === 'content_reviewer' || state.adminRole === 'super_admin';

  function act(action: QuestionAction) {
    if (action === 'approved' && !CHECKS.every((c) => checks[c]))
      return setError(d.questions.checklistRequired);
    if ((action === 'rejected' || action === 'retired' || action === 'voided') && !reason.trim())
      return setError(d.config.reasonRequired);
    dispatch({ type: 'question', id: q.id, action, reason: reason.trim() || undefined });
    setError('');
    setReason('');
  }

  return (
    <Panel title={`${d.questions.question} ${q.id}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={STATUS_TONE[q.status]}>{d.questions.statuses[q.status]}</Badge>
          <Badge>{d.questions.difficulties[q.difficulty]}</Badge>
          <Badge>{d.questions.categories[q.category]}</Badge>
          {q.sponsored && <Badge tone="gold">{d.questions.sponsored}</Badge>}
          {q.image && <Badge tone="violet">{d.questions.imageType}</Badge>}
          <Badge tone="warn">{d.questions.urduPending}</Badge>
        </div>
        <QuestionImage id={q.image} />
        <div className="grid gap-3 rounded-xl bg-page p-3">
          <p dir="rtl" lang="ar" className="font-semibold">
            {q.text.ar}
          </p>
          <p dir="ltr" lang="en" className="font-semibold">
            {q.text.en}
          </p>
        </div>
        <div>
          <div className="mb-1 font-medium">{d.questions.options}</div>
          <ol className="space-y-1">
            {q.options.map((o: BiText, i) => (
              <li
                key={i}
                className={`rounded-lg px-3 py-1.5 ${i === 0 ? 'bg-ok-bg text-ok' : 'bg-page'}`}
              >
                {o.ar} · <span dir="ltr">{o.en}</span>
              </li>
            ))}
          </ol>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          <div>
            <dt className="text-muted">{d.questions.author}</dt>
            <dd>{adminName(q.authorId, locale)}</dd>
          </div>
          <div>
            <dt className="text-muted">{d.questions.reviewer}</dt>
            <dd>{q.reviewerId ? adminName(q.reviewerId, locale) : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">{d.questions.version}</dt>
            <dd className="tabular">{num(q.version)}</dd>
          </div>
          <div>
            <dt className="text-muted">{d.questions.reports}</dt>
            <dd className="tabular">{num(q.reports)}</dd>
          </div>
        </dl>

        {q.status === 'in_review' &&
          reviewerRole &&
          (q.authorId === me ? (
            <Notice tone="warn">{d.questions.twoPerson}</Notice>
          ) : (
            <fieldset className="rounded-xl border border-line p-3">
              <legend className="px-1 font-medium">{d.questions.checklist}</legend>
              {CHECKS.map((c) => (
                <label key={c} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand"
                    checked={Boolean(checks[c])}
                    onChange={(e) => setChecks({ ...checks, [c]: e.target.checked })}
                  />
                  {d.questions[c]}
                </label>
              ))}
            </fieldset>
          ))}

        {(allowed('rejected') || allowed('retired')) && (
          <label className="block">
            <span className="mb-1 block font-medium">{d.questions.reason}</span>
            <input
              className="w-full rounded-xl border border-line px-3 py-2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-bad">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {allowed('submitted') && (
            <Button onClick={() => act('submitted')}>{d.questions.submit}</Button>
          )}
          {allowed('approved') && (
            <Button onClick={() => act('approved')}>{d.questions.approve}</Button>
          )}
          {allowed('rejected') && (
            <Button variant="secondary" onClick={() => act('rejected')}>
              {d.questions.reject}
            </Button>
          )}
          {allowed('retired') && (
            <Button variant="secondary" onClick={() => act('retired')}>
              {d.questions.retire}
            </Button>
          )}
          {allowed('voided') && (
            <Button variant="danger" onClick={() => act('voided')}>
              {d.questions.void}
            </Button>
          )}
        </div>
        {allowed('voided') && <p className="text-xs text-muted">{d.questions.voidNote}</p>}

        <div>
          <div className="mb-1 font-medium">{d.questions.history}</div>
          <ol className="space-y-1 text-xs">
            {[...q.history].reverse().map((h, i) => (
              <li key={i} className="flex justify-between gap-2 rounded-lg bg-page px-3 py-1.5">
                <span>
                  {d.questions.actions[h.action]} · {adminName(h.actor, locale)}
                </span>
                <span className="text-muted">{date(h.at, true)}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-muted">{d.questions.versionNote}</p>
      </div>
    </Panel>
  );
}

function DraftForm({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const { d, fill } = useT();
  const [category, setCategory] = useState<Category>('general');
  const [difficulty, setDifficulty] = useState<Question['difficulty']>('medium');
  const [text, setText] = useState<BiText>({ ar: '', en: '' });
  const [options, setOptions] = useState<BiText[]>(
    Array.from({ length: 4 }, () => ({ ar: '', en: '' })),
  );
  const [error, setError] = useState('');
  const input = 'w-full rounded-xl border border-line px-3 py-2 text-sm';

  function save() {
    const filled = [text, ...options].every((t) => t.ar.trim() && t.en.trim());
    if (!filled) return setError(d.questions.formInvalid);
    dispatch({
      type: 'questionDraft',
      question: {
        id: `q-${Date.now().toString(36)}`,
        category,
        difficulty,
        text,
        options,
        expiresAt: null,
        sponsored: false,
        campaignId: null,
      },
    });
    onClose();
  }

  return (
    <Panel title={d.questions.newDraft} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <select
            className={input}
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            aria-label={d.questions.category}
          >
            {(Object.keys(d.questions.categories) as Category[]).map((c) => (
              <option key={c} value={c}>
                {d.questions.categories[c]}
              </option>
            ))}
          </select>
          <select
            className={input}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Question['difficulty'])}
            aria-label={d.questions.difficulty}
          >
            {(Object.keys(d.questions.difficulties) as Question['difficulty'][]).map((c) => (
              <option key={c} value={c}>
                {d.questions.difficulties[c]}
              </option>
            ))}
          </select>
        </div>
        <label className="block">
          <span className="mb-1 block font-medium">{d.questions.textAr}</span>
          <input
            dir="rtl"
            className={input}
            value={text.ar}
            onChange={(e) => setText({ ...text, ar: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-medium">{d.questions.textEn}</span>
          <input
            dir="ltr"
            className={input}
            value={text.en}
            onChange={(e) => setText({ ...text, en: e.target.value })}
          />
        </label>
        {options.map((o, i) => (
          <fieldset key={i} className="grid grid-cols-2 gap-2">
            <legend className="mb-1 font-medium">
              {i === 0 ? d.questions.correct : fill(d.questions.wrong, { i })}
            </legend>
            <input
              dir="rtl"
              aria-label={`${d.questions.textAr} ${i + 1}`}
              className={input}
              value={o.ar}
              onChange={(e) =>
                setOptions(options.map((x, k) => (k === i ? { ...x, ar: e.target.value } : x)))
              }
            />
            <input
              dir="ltr"
              aria-label={`${d.questions.textEn} ${i + 1}`}
              className={input}
              value={o.en}
              onChange={(e) =>
                setOptions(options.map((x, k) => (k === i ? { ...x, en: e.target.value } : x)))
              }
            />
          </fieldset>
        ))}
        {error && (
          <p role="alert" className="text-bad">
            {error}
          </p>
        )}
        <Button onClick={save}>{d.questions.createDraft}</Button>
      </div>
    </Panel>
  );
}
