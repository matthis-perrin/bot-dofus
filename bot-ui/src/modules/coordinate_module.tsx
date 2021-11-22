import React from 'react';
import styled from 'styled-components';

import {COORDINATE_MIN_SCORE} from '../../../common/src/model';
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
        COORDINATE_MIN_SCORE
      )})`}</span>
    </div>
  );
};
CoordinateModule.displayName = 'CoordinateModule';

const Title = styled.span`
  color: ${ORANGE};
`;
