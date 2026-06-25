import { draftMode } from 'next/headers';
import Bootstrap from 'src/Bootstrap';

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ site: string }>;
}) {
  const { site } = await params;
  const { isEnabled } = await draftMode();
        throw new Error('Intentional test error for deployment validation.');
  return (
    <>
      <Bootstrap siteName={site} isPreviewMode={isEnabled} />
      {children}
    </>
  );
}
