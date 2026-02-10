/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['@privy-io/react-auth'],
  reactCompiler: true,
};

module.exports = nextConfig;
