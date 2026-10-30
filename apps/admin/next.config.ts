import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@quizate/shared'],
  poweredByHeader: false,
};

export default config;
