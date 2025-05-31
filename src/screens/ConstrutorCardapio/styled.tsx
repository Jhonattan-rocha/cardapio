import styled from "styled-components";
import { Button } from '../../components/common/Buttun'; // Ajuste o caminho se necessário

// --- Styled Components (mantidos do original, adicione ou ajuste conforme necessário) ---
export const Container = styled.div`
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

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
`;

export const FormSection = styled.div`
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
  input[type="number"],
  textarea,
  select {
    margin-bottom: var(--spacing-md);
    width: 100%; // Para melhor layout
    padding: var(--spacing-sm);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-sm);
  }
  .quill {
    margin-bottom: var(--spacing-md);
  }
`;

export const ContentBuilderArea = styled.div`
  background-color: #fdfdfd;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  min-height: 300px;
`;

export const Toolbar = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;

  ${Button} {
    font-size: 0.9rem;
    padding: 8px 12px;
  }
`;

export const ContentElement = styled.div`
  background-color: #ffffff;
  border: 1px solid var(--border-color); // Mudado de dashed para solid
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  // cursor: grab; // Removido, o handle do dnd fará isso
  box-shadow: var(--box-shadow-sm); // Sombra mais suave

  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--box-shadow);
  }
`;

export const ElementControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px; // Aumentado o gap
  min-width: 30px;
  align-items: center;
  padding-top: var(--spacing-xs); // Ajustado padding
`;

export const ElementContent = styled.div`
  flex-grow: 1;
  h2 { font-size: 1.5em; margin-bottom: var(--spacing-sm); color: var(--primary-color); }
  p, ul, div[dangerouslySetInnerHTML] { color: var(--text-color); line-height: 1.6; text-overflow: ellipsis; overflow: hidden; max-width: 800px; }
  ul { padding-left: var(--spacing-lg); }
`;

export const StyledImagePreview = styled.img`
  max-width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
  border-radius: var(--border-radius);
  margin-top: var(--spacing-sm);
  border: 1px solid var(--border-color);
`;

export const CardapioItemContainer = styled.div`
  padding: var(--spacing-md); // Aumentado padding
  border: 1px solid #eee;
  border-radius: var(--border-radius);
  margin-top: var(--spacing-sm);
  margin-bottom: var(--spacing-md); // Adicionado margin bottom
  background-color: #f9f9f9;

  h4 {
    margin-bottom: var(--spacing-xs);
    color: var(--primary-color);
    font-size: 1.1em;
    display: flex;
    justify-content: space-between;
  }
  p {
    margin-bottom: var(--spacing-xs);
    font-size: 0.9rem;
    color: var(--text-light-color);
  }
  span.price { // Classe para preço
    font-weight: bold;
    color: var(--text-color);
  }
  .item-details { // Para agrupar tags e alergênicos
    font-size: 0.8rem;
    color: var(--text-light-color);
    margin-top: var(--spacing-xs);
  }
`;

export const AddItemButton = styled(Button)`
  margin-top: var(--spacing-md);
`;

export const PdfButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
`;

