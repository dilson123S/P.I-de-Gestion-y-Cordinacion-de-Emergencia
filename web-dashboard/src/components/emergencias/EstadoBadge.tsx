'use client';

import React from 'react';
import Badge from '../ui/Badge';
import { EstadoEmergencia } from '@/types';

interface EstadoBadgeProps {
  estado: EstadoEmergencia;
  className?: string;
}

const configEstado: Record<EstadoEmergencia, { label: string; variant: 'warning' | 'primary' | 'purple' | 'orange' | 'success' }> = {
  [EstadoEmergencia.REPORTADO]: {
    label: 'REPORTADO',
    variant: 'warning',
  },
  [EstadoEmergencia.CLASIFICADO]: {
    label: 'CLASIFICADO',
    variant: 'primary',
  },
  [EstadoEmergencia.ASIGNADO]: {
    label: 'ASIGNADO',
    variant: 'purple',
  },
  [EstadoEmergencia.EN_ATENCION]: {
    label: 'EN ATENCIÓN',
    variant: 'orange',
  },
  [EstadoEmergencia.CERRADO]: {
    label: 'CERRADO',
    variant: 'success',
  },
};

export default function EstadoBadge({ estado, className }: EstadoBadgeProps) {
  const conf = configEstado[estado] || { label: estado, variant: 'warning' };
  return (
    <Badge variant={conf.variant} className={className}>
      {conf.label}
    </Badge>
  );
}
