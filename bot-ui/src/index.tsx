import React from 'react';
import ReactDOM from 'react-dom';
import {createGlobalStyle} from 'styled-components';

import {App} from './app';
import {BLUE_GRAY_16, WHITE_AA} from './colors';
import {startRefreshLoop, subscribeToEvents} from './events';

const GlobalCss = createGlobalStyle`
  html, body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100%;
    background-color: ${BLUE_GRAY_16};
    color: ${WHITE_AA}
  }
`;

ReactDOM.render(
  <React.StrictMode>
    <App />
    <GlobalCss />
  </React.StrictMode>,
  document.getElementById('root')
);

subscribeToEvents();
startRefreshLoop();
