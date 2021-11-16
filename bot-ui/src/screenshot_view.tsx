import React from 'react';
import styled from 'styled-components';

import {gameCoordinates} from '../../common/model';
import {useServerState} from './events';

export const ScreenshotView: React.FC = () => {
  const serverState = useServerState();
  return (
    <Img
      style={{width: gameCoordinates.width, height: gameCoordinates.height}}
      src={`data:image/png;base64,${serverState.screenshot}`}
    />
  );
};
ScreenshotView.displayName = 'ScreenshotView';

const Img = styled.img``;
