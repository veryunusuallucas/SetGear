import type { Equipamento, Projeto, Veiculo } from '../types/setgear';

/**
 * Dados de demonstração, usados só quando o banco está vazio.
 *
 * Ficavam dentro do store, misturados com a lógica. Estão aqui para que dê para
 * apagar este arquivo inteiro no dia em que o acervo real entrar, sem tocar em
 * regra de negócio.
 */

export const INITIAL_VEHICLES: Veiculo[] = [
  { id: 'v-1', nome: 'Carro 1 - Van Câmera & Luz' },
  { id: 'v-2', nome: 'Carro 2 - Van Grip & Suportes' },
];

export const INITIAL_EQUIPMENT: Equipamento[] = [
  {
    id: 'cont-01',
    nome: 'Pelican 1510 - Kit Câmera RED Komodo',
    categoria_id: 'cat-5',
    categoria_nome: 'Containers & Cases',
    proprietario_id: 'prop-eugenio',
    proprietario_nome: 'Eugenio (DP)',
    qr_code_id: 'CONTAINER-RED-01',
    e_container: true,
    container_pai_id: null,
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'cont-02',
    nome: 'Case Rígido - Kit Baterias V-Mount',
    categoria_id: 'cat-5',
    categoria_nome: 'Containers & Cases',
    proprietario_id: 'prop-cinerent',
    proprietario_nome: 'Locadora CineRent SP',
    qr_code_id: 'CONTAINER-BAT-02',
    e_container: true,
    container_pai_id: null,
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'item-101',
    nome: 'Corpo RED Komodo 6K (Cinza Tático)',
    categoria_id: 'cat-1',
    categoria_nome: 'Câmeras & Corpos',
    proprietario_id: 'prop-eugenio',
    proprietario_nome: 'Eugenio (DP)',
    qr_code_id: 'EQ-CAM-6K-01',
    e_container: false,
    container_pai_id: 'cont-01',
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'item-102',
    nome: 'Monitor On-Camera SmallHD Cine 7',
    categoria_id: 'cat-1',
    categoria_nome: 'Câmeras & Corpos',
    proprietario_id: 'prop-eugenio',
    proprietario_nome: 'Eugenio (DP)',
    qr_code_id: 'EQ-MON-SM7-02',
    e_container: false,
    container_pai_id: 'cont-01',
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'item-201',
    nome: 'Bateria V-Mount FXLION Nano Two 98Wh #01',
    categoria_id: 'cat-3',
    categoria_nome: 'Baterias & Energia',
    proprietario_id: 'prop-cinerent',
    proprietario_nome: 'Locadora CineRent SP',
    qr_code_id: 'BAT-VM-98-01',
    e_container: false,
    container_pai_id: 'cont-02',
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'item-202',
    nome: 'Bateria V-Mount FXLION Nano Two 98Wh #02',
    categoria_id: 'cat-3',
    categoria_nome: 'Baterias & Energia',
    proprietario_id: 'prop-cinerent',
    proprietario_nome: 'Locadora CineRent SP',
    qr_code_id: 'BAT-VM-98-02',
    e_container: false,
    container_pai_id: 'cont-02',
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'item-401',
    nome: 'Tripé de Carbono Sachtler Flowtech 75',
    categoria_id: 'cat-4',
    categoria_nome: 'Suportes & Grips',
    proprietario_id: 'prop-eugenio',
    proprietario_nome: 'Eugenio (DP)',
    qr_code_id: 'TRIPOD-FLOWTECH-75',
    e_container: false,
    container_pai_id: null,
    carro_id: 'v-2',
    carro_nome: 'Carro 2 - Van Grip & Suportes',
  },
];

export const projetoExemplo: Projeto = {
  id: 'proj-tropeiro',
  nome: 'O ÚLTIMO TROPEIRO',
  descricao: 'Longa-metragem de época. Gravações em locações externas rurais.',
  criador_id: 'usr-local',
  diretor: 'Carlos Alberto',
  dp_fotografia: 'Eugenio',
  diretor_arte: 'Mariana Silva',
  gaffer: 'Beto Luz',
  operador_camera: 'Fernanda Lima',
  veiculos: INITIAL_VEHICLES,
  diarias_datas: ['18/07', '19/07', '20/07'],
};
