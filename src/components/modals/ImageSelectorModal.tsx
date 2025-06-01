// src/components/modals/ImageSelectorModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import api from '../../services/axios'; // Seu serviço Axios configurado
import type { Image } from '../../types/imageTypes'; // Tipos de imagem definidos anteriormente
import { Modal as GlobalModal, ModalContent as GlobalModalContent } from '../../styles/GlobalStyles';
import { Button } from '../common/Buttun'; // Verifique o nome do arquivo
import ActivityIndicator from '../common/ActivityIndicator';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-md);
  max-height: 60vh;
  overflow-y: auto;
  padding: var(--spacing-sm);
  background-color: var(--background-color-offset);
  border-radius: var(--border-radius);
`;

const ImageThumbnailContainer = styled.div<{ isSelected?: boolean }>`
  position: relative;
  cursor: pointer;
  border: 2px solid ${props => props.isSelected ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  aspect-ratio: 1 / 1; // Mantém as thumbnails quadradas

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.2s ease-in-out;
  }

  &:hover img {
    transform: scale(1.05);
  }

  .filename-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    padding: var(--spacing-xs);
    font-size: 0.75rem;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const ModalHeader = styled.h3`
  margin-bottom: var(--spacing-md);
  text-align: center;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
`;

const ErrorMessage = styled.p`
  color: var(--danger-color);
  text-align: center;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-sizing: border-box;
`;


interface ImageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string) => void;
  // Adicionar API_BASE_URL se as file_url do backend forem relativas
  // e precisarem ser prefixadas para exibição no modal.
  // Por enquanto, assumindo que image.file_url já é uma URL acessível.
  // Ou que o `api.defaults.baseURL` pode ser usado se necessário.
}

const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({
  isOpen,
  onClose,
  onImageSelect,
}) => {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Ajuste se a URL base da API não estiver configurada globalmente no Axios
  const API_BASE_URL = api.defaults.baseURL || '';

  const fetchImagesCallback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // O endpoint GET /images/ pode ou não precisar de autenticação
      // Depende da configuração do seu backend.
      const response = await api.get<Image[]>('/images/');
      setImages(response.data);
    } catch (err: any) {
      console.error("Falha ao buscar imagens para o seletor:", err);
      setError(err.response?.data?.detail || "Erro ao carregar imagens.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchImagesCallback();
      setSelectedImage(null); // Reseta seleção ao abrir
      setSearchTerm('');    // Reseta busca
    }
  }, [isOpen, fetchImagesCallback]);

  const handleConfirmSelection = () => {
    if (selectedImage) {
      // Se a file_url for relativa (ex: /static/...), precisa ser prefixada.
      // Se já for absoluta, o prefixo não é necessário.
      let finalUrl = selectedImage.file_url;
      if (finalUrl.startsWith('/static/') && API_BASE_URL && !finalUrl.startsWith(API_BASE_URL)) {
         // Evitar duplicação de baseURL se já estiver embutida
         if (API_BASE_URL.endsWith('/') && finalUrl.startsWith('/')) {
            finalUrl = API_BASE_URL + finalUrl.substring(1);
        } else if (!API_BASE_URL.endsWith('/') && !finalUrl.startsWith('/')) {
            finalUrl = API_BASE_URL + '/' + finalUrl;
        } else {
            finalUrl = API_BASE_URL + finalUrl;
        }
      }
      onImageSelect(finalUrl);
      onClose();
    }
  };

  const filteredImages = images.filter(image =>
    image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (image.alt_text && image.alt_text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <GlobalModal>
      <GlobalModalContent style={{ maxWidth: '800px', width: '90%' }}>
        <ModalHeader>Selecionar Imagem</ModalHeader>
        <SearchInput
            type="text"
            placeholder="Buscar por nome ou texto alternativo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isLoading && <ActivityIndicator />}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!isLoading && !error && (
          <ImageGrid>
            {filteredImages.length > 0 ? (
                filteredImages.map(image => (
              <ImageThumbnailContainer
                key={image.id}
                onClick={() => setSelectedImage(image)}
                isSelected={selectedImage?.id === image.id}
                title={`Selecionar: ${image.filename}\nAlt: ${image.alt_text || 'N/D'}`}
              >
                {/* Se image.file_url for relativa e o backend estiver em outro domínio/porta,
                    você precisará prefixá-la com a URL base da API aqui também.
                    Ex: src={image.file_url.startsWith('http') ? image.file_url : `${API_BASE_URL}${image.file_url}`}
                */}
                <img src={image.file_url} alt={image.alt_text || image.filename} />
                <div className="filename-overlay">{image.filename}</div>
              </ImageThumbnailContainer>
            ))
            ) : (
                <p>Nenhuma imagem encontrada {searchTerm ? 'para sua busca.' : '.'}</p>
            )}
          </ImageGrid>
        )}
        <ModalFooter>
          <Button $variant="secondary" onClick={onClose}>
            <FaTimesCircle style={{ marginRight: '5px' }} /> Cancelar
          </Button>
          <Button
            $variant="primary"
            onClick={handleConfirmSelection}
            disabled={!selectedImage || isLoading}
          >
            <FaCheckCircle style={{ marginRight: '5px' }} /> Confirmar Seleção
          </Button>
        </ModalFooter>
      </GlobalModalContent>
    </GlobalModal>
  );
};

export default ImageSelectorModal;