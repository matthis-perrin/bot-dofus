import React, {useCallback, useState} from 'react';
import styled from 'styled-components';

import {apiCall} from '../api';
import {ORANGE} from '../colors';
import {formatTime} from '../format';
import {Button} from '../fragments';
import {Spacing} from '../spacing';
import {useScenarioState} from '../stores';
import {Toggle} from '../toggle';

export const ScenarioModule: React.FC = () => {
  const scenarioState = useScenarioState();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isRunning, setIsRunning] = useState(scenarioState.isRunning);
  const [useInternal, setUseInternal] = useState<number | false>(false);

  const statuses = scenarioState.statusHistory.slice(0, showAllHistory ? undefined : 10);

  const handleIsRunningToggle = useCallback((toggled: boolean) => {
    setIsRunning(toggled);
    const id = Math.random();
    setUseInternal(id);
    apiCall(`/${toggled ? 'start' : 'stop'}-scenario`)
      .catch(console.error)
      .finally(() => setUseInternal(internalId => (internalId === id ? false : internalId)));
  }, []);

  const handleShowAllClick = useCallback(() => setShowAllHistory(current => !current), []);

  return (
    <Wrapper>
      <StatusTitle>
        <Title>Scenario</Title>
        <Toggle
          toggled={useInternal === false ? scenarioState.isRunning : isRunning}
          syncState={handleIsRunningToggle}
          label={<ToggleLabel>{scenarioState.isRunning ? 'Running' : 'Stopped'}</ToggleLabel>}
        />
      </StatusTitle>
      <StatusHeader>
        <span>{`Status (${statuses.length}/${scenarioState.statusHistory.length})`}</span>
        <Spacing width={8} />
        <Button onClick={handleShowAllClick}>{showAllHistory ? 'Cacher' : 'Tout afficher'}</Button>
      </StatusHeader>
      <StatusWrapper>
        {statuses.map((status, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <StatusLine key={`${i}-${status.time}`}>
            <StatusTime>{formatTime(status.time)}</StatusTime>
            <StatusValue>{status.value}</StatusValue>
          </StatusLine>
        ))}
      </StatusWrapper>
    </Wrapper>
  );
};
ScenarioModule.displayName = 'ScenarioModule';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  color: ${ORANGE};
  margin-right: 4px;
`;

const ToggleLabel = styled.div`
  display: flex;
  align-items: center;
  width: 64px;
  line-height: 100%;
  font-size: 14px;
  font-weight: 500;
`;

const StatusTitle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  margin: 8px 0 16px 0;
`;

const StatusWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 300px;
  overflow-y: auto;
`;

const StatusLine = styled.div`
  display: flex;
  align-items: flex-start;
  border-bottom: solid 1px #ffffff22;
  padding-bottom: 2px;
  margin-bottom: 2px;
`;

const StatusTime = styled.div`
  width: 75px;
`;

const StatusValue = styled.div`
  white-space: pre-line;
`;
