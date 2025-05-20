// src/App.tsx

import React, { useState } from 'react';
import { GlobalStyles } from './styles/GlobalStyles';
import GerenciamentoCardapios from './screens/GerenciamentoCardapios';
import ConstrutorCardapio from './screens/ConstrutorCardapio';
import type { Cardapio } from './types/cardapioTypes';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedCardapioId, setSelectedCardapioId] = useState<string | undefined>(undefined);

  const handleAddCardapio = () => {
    setSelectedCardapioId(undefined); // Garante que é um novo cardápio
    setCurrentScreen('create');
  };

  const handleEditCardapio = (id: string) => {
    setSelectedCardapioId(id);
    setCurrentScreen('edit');
  };

  const handleViewCardapio = (id: string) => {
    // Em uma aplicação real, você teria uma tela de visualização dedicada
    alert(`Visualizando cardápio com ID: ${id}`);
    // Ou poderia navegar para uma rota de /cardapios/${id}/view
  };

  const handleDeleteCardapio = (id: string) => {
    console.log(`Excluir cardápio com ID: ${id}`);
    // A lógica de exclusão está dentro de GerenciamentoCardapios
    // Aqui você faria uma chamada API para remover o cardápio do banco de dados
  };

  const handleGeneratePdf = (id: string) => {
    console.log(`Gerar PDF para cardápio com ID: ${id}`);
    // A lógica de geração de PDF está no ConstrutorCardapio, você precisaria carregar os dados completos aqui ou passar o ID para lá
    // Para simplificar, vamos redirecionar para o construtor para "gerar PDF"
    handleEditCardapio(id); // Simplesmente abre o construtor para o cardápio e o botão de PDF estará lá
  };

  const handleSaveCardapio = (cardapioData: Cardapio) => {
    console.log('Cardápio salvo/atualizado:', cardapioData);
    // Aqui você enviaria os dados para o seu backend para salvar ou atualizar
    alert(`Cardápio "${cardapioData.nome}" salvo com sucesso!`);
    setCurrentScreen('list'); // Volta para a lista após salvar
  };

  return (
    <>
      <GlobalStyles />
      {currentScreen === 'list' && (
        <GerenciamentoCardapios
          onAddCardapio={handleAddCardapio}
          onEditCardapio={handleEditCardapio}
          onViewCardapio={handleViewCardapio}
          onDeleteCardapio={handleDeleteCardapio}
          onGeneratePdf={handleGeneratePdf}
        />
      )}
      {(currentScreen === 'create' || currentScreen === 'edit') && (
        <ConstrutorCardapio
          cardapioId={selectedCardapioId}
          onSave={handleSaveCardapio}
          onBack={() => setCurrentScreen('list')}
        />
      )}
    </>
  );
};

export default App;