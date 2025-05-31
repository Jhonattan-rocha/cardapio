// src/screens/GerenciamentoCardapios.tsx

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import type { Cardapio } from '../types/cardapioTypes'; // Atualizado
import { Button, IconButton } from '../components/common/Buttun'; // Verifique o nome do arquivo
import { FaEdit, FaTrashAlt, FaEye, FaPlus, FaFilePdf } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import type { AuthState } from '../store/modules/types'; // Ajuste o caminho se necessário
import api from '../services/axios'; // Seu serviço Axios configurado

// --- Styled Components (mantidos como no seu exemplo) ---
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
  background-color: var(--input-background-color);
  color: var(--text-color);
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
    background-color: #f1f3f5; /* Considerar var(--table-header-background-color) */
    color: var(--text-color-strong); /* Considerar var(--text-color-strong) */
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.9rem;
  }

  td {
    color: var(--text-color); /* Alterado para --text-color para melhor legibilidade */
    font-size: 0.95rem;
  }

  tr:hover {
    background-color: var(--hover-background-color); /* Considerar var(--hover-background-color) */
  }
`;

const ActionsCell = styled.td`
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
`;

const ErrorMessage = styled.p`
  color: var(--danger-color);
  background-color: var(--danger-background-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  text-align: center;
  margin-top: var(--spacing-lg);
`;
// --- Fim Styled Components ---

interface GerenciamentoCardapiosProps {
  onAddCardapio: () => void;
  onEditCardapio: (id: string) => void;
  onViewCardapio: (id: string) => void;
  // onDeleteCardapio: (id: string) => void; // Pode ser removido se o estado for gerenciado aqui
  // onGeneratePdf: (id: string) => void; // Pode ser removido se o download for tratado aqui
}

const GerenciamentoCardapios: React.FC<GerenciamentoCardapiosProps> = ({
  onAddCardapio,
  onEditCardapio,
  onViewCardapio,
}) => {
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const auth = useSelector((state: { authreducer: AuthState }) => state.authreducer);

  const fetchCardapios = useCallback(async () => {
    if (!auth.isLoggedIn || !auth.user) {
      // setError("Faça login para ver seus cardápios."); // Ou apenas não busca
      setCardapios([]); // Limpa cardápios se não estiver logado
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Endpoint para buscar cardápios do usuário logado
      const response = await api.get<Cardapio[]>('/cardapios/', {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      setCardapios(response.data);
    } catch (err: any) {
      console.error("Falha ao buscar cardápios:", err);
      setError(err.response?.data?.detail || "Erro ao carregar seus cardápios.");
    } finally {
      setIsLoading(false);
    }
  }, [auth.isLoggedIn, auth.user]);

  useEffect(() => {
    fetchCardapios();
  }, [fetchCardapios]);

  const filteredCardapios = cardapios.filter(cardapio =>
    cardapio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cardapio.descricaoBreve && cardapio.descricaoBreve.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cardápio? Esta ação não pode ser desfeita.')) {
      setIsLoading(true); // Pode ser um loading específico para a linha/botão
      try {
        await api.delete(`/cardapios/${id}`, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        });
        setCardapios(prevCardapios => prevCardapios.filter(c => c.id !== id));
        // onDeleteCardapio(id); // Chamada ao prop do pai, se ainda for necessário
      } catch (err: any) {
        console.error("Falha ao excluir cardápio:", err);
        alert(err.response?.data?.detail || "Erro ao excluir o cardápio.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGeneratePdf = async (cardapio: Cardapio) => {
    setIsLoading(true); // Pode ser um loading específico
    try {
      const response = await api.get(`/cardapios/download/${cardapio.id}/pdf`, {
        responseType: 'blob', // Essencial para downloads de arquivos
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);

      // Tenta pegar o nome do arquivo do header, senão gera um padrão
      const contentDisposition = response.headers['content-disposition'];
      let filename = `cardapio_${cardapio.nome.replace(/\s+/g, '_')}_${cardapio.id.substring(0,8)}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href); // Libera o objeto URL
    } catch (err: any) {
      console.error("Falha ao gerar PDF do cardápio:", err);
      alert(err.response?.data?.detail || "Erro ao gerar o PDF do cardápio.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && cardapios.length === 0) { // Mostra loading inicial
    return <Container><p>Carregando cardápios...</p></Container>;
  }

  if (error) {
    return <Container><ErrorMessage>{error}</ErrorMessage></Container>;
  }

  return (
    <Container>
      <Header>
        <h1>Gerenciamento de Cardápios</h1>
        <Button $variant="primary" onClick={onAddCardapio} disabled={isLoading}>
          <FaPlus style={{ marginRight: '8px' }} /> Adicionar Novo Cardápio
        </Button>
      </Header>

      <SearchInput
        type="text"
        placeholder="Buscar cardápios por nome ou descrição..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={isLoading}
      />

      {filteredCardapios.length === 0 && !isLoading ? (
        <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', color: 'var(--text-light-color)' }}>
          {searchTerm ? 'Nenhum cardápio encontrado com os termos da busca.' : 'Você ainda não criou nenhum cardápio.'}
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Nome do Cardápio</th>
              <th>Descrição</th>
              <th>Status</th>
              <th>Última Atualização</th>
              <th style={{ width: '200px', textAlign: 'right' }}>Ações</th> {/* Ajustado width */}
            </tr>
          </thead>
          <tbody>
            {filteredCardapios.map((cardapio) => (
              <tr key={cardapio.id}>
                <td>{cardapio.nome}</td>
                <td>{cardapio.descricaoBreve || '-'}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--border-radius-sm)',
                    color: '#fff', // Cor do texto branca para contraste
                    backgroundColor: cardapio.status === 'publicado'
                      ? 'var(--success-color)'
                      : cardapio.status === 'rascunho'
                        ? 'var(--secondary-color)'
                        : 'var(--warning-color)', // Cor padrão para outros status
                    fontWeight: 500,
                  }}>
                    {cardapio.status.charAt(0).toUpperCase() + cardapio.status.slice(1)}
                  </span>
                </td>
                <td>{new Date(cardapio.ultimaAtualizacao).toLocaleDateString()}</td>
                <ActionsCell>
                  <IconButton onClick={() => onViewCardapio(cardapio.id)} title="Visualizar Cardápio" disabled={isLoading}>
                    <FaEye />
                  </IconButton>
                  <IconButton onClick={() => onEditCardapio(cardapio.id)} title="Editar Cardápio" disabled={isLoading}>
                    <FaEdit />
                  </IconButton>
                  <IconButton $variant="danger" onClick={() => handleDelete(cardapio.id)} title="Excluir Cardápio" disabled={isLoading}>
                    <FaTrashAlt />
                  </IconButton>
                  <IconButton onClick={() => handleGeneratePdf(cardapio)} title="Baixar PDF do Cardápio" disabled={isLoading}>
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