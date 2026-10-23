'use client';

import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { mockEmergencias } from '@/lib/mock-data';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await api.get('/emergencias?limite=10');
        if (res.data?.datos?.emergencias && res.data.datos.emergencias.length > 0) {
          const ids = res.data.datos.emergencias.map((e: any) => e.id);
          const logsPromises = ids.slice(0, 5).map((id: number) => api.get(`/emergencias/${id}/historial`));
          const logsResponses = await Promise.all(logsPromises);
          const allLogs = logsResponses.flatMap((r) => r.data?.datos || []);
          setLogs(allLogs.length > 0 ? allLogs : mockEmergencias.flatMap((e) => e.logs_auditoria || []));
        } else {
          setLogs(mockEmergencias.flatMap((e) => e.logs_auditoria || []));
        }
      } catch (err) {
        setLogs(mockEmergencias.flatMap((e) => e.logs_auditoria || []));
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bitácora de Auditoría y Trazabilidad (RNF-09)</h1>
        <p className="text-sm text-slate-500">
          Registro inmutable de acciones, actores, transiciones de estado y modificaciones de datos sensibles
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Cargando registros de auditoría...</p>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No hay registros de auditoría recientes.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Caso #</th>
                <th className="px-4 py-3">Acción Realizada</th>
                <th className="px-4 py-3">Actor Responsable</th>
                <th className="px-4 py-3">Transición</th>
                <th className="px-4 py-3">Datos Modificados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 text-xs">
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {new Date(log.fecha).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                    #{log.id_emergencia}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{log.accion_realizada}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {log.usuario_accion?.nombre} {log.usuario_accion?.apellido} ({log.usuario_accion?.rol})
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {log.estado_anterior || 'INICIAL'} → <span className="font-bold text-blue-600">{log.estado_nuevo}</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate font-mono text-[11px] text-slate-500">
                    {JSON.stringify(log.datos_modificados)}
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
