'use client';

import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Usuario, formatearRol } from '@/types';
import { mockUsuarios } from '@/lib/mock-data';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await api.get('/usuarios');
        if (res.data?.datos && res.data.datos.length > 0) {
          setUsuarios(res.data.datos);
        } else {
          setUsuarios(mockUsuarios);
        }
      } catch (err) {
        setUsuarios(mockUsuarios);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Directorio de Usuarios y Actores</h1>
        <p className="text-sm text-slate-500">
          Administración de cuentas: Administradores y Operadores Integrales (Web), Personal de Campo y Ciudadanos (Móvil)
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Cargando usuarios...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-700">#{u.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.nombre} {u.apellido}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {formatearRol(u.rol)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{u.telefono || '—'}</td>
                  <td className="px-4 py-3">
                    {u.activo ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700">
                        <XCircle className="h-3.5 w-3.5" /> Inactivo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
