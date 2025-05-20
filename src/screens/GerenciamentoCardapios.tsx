// src/screens/GerenciamentoCardapios.tsx

import React, { useState } from 'react';
import styled from 'styled-components';
import type { Cardapio } from '../types/cardapioTypes';
import { Button, IconButton } from '../components/common/Buttun';
import { FaEdit, FaTrashAlt, FaEye, FaPlus, FaFilePdf } from 'react-icons/fa'; // Ícones

// --- Styled Components ---
const Container = styled.div`
  max-width: 1200px;
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

const SearchInput = styled.input`
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  width: 300px;
  font-size: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: var(--spacing-md);

  th, td {
    padding: var(--spacing-md);
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  th {
    background-color: #f1f3f5;
    color: var(--text-color);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.9rem;
  }

  td {
    color: var(--text-light-color);
    font-size: 0.95rem;
  }

  tr:hover {
    background-color: #fdfdfd;
  }
`;

const ActionsCell = styled.td`
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end; /* Alinha os botões à direita */
`;

interface GerenciamentoCardapiosProps {
  onAddCardapio: () => void;
  onEditCardapio: (id: string) => void;
  onViewCardapio: (id: string) => void;
  onDeleteCardapio: (id: string) => void;
  onGeneratePdf: (id: string) => void;
}

const GerenciamentoCardapios: React.FC<GerenciamentoCardapiosProps> = ({
  onAddCardapio,
  onEditCardapio,
  onViewCardapio,
  onDeleteCardapio,
  onGeneratePdf,
}) => {
  // Dados de exemplo (simulando um banco de dados)
  const [cardapios, setCardapios] = useState<Cardapio[]>([
    {
      id: '1',
      nome: 'Cardápio de Verão 2024',
      descricaoBreve: 'Pratos leves e refrescantes da estação.',
      status: 'publicado',
      ultimaAtualizacao: '2024-05-15T10:30:00Z',
      conteudo: [], // Conteúdo vazio para exemplo
    },
    {
      id: '2',
      nome: 'Cardápio de Bebidas Especiais',
      descricaoBreve: 'Coquetéis e vinhos selecionados.',
      status: 'rascunho',
      ultimaAtualizacao: '2024-05-10T14:00:00Z',
      conteudo: [],
    },
    {
        id: '3',
        nome: 'Menu Degustação Noturno',
        descricaoBreve: 'Experiência gastronômica com 5 pratos.',
        status: 'publicado',
        ultimaAtualizacao: '2024-05-01T18:00:00Z',
        conteudo: [],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredCardapios = cardapios.filter(cardapio =>
    cardapio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cardapio.descricaoBreve?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cardápio?')) {
      // Lógica real de exclusão (API call, etc.)
      setCardapios(cardapios.filter(c => c.id !== id));
      onDeleteCardapio(id); // Notifica o componente pai, se necessário
    }
  };

  return (
    <Container>
      <Header>
        <h1>Gerenciamento de Cardápios</h1>
        <Button $variant="primary" onClick={onAddCardapio}>
          <FaPlus style={{ marginRight: '8px' }} /> Adicionar Novo Cardápio
        </Button>
      </Header>

      <SearchInput
        type="text"
        placeholder="Buscar cardápios..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredCardapios.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', color: 'var(--text-light-color)' }}>
          Nenhum cardápio encontrado.
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Nome do Cardápio</th>
              <th>Descrição</th>
              <th>Status</th>
              <th>Última Atualização</th>
              <th style={{ width: '180px', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredCardapios.map((cardapio) => (
              <tr key={cardapio.id}>
                <td>{cardapio.nome}</td>
                <td>{cardapio.descricaoBreve || '-'}</td>
                <td>
                  <span style={{
                    color: cardapio.status === 'publicado' ? 'var(--success-color)' : 'var(--secondary-color)',
                    fontWeight: 500,
                  }}>
                    {cardapio.status.charAt(0).toUpperCase() + cardapio.status.slice(1)}
                  </span>
                </td>
                <td>{new Date(cardapio.ultimaAtualizacao).toLocaleDateString()}</td>
                <ActionsCell>
                  <IconButton onClick={() => onViewCardapio(cardapio.id)} title="Visualizar">
                    <FaEye />
                  </IconButton>
                  <IconButton onClick={() => onEditCardapio(cardapio.id)} title="Editar">
                    <FaEdit />
                  </IconButton>
                  <IconButton $variant="danger" onClick={() => handleDelete(cardapio.id)} title="Excluir">
                    <FaTrashAlt />
                  </IconButton>
                  <IconButton onClick={() => onGeneratePdf(cardapio.id)} title="Gerar PDF">
                    <FaFilePdf />
                  </IconButton>
                </ActionsCell>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default GerenciamentoCardapios;