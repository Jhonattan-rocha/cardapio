// src/screens/LoginScreen.tsx

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../components/common/Buttun';
import { FaUser, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as actions from '../store/modules/authReducer/actions';
import api from '../services/axios';
import { useDispatch } from 'react-redux';
import ActivityIndicator from '../components/common/ActivityIndicator';
import { useSelector } from 'react-redux';
import type { AuthState } from '../store/modules/types';

// --- Styled Components ---
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--background-color);
`;

const LoginForm = styled.div`
  background-color: var(--surface-color);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  width: 90%;
  max-width: 400px;
  text-align: center;

  h2 {
    color: var(--primary-color);
    margin-bottom: var(--spacing-lg);
  }

  label {
    display: block;
    margin-bottom: var(--spacing-sm);
    text-align: left;
    color: var(--text-color);
    font-weight: 600;
  }

  input[type="text"],
  input[type="password"] {
    width: 100%;
    padding: 10px;
    padding-left: 30px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: 1rem;
    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
  }

  button {
    width: 100%;
    padding: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: var(--spacing-md);
  }

  p.error-message {
    color: var(--danger-color);
    margin-top: var(--spacing-sm);
    font-size: 0.9rem;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;

  input {
    padding-left: 40px; /* Espaço para o ícone */
  }

  svg {
    font-size: 25px;
    position: absolute;
    left: 5px;
    top: 10%;
  }
`;

type LoginScreenProps = object;

const LoginScreen: React.FC<LoginScreenProps> = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const user = useSelector((state: { authreducer: AuthState }) => state.authreducer);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!username || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }
    // Simulação de autenticação (em um cenário real, faria uma chamada à API)
    if (username && password) {
      setIsLoading(true);
      login();
    } else {
      setErrorMessage('Credenciais inválidas.');
    }
  };

  const login = async () => {
    try{
      const req = await api.post("/auth/token", {username, password}, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      dispatch(actions.LoginSuccess({ id: req.data.id, token: req.data.access_token, is_admin: req.data.is_admin, username: req.data.username }));
    }catch(e){
      setErrorMessage(`Erro: ${e}`);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    try{
      if(user.isLoggedIn){
        navigate("/");
      }
    }catch(err){
      setErrorMessage(`${err}`);
    }
  }, [user]);

  return (
    <Container>
      <LoginForm>
        <h2>Login</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <label htmlFor="username">Usuário</label>
        <InputWrapper>
          <FaUser />
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Seu nome de usuário"
          />
        </InputWrapper>

        <label htmlFor="password">Senha</label>
        <InputWrapper>
          <FaLock />
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
          />
        </InputWrapper>

        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Button $variant="primary" onClick={handleLogin}>
            Entrar
          </Button>
        )}
      </LoginForm>
    </Container>
  );
};

export default LoginScreen;