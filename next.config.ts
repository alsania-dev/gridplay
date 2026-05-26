import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Exclude test files from being treated as pages/routes
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].map((ext) => {
    // This ensures files like *.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx are excluded
    return ext;
  }),
};

export default nextConfig;
