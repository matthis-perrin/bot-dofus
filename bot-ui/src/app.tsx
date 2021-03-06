import React from 'react';
import styled from 'styled-components';

import {Modules} from './modules';
import {ScreenshotView} from './screenshot_view';

export const App: React.FC = () => {
  return (
    <Wrapper>
      <ScreenshotView />
      <Modules />
    </Wrapper>
  );
};
App.displayName = 'App';

const Wrapper = styled.div`
  display: flex;
  /* flex-direction: column; */
  align-items: flex-start;
  /* padding: 16px; */
`;
