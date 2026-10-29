/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_GRAPHQL_URL: "https://astc-api.joyit.io/graphql",
    NEXT_PUBLIC_API_URL: "https://astc-api.joyit.io/graphql",
    NEXT_PUBLIC_PROJECT_GRAPHQL_URL: "https://astc-api.joyit.io/graphql",
    NEXT_PUBLIC_BACKOFFICE_GRAPHQL_URL: "https://astc-api.joyit.io/graphql",
    NEXT_PUBLIC_AUTH_FRONTEND_URL: "https://astc-auth.joyit.io",
    NEXT_PUBLIC_AUTH_API_URL: "https://astc-auth.joyit.io",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  experimental: {
    cpus: 2,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;

