export interface Visit {
  id: string;
  executive_name: string;
  executive_role: string;
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
}
