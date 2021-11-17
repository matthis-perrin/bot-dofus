import React, {MouseEventHandler, useCallback, useState} from 'react';
import styled from 'styled-components';

import {ORANGE} from './colors';
import {useServerState} from './events';
import {formatScore} from './format';
import {Button} from './fragments';
import {Spacing} from './spacing';

export const SoleilInfo: React.FC = () => {
  const serverState = useServerState();
  const [showAll, setShowAll] = useState(false);

  const soleils = serverState.soleil.filter(s => s.label === 'OK');
  const notSoleils = serverState.soleil.filter(s => s.label !== 'OK');

  const handleToggleShowAllClick = useCallback<MouseEventHandler>(() => {
    setShowAll(showAll => !showAll);
  }, []);

  return (
    <Wrapper>
      <Column>
        <Title>Soleil</Title>
        {soleils.map(s => (
          <Line key={`${s.x}/${s.y}`}>
            <Pos>{`${s.x}/${s.y}`}</Pos>
            <Score>{formatScore(s.score, 2)}</Score>
          </Line>
        ))}
      </Column>
      <Spacing width={16} />
      <Column>
        <Title>Pas Soleil</Title>
        {(showAll ? notSoleils : notSoleils.slice(0, 4)).map(s => (
          <Line key={`${s.x}/${s.y}`}>
            <Pos>{`${s.x}/${s.y}`}</Pos>
            <Score>{`(${formatScore(s.score, 2)})`}</Score>
          </Line>
        ))}
        <Spacing height={8} />
        <Button onClick={handleToggleShowAllClick}>{showAll ? 'Cacher' : 'Tout afficher'}</Button>
      </Column>
    </Wrapper>
  );
};
SoleilInfo.displayName = 'SoleilInfo';

const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
`;
const Title = styled.div`
  color: ${ORANGE};
  margin-bottom: 4px;
`;
const Line = styled.div`
  display: flex;
  align-items: center;
`;
const Pos = styled.div`
  width: 56px;
`;
const Score = styled.div``;
