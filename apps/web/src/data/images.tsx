import type { ReactElement } from 'react';

/**
 * Pictures for image questions. Drawn for the demo: country flags with simple public designs, and the logos of the
 * fictional sample sponsors. Production stores uploaded images in object storage, reviewed like any question.
 */
const frame = (children: ReactElement | ReactElement[], bg = '#ffffff') => (
  <svg viewBox="0 0 300 200" className="h-full w-full" role="img" aria-hidden>
    <rect width="300" height="200" rx="12" fill={bg} />
    {children}
  </svg>
);

export const QUESTION_IMAGES: Record<string, () => ReactElement> = {
  'flag-japan': () => frame(<circle cx="150" cy="100" r="56" fill="#bc002d" />),
  'flag-france': () =>
    frame([
      <rect key="a" width="100" height="200" fill="#002395" />,
      <rect key="b" x="200" width="100" height="200" fill="#ed2939" />,
    ]),
  'flag-italy': () =>
    frame([
      <rect key="a" width="100" height="200" fill="#009246" />,
      <rect key="b" x="200" width="100" height="200" fill="#ce2b37" />,
    ]),
  'flag-germany': () =>
    frame([
      <rect key="a" width="300" height="67" fill="#000000" />,
      <rect key="b" y="67" width="300" height="66" fill="#dd0000" />,
      <rect key="c" y="133" width="300" height="67" fill="#ffce00" />,
    ]),
  'flag-sweden': () =>
    frame(
      [
        <rect key="a" x="90" width="36" height="200" fill="#fecc02" />,
        <rect key="b" y="82" width="300" height="36" fill="#fecc02" />,
      ],
      '#006aa7',
    ),
  'logo-masaa': () =>
    frame(
      [
        <path key="cup" d="M105 80h80v45a40 40 0 0 1-80 0z" fill="#f3e3d3" />,
        <path
          key="handle"
          d="M185 92h12a16 16 0 0 1 0 32h-14"
          fill="none"
          stroke="#f3e3d3"
          strokeWidth="8"
        />,
        <path
          key="steam"
          d="M128 66c-8-12 8-18 0-30M150 66c-8-12 8-18 0-30M172 66c-8-12 8-18 0-30"
          fill="none"
          stroke="#e0b089"
          strokeWidth="5"
          strokeLinecap="round"
        />,
        <circle key="moon" cx="232" cy="52" r="16" fill="#e0b089" />,
        <circle key="moon2" cx="240" cy="46" r="14" fill="#6b3e26" />,
      ],
      '#6b3e26',
    ),
  'logo-oasis': () =>
    frame(
      [
        <path key="trunk" d="M148 170c2-30 4-60 2-90h8c2 30 0 60-2 90z" fill="#8a6420" />,
        <path key="l1" d="M152 82c-30-20-58-14-78 4 26-8 50-4 78-4z" fill="#2f7d4a" />,
        <path key="l2" d="M152 82c30-20 58-14 78 4-26-8-50-4-78-4z" fill="#2f7d4a" />,
        <path key="l3" d="M152 80c-18-30-44-38-64-30 24 2 44 14 64 30z" fill="#3c9a5f" />,
        <path key="l4" d="M152 80c18-30 44-38 64-30-24 2-44 14-64 30z" fill="#3c9a5f" />,
        <circle key="d1" cx="142" cy="96" r="6" fill="#a0522d" />,
        <circle key="d2" cx="162" cy="98" r="6" fill="#a0522d" />,
        <rect key="ground" x="60" y="168" width="180" height="8" rx="4" fill="#d4a64c" />,
      ],
      '#fff8e8',
    ),
  'logo-ittisal': () =>
    frame(
      [
        <circle key="dot" cx="150" cy="140" r="12" fill="#ffffff" />,
        <path
          key="w1"
          d="M120 112a42 42 0 0 1 60 0"
          fill="none"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
        />,
        <path
          key="w2"
          d="M98 88a74 74 0 0 1 104 0"
          fill="none"
          stroke="#9fd9f5"
          strokeWidth="10"
          strokeLinecap="round"
        />,
        <path
          key="w3"
          d="M76 64a106 106 0 0 1 148 0"
          fill="none"
          stroke="#1ea7e8"
          strokeWidth="10"
          strokeLinecap="round"
        />,
        <path
          key="plus"
          d="M222 132h28M236 118v28"
          stroke="#d4a64c"
          strokeWidth="9"
          strokeLinecap="round"
        />,
      ],
      '#0b2238',
    ),
};
