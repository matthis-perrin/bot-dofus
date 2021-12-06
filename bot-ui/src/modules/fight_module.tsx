import React, {useEffect} from 'react';
import styled from 'styled-components';

import {ScenarioType, SquareType} from '../../../common/src/model';
import {ORANGE} from '../colors';
import {setSquareOverlay, useScenarioState, useServerState} from '../stores';

function getColorFromSquareType(mapType: SquareType): string {
  if (mapType === SquareType.Red) {
    return '#ff0000aa';
  } else if (mapType === SquareType.Blue) {
    return '#0000ffaa';
  } else if (mapType === SquareType.Light) {
    return '#ffffffaa';
  } else if (mapType === SquareType.Dark) {
    return '#ffffffaa';
  } else if (mapType === SquareType.Wall) {
    return '#ffff00aa';
  }
  return '#683100cc';
}

export const FightModule: React.FC = () => {
  const {currentScenario} = useScenarioState();
  const {mapScan} = useServerState();
  const isRunning = currentScenario === ScenarioType.Fight;

  useEffect(() => {
    if (isRunning) {
      setSquareOverlay({
        overlay: Object.entries(mapScan).flatMap(([x, data]) =>
          Object.entries(data).map(([y, type]) => ({
            coordinate: {x: parseFloat(x), y: parseFloat(y)},
            color: getColorFromSquareType(type),
          }))
        ),
      });
    } else {
      setSquareOverlay({overlay: undefined});
    }
  }, [mapScan, isRunning]);

  return (
    <Wrapper>
      <Title>Fight :</Title>
    </Wrapper>
  );
};
FightModule.displayName = 'FightModule';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  color: ${ORANGE};
  margin-bottom: 4px;
`;
