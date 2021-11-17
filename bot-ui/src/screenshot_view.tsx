import React from 'react';
import styled from 'styled-components';

import {gameCoordinates, SQUARE_SIZE} from '../../common/model';
import {useServerState} from './events';
import {Block} from './fragments';

export const ScreenshotView: React.FC = () => {
  const serverState = useServerState();
  const soleils = serverState.soleil.filter(s => s.label === 'OK');

  return (
    <Block style={{flexShrink: 0}}>
      <Wrapper>
        <Img
          style={{width: gameCoordinates.width, height: gameCoordinates.height}}
          src={`data:image/png;base64,${serverState.screenshot.image}`}
        />
        {soleils.map(s => (
          <SoleilWrapper
            key={`${s.x},${s.y}`}
            style={{
              left: (s.x * SQUARE_SIZE.width) / 2,
              top: (s.y * SQUARE_SIZE.height) / 2,
            }}
          >{`${Math.round(s.score * 100 * 100) / 100}%`}</SoleilWrapper>
        ))}
      </Wrapper>
    </Block>
  );
};
ScreenshotView.displayName = 'ScreenshotView';

const Wrapper = styled.div`
  position: relative;
`;
const Img = styled.img``;
const SoleilWrapper = styled.div`
  position: absolute;
  border: solid 2px red;
  width: ${SQUARE_SIZE.width / 2}px;
  height: ${SQUARE_SIZE.height / 2}px;
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  font-size: 10px;
  font-weight: 500;
`;
