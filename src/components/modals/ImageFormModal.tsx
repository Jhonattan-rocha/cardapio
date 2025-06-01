// src/components/modals/ImageFormModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import type { Image, ImageSubmitData, ImageMetadataUpdateData, ImageReplaceFileData } from '../../types/imageTypes';
import { Button } from '../common/Buttun'; // Verifique se o nome do arquivo é Button.ts ou Button.tsx
import { Modal as GlobalModal, ModalContent as GlobalModalContent } from '../../styles/GlobalStyles';
import ActivityIndicator from '../common/ActivityIndicator';
import { FaUpload, FaSave, FaTimes } from 'react-icons/fa';

const FormSection = styled.div`
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--text-color-strong);
  }
  input[type="text"],
  input[type="file"] {
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background-color: var(--input-background-color);
    color: var(--text-color);
    box-sizing: border-box;
  }
  input[type="file"] {
    padding: 5px; // Ajuste para input file
  }
  img {
    max-width: 100%;
    max-height: 200px;
    margin-top: 10px;
    margin-bottom: 10px;
    border-radius: var(--border-radius);
    border: 1px solid var(--border-color);
    object-fit: contain;
  }
  p.error-message {
    color: var(--danger-color);
    font-size: 0.9em;
    margin-top: -10px;
    margin-bottom: 10px;
  }
`;

const PreviewContainer = styled.div`
  margin-bottom: 15px;
  text-align: center;
`;

const FileInputLabel = styled.label`
  display: inline-block;
  padding: 10px 15px;
  background-color: var(--primary-color);
  color: white;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  margin-bottom: 10px;

  &:hover {
    background-color: var(--primary-color-dark);
  }

  svg {
    margin-right: 8px;
  }
`;

interface ImageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    imageData: ImageSubmitData | ImageMetadataUpdateData | ImageReplaceFileData,
    isReplacingFile?: boolean
  ) => Promise<void>;
  initialData?: Image;
  mode: 'upload' | 'editMetadata' | 'replaceFile'; // Para controlar a operação
}

const ImageFormModal: React.FC<ImageFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
}) => {
  const [altText, setAltText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = mode === 'upload';
  const isEditingMetadata = mode === 'editMetadata';
  const isReplacingFile = mode === 'replaceFile';

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsLoading(false);
      if ((isEditingMetadata || isReplacingFile) && initialData) {
        setAltText(initialData.alt_text || '');
        setPreviewUrl(initialData.file_url); // Mostrar imagem existente
        setSelectedFile(null); // Resetar seleção de arquivo
      } else { // Uploading
        setAltText('');
        setSelectedFile(null);
        setPreviewUrl(null);
      }
      // Limpar o valor do input file se ele existir
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [initialData, isOpen, mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem válido.');
        setSelectedFile(null);
        setPreviewUrl(isReplacingFile && initialData ? initialData.file_url : null); // Manter preview antigo se estiver substituindo
        return;
      }
      setError(null);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        // Se nenhum arquivo for selecionado (ex: usuário cancelou a seleção de arquivo)
        setSelectedFile(null);
        // Se estiver editando metadados, mantém o preview da imagem existente
        // Se estiver fazendo upload ou substituindo e cancelar, limpa o preview
        if (isUploading || (isReplacingFile && !initialData?.file_url)) {
            setPreviewUrl(null);
        } else if (isReplacingFile && initialData?.file_url) {
            setPreviewUrl(initialData.file_url); // Volta para o preview da imagem original
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if ((isUploading || isReplacingFile) && !selectedFile) {
      setError('Por favor, selecione um arquivo de imagem.');
      return;
    }

    setIsLoading(true);
    try {
      if (isUploading && selectedFile) {
        const data: ImageSubmitData = { file: selectedFile, alt_text: altText || undefined };
        await onSave(data);
      } else if (isEditingMetadata) {
        const data: ImageMetadataUpdateData = { alt_text: altText || undefined };
        await onSave(data);
      } else if (isReplacingFile && selectedFile) {
        const data: ImageReplaceFileData = { file: selectedFile };
        await onSave(data, true); // Passa flag para indicar que é substituição de arquivo
      }
    } catch (submissionError: any) {
      setError(submissionError.message || 'Erro ao salvar imagem.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  let title = "Carregar Nova Imagem";
  if (isEditingMetadata) title = "Editar Texto Alternativo";
  if (isReplacingFile) title = "Substituir Arquivo da Imagem";


  return (
    <GlobalModal>
      <GlobalModalContent style={{ maxWidth: '550px' }}>
        <h3>{title}</h3>
        <form onSubmit={handleSubmit}>
          {(isUploading || isReplacingFile) && (
            <FormSection>
              <label htmlFor="file">Arquivo da Imagem:</label>
              {previewUrl && (
                <PreviewContainer>
                  <img src={previewUrl} alt={altText || 'Preview da imagem'} />
                </PreviewContainer>
              )}
              <input
                type="file"
                id="file"
                name="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }} // Esconder o input padrão
              />
              <FileInputLabel htmlFor="file">
                <FaUpload /> {selectedFile ? selectedFile.name : 'Escolher Imagem'}
              </FileInputLabel>
              {error && error.includes('arquivo') && <p className="error-message">{error}</p>}
            </FormSection>
          )}

          {(isUploading || isEditingMetadata) && (
             <FormSection>
                <label htmlFor="alt_text">Texto Alternativo (Opcional):</label>
                <input
                type="text"
                id="alt_text"
                name="alt_text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descreva a imagem para acessibilidade"
                />
            </FormSection>
          )}


          {error && !error.includes('arquivo') && <p className="error-message" style={{textAlign: 'center', marginTop: '10px'}}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
            <Button type="button" $variant="secondary" onClick={onClose} disabled={isLoading}>
              <FaTimes style={{ marginRight: '5px' }} /> Cancelar
            </Button>
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <Button type="submit" $variant="primary">
                <FaSave style={{ marginRight: '5px' }} />
                {isUploading && 'Carregar Imagem'}
                {isEditingMetadata && 'Salvar Texto'}
                {isReplacingFile && 'Substituir Arquivo'}
              </Button>
            )}
          </div>
        </form>
      </GlobalModalContent>
    </GlobalModal>
  );
};

export default ImageFormModal;