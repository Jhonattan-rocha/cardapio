// src/screens/GerenciamentoImagens.tsx

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import type { Image, ImageSubmitData, ImageMetadataUpdateData, ImageReplaceFileData } from '../types/imageTypes';
import { Button, IconButton } from '../components/common/Buttun'; // Verifique o nome do arquivo
import { FaEdit, FaTrashAlt, FaPlus, FaImages, FaExchangeAlt, FaDownload, FaArrowLeft } from 'react-icons/fa';
import ImageFormModal from '../components/modals/ImageFormModal';
import api from '../services/axios';
import { useSelector } from 'react-redux';
import type { AuthState } from '../store/modules/types';
import { format } from 'date-fns'; // Para formatar datas
import { useNavigate } from 'react-router-dom';

// --- Styled Components (Similares aos de GerenciamentoUsuarios) ---
const Container = styled.div`
  max-width: 1200px; // Aumentado para acomodar previews
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
  th, td {
    padding: var(--spacing-sm) var(--spacing-md); // Ajuste de padding
    text-align: left;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle; // Alinhar verticalmente no meio
  }
  th { background-color: #f1f3f5; font-weight: 600; }
  td.actions-cell { min-width: 180px; } // Largura mínima para botões
`;

const ImagePreview = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.5); // Efeito de zoom no hover
    z-index: 10;
    position: relative;
  }
`;

const ActionsCell = styled.td`
  gap: var(--spacing-xs);
`;

const ErrorMessage = styled.p`
  color: var(--danger-color);
  background-color: var(--danger-background-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  text-align: center;
`;

const LoadingMessage = styled.p`
  text-align: center;
  padding: var(--spacing-lg);
  font-style: italic;
`;

const NoImagesMessage = styled.p`
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-color-light);
`;
// --- Fim Styled Components ---

const GerenciamentoImagens: React.FC = () => {
  const authUser = useSelector((state: { authreducer: AuthState }) => state.authreducer);
  const token = authUser?.token;

  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingImage, setEditingImage] = useState<Image | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'upload' | 'editMetadata' | 'replaceFile'>('upload');
  const navigate = useNavigate();

  const fetchImages = useCallback(async () => {
    if (!token) {
        setError("Autenticação necessária para visualizar imagens.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // O endpoint /api/v1/images/ GET não requer autenticação no backend que criei
      // Se o seu necessitar, adicione o header de Authorization
      const response = await api.get<Image[]>('/images/');
      setImages(response.data);
    } catch (err: any) {
      console.error("Falha ao buscar imagens:", err);
      setError(err.response?.data?.detail || "Erro ao carregar imagens.");
    } finally {
      setIsLoading(false);
    }
  }, [token]); // Adicionado token como dependência se a listagem for protegida

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleOpenModal = (mode: 'upload' | 'editMetadata' | 'replaceFile', image?: Image) => {
    setModalMode(mode);
    setEditingImage(image);
    setShowImageModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setEditingImage(undefined);
    setShowImageModal(false);
  };

  const handleSaveImage = async (
    formData: ImageSubmitData | ImageMetadataUpdateData | ImageReplaceFileData,
    isReplacingFileOp?: boolean
  ) => {
    if (!token) {
        setError("Autenticação necessária para salvar imagem.");
        return;
    }
    setIsLoading(true); // Pode ser gerenciado no modal, ou aqui para a lista
    setError(null);
    try {
      if (modalMode === 'upload') {
        const data = formData as ImageSubmitData;
        const submissionForm = new FormData();
        submissionForm.append('file', data.file);
        if (data.alt_text) {
          submissionForm.append('alt_text', data.alt_text);
        }
        const response = await api.post<Image>('/images/', submissionForm, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        setImages(prev => [response.data, ...prev]); // Adiciona no início da lista
      } else if (modalMode === 'editMetadata' && editingImage) {
        const data = formData as ImageMetadataUpdateData;
        const response = await api.put<Image>(`/images/${editingImage.id}/metadata`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setImages(prev => prev.map(img => img.id === editingImage.id ? response.data : img));
      } else if (modalMode === 'replaceFile' && editingImage && isReplacingFileOp) {
        const data = formData as ImageReplaceFileData;
        const submissionForm = new FormData();
        submissionForm.append('file', data.file);
        const response = await api.put<Image>(`/images/${editingImage.id}/replace-file`, submissionForm, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        setImages(prev => prev.map(img => img.id === editingImage.id ? response.data : img));
      }
      handleCloseModal();
      fetchImages(); // Re-busca para garantir consistência, ou atualiza localmente
    } catch (err: any) {
      console.error('Falha ao salvar imagem:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
        setError(detail.map((d: any) => d.msg).join('; '));
      } else {
        setError("Erro ao salvar imagem. Verifique os dados e tente novamente.");
      }
      // Não fechar o modal em caso de erro para o usuário corrigir
      // setIsLoading(false) já está no finally do modal
      throw err; // Propaga o erro para o modal tratar o setIsLoading
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!token) {
        setError("Autenticação necessária para deletar imagem.");
        return;
    }
    if (window.confirm('Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.')) {
      setIsLoading(true);
      setError(null);
      try {
        await api.delete(`/images/${imageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setImages(images.filter(img => img.id !== imageId));
      } catch (err: any) {
        console.error('Falha ao excluir imagem:', err);
        setError(err.response?.data?.detail || "Erro ao excluir imagem.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDownloadImage = (imageUrl: string, filename: string) => {
    // Cria um link temporário para forçar o download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.setAttribute('download', filename); // Atributo download força o navegador a baixar
    link.setAttribute('target', '_blank'); // Abrir em nova aba pode ser uma alternativa se o download direto falhar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <Container>
      <Header>
        <h1><FaImages style={{ marginRight: '10px' }} /> Gerenciamento de Imagens</h1>
        {token && ( // Mostrar botão apenas se autenticado
             <Button $variant="primary" onClick={() => handleOpenModal('upload')} disabled={isLoading}>
                <FaPlus style={{ marginRight: '8px' }} /> Adicionar Imagem
            </Button>
        )}
          <Button $variant="primary" onClick={() => navigate(-1)} disabled={isLoading}>
            <FaArrowLeft style={{ marginRight: '8px' }} /> Voltar
          </Button>
      </Header>

      {isLoading && <LoadingMessage>Carregando imagens...</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!isLoading && !error && images.length === 0 && (
        <NoImagesMessage>Nenhuma imagem cadastrada.</NoImagesMessage>
      )}

      {!isLoading && images.length > 0 && (
        <Table>
          <thead>
            <tr>
              <th style={{width: '100px'}}>Preview</th>
              <th>Nome do Arquivo</th>
              <th>Texto Alternativo</th>
              <th>Tipo</th>
              <th>Data de Upload</th>
              {token && <th className="actions-cell">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {images.map(image => (
              <tr key={image.id}>
                <td>
                  <a href={image.file_url} target="_blank" rel="noopener noreferrer" title="Ver imagem original">
                    <ImagePreview src={image.file_url} alt={image.alt_text || image.filename} />
                  </a>
                </td>
                <td>{image.filename}</td>
                <td>{image.alt_text || <span style={{color: 'var(--text-color-light)'}}>N/D</span>}</td>
                <td>{image.content_type}</td>
                <td>{format(new Date(image.created_at), 'dd/MM/yyyy HH:mm')}</td>
                {token && (
                    <ActionsCell className="actions-cell">
                        <IconButton size={20} onClick={() => handleOpenModal('editMetadata', image)} title="Editar Texto Alternativo" disabled={isLoading}>
                            <FaEdit />
                        </IconButton>
                        <IconButton size={20} $variant="info" onClick={() => handleOpenModal('replaceFile', image)} title="Substituir Arquivo" disabled={isLoading}>
                            <FaExchangeAlt />
                        </IconButton>
                        <IconButton size={20} $variant="primary" onClick={() => handleDownloadImage(image.file_url, image.filename)} title="Baixar Imagem" disabled={isLoading}>
                            <FaDownload />
                        </IconButton>
                        <IconButton size={20} $variant="danger" onClick={() => handleDeleteImage(image.id)} title="Excluir Imagem" disabled={isLoading}>
                            <FaTrashAlt />
                        </IconButton>
                    </ActionsCell>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {showImageModal && (
        <ImageFormModal
          isOpen={showImageModal}
          onClose={handleCloseModal}
          onSave={handleSaveImage}
          initialData={editingImage}
          mode={modalMode}
        />
      )}
    </Container>
  );
};

export default GerenciamentoImagens;