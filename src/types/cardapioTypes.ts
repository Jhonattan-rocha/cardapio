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
  tipo: 'titulo' | 'texto' | 'item' | 'imagem' | 'lista' | 'divisor' | 'espacador' | 'video' | 'galeria' | 'faq';
  descricao?: string;

  // Conteúdo específico para cada tipo
  texto?: string; // HTML do ReactQuill para 'texto'
  items?: CardapioItem[]; // Para 'item'
  imagemUrl?: string; // Pode ser URL externa ou Data URL para preview/PDF
  legendaImagem?: string;
  listaItems?: string[]; // Para 'lista'
  layoutItem?: 'lista' | 'grade-2-colunas' | 'grade-3-colunas'; // Para seções de 'item'
  altura?: number;
  videoUrl?: string;
  imagens?: Array<ImagemGaleria>;
  itensFaq?: Array<FaqItem>;
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

export interface CardapioSecaoBase {
  id: string;
  ordem: number;
  titulo?: string; // Usado como título da seção ou label interno
}

export interface SecaoTitulo extends CardapioSecaoBase {
  tipo: 'titulo';
  // titulo já está na base
}

export interface SecaoTexto extends CardapioSecaoBase {
  tipo: 'texto';
  texto?: string; // HTML do ReactQuill
}

export interface SecaoItem extends CardapioSecaoBase {
  tipo: 'item';
  items?: CardapioItem[];
  layoutItem?: 'lista' | 'grade-2-colunas' | 'grade-3-colunas';
}

export interface SecaoImagem extends CardapioSecaoBase {
  tipo: 'imagem';
  imagemUrl?: string;
  legendaImagem?: string;
}

export interface SecaoLista extends CardapioSecaoBase {
  tipo: 'lista';
  listaItems?: string[];
}

// NOVOS TIPOS DE SEÇÃO:
export interface SecaoDivisor extends CardapioSecaoBase {
  tipo: 'divisor';
  // Sem conteúdo específico, apenas visual
}

export interface SecaoEspacador extends CardapioSecaoBase {
  tipo: 'espacador';
  altura?: number; // em pixels, ex: 20
}

export interface SecaoVideo extends CardapioSecaoBase {
  tipo: 'video';
  videoUrl?: string; // URL do vídeo (YouTube, Vimeo, etc.)
  legendaVideo?: string;
}

export interface ImagemGaleria {
  id: string;
  url: string;
  legenda?: string;
}
export interface SecaoGaleria extends CardapioSecaoBase {
  tipo: 'galeria';
  imagens: ImagemGaleria[];
  layoutGaleria?: 'grade-2' | 'grade-3' | 'grade-4' | 'carousel';
}

export interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
}
export interface SecaoFaq extends CardapioSecaoBase {
  tipo: 'faq';
  itensFaq: FaqItem[];
}
