// src/types/userTypes.ts

// Representa o objeto User como retornado pelo backend (baseado em schemas.UserSchema)
export interface User {
  id: string; // uuid
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at?: string; // Vem do UserSchema
  // cardapios?: any[]; // Não usado diretamente nesta tela
}

// Dados para o formulário UserFormModal ao submeter
export interface UserSubmitData {
  username: string;
  email: string;
  password?: string;   // Obrigatório para novo usuário, indefinido para edição
  is_admin?: boolean;  // Opcional, apenas se o usuário atual for admin (para edição)
  is_active?: boolean; // Opcional, apenas se o usuário atual for admin (para edição)
}

export interface UserFormData extends Omit<User, 'id'> {
  id?: string; // Opcional para criação
  senha?: string; // Para criação ou alteração de senha
}
