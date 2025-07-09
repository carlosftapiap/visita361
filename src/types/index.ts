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
  // New fields
  customer_code?: string;
  customer_name?: string;
  address?: string;
  seller_code?: string;
  seller_name?: string;
  coordinator?: string;
  material_pop?: string;
  visit_objective?: string;
  management_done?: string;
  observations?: string;
}
