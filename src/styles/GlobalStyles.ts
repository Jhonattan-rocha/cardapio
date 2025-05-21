// src/styles/GlobalStyles.ts
import styled from 'styled-components';
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    --primary-color: #007bff;
    --primary-dark-color: #0056b3;
    --secondary-color: #6c757d;
    --background-color: #f8f9fa;
    --surface-color: #ffffff;
    --border-color: #dee2e6;
    --text-color: #343a40;
    --text-light-color: #6c757d;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --border-radius: 4px;
    --box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--background-color);
    color: var(--text-color);
    line-height: 1.6;
  }

  button {
    cursor: pointer;
    border: none;
    padding: 10px 15px;
    border-radius: var(--border-radius);
    transition: background-color 0.2s ease-in-out;
    font-size: 1rem;
  }

  a {
    color: var(--primary-color);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  input[type="text"],
  input[type="number"],
  textarea,
  select {
    width: 100%;
    padding: 10px;
    margin-bottom: var(--spacing-sm);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: 1rem;
    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }
  }

  h1, h2, h3, h4, h5, h6 {
    color: var(--text-color);
    margin-bottom: var(--spacing-sm);
  }
`;


// Estilos básicos para o Modal (poderia ser um componente separado)
export const Modal = styled.div`
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

export const ModalContent = styled.div`
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
