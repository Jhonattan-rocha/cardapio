// src/screens/ConstrutorCardapio.tsx

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import jsPDF from 'jspdf';

import type { Cardapio, CardapioSecao, CardapioItem } from '../../types/cardapioTypes';
import { Button, IconButton } from '../../components/common/Buttun'; // Ajuste o caminho se necessário
import { FaArrowLeft, FaPlus, FaImage, FaList, FaHeading, FaBars, FaTrashAlt, FaEdit, FaSave, FaFilePdf } from 'react-icons/fa';
import { Modal, ModalContent } from '../../styles/GlobalStyles'; // Ajuste o caminho se necessário
import { AddItemButton, CardapioItemContainer, Container, ContentBuilderArea, ContentElement, ElementContent, ElementControls,
    FormSection, Header, PdfButtonWrapper, StyledImagePreview, Toolbar
 } from './styled';

// --- Tipos para Modais de Edição ---
interface EditingItemState extends Partial<CardapioItem> {
    // Adicione campos específicos para o formulário se necessário
}

interface EditingElementState {
  id: string;
  type: CardapioSecao['tipo'];
  currentConteudo: {
    titulo?: string;
    texto?: string;
    imagemUrl?: string;
    legendaImagem?: string;
    listaItems?: string; // Editado como string separada por ;
    // Adicionar outros campos conforme necessário
  };
  currentImageFile?: File | null;
}

// --- Componente Principal ---
interface ConstrutorCardapioProps {
  cardapioId?: string;
  onSave: (cardapio: Cardapio) => void;
  onBack: () => void;
}

const ConstrutorCardapio: React.FC<ConstrutorCardapioProps> = ({ cardapioId, onSave, onBack }) => {
  const [cardapio, setCardapio] = useState<Cardapio>({
    id: cardapioId || uuidv4(),
    nome: '',
    descricaoBreve: '',
    categoria: '',
    status: 'rascunho',
    ultimaAtualizacao: new Date().toISOString(),
    conteudo: [],
    moeda: 'BRL', // Default
  });

  // Estados para o modal de item de cardápio (prato/bebida)
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItemData, setCurrentItemData] = useState<EditingItemState>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null); // ID do CardapioItem sendo editado
  const [targetSectionIdForModalItem, setTargetSectionIdForModalItem] = useState<string | undefined>(undefined); // Para saber em qual seção de itens adicionar um novo item

  // Estados para o modal de edição de elemento de conteúdo (seção)
  const [showEditElementModal, setShowEditElementModal] = useState(false);
  const [editingElement, setEditingElement] = useState<EditingElementState | null>(null);

  useEffect(() => {
    if (cardapioId && cardapioId !== 'novo') { // 'novo' pode ser um placeholder para criar
      // Simulação de carregamento de dados
      console.log(`Carregando cardápio com ID: ${cardapioId}`);
      const dummyCardapio: Cardapio = {
        id: cardapioId,
        nome: 'Cardápio de Exemplo',
        descricaoBreve: 'Descrição de exemplo para um cardápio saboroso.',
        categoria: 'Jantar',
        status: 'rascunho',
        ultimaAtualizacao: new Date().toISOString(),
        logoUrl: 'https://via.placeholder.com/150x50/CCCCCC/000000?text=Logo+Restaurante',
        informacoesAdicionais: 'Wi-Fi: restaurante_wifi | Aceitamos todos os cartões.',
        moeda: 'BRL',
        conteudo: [
          { id: uuidv4(), ordem: 0, tipo: 'titulo', titulo: 'Nossas Entradas Especiais' },
          {
            id: uuidv4(), ordem: 1, tipo: 'item', titulo: 'Petiscos', items: [
              { id: uuidv4(), nome: 'Bruschetta Clássica', descricao: 'Pão italiano tostado com tomates frescos, alho, manjericão e azeite.', preco: 28.00, tags: ['Vegetariano'], alergenicos: ['Glúten'] },
              { id: uuidv4(), nome: 'Dadinhos de Tapioca', descricao: 'Com queijo coalho e geleia de pimenta.', preco: 32.00, alergenicos: ['Lactose'] }
            ]
          },
          { id: uuidv4(), ordem: 2, tipo: 'texto', texto: '<p>Todos os nossos pratos são preparados com <strong>ingredientes frescos</strong> e de alta qualidade, provenientes de produtores locais sempre que possível.</p>', titulo: 'Sobre Nossos Ingredientes' },
          { id: uuidv4(), ordem: 3, tipo: 'imagem', imagemUrl: 'https://via.placeholder.com/600x200/F0F0F0/000000?text=Prato+Principal+Delicioso', legendaImagem: 'Experimente nosso carro-chefe!', titulo: 'Destaque do Chef' },
        ],
      };
      setCardapio(dummyCardapio);
    } else {
      // Se não há cardapioId, garante que um novo ID seja gerado se o default não for uuid
      setCardapio(prev => ({...prev, id: prev.id.startsWith('novo-') ? uuidv4() : prev.id }))
    }
  }, [cardapioId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCardapio({ ...cardapio, [name]: value });
  };

  const addContentElement = (type: CardapioSecao['tipo']) => {
    const newElementBase: Omit<CardapioSecao, 'tipo'> = { // Omitir tipo para adicionar dinamicamente
        id: uuidv4(),
        ordem: cardapio.conteudo.length, // Ordem inicial
        titulo: '', // Default
    };

    let newElement: CardapioSecao;

    switch (type) {
      case 'titulo':
        newElement = { ...newElementBase, tipo: type, titulo: 'Novo Título de Seção' };
        break;
      case 'texto':
        newElement = { ...newElementBase, tipo: type, texto: '<p>Clique para editar este bloco de texto...</p>' };
        break;
      case 'item':
        // Para 'item', abrimos o modal para adicionar o primeiro item, e a seção é criada ao salvar o item.
        setCurrentItemData({ disponivel: true }); // Default para novo item
        setEditingItemId(null);
        setTargetSectionIdForModalItem(undefined); // Indica que será uma nova seção de itens
        setShowItemModal(true);
        return; // Retorna para aguardar o modal
      case 'imagem':
        newElement = { ...newElementBase, tipo: type, imagemUrl: 'https://via.placeholder.com/400x200?text=Nova+Imagem' };
        break;
      case 'lista':
        newElement = { ...newElementBase, tipo: type, listaItems: ['Item 1', 'Item 2'] };
        break;
      default:
        return; // Tipo desconhecido
    }
    setCardapio(prev => ({
      ...prev,
      conteudo: [...prev.conteudo, newElement].sort((a, b) => a.ordem - b.ordem),
    }));
  };

  const updateContentElement = (id: string, updates: Partial<CardapioSecao>) => {
    setCardapio(prev => ({
      ...prev,
      conteudo: prev.conteudo.map(el => (el.id === id ? { ...el, ...updates } : el)),
    }));
  };

  const deleteContentElement = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta seção do cardápio?')) {
      setCardapio(prev => ({
        ...prev,
        conteudo: prev.conteudo.filter(el => el.id !== id),
      }));
    }
  };

  // Drag-and-Drop Handler
  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(cardapio.conteudo);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItemsWithOrder = items.map((item, index) => ({
      ...item,
      ordem: index,
    }));

    setCardapio(prev => ({
      ...prev,
      conteudo: updatedItemsWithOrder,
    }));
  };

  // --- Modal de Edição de Elemento de Conteúdo (Seção) ---
  const openEditElementModal = (section: CardapioSecao) => {
    setEditingElement({
      id: section.id,
      type: section.tipo,
      currentConteudo: {
        titulo: section.titulo,
        texto: section.tipo === 'texto' ? section.texto : undefined,
        imagemUrl: section.tipo === 'imagem' ? section.imagemUrl : undefined,
        legendaImagem: section.tipo === 'imagem' ? section.legendaImagem : undefined,
        listaItems: section.tipo === 'lista' ? section.listaItems?.join(';\n') : undefined,
      },
      currentImageFile: null,
    });
    setShowEditElementModal(true);
  };

  const handleEditingElementChange = (field: keyof EditingElementState['currentConteudo'], value: any) => {
    if (editingElement) {
      setEditingElement({
        ...editingElement,
        currentConteudo: {
          ...editingElement.currentConteudo,
          [field]: value,
        },
      });
    }
  };
  
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingElement) {
        setEditingElement({ ...editingElement, currentImageFile: file });
        // Preview local imediato se desejar (opcional, pois o save fará isso)
        const reader = new FileReader();
        reader.onloadend = () => {
            handleEditingElementChange('imagemUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  }

  const handleSaveElementChanges = () => {
    if (!editingElement) return;

    const updates: Partial<CardapioSecao> = { titulo: editingElement.currentConteudo.titulo };

    switch (editingElement.type) {
      case 'titulo':
        // titulo já está em updates
        break;
      case 'texto':
        updates.texto = editingElement.currentConteudo.texto;
        break;
      case 'imagem':
        updates.imagemUrl = editingElement.currentConteudo.imagemUrl;
        updates.legendaImagem = editingElement.currentConteudo.legendaImagem;
        // Se currentImageFile existe e foi alterado (handleImageFileChange já atualizou imagemUrl para DataURL)
        // Nenhuma ação extra aqui se o DataURL já está em currentConteudo.imagemUrl
        break;
      case 'lista':
        updates.listaItems = editingElement.currentConteudo.listaItems?.split(';').map(s => s.trim()).filter(Boolean);
        break;
    }
    updateContentElement(editingElement.id, updates);
    setShowEditElementModal(false);
    setEditingElement(null);
  };

  // --- Modal de Item de Cardápio (Prato/Bebida) ---
  const handleItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean | string[] = value;

    if (type === 'number') processedValue = parseFloat(value) || 0;
    if (name === 'disponivel') processedValue = (e.target as HTMLInputElement).checked;
    if (name === 'tags' || name === 'alergenicos') processedValue = value.split(',').map(tag => tag.trim()).filter(Boolean);
    
    setCurrentItemData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleItemSave = () => {
    if (!currentItemData.nome || typeof currentItemData.preco !== 'number') {
      alert('Nome e Preço do item são obrigatórios e o preço deve ser um número.');
      return;
    }

    const itemToSave: CardapioItem = {
      id: editingItemId || uuidv4(),
      nome: currentItemData.nome!,
      preco: currentItemData.preco!,
      descricao: currentItemData.descricao,
      imagemUrl: currentItemData.imagemUrl,
      tags: currentItemData.tags,
      alergenicos: currentItemData.alergenicos,
      disponivel: typeof currentItemData.disponivel === 'boolean' ? currentItemData.disponivel : true,
      ordem: currentItemData.ordem || 0, // Default ordem
    };

    if (editingItemId) { // Editando item existente
      setCardapio(prev => ({
        ...prev,
        conteudo: prev.conteudo.map(section => {
          if (section.tipo === 'item' && section.items) {
            return {
              ...section,
              items: section.items.map(item =>
                item.id === editingItemId ? itemToSave : item
              ).sort((a,b) => (a.ordem || 0) - (b.ordem || 0)), // Reordena
            };
          }
          return section;
        }),
      }));
    } else { // Adicionando novo item
      if (targetSectionIdForModalItem) { // Adicionar a uma seção de itens existente
        setCardapio(prev => ({
          ...prev,
          conteudo: prev.conteudo.map(section =>
            section.id === targetSectionIdForModalItem && section.tipo === 'item'
              ? { ...section, items: [...(section.items || []), itemToSave].sort((a,b) => (a.ordem || 0) - (b.ordem || 0)) }
              : section
          ),
        }));
      } else { // Criar nova seção de item
        const newSection: CardapioSecao = {
          id: uuidv4(),
          tipo: 'item',
          ordem: cardapio.conteudo.length,
          titulo: 'Nova Seção de Itens', // Pode ser editável depois
          items: [itemToSave].sort((a,b) => (a.ordem || 0) - (b.ordem || 0)),
        };
        setCardapio(prev => ({
          ...prev,
          conteudo: [...prev.conteudo, newSection].sort((a,b) => a.ordem - b.ordem),
        }));
      }
    }
    setShowItemModal(false);
    setCurrentItemData({});
    setEditingItemId(null);
    setTargetSectionIdForModalItem(undefined);
  };

  const openEditItemModal = (item: CardapioItem, sectionId: string) => {
    setCurrentItemData({ ...item });
    setEditingItemId(item.id);
    setTargetSectionIdForModalItem(sectionId); // Mantém o contexto da seção para o caso de salvar como novo (não usual aqui)
    setShowItemModal(true);
  };

  const handleDeleteItem = (itemId: string, sectionId: string) => {
    if (window.confirm('Remover este item do cardápio?')) {
      setCardapio(prev => ({
        ...prev,
        conteudo: prev.conteudo.map(section => {
          if (section.id === sectionId && section.tipo === 'item' && section.items) {
            const updatedItems = section.items.filter(i => i.id !== itemId);
            // Se a seção de itens ficar vazia, pode-se optar por removê-la ou mantê-la.
            // Aqui, vamos manter a seção, mesmo que vazia, para que o usuário possa adicionar mais itens.
            // if (updatedItems.length === 0) return null; // Para remover seção vazia (filtrar depois)
            return { ...section, items: updatedItems };
          }
          return section;
        })
        // .filter(Boolean) as CardapioSecao[] // Usar se optar por remover seções vazias
      }));
    }
  };
  
  // --- PDF Generation ---
  const handleGeneratePdf = () => {
    const doc = new jsPDF();
    let y = 20; 
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    const lineHeight = 6;
    const titleFontSize = 18;
    const sectionTitleFontSize = 14;
    const itemFontSize = 11;
    const descriptionFontSize = 9;
    const priceFontSize = 11;
    const currency = cardapio.moeda === 'USD' ? '$' : cardapio.moeda === 'EUR' ? '€' : 'R$';

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addWrappedText = (
        text: string, xPos: number, _currentY: number, maxWidth: number, fontSize: number,
        options?: { color?: string | [number,number,number], style?: 'normal'|'bold'|'italic'|'bolditalic' }
    ): number => {
        doc.setFontSize(fontSize);
        if (options?.style) doc.setFont('helvetica', options.style);
        if (options?.color) {
            if (Array.isArray(options.color)) doc.setTextColor(options.color[0], options.color[1], options.color[2]);
            else doc.setTextColor(options.color);
        }

        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
            checkPageBreak(lineHeight);
            doc.text(line, xPos, y); // Usa o y global
            y += lineHeight;       // Atualiza o y global
        });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0,0,0); // Reset color to black
        return y; // Retorna o novo y
    };
    
    // 1. Logo (se existir)
    if (cardapio.logoUrl) {
        try {
            const imgProps = doc.getImageProperties(cardapio.logoUrl); // Checa se a imagem é válida
            const logoHeight = 25;
            const logoWidth = (imgProps.width * logoHeight) / imgProps.height;
            const logoX = (pageWidth - logoWidth) / 2;
            checkPageBreak(logoHeight + lineHeight);
            doc.addImage(cardapio.logoUrl, '', logoX, y, logoWidth, logoHeight);
            y += logoHeight + lineHeight * 1.5;
        } catch (e) { console.error("Erro ao adicionar logo ao PDF:", e); y += lineHeight; }
    }

    // 2. Nome do Cardápio
    checkPageBreak(titleFontSize + lineHeight);
    addWrappedText(cardapio.nome, pageWidth / 2, y, contentWidth, titleFontSize, { style: 'bold', color: [0,0,0]}); // y é atualizado dentro da função
    y += lineHeight; // Espaço extra

    // 3. Descrição Breve
    if (cardapio.descricaoBreve) {
      checkPageBreak(descriptionFontSize * 2 + lineHeight);
      y = addWrappedText(cardapio.descricaoBreve, margin, y, contentWidth, descriptionFontSize, {color: [100,100,100]});
      y += lineHeight * 0.5;
    }
    
    // 4. Conteúdo
    const sortedConteudo = [...cardapio.conteudo].sort((a, b) => a.ordem - b.ordem);
    for (const section of sortedConteudo) {
      checkPageBreak(sectionTitleFontSize + lineHeight);

      if (section.tipo === 'titulo' && section.titulo) {
        y = addWrappedText(section.titulo, margin, y, contentWidth, sectionTitleFontSize, {style: 'bold'});
        doc.setLineWidth(0.2);
        doc.line(margin, y - lineHeight/2 , pageWidth - margin, y - lineHeight/2); // Linha abaixo
        y += lineHeight * 0.5;
      } else if (section.tipo === 'texto' && section.texto) {
        const plainText = section.texto.replace(/<[^>]+>/g, ' '); // Simplificado: remove tags HTML
        y = addWrappedText(plainText, margin, y, contentWidth, itemFontSize - 1);
        y += lineHeight * 0.5;
      } else if (section.tipo === 'imagem' && section.imagemUrl) {
        try {
            const imgProps = doc.getImageProperties(section.imagemUrl);
            const imgMaxWidth = contentWidth * 0.8; // Max 80% da largura do conteúdo
            const imgWidth = Math.min(imgProps.width, imgMaxWidth);
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            checkPageBreak(imgHeight + lineHeight + (section.legendaImagem ? descriptionFontSize + lineHeight : 0));
            const imgX = (pageWidth - imgWidth) / 2; // Centralizar imagem
            doc.addImage(section.imagemUrl, '', imgX, y, imgWidth, imgHeight);
            y += imgHeight + lineHeight * 0.5;
            if (section.legendaImagem) {
                y = addWrappedText(section.legendaImagem, pageWidth/2, y, contentWidth * 0.7, descriptionFontSize -1, {color: [150,150,150], style: 'italic'});
                // Ajustar x para centralizar legenda: doc.text(legenda, pageWidth/2, y, {align: 'center'})
            }
        } catch (e) {
            console.error("Erro ao adicionar imagem da seção ao PDF:", e);
            y = addWrappedText('(Falha ao carregar imagem da seção)', margin, y, contentWidth, descriptionFontSize, {color: 'red'});
        }
        y += lineHeight;
      } else if (section.tipo === 'lista' && section.listaItems) {
        section.listaItems.forEach(item => {
            checkPageBreak(lineHeight);
            y = addWrappedText(`• ${item}`, margin + 5, y, contentWidth - 5, itemFontSize -1);
        });
        y += lineHeight * 0.5;
      } else if (section.tipo === 'item' && section.items) {
        if (section.titulo) {
             y = addWrappedText(section.titulo, margin, y, contentWidth, itemFontSize + 1, {style: 'italic', color: [50,50,50]});
             y += lineHeight * 0.25;
        }
        const sortedItems = [...section.items].sort((a,b) => (a.ordem || 0) - (b.ordem || 0));
        for (const item of sortedItems) {
            if (item.disponivel === false) continue; // Pula itens não disponíveis

            const itemHeightEstimate = itemFontSize + (item.descricao ? descriptionFontSize * 2 : 0) + lineHeight * 2;
            checkPageBreak(itemHeightEstimate);

            const priceText = `${currency} ${item.preco.toFixed(2)}`;
            const priceWidth = doc.getTextWidth(priceText);
            
            y = addWrappedText(item.nome, margin + 5, y, contentWidth - priceWidth - 10, itemFontSize, {style: 'bold'});
            doc.setFontSize(priceFontSize); // Para pegar a posição do preço na mesma linha do nome (se y não mudou)
            doc.text(priceText, pageWidth - margin - priceWidth, y - lineHeight); // Ajusta y para alinhar com última linha do nome

            if (item.descricao) {
                y = addWrappedText(item.descricao, margin + 5, y, contentWidth - 10, descriptionFontSize, {color: [80,80,80]});
            }

            const details = [];
            if (item.tags && item.tags.length > 0) details.push(`Tags: ${item.tags.join(', ')}`);
            if (item.alergenicos && item.alergenicos.length > 0) details.push(`Alergênicos: ${item.alergenicos.join(', ')}`);
            if (details.length > 0) {
                 y = addWrappedText(details.join(' | '), margin + 10, y, contentWidth - 15, descriptionFontSize - 1, {color: [120,120,120]});
            }
            y += lineHeight * 0.5; // Espaço entre itens
        }
        y += lineHeight; // Espaço após a seção de itens
      }
    }

    // 5. Informações Adicionais (Rodapé da última página)
    if (cardapio.informacoesAdicionais) {
        const infoHeightEstimate = descriptionFontSize * 3; // Estima altura
        if (y + infoHeightEstimate > pageHeight - margin) { // Se não couber, nova página só para isso
            doc.addPage();
            y = margin;
        } else { // Tenta colocar no rodapé
            y = pageHeight - margin - infoHeightEstimate;
        }
        y = addWrappedText(cardapio.informacoesAdicionais, margin, y, contentWidth, descriptionFontSize -1, {color: [100,100,100]});
    }

    doc.save(`${cardapio.nome.replace(/\s+/g, '_') || 'cardapio'}.pdf`);
  };

  const handleSaveCardapio = (publish: boolean = false) => {
    const finalCardapio: Cardapio = {
      ...cardapio,
      status: publish ? 'publicado' : 'rascunho',
      ultimaAtualizacao: new Date().toISOString(),
      // Garante que o conteúdo está ordenado antes de salvar
      conteudo: cardapio.conteudo.sort((a,b) => a.ordem - b.ordem).map(section => {
        if (section.tipo === 'item' && section.items) {
            return {...section, items: section.items.sort((a,b) => (a.ordem || 0) - (b.ordem || 0))}
        }
        return section;
      })
    };
    onSave(finalCardapio);
    alert(`Cardápio salvo ${publish ? 'e publicado' : 'como rascunho'}!`);
  };

  // --- Renderização ---
  return (
    <Container>
      <Header>
        <Button $variant="secondary" onClick={onBack}>
          <FaArrowLeft style={{ marginRight: '8px' }} /> Voltar
        </Button>
        <h1>{cardapioId && cardapioId !== 'novo' ? `Editando: ${cardapio.nome}` : 'Novo Cardápio'}</h1>
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
        <input type="text" id="nome" name="nome" value={cardapio.nome} onChange={handleInputChange} required />

        <label htmlFor="descricaoBreve">Descrição Breve:</label>
        <textarea id="descricaoBreve" name="descricaoBreve" value={cardapio.descricaoBreve || ''} onChange={handleInputChange} rows={3} />
        
        <label htmlFor="categoria">Categoria:</label>
        <select id="categoria" name="categoria" value={cardapio.categoria || ''} onChange={handleInputChange} >
          <option value="">Selecione uma categoria</option>
          <option value="Almoço">Almoço</option> <option value="Jantar">Jantar</option> <option value="Bebidas">Bebidas</option>
          <option value="Sobremesas">Sobremesas</option><option value="Especial">Especial</option>
        </select>

        <label htmlFor="moeda">Moeda (para PDF):</label>
        <select id="moeda" name="moeda" value={cardapio.moeda || 'BRL'} onChange={handleInputChange} >
          <option value="BRL">Real (R$)</option> <option value="USD">Dólar (USD)</option> <option value="EUR">Euro (€)</option>
        </select>

        <label htmlFor="logoUrl">URL do Logo (para PDF):</label>
        <input type="text" id="logoUrl" name="logoUrl" placeholder="https://exemplo.com/logo.png ou Data URL" value={cardapio.logoUrl || ''} onChange={handleInputChange} />
        {/* Adicionar input file para upload de logo e conversão para DataURL se desejar */}

        <label htmlFor="informacoesAdicionais">Informações Adicionais (para PDF, ex: Wi-Fi, contato):</label>
        <textarea id="informacoesAdicionais" name="informacoesAdicionais" value={cardapio.informacoesAdicionais || ''} onChange={handleInputChange} rows={2} />
      </FormSection>

      <ContentBuilderArea>
        <h3>Conteúdo do Cardápio</h3>
        <Toolbar>
          <Button onClick={() => addContentElement('titulo')}><FaHeading /> Título</Button>
          <Button onClick={() => addContentElement('item')}><FaPlus /> Item de Cardápio</Button>
          <Button onClick={() => addContentElement('texto')}><FaBars /> Texto</Button>
          <Button onClick={() => addContentElement('imagem')}><FaImage /> Imagem</Button>
          <Button onClick={() => addContentElement('lista')}><FaList /> Lista</Button>
        </Toolbar>

        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="conteudoCardapio">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {cardapio.conteudo.sort((a,b) => a.ordem - b.ordem).map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(providedDraggable) => (
                      <ContentElement
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                      >
                        <ElementControls>
                          <div {...providedDraggable.dragHandleProps} style={{ cursor: 'grab', padding: '5px' }} title="Arrastar para Reordenar">
                            <FaBars />
                          </div>
                          <IconButton size={20} onClick={() => openEditElementModal(section)} title="Editar Seção" $variant="info">
                            <FaEdit />
                          </IconButton>
                          <IconButton size={20} onClick={() => deleteContentElement(section.id)} title="Remover Seção" $variant="danger">
                            <FaTrashAlt />
                          </IconButton>
                        </ElementControls>
                        <ElementContent>
                          {section.tipo === 'titulo' && <h2>{section.titulo || 'Título não definido'}</h2>}
                          {section.tipo === 'texto' && <div dangerouslySetInnerHTML={{ __html: section.texto || '<p></p>' }} />}
                          {section.tipo === 'imagem' && section.imagemUrl && (
                            <>
                              <StyledImagePreview src={section.imagemUrl} alt={section.legendaImagem || section.titulo || 'Imagem do cardápio'} />
                              {section.legendaImagem && <p style={{textAlign: 'center', fontSize: '0.8em', color: 'var(--text-light-color)'}}>{section.legendaImagem}</p>}
                            </>
                          )}
                          {section.tipo === 'lista' && section.listaItems && <ul>{section.listaItems.map((item, i) => <li key={i}>{item}</li>)}</ul>}
                          {section.tipo === 'item' && (
                            <>
                              {section.titulo && <h3 style={{fontSize: '1.2em', color: 'var(--secondary-color)', marginBottom: 'var(--spacing-sm)'}}>{section.titulo}</h3>}
                              {section.items && section.items.sort((a,b) => (a.ordem || 0) - (b.ordem || 0)).map(item => (
                                <CardapioItemContainer key={item.id}>
                                  <h4>
                                    {item.nome}
                                    {typeof item.preco === 'number' && <span className="price">{cardapio.moeda === 'USD' ? '$' : cardapio.moeda === 'EUR' ? '€' : 'R$'}{item.preco.toFixed(2)}</span>}
                                  </h4>
                                  {item.descricao && <p>{item.descricao}</p>}
                                  {item.imagemUrl && <StyledImagePreview src={item.imagemUrl} alt={item.nome} />}
                                   <div className="item-details">
                                      {item.tags && item.tags.length > 0 && <p>Tags: {item.tags.join(', ')}</p>}
                                      {item.alergenicos && item.alergenicos.length > 0 && <p>Alergênicos: {item.alergenicos.join(', ')}</p>}
                                      {typeof item.disponivel === 'boolean' && !item.disponivel && <p style={{color: 'var(--danger-color)'}}>Indisponível</p>}
                                   </div>
                                  <div style={{marginTop: 'var(--spacing-sm)'}}>
                                    <Button onClick={() => openEditItemModal(item, section.id)} $variant="secondary" size="sm" style={{ marginRight: 'var(--spacing-xs)' }}>
                                      Editar Item
                                    </Button>
                                    <Button onClick={() => handleDeleteItem(item.id, section.id)} $variant="danger" size="sm">
                                      Remover Item
                                    </Button>
                                  </div>
                                </CardapioItemContainer>
                              ))}
                              <AddItemButton $variant="outline" onClick={() => {
                                setCurrentItemData({ disponivel: true, ordem: section.items?.length || 0 });
                                setEditingItemId(null);
                                setTargetSectionIdForModalItem(section.id);
                                setShowItemModal(true);
                              }}>
                                <FaPlus style={{ marginRight: '8px' }} /> Adicionar Item a "{section.titulo || 'esta seção'}"
                              </AddItemButton>
                            </>
                          )}
                        </ElementContent>
                      </ContentElement>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {cardapio.conteudo.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-light-color)', marginTop: 'var(--spacing-lg)' }}>
            Seu cardápio está vazio. Comece adicionando seções e itens usando os botões acima.
          </p>
        )}
      </ContentBuilderArea>

      <PdfButtonWrapper>
        <Button $variant="primary" onClick={handleGeneratePdf}>
          <FaFilePdf style={{ marginRight: '8px' }} /> Gerar PDF
        </Button>
      </PdfButtonWrapper>

      {/* Modal para Adicionar/Editar Item de Cardápio (Prato/Bebida) */}
      {showItemModal && (
        <Modal>
          <ModalContent>
            <h3>{editingItemId ? 'Editar Item' : 'Adicionar Novo Item'}</h3>
            <FormSection style={{border: 'none', padding: 0}}> {/* Reutilizando FormSection para inputs */}
                <label htmlFor="itemName">Nome:</label>
                <input type="text" id="itemName" name="nome" value={currentItemData.nome || ''} onChange={handleItemFormChange} required />
                
                <label htmlFor="itemDescricao">Descrição:</label>
                <textarea id="itemDescricao" name="descricao" value={currentItemData.descricao || ''} onChange={handleItemFormChange} rows={3} />
                
                <label htmlFor="itemPreco">Preço:</label>
                <input type="number" id="itemPreco" name="preco" value={currentItemData.preco || ''} onChange={handleItemFormChange} step="0.01" required />

                <label htmlFor="itemImagemUrl">URL da Imagem do Item:</label>
                <input type="text" id="itemImagemUrl" name="imagemUrl" placeholder="https://... ou Data URL" value={currentItemData.imagemUrl || ''} onChange={handleItemFormChange} />
                {/* Adicionar input[type=file] para upload de imagem do item e conversão para DataURL se desejar */}

                <label htmlFor="itemTags">Tags (separadas por vírgula):</label>
                <input type="text" id="itemTags" name="tags" value={currentItemData.tags?.join(', ') || ''} onChange={handleItemFormChange} />
                
                <label htmlFor="itemAlergenicos">Alergênicos (separados por vírgula):</label>
                <input type="text" id="itemAlergenicos" name="alergenicos" value={currentItemData.alergenicos?.join(', ') || ''} onChange={handleItemFormChange} />
                
                <label htmlFor="itemOrdem">Ordem do item na seção:</label>
                <input type="number" id="itemOrdem" name="ordem" value={currentItemData.ordem || 0} onChange={handleItemFormChange} step="1" />

                <label style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <input type="checkbox" name="disponivel" checked={typeof currentItemData.disponivel === 'boolean' ? currentItemData.disponivel : true} onChange={handleItemFormChange} />
                  Item Disponível
                </label>
            </FormSection>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
              <Button $variant="secondary" onClick={() => { setShowItemModal(false); setCurrentItemData({}); setEditingItemId(null); }}>Cancelar</Button>
              <Button $variant="primary" onClick={handleItemSave}>
                <FaSave style={{ marginRight: '8px' }} /> Salvar Item
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {/* Modal para Editar Elemento de Conteúdo (Seção) */}
      {showEditElementModal && editingElement && (
        <Modal>
          <ModalContent>
            <h3>Editando Seção: {editingElement.type}</h3>
             <FormSection style={{border: 'none', padding: 0}}>
                {editingElement.type !== 'item' && ( // Seções de item têm seu próprio título de item, não de seção aqui
                    <>
                        <label htmlFor="elementTitulo">Título da Seção (opcional):</label>
                        <input type="text" id="elementTitulo" value={editingElement.currentConteudo.titulo || ''}
                        onChange={(e) => handleEditingElementChange('titulo', e.target.value)} />
                    </>
                )}

                {editingElement.type === 'texto' && (
                    <>
                    <label>Conteúdo do Texto:</label>
                    <ReactQuill theme="snow" value={editingElement.currentConteudo.texto || ''}
                        onChange={(content) => handleEditingElementChange('texto', content)} />
                    </>
                )}
                {editingElement.type === 'imagem' && (
                    <>
                    <label htmlFor="elementImageUrl">URL da Imagem:</label>
                    <input type="text" id="elementImageUrl" value={editingElement.currentConteudo.imagemUrl || ''}
                        onChange={(e) => handleEditingElementChange('imagemUrl', e.target.value)} />
                    <label htmlFor="elementImageFile">Ou envie uma nova imagem (substitui URL):</label>
                    <input type="file" id="elementImageFile" accept="image/*" onChange={handleImageFileChange} />
                    {(editingElement.currentConteudo.imagemUrl || editingElement.currentImageFile) && (
                        <StyledImagePreview src={editingElement.currentImageFile ? URL.createObjectURL(editingElement.currentImageFile) : editingElement.currentConteudo.imagemUrl!} alt="Pré-visualização" />
                    )}
                    <label htmlFor="elementLegendaImagem">Legenda da Imagem (opcional):</label>
                    <input type="text" id="elementLegendaImagem" value={editingElement.currentConteudo.legendaImagem || ''}
                        onChange={(e) => handleEditingElementChange('legendaImagem', e.target.value)} />
                    </>
                )}
                {editingElement.type === 'lista' && (
                    <>
                    <label htmlFor="elementListaItems">Itens da Lista (separados por ponto e vírgula ";"):</label>
                    <textarea id="elementListaItems" value={editingElement.currentConteudo.listaItems || ''}
                        onChange={(e) => handleEditingElementChange('listaItems', e.target.value)} rows={5} />
                    </>
                )}
            </FormSection>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
              <Button $variant="secondary" onClick={() => { setShowEditElementModal(false); setEditingElement(null); }}>Cancelar</Button>
              <Button $variant="primary" onClick={handleSaveElementChanges}>
                <FaSave style={{ marginRight: '8px' }} /> Salvar Alterações na Seção
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default ConstrutorCardapio;