export interface Visit {
  id: string;
  trade_executive: string;
  agent: string;
  channel: string;
  chain: string;
  pdv_address: string;
  activity: 'Visita' | 'Impulso' | 'Verificación';
  schedule: string;
  city: string;
  zone: string;
  date: Date;
  budget: number;
  expected_attendance?: number;
  material_delivery_date?: Date;
  activity_objective?: string;
  sample_count?: number;
  material_pop?: string;
  observation?: string;
}
