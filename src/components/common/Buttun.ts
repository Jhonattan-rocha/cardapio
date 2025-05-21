// src/components/common/Button.ts

import styled from 'styled-components';

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' | 'outline'; $fullWidth?: boolean }>`
  background-color: ${props => {
    switch (props.$variant) {
      case 'primary': return 'var(--primary-color)';
      case 'secondary': return 'var(--secondary-color)';
      case 'danger': return 'var(--danger-color)';
      case 'outline': return 'transparent';
      default: return 'var(--primary-color)';
    }
  }};
  color: ${props => (props.$variant === 'outline' ? 'var(--primary-color)' : 'white')};
  padding: 10px 20px;
  border-radius: var(--border-radius);
  font-weight: 600;
  border: ${props => (props.$variant === 'outline' ? '1px solid var(--primary-color)' : 'none')};
  width: ${props => (props.$fullWidth ? '100%' : 'auto')};
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${props => {
      if (props.$variant === 'outline') return 'rgba(0, 123, 255, 0.05)';
      switch (props.$variant) {
        case 'primary': return 'var(--primary-dark-color)';
        case 'secondary': return '#5a6268';
        case 'danger': return '#c82333';
        default: return 'var(--primary-dark-color)';
      }
    }};
    opacity: ${props => (props.$variant === 'outline' ? 1 : 0.9)};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const IconButton = styled(Button)<{ size?: number }>`
  padding: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%; /* Make it round */
  width: 40px; /* Fixed size for icon buttons */
  height: 40px;
  background-color: transparent;
  color: var(--text-color); /* Default icon color */

  &:hover {
    background-color: rgba(0, 0, 0, 0.05); /* Light hover effect */
  }

  & > svg {
    width: 20px;
    height: 20px;
  }
`;