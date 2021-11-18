import styled from 'styled-components';

import {BLUE_GRAY_0D, ORANGE} from './colors';

export const Block = styled.div`
  border-radius: 8px;
  padding: 16px;
  background-color: ${BLUE_GRAY_0D};
`;

export const Button = styled.button`
  background-color: ${ORANGE};
  color: ${BLUE_GRAY_0D};
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  &:disabled {
    background-color: ${ORANGE}aa;
    cursor: default;
  }
`;
