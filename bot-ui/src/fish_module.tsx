import React, {Fragment, useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';

import {Fish, FishSize, FishType, SQUARE_SIZE} from '../../common/src/model';
import {apiCall} from './api';
import {ORANGE} from './colors';
import {FishForm} from './fish_form';
import {formatCoordinate} from './format';
import {
  getServerState,
  getSquareFetching,
  setSquareFetching,
  useClientState,
  useServerState,
} from './stores';

export const FishModule: React.FC = () => {
  const {coordinate, fish} = useServerState();
  const {action} = useClientState();
  const isRunning = action === 'editing-fish';

  const [currentFish, setCurrentFish] = useState<Fish | undefined>();
  const [initial, setInitial] = useState(false);

  const handleCurrentFishSave = useCallback(
    async (
      type: FishType | undefined,
      size: FishSize | undefined,
      distance: number | undefined
    ) => {
      await apiCall('/set-fish', {
        fish: {...currentFish, type, size, distance},
        map: coordinate.coordinate,
      });
      setCurrentFish(undefined);
    },
    [coordinate.coordinate, currentFish]
  );
  const handleCurrentFishCancel = useCallback(() => setCurrentFish(undefined), []);
  const handleCurrentFishDelete = useCallback(async () => {
    if (currentFish === undefined) {
      return;
    }
    await apiCall('/delete-fish', {
      fish: currentFish.coordinate,
      map: coordinate.coordinate,
    });
    setCurrentFish(undefined);
  }, [coordinate.coordinate, currentFish]);

  useEffect(() => {
    const {fetcher: current} = getSquareFetching();
    if (current === undefined) {
      return;
    }
    const fishes = fish.filter(
      f =>
        currentFish === undefined ||
        f.coordinate.x !== currentFish.coordinate.x ||
        f.coordinate.y !== currentFish.coordinate.y
    );

    const selectedSquares = [
      ...fishes.map(f => ({
        color: '#223679',
        coordinate: f.coordinate,
        content: (
          <FishPreview>{`${f.size?.slice(0, 1) ?? '?'}${f.type?.slice(0, 1) ?? '?'}${
            f.distance ?? '?'
          }`}</FishPreview>
        ),
      })),
    ];

    if (currentFish !== undefined) {
      selectedSquares.push({
        color: '#223679',
        coordinate: currentFish.coordinate,
        content: (
          <Fragment>
            <FishPreview>{`${currentFish.size?.slice(0, 1) ?? '?'}${
              currentFish.type?.slice(0, 1) ?? '?'
            }${currentFish.distance ?? '?'}`}</FishPreview>
            <FishForm
              fish={currentFish}
              canDelete={fishes.length !== fish.length}
              onSubmit={handleCurrentFishSave}
              onCancel={handleCurrentFishCancel}
              onDelete={handleCurrentFishDelete}
            />
          </Fragment>
        ),
      });
    }

    setSquareFetching({fetcher: {...current, selectedSquares}});
  }, [
    currentFish,
    fish,
    handleCurrentFishCancel,
    handleCurrentFishDelete,
    handleCurrentFishSave,
    initial,
  ]);

  useEffect(() => {
    if (isRunning) {
      setSquareFetching({
        fetcher: {
          ...(getSquareFetching().fetcher ?? {selectedSquares: []}),
          // hoverColor: '#223679',
          hoverColor: '#ffffff55',
          onSquareClick: c => {
            const current =
              getServerState().fish.find(f => f.coordinate.x === c.x && f.coordinate.y === c.y) ??
              {};
            setCurrentFish({...current, coordinate: c});
          },
        },
      });
      setInitial(true);
    } else {
      setSquareFetching({fetcher: undefined});
    }
  }, [isRunning]);

  return (
    <Wrapper>
      <Title>Poissons :</Title>
      {fish.length === 0 ? (
        <NoFish>Aucun poissons répertoriés sur cette map</NoFish>
      ) : (
        fish.map(f => {
          const pos = formatCoordinate(f.coordinate);
          return (
            <FishLine key={pos}>
              <FishPos>{pos}</FishPos>
              <FishInfo>{`${f.size ?? '?'} de ${f.type ?? '?'} à ${
                f.distance ?? '?'
              } cases`}</FishInfo>
            </FishLine>
          );
        })
      )}
    </Wrapper>
  );
};
FishModule.displayName = 'FishModule';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  color: ${ORANGE};
  margin-bottom: 4px;
`;

const FishPreview = styled.div`
  width: ${SQUARE_SIZE.width / 2}px;
  height: ${SQUARE_SIZE.height / 2}px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff44;
  font-size: 11;
  font-weight: 700;
`;

const FishLine = styled.div`
  display: flex;
  align-items: center;
`;
const FishPos = styled.div`
  width: 56px;
`;
const FishInfo = styled.div``;
const NoFish = styled.div``;
