import React, {Fragment, useEffect, useState} from 'react';
import styled from 'styled-components';

import {apiCall} from '../api';
import {ORANGE} from '../colors';
import {formatCoordinate} from '../format';
import {
  getServerState,
  getSquareFetching,
  setSquareFetching,
  useClientState,
  useServerState,
} from '../stores';

export const SoleilModule: React.FC = () => {
  const {coordinate, soleil} = useServerState();
  const {action} = useClientState();
  const isRunning = action === 'editing-soleil';

  const [initial, setInitial] = useState(false);

  useEffect(() => {
    const {soleilFetcher: current} = getSquareFetching();
    if (current === undefined) {
      return;
    }
    const selectedSquares = [
      ...soleil.map(f => ({
        fillColor: '#dcd61faa',
        coordinate: f.coordinate,
        content: <Fragment />,
      })),
    ];

    setSquareFetching({...getSquareFetching(), soleilFetcher: {...current, selectedSquares}});
  }, [soleil, initial]);

  useEffect(() => {
    if (isRunning) {
      setSquareFetching({
        ...getSquareFetching(),
        soleilFetcher: {
          ...(getSquareFetching().soleilFetcher ?? {selectedSquares: []}),
          // hoverColor: '#223679',
          hoverColor: '#ffffff55',
          onSquareClick: c => {
            const current = getServerState().soleil.find(
              f => f.coordinate.x === c.x && f.coordinate.y === c.y
            );
            if (current) {
              apiCall('/delete-soleil', {
                soleil: current.coordinate,
                map: coordinate.coordinate,
              }).catch(console.error);
            } else {
              apiCall('/set-soleil', {
                soleil: {coordinate: c},
                map: coordinate.coordinate,
              }).catch(console.error);
            }
          },
        },
      });
      setInitial(true);
    } else {
      setSquareFetching({...getSquareFetching(), soleilFetcher: undefined});
    }
  }, [coordinate.coordinate, isRunning]);

  return (
    <Wrapper>
      <Title>Soleils :</Title>
      {soleil.length === 0 ? (
        <NoSoleil>Aucun soleils répertoriés sur cette map</NoSoleil>
      ) : (
        soleil.map(f => {
          const pos = formatCoordinate(f.coordinate);
          return (
            <SoleilLine key={pos}>
              <SoleilPos>{pos}</SoleilPos>
            </SoleilLine>
          );
        })
      )}
    </Wrapper>
  );
};
SoleilModule.displayName = 'SoleilModule';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  color: ${ORANGE};
  margin-bottom: 4px;
`;

const SoleilLine = styled.div`
  display: flex;
  align-items: center;
`;
const SoleilPos = styled.div`
  width: 56px;
`;
const NoSoleil = styled.div``;
