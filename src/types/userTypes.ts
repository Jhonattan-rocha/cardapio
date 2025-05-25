// src/types/userTypes.ts

export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'editor'; // Exemplo de papéis de usuário
}

export interface UserFormData extends Omit<User, 'id'> {
  id?: string; // Opcional para criação
  senha?: string; // Para criação ou alteração de senha
}
