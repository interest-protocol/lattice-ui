/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@privy-io/react-auth'],
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cryptologos.cc' },
    ],
  },
};

module.exports = nextConfig;
