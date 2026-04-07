import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'ClearConsent — Verified Informed Consent',
  description:
    'AI-powered patient education and informed consent verification for hospitals. Reduce liability with verified understanding certificates.',
  keywords:
    'informed consent, healthcare, patient education, legal compliance, HIPAA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body><Providers>{children}</Providers>
      </body>

    </html>
  );
}
