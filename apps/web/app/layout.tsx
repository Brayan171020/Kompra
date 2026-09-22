import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kompra — compras en equipo',
  description: 'Listas de compras inteligentes para hogares que se organizan juntos.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
