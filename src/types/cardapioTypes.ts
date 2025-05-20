// src/types/cardapioTypes.ts

export interface CardapioItem {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagemUrl?: string; // URL da imagem, se houver
  tags?: string[]; // Ex: 'Vegetariano', 'Vegano', 'Gluten Free'
}

export interface CardapioSecao {
  id: string;
  titulo: string;
  tipo: 'titulo' | 'texto' | 'item' | 'imagem' | 'lista'; // Tipos de conteúdo
  // Conteúdo específico para cada tipo
  texto?: string;
  items?: CardapioItem[];
  imagemUrl?: string;
  listaItems?: string[]; // Para listas simples
}

export interface Cardapio {
  id: string;
  nome: string;
  descricaoBreve?: string;
  categoria?: string; // Ex: 'Almoço', 'Jantar'
  status: 'rascunho' | 'publicado' | 'inativo';
  ultimaAtualizacao: string; // Formato de data (ISO string)
  conteudo: CardapioSecao[]; // Array de seções que compõem o cardápio
}