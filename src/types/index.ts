export interface Visit {
  id: string;
  'EJECUTIVA DE TRADE': string;
  'ASESOR COMERCIAL': string;
  'CANAL': string;
  'CADENA': string;
  'DIRECCIÓN DEL PDV': string;
  'ACTIVIDAD': 'Visita' | 'Impulso' | 'Verificación';
  'HORARIO': string;
  'CIUDAD': string;
  'ZONA': string;
  'FECHA': Date;
  'PRESUPUESTO': number;
  'AFLUENCIA ESPERADA'?: number;
  'FECHA DE ENTREGA DE MATERIAL'?: Date;
  'OBJETIVO DE LA ACTIVIDAD'?: string;
  'CANTIDAD DE MUESTRAS'?: number;
  'MATERIAL POP'?: string;
  'OBSERVACION'?: string;
}
