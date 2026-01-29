/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ws', 'bufferutil', 'utf-8-validate'],
  experimental: {
    serverComponentsExternalPackages: ['ws', 'bufferutil', 'utf-8-validate'],
  },
};

export default nextConfig;
// deploy 1769554074
