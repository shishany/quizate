'use client';

import { useT } from '@/i18n';
import { sponsorForCampaign } from '@/data/sponsors';

/** After a sponsored question is revealed, the sponsor's short message: the "ad" is the sponsor (BR-14, FR-16). */
export function SponsorMessage({ campaignId }: { campaignId: string | null }) {
  const { d, fill, pick } = useT();
  const sponsor = sponsorForCampaign(campaignId);
  if (!sponsor) return null;
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
      <span
        className="h-8 w-1.5 shrink-0 rounded-full"
        style={{ background: sponsor.color }}
        aria-hidden
      />
      <span>
        <span className="block text-xs font-semibold text-gold-ink">
          {fill(d.match.sponsoredBy, { name: pick(sponsor.name) })}
        </span>
        {pick(sponsor.tagline)}
      </span>
    </div>
  );
}
