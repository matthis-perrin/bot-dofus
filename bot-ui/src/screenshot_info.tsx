import React, {useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';

import {apiCall} from './api';
import {useServerState} from './events';
import {formatScore} from './format';
import {Toggle} from './toggle';

export const ScreenshotInfo: React.FC = () => {
  const serverState = useServerState();
  const [isRunning, setIsRunning] = useState(serverState.screenshot.isRunning);
  const [useInternal, setUseInternal] = useState<number | false>(false);

  const handleIsRunningToggle = useCallback((toggled: boolean) => {
    setIsRunning(toggled);
    const id = Math.random();
    setUseInternal(id);
    apiCall(`/${toggled ? 'start' : 'stop'}-screenshot`)
      .catch(console.error)
      .finally(() => setUseInternal(internalId => (internalId === id ? false : internalId)));
  }, []);

  useEffect(() => {}, [serverState]);

  return (
    <Wrapper>
      <ToggleWrapper>
        <Toggle
          toggled={useInternal === false ? serverState.screenshot.isRunning : isRunning}
          syncState={handleIsRunningToggle}
          label={
            <ToggleLabel>{serverState.screenshot.isRunning ? 'Running' : 'Stopped'}</ToggleLabel>
          }
        />
      </ToggleWrapper>
      {/* <RunningWrapper></RunningWrapper> */}
      <div>{`Coordonnées : ${serverState.coordinate.label} (${formatScore(
        serverState.coordinate.score
      )})`}</div>
      <div>{`Soleils : `}</div>
      <table>
        <tr>
          <th>x</th>
          <th>y</th>
          <th>label</th>
          <th>score</th>
        </tr>
        {serverState.soleil.map(s => (
          <tr key={`${s.x},${s.y}`}>
            <td>{s.x}</td>
            <td>{s.y}</td>
            <td>{s.label}</td>
            <td>{s.score}</td>
          </tr>
        ))}
      </table>
    </Wrapper>
  );
};
ScreenshotInfo.displayName = 'ScreenshotInfo';

const Wrapper = styled.div`
  position: relative;
  padding: 16px;
  flex-grow: 1;
`;

const ToggleWrapper = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
`;

const ToggleLabel = styled.div`
  display: flex;
  align-items: center;
  width: 64px;
  line-height: 100%;
  font-size: 14px;
  font-weight: 500;
`;
