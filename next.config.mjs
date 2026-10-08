/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_GRAPHQL_URL: "https://astc-api.joyit.io/graphql",
    NEXT_PUBLIC_API_URL: "https://astc-api.joyit.io/graphql",
    NEXT_PUBLIC_PROJECT_GRAPHQL_URL: "https://astc-api.joyit.io/graphql",
    NEXT_PUBLIC_BACKOFFICE_GRAPHQL_URL: "https://astc-api.joyit.io/graphql",
  },
      typescript: {
        ignoreBuildErrors: true,
      },
      // Limita los workers del build a 2. Sin esto Next calcula cpus-1 = 11 workers
      // (por los nucleos del host) y en emulacion ARM se excede la RAM de Docker
      // ("Collecting page data" -> rpc error Unavailable / EOF).
      experimental: {
        cpus: 2,
      },
  images: {
    unoptimized: true,
  },
}

export default nextConfig


