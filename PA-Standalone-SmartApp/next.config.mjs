/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the SMART app to be embedded in an EHR iframe
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "X-Frame-Options", value: "ALLOWALL" }],
      },
    ];
  },
};

export default nextConfig;
