export type UserRole = 'admin' | 'operador' | 'visualizador';

export type BatteryStatus = 'nao_requer' | 'pendente' | 'carregando' | '100_porcento' | 'nao_100_porcento';

export type ItemLocationStatus = 
  | 'pendente_base' 
  | 'no_carro_ida'   // SAÍDA (OK)
  | 'no_carro_volta' // VOLTA (OK)
  | 'ignorado';     // IGNORADO

export interface Profile {
  id: string;
  nome: string;
  cargo: UserRole;
  created_at?: string;
}

export interface Categoria {
  id: string;
  nome: string;
}

export interface Proprietario {
  id: string;
  nome: string;
}

export interface Veiculo {
  id: string;
  nome: string;
  placa?: string;
}

export interface Equipamento {
  id: string;
  nome: string;
  categoria_id?: string;
  categoria_nome?: string;
  proprietario_id?: string;
  proprietario_nome?: string;
  qr_code_id: string;
  e_container: boolean;
  container_pai_id?: string | null;
  carro_id?: string | null;
  carro_nome?: string | null;
  created_at?: string;
  // Campos virtuais de status para a diária atual
  status_carga?: BatteryStatus;
  status_locacao?: ItemLocationStatus;
  validado_por_qr?: boolean;
  bateria_alerta_100?: boolean;
  bateria_carregando?: boolean;
}

export interface Projeto {
  id: string;
  nome: string;
  descricao?: string;
  criador_id?: string;
  diretor?: string;
  dp_fotografia?: string;
  diretor_arte?: string;
  gaffer?: string;
  operador_camera?: string;
  veiculos: Veiculo[];
  diarias_datas: string[];
  created_at?: string;
}

export interface Diaria {
  id: string;
  projeto_id: string;
  projeto_nome?: string;
  data_diaria: string;
  horario_saida: string; // Ex: "10:00"
  status: 'planejada' | 'em_andamento' | 'finalizada';
  equipamentos_ids: string[]; // Lista de IDs de equipamentos adicionados nesta diária
}

export interface DiariaItemStatus {
  id: string;
  diaria_id: string;
  equipamento_id: string;
  status_carga: BatteryStatus;
  status_locacao: ItemLocationStatus;
  validado_por_qr?: boolean;
  bateria_alerta_100?: boolean;
  bateria_carregando?: boolean;
  updated_at?: string;
}

export interface BugReport {
  id: string;
  titulo: string;
  descricao: string;
  data_criacao: string;
  autor: string;
  status: 'pendente' | 'em_analise' | 'resolvido';
}

export type DailyPhase = 'saida' | 'volta';

export type ActiveView = 'app' | 'projects' | 'database' | 'settings' | 'bugs';
