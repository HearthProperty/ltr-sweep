import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monthly Sweep Simulator | Hearth Property',
  description:
    'Preview a clean Monthly Sweep with fees, reserves, pass-throughs, and expected owner distribution before you switch managers. Free instant simulation.',
  openGraph: {
    title: 'See What Your Monthly Owner Statement Should Look Like | Hearth',
    description:
      'Preview a clean Monthly Sweep with fees, reserves, pass-throughs, and expected owner distribution — in 60 seconds.',
    url: 'https://sweep.hearthproperty.com',
    siteName: 'Hearth Property',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
