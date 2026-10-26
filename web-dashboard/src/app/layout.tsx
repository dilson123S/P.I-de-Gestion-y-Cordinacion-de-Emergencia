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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(event) {
                var msg = (event && event.message) || '';
                if (msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1) {
                  var lastReload = Number(sessionStorage.getItem('sigem_last_chunk_reload') || 0);
                  var now = Date.now();
                  if (now - lastReload > 8000) {
                    sessionStorage.setItem('sigem_last_chunk_reload', String(now));
                    console.warn('ChunkLoadError detectado. Recargando automáticamente...');
                    window.location.reload();
                  }
                }
              });
            `,
          }}
        />
      </head>
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
