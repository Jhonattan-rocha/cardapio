// src/types/imageTypes.ts

export interface Image {
  id: string; // UUID no backend, string no frontend
  filename: string;
  alt_text: string | null;
  content_type: string;
  file_url: string; // URL completa para acessar a imagem
  created_at: string; // ou Date, se for converter
}

// Para o formulário de criação/upload
export interface ImageSubmitData {
  alt_text?: string;
  file: File; // O arquivo da imagem
}

// Para o formulário de atualização de metadados
export interface ImageMetadataUpdateData {
  alt_text?: string;
}

// Para o formulário de substituição de arquivo
export interface ImageReplaceFileData {
    file: File;
}