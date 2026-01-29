/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['ws', 'bufferutil', 'utf-8-validate'],
  experimental: {
    serverComponentsExternalPackages: ['ws', 'bufferutil', 'utf-8-validate'],
    outputFileTracingIncludes: {
      '/api/brain': ['./src/second-brain/**/*'],
    },
  },
};

export default nextConfig;
// deploy 1769554074
