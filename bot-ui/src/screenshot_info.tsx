import React, {Fragment, useCallback, useRef, useState} from 'react';
import styled from 'styled-components';

import {apiCall} from './api';
import {BLUE_GRAY_16, ORANGE, WHITE_AA} from './colors';
import {FishModule} from './fish_module';
import {formatScoreWithIcon} from './format';
import {Block, Button} from './fragments';
import {SoleilInfo} from './soleil_info';
import {Spacing} from './spacing';
import {setClientState, useClientState, useServerState} from './stores';
import {Toggle} from './toggle';

export const ScreenshotInfo: React.FC = () => {
  // eslint-disable-next-line no-null/no-null
  const screenshotInputX = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line no-null/no-null
  const screenshotInputY = useRef<HTMLInputElement>(null);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);

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

  //

  const clientState = useClientState();

  const handleFishModeClick = useCallback(() => setClientState({action: 'editing-fish'}), []);
  const handleStop = useCallback(() => setClientState({action: undefined}), []);
  const handleMapScreenshotClick = useCallback(
    () => setClientState({action: 'take-screenshot'}),
    []
  );
  const handleTakeScreenshotClick = useCallback(() => {
    if (!screenshotInputX.current || !screenshotInputY.current) {
      return;
    }
    const x = parseFloat(screenshotInputX.current.value);
    const y = parseFloat(screenshotInputY.current.value);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    setIsTakingScreenshot(true);
    apiCall('/take-screenshot', {x, y})
      .then(() => setClientState({action: undefined}))
      .catch(console.error)
      .finally(() => setIsTakingScreenshot(false));
  }, []);

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
        <ModuleActions>
          <Button onClick={handleFishModeClick} disabled={clientState.action !== undefined}>
            Mode poissons
          </Button>
          <Spacing width={16} />
          <Button onClick={handleMapScreenshotClick} disabled={clientState.action !== undefined}>
            Map screenshot
          </Button>
          <Spacing width={16} />
          {clientState.action !== undefined ? (
            <Button onClick={handleStop}>Stop</Button>
          ) : (
            <Fragment />
          )}
        </ModuleActions>
        {clientState.action === 'take-screenshot' ? (
          <Fragment>
            <Spacing height={16} />
            <Line>
              <Title>x : </Title>
              <CoordinateInput type="text" ref={screenshotInputX} />
              <Spacing width={16} />
              <Title>y : </Title>
              <CoordinateInput type="text" ref={screenshotInputY} />
              <Spacing width={16} />
              <Button disabled={isTakingScreenshot} onClick={handleTakeScreenshotClick}>
                Prendre screenshot
              </Button>
            </Line>
          </Fragment>
        ) : (
          <Fragment />
        )}
      </Block>
      <Spacing height={16} />
      <Block>
        <FishModule />
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

const ModuleActions = styled.div`
  display: flex;
  align-items: center;
`;

const CoordinateInput = styled.input`
  width: 24px;
  background-color: ${BLUE_GRAY_16};
  color: ${WHITE_AA};
  border: solid 1px ${ORANGE};
  border-radius: 4px;
  margin-left: 4px;
  padding: 4px;
`;
const Line = styled.div`
  display: flex;
  align-items: center;
`;
