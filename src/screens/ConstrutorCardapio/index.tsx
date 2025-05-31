// src/screens/ConstrutorCardapio.tsx

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import ReactQuill from 'react-quill-new'; // Verifique se é o 'react-quill' ou uma fork específica
import 'react-quill-new/dist/quill.snow.css'; // Ajuste se o nome do pacote for diferente
import jsPDF from 'jspdf';
import { useSelector } from 'react-redux'; // Para obter informações do usuário, se necessário

import type {
  Cardapio, // Tipo principal do cardápio
  CardapioSecao,
  CardapioItem,
  SecaoEspacador,
  SecaoVideo,
  SecaoGaleria,
  SecaoFaq,
  ImagemGaleria,
  ItemFaq
} from '../../types/cardapioTypes';
import type { AuthState } from '../../store/modules/types'; // Ajuste o caminho se necessário
import api from '../../services/axios'; // Seu serviço Axios configurado

import { Button, IconButton } from '../../components/common/Buttun';
import { FaArrowLeft, FaPlus, FaImage, FaList, FaHeading, FaBars, FaTrashAlt, FaEdit, FaSave, FaFilePdf, FaMinus, FaArrowsAltV, FaYoutube, FaImages, FaQuestionCircle, FaQrcode } from 'react-icons/fa';
import { Modal as GlobalModal, ModalContent as GlobalModalContent } from '../../styles/GlobalStyles'; // Usando GlobalModal
import {
  AddItemButton, CardapioItemContainer, Container, ContentBuilderArea, ContentElement, ElementContent, ElementControls,
  FormSection, Header, PdfButtonWrapper, StyledImagePreview, Toolbar
} from './styled'; // Seus componentes estilizados
import { QRCodeCanvas } from 'qrcode.react';

// --- Tipos para Modais de Edição (mantidos como no seu exemplo) ---
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
    altura?: number;     // para 'espacador'
    videoUrl?: string;   // para 'video'
    legendaVideo?: string; // para 'video'
    imagens?: ImagemGaleria[]; // para 'galeria'
    itensFaq?: ItemFaq[];    // para 'faq'
  };
  currentImageFile?: File | null;
}

// --- Componente Principal ---
interface ConstrutorCardapioProps {
  cardapioId?: string; // Se 'novo' ou undefined, é criação. Senão, é edição.
  onSaveSuccess: (savedCardapio: Cardapio) => void; // Callback após salvar com sucesso (API)
  onBack: () => void;
}

const initialCardapioState = (id?: string): Cardapio => ({
  id: id && id !== 'novo' ? id : uuidv4(), // Usa ID existente ou gera novo para 'novo'
  nome: '',
  descricaoBreve: '',
  categoria: '',
  status: 'rascunho',
  ultimaAtualizacao: new Date().toISOString(),
  conteudo: [],
  logoUrl: '',
  informacoesAdicionais: '',
  moeda: 'BRL',
});


const ConstrutorCardapio: React.FC<ConstrutorCardapioProps> = ({ cardapioId, onSaveSuccess, onBack }) => {
  const [cardapio, setCardapio] = useState<Cardapio>(initialCardapioState(cardapioId));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useSelector((state: { authreducer: AuthState }) => state.authreducer); // Para owner_id

  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrCodeValue, setQrCodeValue] = useState<string>('');
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  const [currentCardapioNameForQr, setCurrentCardapioNameForQr] = useState<string>('');

  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItemData, setCurrentItemData] = useState<EditingItemState>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [targetSectionIdForModalItem, setTargetSectionIdForModalItem] = useState<string | undefined>(undefined);

  const [showEditElementModal, setShowEditElementModal] = useState(false);
  const [editingElement, setEditingElement] = useState<EditingElementState | null>(null);

  // Carregar cardápio existente
  useEffect(() => {
    const loadCardapio = async (idToLoad: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<Cardapio>(`/cardapios/${idToLoad}`, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        });
        // Garante que o conteúdo seja um array, mesmo que venha nulo do backend.
        const loadedCardapio = { ...response.data, conteudo: response.data.conteudo || [] };
        setCardapio(loadedCardapio);
      } catch (err: any) {
        console.error(`Falha ao carregar cardápio ${idToLoad}:`, err);
        setError(err.response?.data?.detail || `Erro ao carregar cardápio.`);
        // Considerar chamar onBack() ou mostrar um erro mais proeminente
      } finally {
        setIsLoading(false);
      }
    };

    if (cardapioId && cardapioId !== 'novo') {
      loadCardapio(cardapioId);
    } else {
      // Novo cardápio: reseta para o estado inicial com um novo UUID se necessário
      // Se cardapio.id já for um UUID de uma tentativa anterior não salva, pode mantê-lo.
      // Se o cardapioId prop for explicitamente 'novo', geramos um novo id para o estado.
      setCardapio(initialCardapioState(cardapioId === 'novo' ? uuidv4() : cardapio.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardapioId]); // Não incluir onBack se ele não mudar.

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCardapio(prev => ({ ...prev, [name]: value }));
  };

  // Salvar cardápio (criação ou atualização)
  const handleSaveCardapio = async (publish: boolean = false) => {
    setIsLoading(true);
    setError(null);

    const finalStatus = publish ? 'publicado' : cardapio.status === 'publicado' && !publish ? 'publicado' : 'rascunho';

    // Garante que todas as seções e itens tenham IDs UUIDv4 válidos se forem novos
    const processedConteudo = cardapio.conteudo.map(section => ({
      ...section,
      id: section.id || uuidv4(), // Garante ID para a seção
      items: section.tipo === 'item' && section.items
        ? section.items.map(item => ({ ...item, id: item.id || uuidv4() })) // Garante ID para cada item
        : section.items,
      imagens: section.tipo === 'galeria' && section.imagens
        ? section.imagens.map(img => ({...img, id: img.id || uuidv4() }))
        : section.imagens,
      itensFaq: section.tipo === 'faq' && section.itensFaq
        ? section.itensFaq.map(faq => ({...faq, id: faq.id || uuidv4() }))
        : section.itensFaq,
    }));


    const cardapioToSubmit: Omit<Cardapio, 'owner_id' | 'created_at' | 'ultimaAtualizacao' | 'id'> & { id?: string } = {
      nome: cardapio.nome,
      descricaoBreve: cardapio.descricaoBreve,
      categoria: cardapio.categoria,
      status: finalStatus,
      logoUrl: cardapio.logoUrl,
      informacoesAdicionais: cardapio.informacoesAdicionais,
      moeda: cardapio.moeda,
      conteudo: processedConteudo.sort((a, b) => a.ordem - b.ordem).map(section => {
        if (section.tipo === 'item' && section.items) {
          return { ...section, items: section.items.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)) };
        }
        return section;
      }),
      // tema: cardapio.tema, // 'tema' será ignorado se não estiver no schema do backend
    };


    try {
      let savedCardapio: Cardapio;
      if (cardapioId && cardapioId !== 'novo') {
        // Atualizando cardápio existente
        // O backend espera `schemas.CardapioUpdate`
        const response = await api.put<Cardapio>(`/cardapios/${cardapio.id}`, cardapioToSubmit, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        });
        savedCardapio = response.data;
        alert(`Cardápio atualizado ${finalStatus === 'publicado' ? 'e publicado' : 'como ' + finalStatus}!`);
      } else {
        // Criando novo cardápio
        // O backend espera `schemas.CardapioCreate` (sem id)
        const response = await api.post<Cardapio>('/cardapios/', cardapioToSubmit, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        });
        savedCardapio = response.data;
        // Atualiza o estado com o cardápio retornado, incluindo o ID gerado pelo servidor
        setCardapio(savedCardapio);
        alert(`Cardápio criado ${finalStatus === 'publicado' ? 'e publicado' : 'como ' + finalStatus}!`);
      }
      onSaveSuccess(savedCardapio); // Notifica o componente pai sobre o sucesso
    } catch (err: any) {
      console.error("Falha ao salvar cardápio:", err);
      const errorDetail = err.response?.data?.detail;
      let errorMessage = "Erro ao salvar cardápio.";
      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail)) { // Erros de validação do Pydantic
        errorMessage = errorDetail.map(e => `${e.loc.join('.')} - ${e.msg}`).join('\n');
      }
      setError(errorMessage);
      alert(`Erro ao salvar: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };


  // --- Funções de manipulação de conteúdo (addContentElement, updateContentElement, etc.) ---
  // Seu código para addContentElement, updateContentElement, deleteContentElement, handleOnDragEnd
  // openEditElementModal, handleEditingElementChange, handleImageFileChange, handleSaveElementChanges
  // handleItemFormChange, handleItemSave, openEditItemModal, handleDeleteItem
  // handleGalleryImageChange, addGalleryImage, removeGalleryImage
  // handleFaqItemChange, addFaqItem, removeFaqItem
  // permanecem aqui, pois gerenciam o estado local 'cardapio'.
  // Apenas certifique-se que os IDs (uuidv4) são gerados para novos elementos/itens
  // se eles ainda não tiverem um, antes de salvar no backend.
  // A função `handleSaveCardapio` já tenta garantir IDs.

  const addContentElement = (type: CardapioSecao['tipo']) => {
    const newElementBase: Omit<CardapioSecao, 'tipo' | 'id' | 'ordem'> & { id?: string, ordem?: number } = {
        titulo: '',
    };
    let newElement: CardapioSecao;
    const baseProps = {
        id: uuidv4(),
        ordem: cardapio.conteudo.length,
    };

    switch (type) {
      case 'titulo':
        newElement = { ...baseProps, ...newElementBase, tipo: type, titulo: 'Novo Título de Seção' };
        break;
      case 'texto':
        newElement = { ...baseProps, ...newElementBase, tipo: type, texto: '<p>Clique para editar...</p>', titulo: 'Nova Seção de Texto' };
        break;
      case 'item':
        // Para 'item', abrimos o modal para adicionar o primeiro item, ou criamos uma seção vazia
        // A lógica atual de abrir o modal para o primeiro item parece mais interativa.
        // Se quiser criar a seção primeiro e depois adicionar itens:
        newElement = { ...baseProps, tipo: type, titulo: 'Nova Seção de Itens', items: [] };
        setCardapio(prev => ({
            ...prev,
            conteudo: [...prev.conteudo, newElement].sort((a, b) => a.ordem - b.ordem),
        }));
        // Opcionalmente, abrir o modal de item para a nova seção criada:
        // setTargetSectionIdForModalItem(newElement.id);
        // setCurrentItemData({ disponivel: true, ordem: 0 });
        // setEditingItemId(null);
        // setShowItemModal(true);
        return; // Retorna para evitar a lógica de setCardapio duplicada abaixo
      case 'imagem':
        newElement = { ...baseProps, ...newElementBase, tipo: type, imagemUrl: 'https://via.placeholder.com/600x200?text=Nova+Imagem', titulo: 'Nova Imagem' };
        break;
      case 'lista':
        newElement = { ...baseProps, ...newElementBase, tipo: type, listaItems: ['Item 1'], titulo: 'Nova Lista' };
        break;
      case 'divisor':
        newElement = { ...baseProps, tipo: type, titulo: 'Divisor' };
        break;
      case 'espacador':
        newElement = { ...baseProps, tipo: type, titulo: 'Espaçador', altura: 20 } as SecaoEspacador;
        break;
      case 'video':
        newElement = { ...baseProps, tipo: type, titulo: 'Vídeo', videoUrl: '', legendaVideo: '' } as SecaoVideo;
        break;
      case 'galeria':
        newElement = { ...baseProps, tipo: type, titulo: 'Galeria de Imagens', imagens: [] } as SecaoGaleria;
        break;
      case 'faq':
        newElement = { ...baseProps, tipo: type, titulo: 'Perguntas Frequentes', itensFaq: [] } as SecaoFaq;
        break;
      default:
        console.warn("Tipo de seção desconhecido:", type);
        return;
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

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(cardapio.conteudo);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const updatedItemsWithOrder = items.map((item, index) => ({ ...item, ordem: index }));
    setCardapio(prev => ({ ...prev, conteudo: updatedItemsWithOrder }));
  };

  const openEditElementModal = (section: CardapioSecao) => {
    const currentConteudo: EditingElementState['currentConteudo'] = {
        titulo: section.titulo,
    };
    switch (section.tipo) {
        case 'texto': currentConteudo.texto = section.texto; break;
        case 'imagem':
            currentConteudo.imagemUrl = section.imagemUrl;
            currentConteudo.legendaImagem = section.legendaImagem;
            break;
        case 'lista': currentConteudo.listaItems = section.listaItems?.join(';\n'); break;
        case 'espacador': currentConteudo.altura = (section as SecaoEspacador).altura; break;
        case 'video':
            currentConteudo.videoUrl = (section as SecaoVideo).videoUrl;
            currentConteudo.legendaVideo = (section as SecaoVideo).legendaVideo;
            break;
        case 'galeria': currentConteudo.imagens = (section as SecaoGaleria).imagens || []; break;
        case 'faq': currentConteudo.itensFaq = (section as SecaoFaq).itensFaq || []; break;
    }
    setEditingElement({ id: section.id, type: section.tipo, currentConteudo, currentImageFile: null });
    setShowEditElementModal(true);
  };

  const handleEditingElementChange = (field: keyof EditingElementState['currentConteudo'], value: any) => {
    if (editingElement) {
        setEditingElement(prev => prev ? ({
            ...prev,
            currentConteudo: { ...prev.currentConteudo, [field]: value },
        }) : null);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingElement) {
        setEditingElement({ ...editingElement, currentImageFile: file });
        const reader = new FileReader();
        reader.onloadend = () => {
            handleEditingElementChange('imagemUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveElementChanges = () => {
    if (!editingElement) return;
    const updates: Partial<CardapioSecao> = { titulo: editingElement.currentConteudo.titulo };
    switch (editingElement.type) {
        case 'texto': updates.texto = editingElement.currentConteudo.texto; break;
        case 'imagem':
            updates.imagemUrl = editingElement.currentConteudo.imagemUrl;
            updates.legendaImagem = editingElement.currentConteudo.legendaImagem;
            break;
        case 'lista':
            updates.listaItems = editingElement.currentConteudo.listaItems?.split(';').map(s => s.trim()).filter(Boolean);
            break;
        case 'espacador': (updates as Partial<SecaoEspacador>).altura = editingElement.currentConteudo.altura || 20; break;
        case 'video':
            (updates as Partial<SecaoVideo>).videoUrl = editingElement.currentConteudo.videoUrl;
            (updates as Partial<SecaoVideo>).legendaVideo = editingElement.currentConteudo.legendaVideo;
            break;
        case 'galeria': (updates as Partial<SecaoGaleria>).imagens = editingElement.currentConteudo.imagens || []; break;
        case 'faq': (updates as Partial<SecaoFaq>).itensFaq = editingElement.currentConteudo.itensFaq || []; break;
    }
    updateContentElement(editingElement.id, updates);
    setShowEditElementModal(false);
    setEditingElement(null);
  };

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
        tags: Array.isArray(currentItemData.tags) ? currentItemData.tags : [],
        alergenicos: Array.isArray(currentItemData.alergenicos) ? currentItemData.alergenicos : [],
        disponivel: typeof currentItemData.disponivel === 'boolean' ? currentItemData.disponivel : true,
        ordem: typeof currentItemData.ordem === 'number' ? currentItemData.ordem : 0,
    };

    let sectionToUpdateId = targetSectionIdForModalItem;

    if (editingItemId) { // Editando item existente
        setCardapio(prev => ({
            ...prev,
            conteudo: prev.conteudo.map(section => {
                if (section.tipo === 'item' && section.items && section.items.some(it => it.id === editingItemId)) {
                    return {
                        ...section,
                        items: section.items.map(item => item.id === editingItemId ? itemToSave : item)
                                      .sort((a,b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
                    };
                }
                return section;
            }),
        }));
    } else { // Adicionando novo item
        if (sectionToUpdateId) { // Adicionando a uma seção 'item' existente
            setCardapio(prev => ({
                ...prev,
                conteudo: prev.conteudo.map(section =>
                    section.id === sectionToUpdateId && section.tipo === 'item'
                    ? { ...section, items: [...(section.items || []), itemToSave].sort((a,b) => (a.ordem ?? 0) - (b.ordem ?? 0)) }
                    : section
                ),
            }));
        } else { // Criando nova seção 'item' para este novo item
            const newSection: CardapioSecao = {
                id: uuidv4(), tipo: 'item', ordem: cardapio.conteudo.length,
                titulo: 'Nova Seção de Itens', // Ou pedir um título
                items: [itemToSave].sort((a,b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
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
    setCurrentItemData({ ...item, tags: item.tags || [], alergenicos: item.alergenicos || [] });
    setEditingItemId(item.id);
    setTargetSectionIdForModalItem(sectionId); // Importante para saber onde salvar
    setShowItemModal(true);
  };

  const handleDeleteItem = (itemId: string, sectionId: string) => {
    if (window.confirm('Remover este item do cardápio?')) {
        setCardapio(prev => ({
            ...prev,
            conteudo: prev.conteudo.map(section => {
                if (section.id === sectionId && section.tipo === 'item' && section.items) {
                    return { ...section, items: section.items.filter(i => i.id !== itemId) };
                }
                return section;
            })
        }));
    }
  };

  const handleGalleryImageChange = (index: number, field: keyof ImagemGaleria, value: string | number) => {
    if (editingElement && editingElement.type === 'galeria' && editingElement.currentConteudo.imagens) {
        const newImagens = [...editingElement.currentConteudo.imagens];
        // @ts-ignore
        newImagens[index] = { ...newImagens[index], [field]: value };
        setEditingElement(prev => prev ? ({ ...prev, currentConteudo: { ...prev.currentConteudo, imagens: newImagens }}) : null);
    }
  };
  const addGalleryImage = () => {
    if (editingElement && editingElement.type === 'galeria') {
        const newImage: ImagemGaleria = { id: uuidv4(), url: '', legenda: '', ordem: editingElement.currentConteudo.imagens?.length || 0 };
        const newImagens = [...(editingElement.currentConteudo.imagens || []), newImage];
        setEditingElement(prev => prev ? ({ ...prev, currentConteudo: { ...prev.currentConteudo, imagens: newImagens }}) : null);
    }
  };
  const removeGalleryImage = (idToRemove: string) => {
    if (editingElement && editingElement.type === 'galeria' && editingElement.currentConteudo.imagens) {
        const newImagens = editingElement.currentConteudo.imagens.filter(img => img.id !== idToRemove);
        setEditingElement(prev => prev ? ({ ...prev, currentConteudo: { ...prev.currentConteudo, imagens: newImagens }}) : null);
    }
  };

  const handleFaqItemChange = (index: number, field: keyof Omit<ItemFaq, 'id' | 'ordem'>, value: string) => {
    if (editingElement && editingElement.type === 'faq' && editingElement.currentConteudo.itensFaq) {
        const newItensFaq = [...editingElement.currentConteudo.itensFaq];
        newItensFaq[index] = { ...newItensFaq[index], [field]: value };
        setEditingElement(prev => prev ? ({ ...prev, currentConteudo: { ...prev.currentConteudo, itensFaq: newItensFaq }}) : null);
    }
  };
  const addFaqItem = () => {
    if (editingElement && editingElement.type === 'faq') {
        const newItem: ItemFaq = { id: uuidv4(), pergunta: '', resposta: '', ordem: editingElement.currentConteudo.itensFaq?.length || 0 };
        const newItensFaq = [...(editingElement.currentConteudo.itensFaq || []), newItem];
        setEditingElement(prev => prev ? ({ ...prev, currentConteudo: { ...prev.currentConteudo, itensFaq: newItensFaq }}) : null);
    }
  };
  const removeFaqItem = (idToRemove: string) => {
    if (editingElement && editingElement.type === 'faq' && editingElement.currentConteudo.itensFaq) {
        const newItensFaq = editingElement.currentConteudo.itensFaq.filter(item => item.id !== idToRemove);
        setEditingElement(prev => prev ? ({ ...prev, currentConteudo: { ...prev.currentConteudo, itensFaq: newItensFaq }}) : null);
    }
  };


  // --- Funções de Geração de PDF e QR Code (mantidas como no seu exemplo) ---
  const handleGeneratePdf = () => {
    // Sua lógica jsPDF existente...
    // Certifique-se que `cardapio` aqui tem os dados mais recentes do estado.
    // ... (código jsPDF omitido para brevidade, mas ele usaria o estado 'cardapio')
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
        options?: { color?: string | [number,number,number], style?: 'normal'|'bold'|'italic'|'bolditalic', align?: 'left' | 'center' | 'right' }
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
            let currentX = xPos;
            if (options?.align === 'center') {
                const textWidth = doc.getTextWidth(line);
                currentX = xPos + (maxWidth - textWidth) / 2;
                if (xPos === pageWidth / 2) currentX = (pageWidth - textWidth) / 2;
            } else if (options?.align === 'right') {
                const textWidth = doc.getTextWidth(line);
                currentX = xPos + maxWidth - textWidth;
            }
            doc.text(line, currentX, y);
            y += lineHeight;
        });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0,0,0);
        return y;
    };

    if (cardapio.logoUrl) {
        try {
            // Para jsPDF, se for Data URL, ele lida bem. Se for URL externa, precisa de CORS ou ser convertida.
            // A maneira mais segura para jsPDF é usar Data URLs ou garantir que as imagens estejam acessíveis (CORS).
            const imgData = cardapio.logoUrl; // Assumindo que pode ser Data URL
            const imgProps = doc.getImageProperties(imgData);
            const logoHeight = 25;
            const logoWidth = (imgProps.width * logoHeight) / imgProps.height;
            const logoX = (pageWidth - logoWidth) / 2;
            checkPageBreak(logoHeight + lineHeight);
            doc.addImage(imgData, imgProps.fileType, logoX, y, logoWidth, logoHeight);
            y += logoHeight + lineHeight * 1.5;
        } catch (e) { console.error("Erro ao adicionar logo ao PDF (jsPDF):", e); y = addWrappedText('(Falha ao carregar logo)', margin, y, contentWidth, descriptionFontSize, {color: 'red'}); }
    }

    checkPageBreak(titleFontSize + lineHeight);
    y = addWrappedText(cardapio.nome, pageWidth / 2, y, contentWidth, titleFontSize, { style: 'bold', align: 'center'});
    y += lineHeight;

    if (cardapio.descricaoBreve) {
      checkPageBreak(descriptionFontSize * 2 + lineHeight);
      y = addWrappedText(cardapio.descricaoBreve, margin, y, contentWidth, descriptionFontSize, {color: [100,100,100]});
      y += lineHeight * 0.5;
    }

    const sortedConteudo = [...cardapio.conteudo].sort((a, b) => a.ordem - b.ordem);
    for (const section of sortedConteudo) {
      checkPageBreak(sectionTitleFontSize + lineHeight);
      if (section.tipo === 'titulo' && section.titulo) {
        y = addWrappedText(section.titulo, margin, y, contentWidth, sectionTitleFontSize, {style: 'bold'});
        doc.setLineWidth(0.2);
        doc.line(margin, y - lineHeight/2 , pageWidth - margin, y - lineHeight/2);
        y += lineHeight * 0.5;
      } else if (section.tipo === 'texto' && section.texto) {
        const plainText = section.texto.replace(/<[^>]+>/g, ' '); // Simples remoção de HTML para jsPDF
        y = addWrappedText(plainText, margin, y, contentWidth, itemFontSize - 1);
        y += lineHeight * 0.5;
      } else if (section.tipo === 'imagem' && section.imagemUrl) {
        try {
            const imgData = section.imagemUrl; // Assumindo Data URL ou URL acessível
            const imgProps = doc.getImageProperties(imgData);
            const imgMaxWidth = contentWidth * 0.8;
            const imgWidth = Math.min(imgProps.width, imgMaxWidth);
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            checkPageBreak(imgHeight + lineHeight + (section.legendaImagem ? descriptionFontSize + lineHeight : 0));
            const imgX = (pageWidth - imgWidth) / 2;
            doc.addImage(imgData, imgProps.fileType, imgX, y, imgWidth, imgHeight);
            y += imgHeight + lineHeight * 0.5;
            if (section.legendaImagem) {
                y = addWrappedText(section.legendaImagem, pageWidth/2, y, contentWidth * 0.7, descriptionFontSize -1, {color: [150,150,150], style: 'italic', align: 'center'});
            }
        } catch (e) {
            console.error("Erro ao adicionar imagem da seção ao PDF (jsPDF):", e);
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
        const sortedItems = [...section.items].sort((a,b) => (a.ordem ?? 0) - (b.ordem ?? 0));
        for (const item of sortedItems) {
            if (item.disponivel === false) continue;
            const itemHeightEstimate = itemFontSize + (item.descricao ? descriptionFontSize * 2 : 0) + lineHeight * 2;
            checkPageBreak(itemHeightEstimate);
            const priceText = `${currency} ${item.preco.toFixed(2)}`;
            const priceWidth = doc.getTextWidth(priceText);
            const currentYBeforeName = y;
            y = addWrappedText(item.nome, margin + 5, y, contentWidth - priceWidth - 10, itemFontSize, {style: 'bold'});
            const nameLines = doc.splitTextToSize(item.nome, contentWidth - priceWidth - 10).length;
            const priceY = currentYBeforeName + (nameLines > 1 ? (nameLines -1) * lineHeight : 0); // Ajuste para preço ao lado do nome
            doc.setFontSize(priceFontSize);
            doc.text(priceText, pageWidth - margin - priceWidth, priceY);

            if (item.descricao) {
                y = addWrappedText(item.descricao, margin + 5, y, contentWidth - 10, descriptionFontSize, {color: [80,80,80]});
            }
            const details = [];
            if (item.tags && item.tags.length > 0) details.push(`Tags: ${item.tags.join(', ')}`);
            if (item.alergenicos && item.alergenicos.length > 0) details.push(`Alergênicos: ${item.alergenicos.join(', ')}`);
            if (details.length > 0) {
                y = addWrappedText(details.join(' | '), margin + 10, y, contentWidth - 15, descriptionFontSize - 1, {color: [120,120,120]});
            }
            y += lineHeight * 0.5;
        }
        y += lineHeight;
      } else if (section.tipo === 'divisor') {
        checkPageBreak(lineHeight * 1.5);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += lineHeight * 1.5;
      } else if (section.tipo === 'espacador' && 'altura' in section) {
        const alturaEspacador = section.altura || 20;
        checkPageBreak(alturaEspacador / 3); // Aproximação
        y += alturaEspacador / 3;
      }
      // Adicionar Video, Galeria, FAQ no PDF (placeholder por enquanto)
      else if (section.tipo === 'video' && 'videoUrl' in section) {
        y = addWrappedText(`[Vídeo: ${section.titulo || 'Vídeo'}${section.legendaVideo ? ' - ' + section.legendaVideo : ''}] (${(section as SecaoVideo).videoUrl})`, margin, y, contentWidth, descriptionFontSize);
        y += lineHeight;
      } else if (section.tipo === 'galeria' && 'imagens' in section) {
        y = addWrappedText(`[Galeria: ${section.titulo || 'Galeria de Imagens'}] (${(section as SecaoGaleria).imagens.length} imagens)`, margin, y, contentWidth, descriptionFontSize);
        y += lineHeight;
      } else if (section.tipo === 'faq' && 'itensFaq' in section) {
        y = addWrappedText(`[FAQ: ${section.titulo || 'FAQ'}] (${(section as SecaoFaq).itensFaq.length} itens)`, margin, y, contentWidth, descriptionFontSize);
        (section as SecaoFaq).itensFaq.forEach(faqItem => {
            y = addWrappedText(`P: ${faqItem.pergunta}`, margin + 5, y, contentWidth -5, descriptionFontSize -1);
            y = addWrappedText(`R: ${faqItem.resposta}`, margin + 10, y, contentWidth -10, descriptionFontSize -1, {color: [80,80,80]});
        });
        y += lineHeight;
      }
    }

    if (cardapio.informacoesAdicionais) {
        const infoHeightEstimate = descriptionFontSize * 3;
        if (y + infoHeightEstimate > pageHeight - margin - 10) {
            doc.addPage();
            y = margin;
        }
        const footerY = pageHeight - margin - infoHeightEstimate;
        // y = Math.max(y, footerY); // Esta linha pode causar problemas se y já for muito grande
        if (y < footerY) y = footerY; // Só move para o rodapé se houver espaço

        y = addWrappedText(cardapio.informacoesAdicionais, margin, y, contentWidth, descriptionFontSize -1, {color: [100,100,100], align: 'center'});
    }

    const pageCount = doc.getNumberOfPages ? doc.getNumberOfPages() : (doc.internal as any).getNumberOfPages(); // Compatibilidade
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Página ' + String(i) + ' de ' + String(pageCount), pageWidth - margin - doc.getTextWidth('Página X de Y') - 5 , pageHeight - margin + 5);
    }

    doc.save(`${cardapio.nome.replace(/\s+/g, '_') || 'cardapio'}.pdf`);
    alert("PDF gerado com sucesso!");
  };

  const handleShowQrCode = (cardapioName: string) => {
    // Idealmente, a URL deve apontar para uma página pública de visualização do cardápio.
    // Se o ID do cardápio puder mudar após a primeira criação (o que não deveria se o estado for atualizado corretamente),
    // certifique-se de usar o ID mais atual.
    const publicViewUrl = `${api.defaults.baseURL}cardapios/download/${cardapio.id}/pdf/`; // Exemplo de rota
    setQrCodeValue(publicViewUrl);
    setCurrentCardapioNameForQr(cardapioName || "Cardápio");
    setShowQrModal(true);
  };

  const handleDownloadQrCode = () => {
    if (qrCodeRef.current) {
        const canvas = qrCodeRef.current; //.querySelector('canvas'); // Se QRCodeCanvas renderiza um canvas interno
        if (canvas) {
            const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            let downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `qrcode-${(currentCardapioNameForQr || 'cardapio').replace(/\s+/g, '_')}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else {
            console.error("Elemento canvas do QR Code não encontrado via ref.");
            alert("Não foi possível baixar o QR Code. Tente novamente.");
        }
    }
  };

  // --- Renderização ---
  if (isLoading && !(cardapioId && cardapioId !== 'novo')) { // Mostra loading só ao carregar cardápio existente
    return <Container><p>Carregando cardápio...</p></Container>;
  }
  if (error) { // Mostra erro se houver
    return <Container><p style={{color: 'red'}}>Erro: {error}</p><Button onClick={onBack}>Voltar</Button></Container>;
  }

  return (
    <Container>
      <Header>
        <Button $variant="secondary" onClick={onBack} disabled={isLoading}>
          <FaArrowLeft style={{ marginRight: '8px' }} /> Voltar
        </Button>
        <h1>{cardapioId && cardapioId !== 'novo' ? `Editando: ${cardapio.nome || 'Cardápio sem nome'}` : 'Novo Cardápio'}</h1>
        <div>
          <Button $variant="outline" onClick={() => handleSaveCardapio(false)} style={{ marginRight: 'var(--spacing-sm)' }} disabled={isLoading}>
            <FaSave style={{ marginRight: '8px' }} /> Salvar Rascunho
          </Button>
          <Button $variant="primary" onClick={() => handleSaveCardapio(true)} disabled={isLoading}>
            <FaSave style={{ marginRight: '8px' }} /> Salvar e Publicar
          </Button>
        </div>
      </Header>

      {/* Seu JSX para FormSection, ContentBuilderArea, Modais, etc. permanece aqui */}
      {/* O conteúdo do return de ConstrutorCardapio.tsx (FormSection, ContentBuilderArea, Modais)
          é extenso e não precisa ser repetido aqui, pois as mudanças principais
          são no estado, useEffect e nas funções de save/load.
          Cole seu JSX original aqui, garantindo que os values e onChanges
          usem o estado `cardapio` e a função `handleInputChange`.
      */}
        <FormSection>
            <h3>Informações Básicas do Cardápio</h3>
            <label htmlFor="nome">Nome do Cardápio:</label>
            <input type="text" id="nome" name="nome" value={cardapio.nome} onChange={handleInputChange} required disabled={isLoading}/>

            <label htmlFor="descricaoBreve">Descrição Breve:</label>
            <textarea id="descricaoBreve" name="descricaoBreve" value={cardapio.descricaoBreve || ''} onChange={handleInputChange} rows={3} disabled={isLoading}/>
            
            <label htmlFor="categoria">Categoria:</label>
            <select id="categoria" name="categoria" value={cardapio.categoria || ''} onChange={handleInputChange} disabled={isLoading}>
                <option value="">Selecione uma categoria</option>
                <option value="Almoço">Almoço</option> <option value="Jantar">Jantar</option> <option value="Bebidas">Bebidas</option>
                <option value="Sobremesas">Sobremesas</option><option value="Especial">Especial</option>
            </select>

            <label htmlFor="moeda">Moeda (para PDF):</label>
            <select id="moeda" name="moeda" value={cardapio.moeda || 'BRL'} onChange={handleInputChange} disabled={isLoading}>
                <option value="BRL">Real (R$)</option> <option value="USD">Dólar (USD)</option> <option value="EUR">Euro (€)</option>
            </select>

            <label htmlFor="logoUrl">URL do Logo (para PDF):</label>
            <input type="text" id="logoUrl" name="logoUrl" placeholder="https://exemplo.com/logo.png ou Data URL" value={cardapio.logoUrl || ''} onChange={handleInputChange} disabled={isLoading}/>

            <label htmlFor="informacoesAdicionais">Informações Adicionais (para PDF, ex: Wi-Fi, contato):</label>
            <textarea id="informacoesAdicionais" name="informacoesAdicionais" value={cardapio.informacoesAdicionais || ''} onChange={handleInputChange} rows={2} disabled={isLoading}/>
        </FormSection>

        <ContentBuilderArea>
            <h3>Conteúdo do Cardápio</h3>
            <Toolbar>
                <Button onClick={() => addContentElement('titulo')} disabled={isLoading}><FaHeading /> Título</Button>
                <Button onClick={() => addContentElement('item')} disabled={isLoading}><FaPlus /> Seção de Itens</Button>
                <Button onClick={() => addContentElement('texto')} disabled={isLoading}><FaBars /> Texto</Button>
                <Button onClick={() => addContentElement('imagem')} disabled={isLoading}><FaImage /> Imagem</Button>
                <Button onClick={() => addContentElement('lista')} disabled={isLoading}><FaList /> Lista</Button>
                <Button onClick={() => addContentElement('divisor')} title="Adicionar Divisor" disabled={isLoading}><FaMinus /> Divisor</Button>
                <Button onClick={() => addContentElement('espacador')} title="Adicionar Espaçador" disabled={isLoading}><FaArrowsAltV /> Espaçador</Button>
                <Button onClick={() => addContentElement('video')} title="Adicionar Vídeo" disabled={isLoading}><FaYoutube /> Vídeo</Button>
                <Button onClick={() => addContentElement('galeria')} title="Adicionar Galeria de Imagens" disabled={isLoading}><FaImages /> Galeria</Button>
                <Button onClick={() => addContentElement('faq')} title="Adicionar FAQ" disabled={isLoading}><FaQuestionCircle /> FAQ</Button>
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
                              <IconButton size={20} onClick={() => openEditElementModal(section)} title="Editar Seção" $variant="info" disabled={isLoading}>
                                <FaEdit />
                              </IconButton>
                              <IconButton size={20} onClick={() => deleteContentElement(section.id)} title="Remover Seção" $variant="danger" disabled={isLoading}>
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
                                  {section.items && section.items.sort((a,b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map(item => (
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
                                        <Button onClick={() => openEditItemModal(item, section.id)} $variant="secondary" size="sm" style={{ marginRight: 'var(--spacing-xs)' }} disabled={isLoading}>
                                          Editar Item
                                        </Button>
                                        <Button onClick={() => handleDeleteItem(item.id, section.id)} $variant="danger" size="sm" disabled={isLoading}>
                                          Remover Item
                                        </Button>
                                      </div>
                                    </CardapioItemContainer>
                                  ))}
                                  <AddItemButton $variant="outline" disabled={isLoading} onClick={() => {
                                    setCurrentItemData({ disponivel: true, ordem: section.items?.length || 0 });
                                    setEditingItemId(null);
                                    setTargetSectionIdForModalItem(section.id);
                                    setShowItemModal(true);
                                  }}>
                                    <FaPlus style={{ marginRight: '8px' }} /> Adicionar Item a "{section.titulo || 'esta seção'}"
                                  </AddItemButton>
                                </>
                              )}
                              {section.tipo === 'divisor' && <hr style={{ margin: 'var(--spacing-md) 0', border: 'none', borderTop: '2px solid var(--border-color)' }} />}
                              {section.tipo === 'espacador' && <div style={{ height: `${(section as SecaoEspacador).altura || 20}px` }} />}
                              {section.tipo === 'video' && (section as SecaoVideo).videoUrl && (
                                <div>
                                  <h4>Vídeo: {section.titulo}</h4>
                                  <iframe
                                    width="100%"
                                    height="315"
                                    src={(section as SecaoVideo).videoUrl?.includes('embed') ? (section as SecaoVideo).videoUrl : (section as SecaoVideo).videoUrl?.replace("watch?v=", "embed/")}
                                    title={section.titulo || 'Vídeo'}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                  {(section as SecaoVideo).legendaVideo && <p style={{textAlign: 'center', fontSize: '0.8em'}}>{(section as SecaoVideo).legendaVideo}</p>}
                                </div>
                              )}
                              {section.tipo === 'galeria' && (
                                <div>
                                  <h4>Galeria: {section.titulo}</h4>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                                    {(section as SecaoGaleria).imagens.map(img => (
                                      <div key={img.id} style={{ textAlign: 'center'}}>
                                        <img src={img.url} alt={img.legenda || 'Imagem da galeria'} style={{ width: '150px', height: '100px', objectFit: 'cover', border: '1px solid #ddd', borderRadius: '4px' }}/>
                                        {img.legenda && <p style={{fontSize: '0.8em', marginTop: '4px'}}>{img.legenda}</p>}
                                      </div>
                                    ))}
                                  </div>
                                  { (!section.imagens || (section as SecaoGaleria).imagens.length === 0) && <p>Nenhuma imagem na galeria. Edite para adicionar.</p>}
                                </div>
                              )}
                              {section.tipo === 'faq' && (
                                <div>
                                  <h4>FAQ: {section.titulo}</h4>
                                  {(section as SecaoFaq).itensFaq.map(item => (
                                    <details key={item.id} style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                                      <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>{item.pergunta}</summary>
                                      <p style={{marginTop: '5px', paddingLeft: '10px'}}>{item.resposta}</p>
                                    </details>
                                  ))}
                                  { (!section.itensFaq || (section as SecaoFaq).itensFaq.length === 0) && <p>Nenhuma pergunta e resposta. Edite para adicionar.</p>}
                                </div>
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
            <Button $variant="primary" onClick={handleGeneratePdf} disabled={isLoading}>
                <FaFilePdf style={{ marginRight: '8px' }} /> Gerar PDF (Cliente)
            </Button>
            <IconButton onClick={() => handleShowQrCode(cardapio.nome)} title="Gerar QR Code para Link do Cardápio" disabled={isLoading}>
                <FaQrcode />
            </IconButton>
        </PdfButtonWrapper>

        {/* Modais (QR Code, Item, Edit Element) */}
        {showQrModal && (
            <GlobalModal> {/* Usando GlobalModal */}
                <GlobalModalContent style={{ textAlign: 'center' }}>
                    <h3>QR Code para: {currentCardapioNameForQr}</h3>
                    <p style={{marginBottom: 'var(--spacing-md)', fontSize: '0.9em', wordBreak: 'break-all'}}>
                        Escaneie para acessar o cardápio: <br/> <a href={qrCodeValue} target="_blank" rel="noopener noreferrer">{qrCodeValue}</a>
                    </p>
                    {qrCodeValue ? (
                        <div style={{ cursor: 'pointer' }} onClick={handleDownloadQrCode} title="Clique para baixar o QR Code">
                            <QRCodeCanvas value={qrCodeValue} ref={qrCodeRef} size={256} level="H" />
                        </div>
                    ) : <p>Gerando QR Code...</p>}
                    <Button $variant="secondary" onClick={() => setShowQrModal(false)} style={{ marginTop: 'var(--spacing-lg)' }}>
                        Fechar
                    </Button>
                </GlobalModalContent>
            </GlobalModal>
        )}

        {showItemModal && (
            <GlobalModal> {/* Usando GlobalModal */}
                <GlobalModalContent> {/* Ajustar o estilo max-width se necessário */}
                    <h3>{editingItemId ? 'Editar Item' : 'Adicionar Novo Item'}</h3>
                    <FormSection style={{border: 'none', padding: 0}}>
                        <label htmlFor="itemName">Nome:</label>
                        <input type="text" id="itemName" name="nome" value={currentItemData.nome || ''} onChange={handleItemFormChange} required />

                        <label htmlFor="itemDescricao">Descrição:</label>
                        <textarea id="itemDescricao" name="descricao" value={currentItemData.descricao || ''} onChange={handleItemFormChange} rows={3} />

                        <label htmlFor="itemPreco">Preço:</label>
                        <input type="number" id="itemPreco" name="preco" value={currentItemData.preco ?? ''} onChange={handleItemFormChange} step="0.01" required />

                        <label htmlFor="itemImagemUrl">URL da Imagem do Item:</label>
                        <input type="text" id="itemImagemUrl" name="imagemUrl" placeholder="https://... ou Data URL" value={currentItemData.imagemUrl || ''} onChange={handleItemFormChange} />

                        <label htmlFor="itemTags">Tags (separadas por vírgula):</label>
                        <input type="text" id="itemTags" name="tags" value={Array.isArray(currentItemData.tags) ? currentItemData.tags.join(', ') : ''} onChange={handleItemFormChange} />

                        <label htmlFor="itemAlergenicos">Alergênicos (separados por vírgula):</label>
                        <input type="text" id="itemAlergenicos" name="alergenicos" value={Array.isArray(currentItemData.alergenicos) ? currentItemData.alergenicos.join(', ') : ''} onChange={handleItemFormChange} />

                        <label htmlFor="itemOrdem">Ordem do item na seção:</label>
                        <input type="number" id="itemOrdem" name="ordem" value={currentItemData.ordem ?? 0} onChange={handleItemFormChange} step="1" />

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
                </GlobalModalContent>
            </GlobalModal>
        )}

        {showEditElementModal && editingElement && (
            <GlobalModal> {/* Usando GlobalModal */}
                <GlobalModalContent> {/* Ajustar o estilo max-width se necessário */}
                    <h3>Editando Seção: {editingElement.type.charAt(0).toUpperCase() + editingElement.type.slice(1)}</h3>
                    <FormSection style={{border: 'none', padding: 0, maxHeight: '70vh', overflowY: 'auto' }}>
                        {!['divisor', 'espacador'].includes(editingElement.type) && (
                            <>
                                <label htmlFor="elementTitulo">
                                    {editingElement.type === 'item' ? 'Título da Seção de Itens (ex: Pratos Principais):' :
                                    editingElement.type === 'titulo' ? 'Título da Seção:' :
                                    'Título da Seção (opcional):'}
                                </label>
                                <input
                                    type="text" id="elementTitulo"
                                    value={editingElement.currentConteudo.titulo || ''}
                                    onChange={(e) => handleEditingElementChange('titulo', e.target.value)}
                                />
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
                                <StyledImagePreview
                                    src={editingElement.currentImageFile ? URL.createObjectURL(editingElement.currentImageFile) : editingElement.currentConteudo.imagemUrl!}
                                    alt="Pré-visualização"
                                    style={{maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', marginTop: '10px'}}
                                />
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
                        {editingElement.type === 'espacador' && (
                            <>
                                <label htmlFor="elementAltura">Altura do Espaçador (em pixels):</label>
                                <input
                                    type="number" id="elementAltura"
                                    value={editingElement.currentConteudo.altura || 20}
                                    onChange={(e) => handleEditingElementChange('altura', parseInt(e.target.value, 10) || 20)}
                                    min="0"
                                />
                            </>
                        )}
                        {editingElement.type === 'video' && (
                            <>
                                <label htmlFor="elementVideoUrl">URL do Vídeo (YouTube embed URL preferível):</label>
                                <input
                                    type="text" id="elementVideoUrl" placeholder="https://www.youtube.com/embed/VIDEO_ID"
                                    value={editingElement.currentConteudo.videoUrl || ''}
                                    onChange={(e) => handleEditingElementChange('videoUrl', e.target.value)}
                                />
                                <label htmlFor="elementLegendaVideo">Legenda do Vídeo (opcional):</label>
                                <input
                                    type="text" id="elementLegendaVideo"
                                    value={editingElement.currentConteudo.legendaVideo || ''}
                                    onChange={(e) => handleEditingElementChange('legendaVideo', e.target.value)}
                                />
                            </>
                        )}
                        {editingElement.type === 'galeria' && (
                            <>
                                <h4>Imagens da Galeria:</h4>
                                {editingElement.currentConteudo.imagens?.map((img, index) => (
                                    <div key={img.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '4px' }}>
                                        <label htmlFor={`galleryImageUrl_${img.id}`}>URL da Imagem {index + 1}:</label>
                                        <input
                                            type="text" id={`galleryImageUrl_${img.id}`} placeholder="https://exemplo.com/imagem.jpg"
                                            value={img.url} onChange={(e) => handleGalleryImageChange(index, 'url', e.target.value)}
                                            style={{marginBottom: '5px'}}
                                        />
                                        <label htmlFor={`galleryImageLegenda_${img.id}`}>Legenda {index + 1} (opcional):</label>
                                        <input
                                            type="text" id={`galleryImageLegenda_${img.id}`} value={img.legenda || ''}
                                            onChange={(e) => handleGalleryImageChange(index, 'legenda', e.target.value)}
                                            style={{marginBottom: '10px'}}
                                        />
                                        {img.url && <StyledImagePreview src={img.url} alt={img.legenda || `Imagem ${index+1}`} style={{maxHeight: '100px', maxWidth: '150px', objectFit: 'cover', borderRadius: '4px', display: 'block', marginBottom: '10px'}} />}
                                        <Button $variant="danger" size="sm" onClick={() => removeGalleryImage(img.id)}>
                                            <FaTrashAlt style={{ marginRight: '5px' }} /> Remover Imagem
                                        </Button>
                                    </div>
                                ))}
                                <Button $variant="outline" onClick={addGalleryImage} style={{marginBottom: '10px', display: 'flex', alignItems: 'center'}}>
                                    <FaPlus style={{ marginRight: '8px' }} /> Adicionar Imagem à Galeria
                                </Button>
                                {(!editingElement.currentConteudo.imagens || editingElement.currentConteudo.imagens.length === 0) && <p>Nenhuma imagem na galeria.</p>}
                            </>
                        )}
                        {editingElement.type === 'faq' && (
                             <>
                                <h4>Itens de Perguntas Frequentes:</h4>
                                {editingElement.currentConteudo.itensFaq?.map((item, index) => (
                                    <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '4px' }}>
                                        <label htmlFor={`faqPergunta_${item.id}`}>Pergunta {index + 1}:</label>
                                        <input
                                            type="text" id={`faqPergunta_${item.id}`} value={item.pergunta}
                                            onChange={(e) => handleFaqItemChange(index, 'pergunta', e.target.value)}
                                            style={{marginBottom: '5px'}}
                                        />
                                        <label htmlFor={`faqResposta_${item.id}`}>Resposta {index + 1}:</label>
                                        <textarea
                                            id={`faqResposta_${item.id}`} value={item.resposta}
                                            onChange={(e) => handleFaqItemChange(index, 'resposta', e.target.value)}
                                            rows={3} style={{marginBottom: '10px', width: '100%', boxSizing: 'border-box'}}
                                        />
                                        <Button $variant="danger" size="sm" onClick={() => removeFaqItem(item.id)}>
                                            <FaTrashAlt style={{ marginRight: '5px' }} /> Remover Item FAQ
                                        </Button>
                                    </div>
                                ))}
                                 <Button $variant="outline" onClick={addFaqItem} style={{marginBottom: '10px', display: 'flex', alignItems: 'center'}}>
                                    <FaPlus style={{ marginRight: '8px' }} /> Adicionar Pergunta/Resposta
                                </Button>
                                {(!editingElement.currentConteudo.itensFaq || editingElement.currentConteudo.itensFaq.length === 0) && <p>Nenhum item de FAQ.</p>}
                            </>
                        )}

                    </FormSection>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
                        <Button $variant="secondary" onClick={() => { setShowEditElementModal(false); setEditingElement(null); }}>Cancelar</Button>
                        <Button $variant="primary" onClick={handleSaveElementChanges}>
                            <FaSave style={{ marginRight: '8px' }} /> Salvar Alterações na Seção
                        </Button>
                    </div>
                </GlobalModalContent>
            </GlobalModal>
        )}

    </Container>
  );
};

export default ConstrutorCardapio;