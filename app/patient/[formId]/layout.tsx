import Providers from '@/app/providers';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}