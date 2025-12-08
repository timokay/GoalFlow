'use client';

import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

export function AnalyticsProvider() {
  // Vercel Analytics is automatically initialized when the component mounts
  return <Analytics />;
}

