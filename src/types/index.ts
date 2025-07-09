

export interface Visit {
  id: string;
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
  'MATERIAL POP'?: string[];
  'OBSERVACION'?: string;
}

    
