/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add this to handle custom Pages directory
  pageExtensions: ['page.tsx', 'page.ts', 'tsx', 'ts'],
  // Enable proper filesystem-based routing
  experimental: {
    appDir: false, // Disable if not using App Router
  },
}

module.exports = nextConfig