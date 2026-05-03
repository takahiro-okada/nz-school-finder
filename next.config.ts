import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './i18n/request.ts',
  localePrefix: 'never'
} as any);

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
