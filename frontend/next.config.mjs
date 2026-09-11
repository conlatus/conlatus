/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/admin/login",
        permanent: false,
      },
      {
        source: "/signup",
        destination: "/admin/login?tab=register",
        permanent: false,
      },
      {
        source: "/register",
        destination: "/admin/login?tab=register",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
