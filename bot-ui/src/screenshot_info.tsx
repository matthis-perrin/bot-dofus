import React, {useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';

import {apiCall} from './api';
import {ORANGE} from './colors';
import {useServerState} from './events';
import {formatScoreWithIcon} from './format';
import {Block} from './fragments';
import {SoleilInfo} from './soleil_info';
import {Spacing} from './spacing';
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
      <Block>
        <div>
          <Title>Coordonnées</Title>
          <span>{` : ${serverState.coordinate.label} (${formatScoreWithIcon(
            serverState.coordinate.score,
            0.95
          )})`}</span>
        </div>
      </Block>
      <Spacing height={16} />
      <Block>
        <SoleilInfo />
      </Block>
    </Wrapper>
  );
};
ScreenshotInfo.displayName = 'ScreenshotInfo';

const Wrapper = styled.div`
  position: relative;
  margin-left: 16px;
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

const Title = styled.span`
  color: ${ORANGE};
`;
