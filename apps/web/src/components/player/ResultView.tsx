'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { AnswerRecord } from '@quizate/game';
import { Badge, Button, Card, Notice, Stat } from '@/components/ui';
import { useT } from '@/i18n';
import { productName } from '@/lib/product';
import { useStore } from '@/lib/store';
import type { MatchSummary, Question } from '@/lib/types';
import type { BiText } from '@/data/questions';

/** FR-08: score, monthly points earned, rating change, rematch and share. Values come from the recorded match. */
export function ResultView({
  summary,
  questions,
  mine,
  onAgain,
  onRematch,
}: {
  summary: MatchSummary;
  questions: Question[];
  mine: AnswerRecord[];
  onAgain: () => void;
  onRematch?: () => void;
}) {
  const { state, dispatch } = useStore();
  const { d, fill, num, pick, locale } = useT();
  const [copied, setCopied] = useState(false);
  const [review, setReview] = useState(false);
  const ranked = summary.mode === 'ranked';
  const outcomeKey = summary.forfeit ? 'forfeit' : (summary.outcome ?? 'draw');
  const tone = outcomeKey === 'win' ? 'ok' : outcomeKey === 'draw' ? 'brand' : 'bad';
  const ratingDelta = summary.ratingAfter - summary.ratingBefore;
  const opp = summary.opponent;
  const following = opp ? state.following.includes(opp.id) : false;

  async function share() {
    const text = fill(d.result.shareText, {
      name: state.player?.name ?? '',
      score: num(summary.myScore),
      product: productName(locale),
    });
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Cancelled by the user.
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card className="text-center">
        <Badge tone={tone} className="mb-3 px-4 py-1 text-sm">
          {d.result[outcomeKey]}
        </Badge>
        <div className="tabular flex items-center justify-center gap-4 text-4xl font-black">
          <span className="text-brand-deep">{num(summary.myScore)}</span>
          <span className="text-xl text-muted">:</span>
          <span className="text-muted">
            {summary.opponentScore === null ? '—' : num(summary.opponentScore)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {opp ? fill(d.history.vs, { name: pick(opp.name) }) : ''}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-start">
          <Stat
            label={d.result.monthlyPoints}
            value={ranked ? `+${num(summary.monthlyPoints, 1)}` : '—'}
          />
          <Stat
            label={d.result.rating}
            value={ranked ? `${ratingDelta >= 0 ? '+' : ''}${num(ratingDelta)}` : '—'}
            hint={ranked ? num(summary.ratingAfter) : null}
          />
          <Stat
            label={d.result.accuracy}
            value={`${num(Math.round((summary.correct / summary.questions) * 100))}%`}
          />
        </div>
        {ranked && !summary.counted && (
          <div className="mt-3">
            <Notice tone="warn">
              {fill(d.result.notCounted, { cap: num(state.config.monthlyCap) })}
            </Notice>
          </div>
        )}
        {!ranked && <p className="mt-3 text-xs text-muted">{d.result.practiceNote}</p>}
        {Boolean(summary.xp) && (
          <p className="mt-3 text-sm font-semibold text-violet">+{num(summary.xp ?? 0)} XP</p>
        )}
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" onClick={onAgain}>
          {ranked ? d.result.playAgain : d.result.practiceAgain}
        </Button>
        {onRematch && (
          <Button size="lg" variant="secondary" onClick={onRematch}>
            {d.result.rematch}
          </Button>
        )}
        <Button variant="secondary" onClick={share}>
          {copied ? d.result.copied : d.result.share}
        </Button>
        {opp && !opp.id.startsWith('bot') && (
          <Button variant="secondary" onClick={() => dispatch({ type: 'follow', id: opp.id })}>
            {following ? d.result.following : d.result.follow}
          </Button>
        )}
      </div>
      {ranked && <p className="text-center text-xs text-muted">{d.result.samePair}</p>}

      <Card>
        <button
          type="button"
          className="flex w-full items-center justify-between font-semibold"
          aria-expanded={review}
          onClick={() => setReview(!review)}
        >
          {d.result.review}
          <span aria-hidden>{review ? '−' : '+'}</span>
        </button>
        {review && (
          <ol className="mt-3 space-y-2">
            {questions.map((q, i) => {
              const a = mine[i];
              return (
                <li key={q.id} className="rounded-xl bg-page p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">
                      {num(i + 1)}. {pick(q.text)}
                    </span>
                    {q.sponsored && <Badge tone="gold">{d.common.sponsored}</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs">
                    <span className="text-ok">
                      ✓ <bdi>{pick(q.options[0] as BiText)}</bdi>
                    </span>
                    {a && !a.correct && a.option !== null && (
                      <span className="text-bad">
                        ✗ <bdi>{pick(q.options[a.option] as BiText)}</bdi>
                      </span>
                    )}
                    {a?.option === null && <span className="text-warn">{d.match.timeUp}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <div className="text-center">
        <Link href="/play" className="text-sm font-semibold text-brand">
          {d.result.home}
        </Link>
      </div>
    </div>
  );
}
