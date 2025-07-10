

export interface Material {
  id: number;
  name: string;
  unit_price: number;
}

export interface Visit {
  id: number; // Changed to number to match Supabase serial
  'EJECUTIVA DE TRADE': string;
  'ASESOR COMERCIAL': string;
  'CANAL': string;
  'CADENA': string;
  'DIRECCIÓN DEL PDV': string;
  'ACTIVIDAD': 'Visita' | 'IMPULSACIÓN' | 'Verificación';
  'HORARIO': string;
  'CIUDAD': string;
  'ZONA': string;
  'FECHA': string; // ISO 8601 date string
  'PRESUPUESTO': number;
  'AFLUENCIA ESPERADA'?: number;
  'FECHA DE ENTREGA DE MATERIAL'?: string; // ISO 8601 date string
  'OBJETIVO DE LA ACTIVIDAD'?: string;
  'CANTIDAD DE MUESTRAS'?: number;
  'OBSERVACION'?: string;
}

export interface VisitWithMaterials extends Visit {
    'MATERIAL POP': Record<string, { quantity: number; unit_price: number }>;
}
