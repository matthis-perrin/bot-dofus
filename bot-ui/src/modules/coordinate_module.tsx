import React from 'react';
import styled from 'styled-components';

import {ORANGE} from '../colors';
import {formatScoreWithIcon} from '../format';
import {useServerState} from '../stores';

export const CoordinateModule: React.FC = () => {
  const serverState = useServerState();

  return (
    <div>
      <Title>Coordonnées</Title>
      <span>{` : ${serverState.coordinate.label} (${formatScoreWithIcon(
        serverState.coordinate.score,
        0.95
      )})`}</span>
    </div>
  );
};
CoordinateModule.displayName = 'CoordinateModule';

const Title = styled.span`
  color: ${ORANGE};
`;
