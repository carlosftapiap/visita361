export interface Visit {
  id: string;
  trade_executive: string;
  agent: string;
  channel: string;
  chain: string;
  pdv_detail: string;
  activity: 'Visita' | 'Impulso' | 'Verificación';
  schedule: string;
  city: string;
  zone: string;
  date: Date;
  budget: number;
  expected_people?: number;
  material_delivery_date?: Date;
  delivery_place?: string;
  objective?: string;
  sample_count?: number;
  material_pop?: string;
  other_materials?: string;
}
