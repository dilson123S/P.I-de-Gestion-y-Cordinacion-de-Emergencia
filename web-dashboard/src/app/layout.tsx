import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import RealtimeSync from '@/components/RealtimeSync';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SIGEM - Plataforma de Gestión y Coordinación de Emergencias',
  description: 'Canal digital unificado de despacho, control y respuesta ante emergencias.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SocketProvider>
          <AuthProvider>
            <RealtimeSync />
            {children}
          </AuthProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
