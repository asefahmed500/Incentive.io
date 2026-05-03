/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        'fs/promises': false,
        'timers/promises': false,
        async_hooks: false,
        child_process: false,
        process: false,
        modules: false,
      };
    } else {
      config.externals = config.externals || [];
      if (!Array.isArray(config.externals)) {
        config.externals = [config.externals];
      }
      config.externals.push({
        mongoose: 'commonjs mongoose',
      });
    }
    return config;
  },
};

export default nextConfig;