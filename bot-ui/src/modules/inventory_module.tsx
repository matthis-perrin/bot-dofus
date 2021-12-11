import React from 'react';
import styled from 'styled-components';

import {ORANGE} from '../colors';
import {useServerState} from '../stores';

export const InventoryModule: React.FC = () => {
  const {inventory} = useServerState();

  return (
    <Wrapper>
      <Title>Inventaire :</Title>
      <Img src={`data:image/png;base64,${inventory}`} />
    </Wrapper>
  );
};
InventoryModule.displayName = 'InventoryModule';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  color: ${ORANGE};
  margin-bottom: 4px;
`;

const Img = styled.img``;
