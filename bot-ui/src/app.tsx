import React from 'react';
import styled from 'styled-components';

import {ScreenshotView} from './screenshot_view';

export const App: React.FC = () => {
  return (
    <Wrapper>
      <ScreenshotView />
    </Wrapper>
  );
};
App.displayName = 'App';

const Wrapper = styled.div``;
