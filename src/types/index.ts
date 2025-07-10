

export interface Material {
  id: number;
  name: string;
  unit_price: number;
}

export interface Visit {
  id: number;
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
  'MATERIAL POP': Record<string, number>;
  'OBSERVACION'?: string;
}

export interface VisitWithMaterials extends Omit<Visit, 'MATERIAL POP'> {
    visit_materials: {
        quantity: number;
        materials: {
            id: number;
            name: string;
            unit_price: number;
        }
    }[]
}
