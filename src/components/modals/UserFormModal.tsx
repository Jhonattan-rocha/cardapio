// src/components/modals/UserFormModal.tsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { User, UserSubmitData } from '../../types/userTypes';
import { Button } from '../common/Buttun'; // Verifique se o nome do arquivo é Button.ts ou Button.tsx
import { Modal as GlobalModal, ModalContent as GlobalModalContent } from '../../styles/GlobalStyles';
import ActivityIndicator from '../common/ActivityIndicator';

const FormSection = styled.div`
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: var(--text-color-strong); // Adicionado para melhor contraste
  }
  input[type="text"],
  input[type="email"],
  input[type="password"],
  select { // Mantido select para caso seja usado em outro lugar, mas não neste form
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background-color: var(--input-background-color); // Adicionado
    color: var(--text-color); // Adicionado
    box-sizing: border-box; // Garante que padding não aumente a largura total
  }
  input[type="checkbox"] {
    margin-right: 8px;
    vertical-align: middle;
  }
  .checkbox-label { // Label para checkboxes
    font-weight: normal;
    display: inline-flex; // Para alinhar melhor com o checkbox
    align-items: center;
    margin-bottom: 15px;
  }
  p.error-message { // Estilo para mensagens de erro
    color: var(--danger-color);
    font-size: 0.8em;
    margin-top: -10px;
    margin-bottom: 10px;
  }
`;

// Estado interno do formulário
interface InternalFormState {
  username: string;
  email: string;
  password?: string;
  is_admin: boolean;
  is_active: boolean;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserSubmitData) => Promise<void>;
  initialData?: User; // User alinhado com o backend
  currentUserIsAdmin: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentUserIsAdmin,
}) => {
  const [formData, setFormData] = useState<InternalFormState>({
    username: '',
    email: '',
    password: '',
    is_admin: false,
    is_active: true, // Por padrão, novos usuários são ativos
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InternalFormState, string>>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) { // Resetar o formulário sempre que o modal abrir
      if (isEditing && initialData) {
        setFormData({
          username: initialData.username,
          email: initialData.email,
          password: '', // Senha não é preenchida para edição
          is_admin: initialData.is_admin,
          is_active: initialData.is_active,
        });
      } else {
        // Novo usuário
        setFormData({
          username: '',
          email: '',
          password: '',
          is_admin: false, // Novos usuários não são admin por padrão via este formulário
          is_active: true,  // Novos usuários são ativos por padrão
        });
      }
      setErrors({}); // Limpa erros anteriores
    }
  }, [initialData, isOpen, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Limpa o erro do campo ao ser modificado
    if (errors[name as keyof InternalFormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InternalFormState, string>> = {};
    if (!formData.username.trim()) newErrors.username = 'Nome de usuário é obrigatório.';

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido.';
    }

    if (!isEditing) { // Senha obrigatória apenas na criação
      if (!formData.password) {
        newErrors.password = 'Senha é obrigatória para novos usuários.';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Senha deve ter pelo menos 6 caracteres.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSave: UserSubmitData = {
        username: formData.username,
        email: formData.email,
      };

      if (!isEditing && formData.password) {
        dataToSave.password = formData.password;
      }

      // Apenas incluir is_admin e is_active se o usuário logado for admin e estiver editando
      if (isEditing && currentUserIsAdmin) {
        dataToSave.is_admin = formData.is_admin;
        dataToSave.is_active = formData.is_active;
      }
      setIsLoading(true);
      await onSave(dataToSave);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <GlobalModal>
      <GlobalModalContent style={{ maxWidth: '480px' }}> {/* Ajustado maxWidth */}
        <h3>{isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h3>
        <form onSubmit={handleSubmit}>
          <FormSection style={{ border: 'none', padding: 0 }}>
            <label htmlFor="username">Nome de Usuário:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && <p className="error-message">{errors.username}</p>}

            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="error-message">{errors.email}</p>}

            {!isEditing && ( // Campo de senha apenas para novos usuários
              <>
                <label htmlFor="password">Senha:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && <p className="error-message">{errors.password}</p>}
              </>
            )}

            {/* Campos de Admin e Ativo - visíveis apenas para admins editando usuários */}
            {isEditing && currentUserIsAdmin && (
              <>
                <div>
                  <label htmlFor="is_active" className="checkbox-label">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                    Usuário Ativo?
                  </label>
                </div>

                <div>
                  <label htmlFor="is_admin" className="checkbox-label">
                    <input
                      type="checkbox"
                      id="is_admin"
                      name="is_admin"
                      checked={formData.is_admin}
                      onChange={handleChange}
                    />
                    Administrador?
                  </label>
                </div>
              </>
            )}
          </FormSection>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}> {/* Aumentado marginTop */}
            <Button type="button" $variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <Button type="submit" $variant="primary">
                {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
            )}
          </div>
        </form>
      </GlobalModalContent>
    </GlobalModal>
  );
};

export default UserFormModal;