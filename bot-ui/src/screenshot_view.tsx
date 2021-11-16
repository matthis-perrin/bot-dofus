import React from 'react';
import styled from 'styled-components';

import {useServerState} from './events';

export const ScreenshotView: React.FC = () => {
  const serverState = useServerState();
  return <Img src={`data:image/png;base64,${serverState.screenshot}`} />;
};
ScreenshotView.displayName = 'ScreenshotView';

const Img = styled.img`
  width: 1000px;
`;
