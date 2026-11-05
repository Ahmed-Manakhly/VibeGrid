// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  staticPageGenerationTimeout: 180,
  experimental: {
    cpus: 1,
    serverComponentsExternalPackages: [
      'pino',
      'pino-roll',
      'thread-stream',
    ],
  },
  images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '9000',
          pathname: '/**',
        },
        {
          protocol: 'http',
          hostname: '127.0.0.1',
          port: '9000',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'vibegrid.manakhly.tech',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'utfs.io',
        },
      ],
    },
};

export default nextConfig;

