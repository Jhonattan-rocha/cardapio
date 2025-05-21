// src/types/cardapioTypes.ts

export interface CardapioItem {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagemUrl?: string; // Pode ser URL externa ou Data URL para preview/PDF
  tags?: string[];
  alergenicos?: string[];
  disponivel?: boolean; // Default: true
  ordem?: number;
}

export interface CardapioSecao {
  id: string;
  ordem: number;
  titulo?: string;
  tipo: 'titulo' | 'texto' | 'item' | 'imagem' | 'lista';
  descricao?: string;

  // Conteúdo específico para cada tipo
  texto?: string; // HTML do ReactQuill para 'texto'
  items?: CardapioItem[]; // Para 'item'
  imagemUrl?: string; // Pode ser URL externa ou Data URL para preview/PDF
  legendaImagem?: string;
  listaItems?: string[]; // Para 'lista'
  layoutItem?: 'lista' | 'grade-2-colunas' | 'grade-3-colunas'; // Para seções de 'item'
}

export interface Cardapio {
  id: string;
  nome: string;
  descricaoBreve?: string;
  categoria?: string;
  status: 'rascunho' | 'publicado' | 'inativo';
  ultimaAtualizacao: string; // Formato de data (ISO string)
  conteudo: CardapioSecao[];

  // Novas propriedades
  logoUrl?: string; // Pode ser URL externa ou Data URL
  informacoesAdicionais?: string;
  moeda?: string; // Default 'BRL'. Ex: "BRL", "USD", "EUR"
  tema?: string;
}