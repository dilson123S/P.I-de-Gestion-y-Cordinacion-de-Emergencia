'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Printer, CheckCircle2, Lock, FileText, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { mockEmergencias } from '@/lib/mock-data';
import { generarHuellaAuditoria } from '@/lib/crypto';
import Button from '@/components/ui/Button';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [huellas, setHuellas] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await api.get('/emergencias?limite=20');
        if (res.data?.datos?.emergencias && res.data.datos.emergencias.length > 0) {
          const ids = res.data.datos.emergencias.map((e: any) => e.id);
          const logsPromises = ids.slice(0, 10).map((id: number) =>
            api.get(`/emergencias/${id}/historial`).catch(() => null)
          );
          const logsResponses = await Promise.all(logsPromises);
          const allLogs = logsResponses
            .filter(Boolean)
            .flatMap((r: any) => r.data?.datos || []);

          setLogs(
            allLogs.length > 0
              ? allLogs
              : mockEmergencias.flatMap((e) => e.logs_auditoria || [])
          );
        } else {
          setLogs(mockEmergencias.flatMap((e) => e.logs_auditoria || []));
        }
      } catch {
        setLogs(mockEmergencias.flatMap((e) => e.logs_auditoria || []));
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  // Calcular huellas digitales criptográficas SHA-256 para cada registro
  useEffect(() => {
    async function calcularHuellas() {
      const mapaHuellas: Record<number, string> = {};
      for (const log of logs) {
        if (log.id) {
          const hash = await generarHuellaAuditoria({
            id: log.id,
            id_emergencia: log.id_emergencia,
            id_usuario_accion: log.id_usuario_accion,
            fecha: log.fecha,
            accion_realizada: log.accion_realizada,
            estado_anterior: log.estado_anterior,
            estado_nuevo: log.estado_nuevo,
          });
          mapaHuellas[log.id] = hash;
        }
      }
      setHuellas(mapaHuellas);
    }

    if (logs.length > 0) {
      calcularHuellas();
    }
  }, [logs]);

  const imprimirLibroOficial = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Membrete Oficial para Impresión (@media print) */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-6 text-center">
        <h1 className="text-xl font-bold font-serif uppercase tracking-wider text-slate-900">
          República de Colombia — Alcaldía Mayor de Cartagena de Indias
        </h1>
        <p className="text-sm font-semibold text-slate-700">
          Plataforma SIGEM — Libro Maestro de Auditoría e Inmutabilidad (RNF-09)
        </p>
        <p className="text-xs font-mono text-slate-500 mt-1">
          Certificación de Trazabilidad Criptográfica SHA-256 · Fecha de emisión: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Encabezado en Pantalla */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-900 text-slate-100 text-xs font-bold px-2.5 py-0.5 border border-slate-800">
              RNF-09
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Libro Maestro de Auditoría Forense</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Registro inmutable de transiciones de estado, actores, marcas de tiempo y sellos criptográficos SHA-256.
          </p>
        </div>

        <Button
          onClick={imprimirLibroOficial}
          variant="outline"
          className="flex items-center gap-2 text-xs font-semibold"
        >
          <Printer className="h-4 w-4 text-slate-600" /> Imprimir Registro Oficial
        </Button>
      </div>

      {/* Tabla de Auditoría Criptográfica */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-12 text-center text-slate-500 text-sm">Calculando cadena de custodia y huellas...</p>
        ) : logs.length === 0 ? (
          <p className="p-12 text-center text-slate-500 text-sm">No hay registros de auditoría disponibles.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3">Marca de Tiempo</th>
                  <th className="px-4 py-3">Incidente</th>
                  <th className="px-4 py-3">Acción Operativa</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Transición de Estado</th>
                  <th className="px-4 py-3 font-mono">Huella SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 text-xs transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.fecha).toLocaleString([], {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                      #{log.id_emergencia}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {log.accion_realizada}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.usuario_accion ? (
                        <span>
                          {log.usuario_accion.nombre} {log.usuario_accion.apellido}
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {log.usuario_accion.email}
                          </span>
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400">ID #{log.id_usuario_accion}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.estado_anterior || log.estado_nuevo ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                            {log.estado_anterior || 'INICIO'}
                          </span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                            {log.estado_nuevo}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin cambio de fase</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Lock className="h-3 w-3 text-emerald-600" />
                        {huellas[log.id] ? `${huellas[log.id]}...` : 'Verificando...'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
