// src/Router.tsx

import React, { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import GerenciamentoImagens from '../screens/GerenciamentoImagens';
import GerenciamentoCardapios from '../screens/GerenciamentoCardapios';
import ConstrutorCardapio from '../screens/ConstrutorCardapio';
import LoginScreen from '../screens/LoginCardapio';
import GerenciamentoUsuarios from '../screens/GerenciamentoUsuarios';
import { useSelector } from 'react-redux';
import type { AuthState } from '../store/modules/types';

const Router: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: { authreducer: AuthState }) => state.authreducer)
  const [selectedCardapioId, setSelectedCardapioId] = useState<string | undefined>(undefined);

  const handleAddCardapio = () => {
    setSelectedCardapioId(undefined); // Garante que é um novo cardápio
    navigate('/create');
  };

  const handleEditCardapio = (id: string) => {
    setSelectedCardapioId(id);
    navigate('/edit');
  };

  const handleSaveCardapio = () => {
    navigate('/'); // Volta para a lista após salvar
  };

  useEffect(() => {
    try{
      if(!user.isLoggedIn){
        navigate('/login');
      }
    }catch(err){
      navigate('/login');
    }
  }, [user]);

  return (
      <Routes>
        <Route path='/' index element={<GerenciamentoCardapios
          onAddCardapio={handleAddCardapio}
          onEditCardapio={handleEditCardapio}
        />}/>
        <Route path='/image' index element={<GerenciamentoImagens />} />
        <Route path='/create' element={<ConstrutorCardapio
            cardapioId={selectedCardapioId}
            onSaveSuccess={handleSaveCardapio}
            onBack={() => navigate('/')}
        />}/>
        <Route path='/edit' element={<ConstrutorCardapio
            cardapioId={selectedCardapioId}
            onSaveSuccess={handleSaveCardapio}
            onBack={() => navigate('/')}
        />}/>
        <Route path='/login' element={<LoginScreen />} />

        {/* Nova rota para gerenciamento de usuários */}
        <Route path="/admin/users" element={<GerenciamentoUsuarios />} />
      </Routes>
  );
};

export default Router;