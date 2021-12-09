import React, {Fragment, useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';

import {SQUARE_SIZE} from '../../../common/src/coordinates';
import {Fish, FishSize, FishType} from '../../../common/src/model';
import {apiCall} from '../api';
import {ORANGE} from '../colors';
import {FishForm} from '../fish_form';
import {formatCoordinate} from '../format';
import {
  getServerState,
  getSquareFetching,
  setSquareFetching,
  useClientState,
  useServerState,
} from '../stores';

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
    const {fishFetcher: current} = getSquareFetching();
    if (current === undefined) {
      return;
    }
    const fishs = fish.filter(
      f =>
        currentFish === undefined ||
        f.coordinate.x !== currentFish.coordinate.x ||
        f.coordinate.y !== currentFish.coordinate.y
    );

    const selectedSquares = [
      ...fishs.map((f, i) => ({
        borderColor: '#223679',
        coordinate: f.coordinate,
        content: (
          <FishPreview>
            <span>{`${f.size?.slice(0, 1) ?? '?'}${f.type?.slice(0, 1) ?? '?'}${
              f.distance ?? '?'
            }`}</span>
            <FishPreviewIndex>{`#${i + 1}`}</FishPreviewIndex>
          </FishPreview>
        ),
      })),
    ];

    if (currentFish !== undefined) {
      selectedSquares.push({
        borderColor: '#223679',
        coordinate: currentFish.coordinate,
        content: (
          <Fragment>
            <FishPreview>
              <span>{`${currentFish.size?.slice(0, 1) ?? '?'}${
                currentFish.type?.slice(0, 1) ?? '?'
              }${currentFish.distance ?? '?'}`}</span>
            </FishPreview>
            <FishForm
              fish={currentFish}
              canDelete={fishs.length !== fish.length}
              onSubmit={handleCurrentFishSave}
              onCancel={handleCurrentFishCancel}
              onDelete={handleCurrentFishDelete}
            />
          </Fragment>
        ),
      });
    }

    setSquareFetching({...getSquareFetching(), fishFetcher: {...current, selectedSquares}});
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
        ...getSquareFetching(),
        fishFetcher: {
          ...(getSquareFetching().fishFetcher ?? {selectedSquares: []}),
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
      setSquareFetching({...getSquareFetching(), fishFetcher: undefined});
    }
  }, [isRunning]);

  const moveFish = useCallback(
    (fish: Fish, up: boolean) => {
      apiCall('/update-fish-pos', {
        map: coordinate.coordinate,
        fish: fish.coordinate,
        up,
      }).catch(console.error);
    },
    [coordinate.coordinate]
  );

  return (
    <Wrapper>
      <Title>Poissons :</Title>
      {fish.length === 0 ? (
        <NoFish>Aucun poissons répertoriés sur cette map</NoFish>
      ) : (
        fish.map((f, i) => {
          const pos = formatCoordinate(f.coordinate);
          return (
            <FishLine key={pos}>
              <FishActions>
                <MoveButton
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={() => moveFish(f, true)}
                  disabled={i === 0}
                >
                  ▲
                </MoveButton>
                <MoveButton
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={() => moveFish(f, false)}
                  disabled={i === fish.length - 1}
                >
                  ▼
                </MoveButton>
              </FishActions>
              <FishIndex>{`#${i + 1}`}</FishIndex>
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
  flex-direction: column;
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
const FishIndex = styled.div`
  width: 34px;
  text-align: right;
  margin-right: 8px;
`;
const FishInfo = styled.div``;
const NoFish = styled.div``;

const FishActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const MoveButton = styled.div<{disabled: boolean}>`
  cursor: ${p => (p.disabled ? 'default' : 'pointer')};
  opacity: ${p => (p.disabled ? 0.3 : 1)};
  pointer-events: ${p => (p.disabled ? 'none' : 'all')};
  color: ${ORANGE};
  height: 12px;
  font-size: 14px;
  &:hover {
    color: #ffffff;
  }
`;
const FishPreviewIndex = styled.div`
  font-size: 12px;
  margin-top: -4px;
  margin-bottom: -5px;
`;
