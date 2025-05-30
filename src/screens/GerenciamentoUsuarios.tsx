// src/screens/GerenciamentoUsuarios.tsx

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import type { User, UserSubmitData } from '../types/userTypes';
import { Button, IconButton } from '../components/common/Buttun';
import { FaEdit, FaTrashAlt, FaPlus, FaUserShield } from 'react-icons/fa';
import UserFormModal from '../components/modals/UserFormModal'; // Presume-se que este modal será ajustado
import api from '../services/axios'; // Seu serviço Axios configurado
import { useSelector } from 'react-redux';
import type { AuthState } from '../store/modules/types'; // Ajuste o caminho conforme necessário

// --- Styled Components (mantidos como no seu exemplo) ---
const Container = styled.div`
  max-width: 1000px;
  margin: var(--spacing-lg) auto;
  padding: var(--spacing-lg);
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: var(--spacing-md);
  th, td { padding: var(--spacing-md); text-align: left; border-bottom: 1px solid var(--border-color); }
  th { background-color: #f1f3f5; font-weight: 600; }
`;

const ActionsCell = styled.td`
  display: flex;
  gap: var(--spacing-sm);
`;

const ErrorMessage = styled.p`
  color: var(--danger-color);
  background-color: var(--danger-background-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  text-align: center;
`;
// --- Fim Styled Components ---

const GerenciamentoUsuarios: React.FC = () => {
  const authUser = useSelector((state: { authreducer: AuthState }) => state.authreducer);
  const currentUserIsAdmin = authUser?.user.is_admin || false;

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const fetchUsers = useCallback(async () => {
    if (!currentUserIsAdmin) {
      setError("Você não tem permissão para gerenciar usuários.");
      setUsers([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<User[]>('/users/', {
        headers: {
          Authorization: `Bearer ${authUser.token}`
        }
      }); // Backend retorna schemas.UserSchema[]
      setUsers(response.data);
    } catch (err: any) {
      console.error("Falha ao buscar usuários:", err);
      setError(err.response?.data?.detail || "Erro ao carregar usuários. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserIsAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user?: User) => {
    setEditingUser(user);
    setShowUserModal(true);
    setError(null); // Limpa erros ao abrir o modal
  };

  const handleCloseModal = () => {
    setEditingUser(undefined);
    setShowUserModal(false);
  };

  const handleSaveUser = async (formData: UserSubmitData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (editingUser) { // Editando usuário existente
        const payload: Partial<{ username: string, email: string, is_admin: boolean, is_active: boolean }> = {
          username: formData.username,
          email: formData.email,
        };
        // Apenas admins podem modificar is_admin e is_active
        if (currentUserIsAdmin) {
          if (formData.is_admin !== undefined) payload.is_admin = formData.is_admin;
          if (formData.is_active !== undefined) payload.is_active = formData.is_active;
        }
        // Senha não é atualizada por este formulário/endpoint
        const response = await api.put<User>(`/users/${editingUser.id}`, payload, {
          headers: {
            Authorization: `Bearer ${authUser.token}`
          }
        });
        setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
      } else { // Criando novo usuário
        if (!formData.password) {
          setError("O campo senha é obrigatório para novos usuários.");
          setIsLoading(false);
          return;
        }
        const payload: {
          username: string,
          email: string,
          password: string,
        } = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        };
        // Novas contas são criadas com is_admin=false, is_active=true por padrão no backend.
        // Se o formulário permitisse a um admin definir is_admin na criação,
        // seria necessário um PUT subsequente após o POST bem-sucedido,
        // ou uma modificação no endpoint de criação do backend.
        // Por simplicidade, is_admin é gerenciado na edição por um admin.
        const response = await api.post<User>('/users/', payload, {
          headers: {
            Authorization: `Bearer ${authUser.token}`
          }
        });
        setUsers([...users, response.data]);
      }
      handleCloseModal();
    } catch (err: any) {
      console.error('Falha ao salvar usuário:', err);
      setError(err.response?.data?.detail || "Erro ao salvar usuário. Verifique os dados e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUserIsAdmin) {
        setError("Você não tem permissão para excluir usuários.");
        return;
    }
    // Verificação para não excluir o próprio admin logado ou o último admin (lógica do frontend)
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && userToDelete.is_admin && Number(userToDelete.id) === authUser?.user.id) {
        alert('Você não pode excluir sua própria conta de administrador.');
        return;
    }
    if (users.filter(u => u.is_admin).length === 1 && userToDelete?.is_admin) {
      alert('Não é possível excluir o único administrador do sistema.');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      setIsLoading(true);
      setError(null);
      try {
        await api.delete(`/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${authUser.token}`
          }
        });
        setUsers(users.filter(u => u.id !== userId));
      } catch (err: any) {
        console.error('Falha ao excluir usuário:', err);
        setError(err.response?.data?.detail || "Erro ao excluir usuário. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!currentUserIsAdmin && !isLoading && !error) {
      // Se o fetchUsers já definiu um erro de permissão, ele será mostrado.
      // Caso contrário, se ainda não houve tentativa de fetch, podemos definir um aqui.
      if (users.length === 0) { // Evita sobrescrever erro do fetchUsers
          return <Container><ErrorMessage>Você não tem permissão para acessar esta página.</ErrorMessage></Container>;
      }
  }

  return (
    <Container>
      <Header>
        <h1><FaUserShield style={{ marginRight: '10px' }} /> Gerenciamento de Usuários</h1>
        {currentUserIsAdmin && (
          <Button $variant="primary" onClick={() => handleOpenModal()} disabled={isLoading}>
            <FaPlus style={{ marginRight: '8px' }} /> Adicionar Usuário
          </Button>
        )}
      </Header>
        
      {isLoading && <p>Carregando usuários...</p>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!isLoading && !error && users.length === 0 && currentUserIsAdmin && (
        <p>Nenhum usuário cadastrado.</p>
      )}

      {!isLoading && users.length > 0 && (
        <Table>
          <thead>
            <tr>
              <th>Nome de Usuário</th>
              <th>Email</th>
              <th>Status</th>
              <th>Papel</th>
              {currentUserIsAdmin && <th style={{ width: '120px' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.is_active ? 'Ativo' : 'Inativo'}</td>
                <td>{user.is_admin ? 'Admin' : 'Usuário'}</td>
                {currentUserIsAdmin && (
                  <ActionsCell>
                    <IconButton onClick={() => handleOpenModal(user)} title="Editar Usuário" disabled={isLoading}>
                      <FaEdit />
                    </IconButton>
                    <IconButton $variant="danger" onClick={() => handleDeleteUser(user.id)} title="Excluir Usuário" disabled={isLoading}>
                      <FaTrashAlt />
                    </IconButton>
                  </ActionsCell>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {showUserModal && (
        <UserFormModal
          isOpen={showUserModal}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          initialData={editingUser} // UserFormModal precisará mapear User para seus campos internos
          currentUserIsAdmin={currentUserIsAdmin} // Para lógica condicional de campos no modal
          // Passe quaisquer outras props necessárias para UserFormModal
        />
      )}
    </Container>
  );
};

export default GerenciamentoUsuarios;
