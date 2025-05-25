// src/components/modals/UserFormModal.tsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { User, UserFormData } from '../../types/userTypes';
import { Button } from '../common/Buttun';
import { Modal as GlobalModal, ModalContent as GlobalModalContent } from '../../styles/GlobalStyles'; //

const FormSection = styled.div`
  /* Estilos do FormSection como em ConstrutorCardapio/styled.tsx */
  label { display: block; margin-bottom: 5px; font-weight: 600; }
  input, select {
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
  }
`;

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserFormData) => void;
  initialData?: User;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<UserFormData>({
    nome: '',
    email: '',
    senha: '',
    role: 'editor', // Default role
  });
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome,
        email: initialData.email,
        role: initialData.role,
        senha: '', // Senha não é preenchida para edição por segurança
      });
    } else {
      setFormData({ nome: '', email: '', senha: '', role: 'editor' });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof UserFormData]) {
        setErrors(prev => ({...prev, [name]: undefined}));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório.';
    if (!formData.email.trim()) {
        newErrors.email = 'Email é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email inválido.';
    }
    if (!initialData && !formData.senha) { // Senha obrigatória apenas na criação
        newErrors.senha = 'Senha é obrigatória para novos usuários.';
    } else if (formData.senha && formData.senha.length < 6) {
        newErrors.senha = 'Senha deve ter pelo menos 6 caracteres.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
        onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <GlobalModal>
      <GlobalModalContent style={{maxWidth: '450px'}}>
        <h3>{initialData ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h3>
        <form onSubmit={handleSubmit}>
          <FormSection style={{ border: 'none', padding: 0 }}>
            <label htmlFor="nome">Nome:</label>
            <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} />
            {errors.nome && <p style={{color: 'var(--danger-color)', fontSize: '0.8em'}}>{errors.nome}</p>}

            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
            {errors.email && <p style={{color: 'var(--danger-color)', fontSize: '0.8em'}}>{errors.email}</p>}

            <label htmlFor="senha">Senha:</label>
            <input type="password" id="senha" name="senha" value={formData.senha} onChange={handleChange} placeholder={initialData ? "Deixe em branco para não alterar" : ""} />
            {errors.senha && <p style={{color: 'var(--danger-color)', fontSize: '0.8em'}}>{errors.senha}</p>}

            <label htmlFor="role">Papel:</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange}>
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
            </select>
          </FormSection>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
            <Button type="button" $variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" $variant="primary">Salvar Usuário</Button>
          </div>
        </form>
      </GlobalModalContent>
    </GlobalModal>
  );
};

export default UserFormModal;