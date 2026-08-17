import { Calendar, Check, CircleDot } from 'lucide-react';
import type { Diaria } from '../types/setgear';

interface SeletorDiariaProps {
  /** As datas previstas no projeto, mesmo as que ainda não têm diária criada. */
  datasPrevistas: string[];
  /** As diárias que já existem, com a conferência de cada uma. */
  diariasExistentes: Diaria[];
  dataAtiva: string;
  onSelecionar: (data: string) => void;
}

/**
 * Troca a diária ativa dentro do projeto.
 *
 * Esta tela não existia, e a consequência era silenciosa: um projeto com três
 * datas de gravação só deixava usar a primeira. O store até tinha o
 * `setDailyDate()`, mas nenhum componente o chamava — havia uma diária só,
 * alcançável, para sempre.
 *
 * Uma data sem diária criada aparece igual às outras: a diária nasce no primeiro
 * clique, zerada. É o mesmo princípio da "diária zerada" — nada é pré-montado
 * antes de alguém precisar.
 *
 * A Fase 2 troca a FONTE das diárias (passam a vir do SetProd), não este
 * seletor: ele lê do store e continua valendo.
 */
export const SeletorDiaria: React.FC<SeletorDiariaProps> = ({
  datasPrevistas,
  diariasExistentes,
  dataAtiva,
  onSelecionar,
}) => {
  // Datas do projeto mais qualquer diária que exista fora dessa lista (uma data
  // pode ter sido criada e depois removida do cadastro do projeto — a
  // conferência dela não deve desaparecer da navegação por causa disso).
  const datas = [...new Set([...datasPrevistas, ...diariasExistentes.map(d => d.data_diaria)])];

  if (datas.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-semibold text-[#B0B0B0] uppercase flex items-center gap-1.5 shrink-0">
        <Calendar className="w-3.5 h-3.5" /> Diárias:
      </span>

      {datas.map(data => {
        const diaria = diariasExistentes.find(d => d.data_diaria === data);
        const ativa = data === dataAtiva;
        const itens = diaria?.equipamentos_ids.length ?? 0;

        return (
          <button
            key={data}
            onClick={() => onSelecionar(data)}
            aria-current={ativa ? 'true' : undefined}
            title={
              itens > 0
                ? `${itens} equipamento(s) nesta diária`
                : 'Diária zerada — nada conferido ainda'
            }
            className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              ativa
                ? 'bg-[#00A3FF] text-white shadow-lg'
                : 'bg-[#2a2a2a] text-[#B0B0B0] border border-[#383838] hover:text-white hover:border-[#00A3FF]'
            }`}
          >
            {ativa ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              itens > 0 && <CircleDot className="w-3.5 h-3.5 text-[#2ED5A0]" />
            )}
            <span>{data}</span>
            {/* O contador é o que diz "já mexi nesta" sem precisar abrir. */}
            {!ativa && itens > 0 && (
              <span className="text-[10px] opacity-70">({itens})</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
