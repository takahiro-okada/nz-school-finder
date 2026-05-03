import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './i18n/request.ts',
  localePrefix: 'never'
} as any);

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  webpack(config) {
    if (config.resolve?.extensions && !config.resolve.extensions.includes('.json')) {
      config.resolve.extensions.push('.json');
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
