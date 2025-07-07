export interface Visit {
  id: string;
  agent: string;
  client: string;
  pdv_detail: string;
  city: string;
  date: Date;
  activity: 'Visita' | 'Impulso' | 'Verificación';
  schedule: string;
  channel: string;
  budget: number;
  observations: string;
}
