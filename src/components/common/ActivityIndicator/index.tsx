import styled, { keyframes } from "styled-components";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const ActivityIndicator = styled.div`
  border: 4px solid #f3f3f3; 
  border-top: 4px solid #3498db; 
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${rotate} 2s linear infinite;
  margin: 20px auto;
`;

export default ActivityIndicator;