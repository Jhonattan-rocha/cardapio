// src/Router.tsx

import React, { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import GerenciamentoCardapios from '../screens/GerenciamentoCardapios';
import ConstrutorCardapio from '../screens/ConstrutorCardapio';
import type { Cardapio } from '../types/cardapioTypes';
import LoginScreen from '../screens/LoginCardapio';
import GerenciamentoUsuarios from '../screens/GerenciamentoUsuarios';

const Router: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCardapioId, setSelectedCardapioId] = useState<string | undefined>(undefined);

  const handleAddCardapio = () => {
    setSelectedCardapioId(undefined); // Garante que é um novo cardápio
    navigate('/create');
  };

  const handleEditCardapio = (id: string) => {
    setSelectedCardapioId(id);
    navigate('/edit');
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
    navigate('/'); // Volta para a lista após salvar
  };

  return (
      <Routes>
        <Route path='/' index element={<GerenciamentoCardapios
          onAddCardapio={handleAddCardapio}
          onEditCardapio={handleEditCardapio}
          onViewCardapio={handleViewCardapio}
          onDeleteCardapio={handleDeleteCardapio}
          onGeneratePdf={handleGeneratePdf}
        />}/>
        <Route path='/create' element={<ConstrutorCardapio
            cardapioId={selectedCardapioId}
            onSave={handleSaveCardapio}
            onBack={() => navigate('/')}
        />}/>
        <Route path='/edit' element={<ConstrutorCardapio
            cardapioId={selectedCardapioId}
            onSave={handleSaveCardapio}
            onBack={() => navigate('/')}
        />}/>
        <Route path='/login' element={<LoginScreen />} />

        {/* Nova rota para gerenciamento de usuários */}
        <Route path="/admin/users" element={<GerenciamentoUsuarios />} />
      </Routes>
  );
};

export default Router;