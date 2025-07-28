

export interface Material {
  id: number;
  name: string;
  unit_price: number;
}

export interface VisitMaterial {
    id: number;
    visit_id: number;
    material_id: number;
    quantity: number;
}

export interface Visit {
  id: number;
  'EJECUTIVA DE TRADE': string;
  'ASESOR COMERCIAL': string;
  'CANAL': string;
  'CADENA': string;
  'DIRECCIÓN DEL PDV': string;
  'ACTIVIDAD': string;
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
  total_cost?: number; // Costo total calculado de los materiales
}

export interface VisitWithMaterials extends Visit {
    total_cost: number;
    materials_list: { name: string, quantity: number, unit_price: number }[];
}

export interface RoiCampaign {
  id: number;
  name: string;
  client: string;
  start_date: string; // ISO 8601 date string
  end_date: string; // ISO 8601 date string
  zone: string;
  responsible: string;
  investment_type: string;
  amount_invested: number;
  revenue_generated: number;
  profit_generated: number; // Utilidad neta generada
  units_sold?: number;
  comment?: string;
  roi: number; // Calculated field
}
