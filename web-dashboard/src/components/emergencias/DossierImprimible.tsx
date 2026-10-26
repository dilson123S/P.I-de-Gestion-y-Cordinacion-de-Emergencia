'use client';

import React from 'react';
import { Emergencia, formatearRol } from '@/types';

interface DossierImprimibleProps {
  emergencia: Emergencia;
}

/**
 * Ficha / Dossier Oficial de Incidente para Impresión y Expediente Físico.
 * Solo se visualiza al imprimir (@media print) con tipografía institucional,
 * marcas de tiempo del ciclo de vida y firmas de los actores intervinientes.
 */
export default function DossierImprimible({ emergencia }: DossierImprimibleProps) {
  return (
    <div className="hidden print:block p-8 font-serif text-slate-900 bg-white max-w-4xl mx-auto">
      {/* Membrete Oficial del Estado */}
      <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-lg font-bold uppercase tracking-wider">
          República de Colombia · Distrito Turístico y Cultural de Cartagena de Indias
        </h1>
        <h2 className="text-base font-semibold text-slate-800">
          Centro de Coordinación y Atención de Emergencias — SIGEM 123
        </h2>
        <p className="text-xs font-mono text-slate-600 mt-1">
          EXPEDIENTE TÉCNICO OFICIAL DE INCIDENTE · REGISTRO ÚNICO (RNF-07)
        </p>
      </div>

      {/* Datos Clave del Incidente */}
      <div className="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded mb-6 text-sm">
        <div>
          <p>
            <strong>Número de Caso:</strong> <span className="font-mono font-bold">#{emergencia.id}</span>
          </p>
          <p>
            <strong>Tipo de Evento:</strong> {emergencia.tipo_emergencia?.nombre || 'General'}
          </p>
          <p>
            <strong>Prioridad Asignada:</strong> Prioridad {emergencia.prioridad}
          </p>
          <p>
            <strong>Estado de Cierre:</strong> <span className="font-bold">{emergencia.estado}</span>
          </p>
        </div>
        <div>
          <p>
            <strong>Fecha de Recepción:</strong>{' '}
            <span className="font-mono">{new Date(emergencia.fecha_creacion).toLocaleString()}</span>
          </p>
          <p>
            <strong>Geoposicionamiento GPS:</strong>{' '}
            <span className="font-mono text-xs">
              {emergencia.latitud.toFixed(4)}°N, {emergencia.longitud.toFixed(4)}°W
            </span>
          </p>
          <p>
            <strong>Unidad de Respuesta:</strong>{' '}
            {emergencia.unidad ? `${emergencia.unidad.codigo} (${emergencia.unidad.tipo})` : 'Sin asignar'}
          </p>
        </div>
      </div>

      {/* Descripción Original de los Hechos (RF-01) */}
      <div className="border border-slate-300 p-4 rounded mb-6 text-sm">
        <h3 className="font-bold uppercase text-xs tracking-wider mb-2 border-b border-slate-200 pb-1">
          1. Declaración Inicial del Reportante (RF-01)
        </h3>
        <p className="leading-relaxed text-slate-800 italic">
          &ldquo;{emergencia.descripcion}&rdquo;
        </p>
      </div>

      {/* Actores Intervinientes en la Cadena de Custodia */}
      <div className="border border-slate-300 p-4 rounded mb-6 text-sm">
        <h3 className="font-bold uppercase text-xs tracking-wider mb-2 border-b border-slate-200 pb-1">
          2. Cadena de Actores y Responsables Operativos
        </h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-bold">
              <th className="py-1">Función</th>
              <th className="py-1">Nombre Completo</th>
              <th className="py-1">Identificación / Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-1.5 font-semibold">Ciudadano Alertante</td>
              <td className="py-1.5">
                {emergencia.ciudadano?.nombre} {emergencia.ciudadano?.apellido}
              </td>
              <td className="py-1.5 font-mono text-slate-600">{emergencia.ciudadano?.email}</td>
            </tr>
            {emergencia.operador && (
              <tr>
                <td className="py-1.5 font-semibold">Operador de Triage (RF-03)</td>
                <td className="py-1.5">
                  {emergencia.operador.nombre} {emergencia.operador.apellido}
                </td>
                <td className="py-1.5 font-mono text-slate-600">{emergencia.operador.email}</td>
              </tr>
            )}
            {emergencia.despachador && (
              <tr>
                <td className="py-1.5 font-semibold">Despachador Táctico (RF-05)</td>
                <td className="py-1.5">
                  {emergencia.despachador.nombre} {emergencia.despachador.apellido}
                </td>
                <td className="py-1.5 font-mono text-slate-600">{emergencia.despachador.email}</td>
              </tr>
            )}
            {emergencia.unidad && (
              <tr>
                <td className="py-1.5 font-semibold">Unidad Despachada</td>
                <td className="py-1.5">{emergencia.unidad.codigo}</td>
                <td className="py-1.5 font-mono text-slate-600">Placa: {emergencia.unidad.placa}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resolución y Cierre */}
      <div className="border border-slate-300 p-4 rounded mb-8 text-sm">
        <h3 className="font-bold uppercase text-xs tracking-wider mb-2 border-b border-slate-200 pb-1">
          3. Informe de Resolución y Conclusión en Escena
        </h3>
        <p className="leading-relaxed text-slate-800">
          {emergencia.resolucion ||
            (emergencia.estado === 'CERRADO'
              ? 'Procedimiento de atención de emergencia concluido a satisfacción.'
              : 'Caso actualmente en desarrollo operativo.')}
        </p>
      </div>

      {/* Firmas de Legalización */}
      <div className="grid grid-cols-2 gap-8 pt-8 mt-12 border-t border-slate-300 text-center text-xs">
        <div>
          <div className="border-t border-slate-600 w-48 mx-auto mb-2" />
          <p className="font-bold">Firma Operador / Despachador</p>
          <p className="text-slate-500 font-mono">Consola SIGEM Central 123</p>
        </div>
        <div>
          <div className="border-t border-slate-600 w-48 mx-auto mb-2" />
          <p className="font-bold">Firma Jefe de Misión / Unidad</p>
          <p className="text-slate-500 font-mono">Personal Operativo en Escena</p>
        </div>
      </div>
    </div>
  );
}
