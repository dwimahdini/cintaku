/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'akamai-static.shorttv.live' },
      { protocol: 'https', hostname: '**.shorttv.live' },
      { protocol: 'https', hostname: 'cdn.dramabos.live' },
      { protocol: 'https', hostname: 'cdn.dracinapi.com' },
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: '**.reelshort.com' },
      { protocol: 'https', hostname: '**.dramabox.com' },
    ],
  },
};
export default nextConfig;
