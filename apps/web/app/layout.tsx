import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kompra — compras en equipo',
  description: 'Listas asignadas e inventario general para organizar cualquier compra.',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
