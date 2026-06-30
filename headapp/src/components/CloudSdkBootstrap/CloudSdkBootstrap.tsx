// app/components/CloudSdkBootstrap.tsx
'use client';
import { useEffect } from 'react';

export default function CloudSdkBootstrap() {
  useEffect(() => {
    (async () => {
      const { CloudSDK } = await import('@sitecore-cloudsdk/core/browser');
      await import('@sitecore-cloudsdk/events/browser');

      CloudSDK({
        sitecoreEdgeContextId: process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID!,
        siteName: 'akshayxmc',
        enableBrowserCookie: true,
      })
        .addEvents()
        .initialize();
    })();
  }, []);

  return null;
}