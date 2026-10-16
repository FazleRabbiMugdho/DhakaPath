/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allows an isolated build output (e.g. NEXT_DIST_DIR=.next-e2e) next to a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The old standalone developer pages were folded into the single /app experience.
  async redirects() {
    return [
      { source: "/command-center", destination: "/app", permanent: true },
      { source: "/track-1-engine", destination: "/app#plan", permanent: true },
      { source: "/track-2-trust-cms", destination: "/app#alerts", permanent: true },
      { source: "/track-3-commute", destination: "/app#plan", permanent: true },
      { source: "/track-4-map-shell", destination: "/app#plan", permanent: true },
    ];
  },
};

export default nextConfig;
