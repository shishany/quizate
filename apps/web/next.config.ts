import type { NextConfig } from 'next';

/**
 * Static export: the sample version needs no server, so it is published as plain files (apps/web/out). Security
 * headers are set by the host (vercel.json), since a static export cannot send headers itself.
 */
const config: NextConfig = {
  output: 'export',
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default config;
