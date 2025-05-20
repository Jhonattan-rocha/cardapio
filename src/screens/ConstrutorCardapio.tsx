// src/screens/ConstrutorCardapio.tsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { Cardapio, CardapioSecao, CardapioItem } from '../types/cardapioTypes';
import { Button, IconButton } from '../components/common/Buttun';
import { FaArrowLeft, FaPlus, FaImage, FaList, FaHeading, FaBars, FaTrashAlt, FaEdit, FaSave, FaFilePdf } from 'react-icons/fa';

// Importe uma biblioteca de editor de texto rica aqui (ex: ReactQuill)
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css'; // ou 'quill/dist/quill.snow.css'

// --- Styled Components ---
const Container = styled.div`
  max-width: 1000px;
  margin: var(--spacing-lg) auto;
  padding: var(--spacing-lg);
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
`;

const FormSection = styled.div`
  background-color: #fdfdfd;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);

  h3 {
    margin-bottom: var(--spacing-md);
    color: var(--primary-color);
  }

  label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-weight: 600;
    color: var(--text-color);
  }

  input[type="text"],
  textarea {
    margin-bottom: var(--spacing-md);
  }
`;

const ContentBuilderArea = styled.div`
  background-color: #fdfdfd;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  min-height: 300px;
`;

const Toolbar = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;

  ${Button} {
    font-size: 0.9rem;
    padding: 8px 12px;
  }
`;

const ContentElement = styled.div`
  background-color: #ffffff;
  border: 1px dashed var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  cursor: grab;
  box-shadow: var(--box-shadow);

  &:hover {
    border-color: var(--primary-color);
  }
`;

const ElementControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 30px; /* Para acomodar os ícones */
  align-items: center;
  justify-content: center;
  padding-top: var(--spacing-sm);
`;

const ElementContent = styled.div`
  flex-grow: 1;
`;

const StyledImagePreview = styled.img`
  max-width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
  border-radius: var(--border-radius);
  margin-top: var(--spacing-sm);
`;

const CardapioItemContainer = styled.div`
  padding: var(--spacing-sm);
  border: 1px solid #eee;
  border-radius: var(--border-radius);
  margin-top: var(--spacing-sm);
  background-color: #f9f9f9;

  h4 {
    margin-bottom: 5px;
    color: var(--primary-color);
  }
  p {
    margin-bottom: 5px;
    font-size: 0.9rem;
    color: var(--text-light-color);
  }
  span {
    font-weight: bold;
    color: var(--text-color);
  }
`;

const AddItemButton = styled(Button)`
  margin-top: var(--spacing-md);
`;

const PdfButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
`;

interface ConstrutorCardapioProps {
  cardapioId?: string; // Opcional, para edição
  onSave: (cardapio: Cardapio) => void;
  onBack: () => void;
}

const ConstrutorCardapio: React.FC<ConstrutorCardapioProps> = ({ cardapioId, onSave, onBack }) => {
  // Estado inicial do cardápio
  const [cardapio, setCardapio] = useState<Cardapio>({
    id: cardapioId || `novo-${Date.now()}`,
    nome: '',
    descricaoBreve: '',
    categoria: '',
    status: 'rascunho',
    ultimaAtualizacao: new Date().toISOString(),
    conteudo: [],
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<CardapioItem>>({});

  useEffect(() => {
    // Carregar dados do cardápio para edição se cardapioId for fornecido
    if (cardapioId) {
      // Simulação de carregamento de dados (em um ambiente real, faria uma chamada à API)
      const dummyCardapio: Cardapio = {
        id: cardapioId,
        nome: 'Cardápio de Exemplo Existente',
        descricaoBreve: 'Este é um cardápio carregado para edição.',
        categoria: 'Almoço',
        status: 'rascunho',
        ultimaAtualizacao: '2024-05-18T10:00:00Z',
        conteudo: [
          { id: 'sec1', tipo: 'titulo', titulo: 'Entradas' },
          {
              id: 'item1', tipo: 'item', items: [{ id: 'pi1', nome: 'Salada Caprese', descricao: 'Tomate, mussarela de búfala e manjericão.', preco: 25.00, tags: ['Vegetariano'] }],
              titulo: ''
          },
          {
              id: 'txt1', tipo: 'texto', texto: 'Nossos pratos são preparados com ingredientes frescos e selecionados.',
              titulo: ''
          },
          {
              id: 'img1', tipo: 'imagem', imagemUrl: 'https://via.placeholder.com/400x200/F0F0F0/000000?text=Imagem+de+Exemplo',
              titulo: ''
          },
        ],
      };
      setCardapio(dummyCardapio);
    }
  }, [cardapioId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCardapio({ ...cardapio, [name]: value });
  };

  const addContentElement = (type: CardapioSecao['tipo']) => {
    const newElement: CardapioSecao = {
        id: `element-${Date.now()}`,
        tipo: type,
        titulo: ''
    };

    switch (type) {
      case 'titulo':
        newElement.titulo = 'Novo Título de Seção';
        break;
      case 'texto':
        newElement.texto = 'Clique para editar este texto.';
        break;
      case 'item':
        // Abre modal para adicionar um item de cardápio
        setCurrentItem({});
        setEditingItemId(null);
        setShowItemModal(true);
        return; // Retorna para aguardar o modal
      case 'imagem':
        newElement.imagemUrl = 'https://via.placeholder.com/300x150?text=Upload+Imagem'; // Placeholder
        break;
      case 'lista':
        newElement.listaItems = ['Item 1', 'Item 2'];
        break;
      default:
        break;
    }
    setCardapio(prev => ({
      ...prev,
      conteudo: [...prev.conteudo, newElement],
    }));
  };

  const updateContentElement = (id: string, updates: Partial<CardapioSecao>) => {
    setCardapio(prev => ({
      ...prev,
      conteudo: prev.conteudo.map(el => (el.id === id ? { ...el, ...updates } : el)),
    }));
  };

  const deleteContentElement = (id: string) => {
    setCardapio(prev => ({
      ...prev,
      conteudo: prev.conteudo.filter(el => el.id !== id),
    }));
  };

  const handleSaveCardapio = (publish: boolean = false) => {
    const finalCardapio = {
      ...cardapio,
      status: publish ? 'publicado' : 'rascunho',
      ultimaAtualizacao: new Date().toISOString(),
    };
    onSave(finalCardapio); // Chama a função onSave do componente pai
    alert('Cardápio salvo!');
  };

  const handleGeneratePdf = () => {
    // --- LÓGICA DE GERAÇÃO DE PDF ---
    // Isso seria a parte mais complexa. Você usaria uma biblioteca como jsPDF ou html2pdf.js
    // para renderizar o conteúdo do cardápio em um PDF.
    // Exemplo básico (APENAS CONCEITUAL):
    alert('Gerando PDF do cardápio... (Implementação de PDF viria aqui)');
    console.log('Dados do cardápio para PDF:', cardapio);
    // Exemplo de como usar jsPDF (necessitaria de instalação):
    /*
    import jsPDF from 'jspdf';
    const doc = new jsPDF();
    doc.text(cardapio.nome, 10, 10);
    cardapio.conteudo.forEach((section, index) => {
        if (section.tipo === 'titulo') doc.text(section.titulo!, 10, 20 + (index * 10));
        if (section.tipo === 'texto') doc.text(section.texto!, 10, 20 + (index * 10));
        // ... e assim por diante para outros tipos de conteúdo
    });
    doc.save(`${cardapio.nome}.pdf`);
    */
  };

  // Lógica para o modal de item de cardápio
  const handleItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: name === 'preco' ? parseFloat(value) || 0 : value }));
  };

  const handleItemSave = () => {
    if (!currentItem.nome || !currentItem.preco) {
      alert('Nome e Preço do item são obrigatórios.');
      return;
    }

    if (editingItemId) {
      // Atualizar item existente dentro de uma seção de itens
      setCardapio(prev => ({
        ...prev,
        conteudo: prev.conteudo.map(section => {
          if (section.tipo === 'item' && section.items) {
            return {
              ...section,
              items: section.items.map(item =>
                item.id === editingItemId ? { ...item, ...currentItem as CardapioItem } : item
              ),
            };
          }
          return section;
        }),
      }));
    } else {
      // Adicionar novo item a uma nova seção de item (ou a uma existente se for mais complexo)
      const newItem: CardapioItem = {
        ...currentItem as CardapioItem,
      };
      setCardapio(prev => ({
        ...prev,
        conteudo: [...prev.conteudo, { id: `section-${Date.now()}`, titulo: '', tipo: 'item', items: [newItem] }],
      }));
    }
    setShowItemModal(false);
    setCurrentItem({});
    setEditingItemId(null);
  };

  const handleEditItem = (itemId: string, itemData: CardapioItem) => {
    setCurrentItem(itemData);
    setEditingItemId(itemId);
    setShowItemModal(true);
  };

  // --- Placeholder for Drag-and-Drop functionality ---
  // AQUI VOCÊ INTEGRARIA UMA BIBLIOTECA COMO 'react-beautiful-dnd' ou 'dnd-kit'
  // Para permitir arrastar e soltar os elementos de 'Conteúdo'.
  const handleReorder = (draggedId: string, targetId: string) => {
    console.log(`Reordenando ${draggedId} para a posição de ${targetId}`);
    // Lógica para reordenar o array 'cardapio.conteudo'
  };


  return (
    <Container>
      <Header>
        <Button $variant="secondary" onClick={onBack}>
          <FaArrowLeft style={{ marginRight: '8px' }} /> Voltar
        </Button>
        <h1>{cardapioId ? `Editando: ${cardapio.nome}` : 'Novo Cardápio'}</h1>
        <div>
          <Button $variant="outline" onClick={() => handleSaveCardapio(false)} style={{ marginRight: 'var(--spacing-sm)' }}>
            <FaSave style={{ marginRight: '8px' }} /> Salvar Rascunho
          </Button>
          <Button $variant="primary" onClick={() => handleSaveCardapio(true)}>
            <FaSave style={{ marginRight: '8px' }} /> Salvar e Publicar
          </Button>
        </div>
      </Header>

      <FormSection>
        <h3>Informações Básicas do Cardápio</h3>
        <label htmlFor="nome">Nome do Cardápio:</label>
        <input
          type="text"
          id="nome"
          name="nome"
          value={cardapio.nome}
          onChange={handleInputChange}
          placeholder="Ex: Cardápio de Almoço Executivo"
          required
        />

        <label htmlFor="descricaoBreve">Descrição Breve:</label>
        <textarea
          id="descricaoBreve"
          name="descricaoBreve"
          value={cardapio.descricaoBreve || ''}
          onChange={handleInputChange}
          placeholder="Uma breve descrição sobre o cardápio."
          rows={3}
        />

        <label htmlFor="categoria">Categoria:</label>
        <select
          id="categoria"
          name="categoria"
          value={cardapio.categoria || ''}
          onChange={handleInputChange}
        >
          <option value="">Selecione uma categoria</option>
          <option value="Almoço">Almoço</option>
          <option value="Jantar">Jantar</option>
          <option value="Bebidas">Bebidas</option>
          <option value="Sobremesas">Sobremesas</option>
          <option value="Especial">Especial</option>
        </select>
      </FormSection>

      <ContentBuilderArea>
        <h3>Conteúdo do Cardápio</h3>
        <Toolbar>
          <Button onClick={() => addContentElement('titulo')}>
            <FaHeading style={{ marginRight: '8px' }} /> Adicionar Título
          </Button>
          <Button onClick={() => addContentElement('item')}>
            <FaPlus style={{ marginRight: '8px' }} /> Adicionar Item de Cardápio
          </Button>
          <Button onClick={() => addContentElement('texto')}>
            <FaBars style={{ marginRight: '8px' }} /> Adicionar Bloco de Texto
          </Button>
          <Button onClick={() => addContentElement('imagem')}>
            <FaImage style={{ marginRight: '8px' }} /> Adicionar Imagem
          </Button>
          <Button onClick={() => addContentElement('lista')}>
            <FaList style={{ marginRight: '8px' }} /> Adicionar Lista Simples
          </Button>
        </Toolbar>

        {cardapio.conteudo.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-light-color)', marginTop: 'var(--spacing-lg)' }}>
            Comece adicionando elementos ao seu cardápio usando os botões acima.
          </p>
        )}

        {cardapio.conteudo.map((section, index) => (
          <ContentElement key={section.id} draggable onDragStart={(e) => {
            // Lógica para drag-and-drop: e.dataTransfer.setData('elementId', section.id);
            console.log('Iniciando drag de:', section.id);
          }}>
            <ElementControls>
              <FaBars style={{ cursor: 'grab', color: 'var(--secondary-color)' }} title="Arrastar para reordenar" />
              <IconButton size={20} onClick={() => deleteContentElement(section.id)} title="Remover" $variant="danger">
                <FaTrashAlt />
              </IconButton>
              {/* Adicionar um botão de edição para cada tipo de conteúdo */}
              { (section.tipo !== 'item' || (section.tipo === 'item' && section.items && section.items.length > 0)) && (
                <IconButton size={20} onClick={() => {
                    // Lógica para abrir o modal/formulário de edição do elemento
                    if (section.tipo === 'titulo') {
                        const newTitle = prompt('Editar título:', section.titulo || '');
                        if (newTitle !== null) updateContentElement(section.id, { titulo: newTitle });
                    } else if (section.tipo === 'texto') {
                        // Aqui você abriria seu editor WYSIWYG
                        const newText = prompt('Editar texto:', section.texto || '');
                        if (newText !== null) updateContentElement(section.id, { texto: newText });
                    } else if (section.tipo === 'imagem') {
                        const newImageUrl = prompt('Editar URL da Imagem:', section.imagemUrl || '');
                        if (newImageUrl !== null) updateContentElement(section.id, { imagemUrl: newImageUrl });
                    } else if (section.tipo === 'lista') {
                        const newItems = prompt('Editar itens da lista (separados por ;):', section.listaItems?.join(';') || '');
                        if (newItems !== null) updateContentElement(section.id, { listaItems: newItems.split(';').map(s => s.trim()) });
                    }
                }} title="Editar">
                  <FaEdit />
                </IconButton>
              )}
            </ElementControls>
            <ElementContent>
              {section.tipo === 'titulo' && <h2>{section.titulo}</h2>}
              {section.tipo === 'texto' && (
                // Aqui você renderizaria seu editor WYSIWYG (ex: <ReactQuill value={section.texto} onChange={...} />)
                <div dangerouslySetInnerHTML={{ __html: section.texto || '' }} />
              )}
              {section.tipo === 'item' && section.items && (
                <>
                  {section.items.map(item => (
                    <CardapioItemContainer key={item.id}>
                      <h4>{item.nome} {item.preco && <span>R$ {item.preco.toFixed(2)}</span>}</h4>
                      <p>{item.descricao}</p>
                      {item.imagemUrl && <StyledImagePreview src={item.imagemUrl} alt={item.nome} />}
                      {item.tags && item.tags.length > 0 && (
                        <p>Tags: {item.tags.join(', ')}</p>
                      )}
                      <Button onClick={() => handleEditItem(item.id, item)} $variant="secondary" style={{ marginRight: 'var(--spacing-sm)' }}>
                        Editar Item
                      </Button>
                       <Button onClick={() => {
                          if (window.confirm('Remover este item do cardápio?')) {
                            updateContentElement(section.id, { items: section.items?.filter(i => i.id !== item.id) });
                          }
                       }} $variant="danger">
                         Remover Item
                       </Button>
                    </CardapioItemContainer>
                  ))}
                  <AddItemButton $variant="outline" onClick={() => { setCurrentItem({}); setEditingItemId(null); setShowItemModal(true); }}>
                     <FaPlus style={{ marginRight: '8px' }} /> Adicionar Outro Item a Esta Seção
                  </AddItemButton>
                </>
              )}
              {section.tipo === 'imagem' && section.imagemUrl && (
                <>
                  <StyledImagePreview src={section.imagemUrl} alt="Pré-visualização da imagem" />
                  {/* Botão de upload real (necessita de lógica de upload para um servidor) */}
                  <input type="file" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateContentElement(section.id, { imagemUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file); // Para pré-visualização local
                      // Lógica de upload para backend viria aqui
                    }
                  }} />
                </>
              )}
              {section.tipo === 'lista' && section.listaItems && (
                <ul>
                  {section.listaItems.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </ElementContent>
          </ContentElement>
        ))}
      </ContentBuilderArea>

      <PdfButtonWrapper>
        <Button $variant="secondary" onClick={handleGeneratePdf}>
          <FaFilePdf style={{ marginRight: '8px' }} /> Gerar PDF Padrão
        </Button>
      </PdfButtonWrapper>

      {/* Modal para Adicionar/Editar Item de Cardápio */}
      {showItemModal && (
        <Modal>
          <ModalContent>
            <h3>{editingItemId ? 'Editar Item de Cardápio' : 'Adicionar Novo Item'}</h3>
            <label htmlFor="itemName">Nome:</label>
            <input
              type="text"
              id="itemName"
              name="nome"
              value={currentItem.nome || ''}
              onChange={handleItemFormChange}
              placeholder="Nome do prato"
              required
            />
            <label htmlFor="itemDescricao">Descrição:</label>
            <textarea
              id="itemDescricao"
              name="descricao"
              value={currentItem.descricao || ''}
              onChange={handleItemFormChange}
              placeholder="Breve descrição do prato"
              rows={3}
            />
            <label htmlFor="itemPreco">Preço:</label>
            <input
              type="number"
              id="itemPreco"
              name="preco"
              value={currentItem.preco || ''}
              onChange={handleItemFormChange}
              step="0.01"
              placeholder="0.00"
              required
            />
            {/* Campo para tags, imagem, etc. */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
              <Button $variant="secondary" onClick={() => setShowItemModal(false)}>Cancelar</Button>
              <Button $variant="primary" onClick={handleItemSave}>
                <FaSave style={{ marginRight: '8px' }} /> Salvar Item
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default ConstrutorCardapio;

// Estilos básicos para o Modal (poderia ser um componente separado)
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--surface-color);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  width: 90%;
  max-width: 500px;

  h3 {
    margin-bottom: var(--spacing-lg);
    color: var(--primary-color);
  }
`;