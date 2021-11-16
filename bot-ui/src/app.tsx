import React from 'react';
import styled from 'styled-components';

import {ScreenshotInfo} from './screenshot_info';
import {ScreenshotView} from './screenshot_view';

export const App: React.FC = () => {
  return (
    <Wrapper>
      <ScreenshotView />
      <ScreenshotInfo />
    </Wrapper>
  );
};
App.displayName = 'App';

const Wrapper = styled.div`
  display: flex;
`;
