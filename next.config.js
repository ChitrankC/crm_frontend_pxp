/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://38.248.12.151:8000/:path*" }];
  },
};

module.exports = nextConfig;
