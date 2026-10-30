import { QUESTION_IMAGES } from '@/data/images';

/** The picture of an image question, at a fixed 3:2 ratio so the layout never jumps. */
export function QuestionImage({
  id,
  className = '',
}: {
  id: string | undefined;
  className?: string;
}) {
  const Image = id ? QUESTION_IMAGES[id] : undefined;
  if (!Image) return null;
  return (
    <div
      className={`mx-auto aspect-[3/2] w-full max-w-xs overflow-hidden rounded-xl border border-line shadow-sm ${className}`}
    >
      <Image />
    </div>
  );
}
