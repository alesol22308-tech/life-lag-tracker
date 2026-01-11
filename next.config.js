/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Skip static generation for routes that use Supabase
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig
