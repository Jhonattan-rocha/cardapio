// src/screens/GerenciamentoUsuarios.tsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import type { User, UserFormData } from '../types/userTypes';
import { Button, IconButton } from '../components/common/Buttun'; // Supondo que você tenha um Button.ts
import { FaEdit, FaTrashAlt, FaPlus, FaUserShield } from 'react-icons/fa';
import UserFormModal from '../components/modals/UserFormModal'; // Será criado a seguir

// --- Styled Components (similares aos de GerenciamentoCardapios.tsx) ---
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
  /* Outros estilos da tabela como em GerenciamentoCardapios */
`;

const ActionsCell = styled.td`
  display: flex;
  gap: var(--spacing-sm);
`;
// --- Fim Styled Components ---

const GerenciamentoUsuarios: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  // Simulação de carregamento inicial e persistência (usar localStorage para demonstração)
  useEffect(() => {
    const storedUsers = localStorage.getItem('app_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Dados iniciais de exemplo, se não houver nada no localStorage
      setUsers([
        { id: uuidv4(), nome: 'Administrador Principal', email: 'admin@example.com', role: 'admin' },
        { id: uuidv4(), nome: 'Editor Conteúdo', email: 'editor@example.com', role: 'editor' },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(users));
  }, [users]);

  const handleOpenModal = (user?: User) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setEditingUser(undefined);
    setShowUserModal(false);
  };

  const handleSaveUser = (userData: UserFormData) => {
    if (editingUser) { // Editando
      setUsers(users.map(u => u.id === editingUser.id ? { ...editingUser, ...userData, id: editingUser.id } : u));
    } else { // Criando
      const newUser: User = {
        id: uuidv4(),
        nome: userData.nome,
        email: userData.email,
        role: userData.role,
      };
      setUsers([...users, newUser]);
    }
    // Em uma aplicação real, aqui seria a chamada para a API para salvar/atualizar
    // e a senha seria tratada de forma segura.
    console.log('Dados do usuário para salvar (simulado):', userData);
    handleCloseModal();
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      // Adicionar verificação para não permitir excluir o último admin, por exemplo.
      if (users.filter(u => u.role === 'admin').length === 1 && users.find(u => u.id === userId)?.role === 'admin') {
        alert('Não é possível excluir o único administrador do sistema.');
        return;
      }
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  return (
    <Container>
      <Header>
        <h1><FaUserShield style={{ marginRight: '10px' }} /> Gerenciamento de Usuários</h1>
        <Button $variant="primary" onClick={() => handleOpenModal()}>
          <FaPlus style={{ marginRight: '8px' }} /> Adicionar Usuário
        </Button>
      </Header>

      {users.length === 0 ? (
        <p>Nenhum usuário cadastrado.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Papel</th>
              <th style={{ width: '120px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.nome}</td>
                <td>{user.email}</td>
                <td>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                <ActionsCell>
                  <IconButton onClick={() => handleOpenModal(user)} title="Editar Usuário">
                    <FaEdit />
                  </IconButton>
                  <IconButton $variant="danger" onClick={() => handleDeleteUser(user.id)} title="Excluir Usuário">
                    <FaTrashAlt />
                  </IconButton>
                </ActionsCell>
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
          initialData={editingUser}
        />
      )}
    </Container>
  );
};

export default GerenciamentoUsuarios;