export interface Visit {
  id: string;
  agent: string;
  client: string;
  city: string;
  date: Date;
  activity: 'Visita' | 'Impulso' | 'Verificación';
  observations: string;
}
