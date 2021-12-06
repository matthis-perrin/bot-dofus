import React, {Fragment, useCallback, useRef, useState} from 'react';
import styled from 'styled-components';

import {apiCall} from './api';
import {BLUE_GRAY_16, ORANGE, WHITE_AA} from './colors';
import {Block, Button} from './fragments';
import {CoordinateModule} from './modules/coordinate_module';
import {FightModule} from './modules/fight_module';
import {FishModule} from './modules/fish_module';
import {ScenarioModule} from './modules/scenario_module';
import {SoleilModule} from './modules/soleil_module';
import {Spacing} from './spacing';
import {setClientState, useClientState} from './stores';

export const Modules: React.FC = () => {
  const [lastCoordinate, setLastCoordinate] = useState({x: '', y: ''});
  // eslint-disable-next-line no-null/no-null
  const screenshotInputX = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line no-null/no-null
  const screenshotInputY = useRef<HTMLInputElement>(null);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);

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
      .then(() => {
        setLastCoordinate({x: String(x), y: String(y)});
      })
      .catch(console.error)
      .finally(() => setIsTakingScreenshot(false));
  }, []);

  return (
    <Wrapper>
      <Block>
        <CoordinateModule />
      </Block>
      <Spacing height={16} />
      <Block>
        <ScenarioModule />
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
              <CoordinateInput defaultValue={lastCoordinate.x} type="text" ref={screenshotInputX} />
              <Spacing width={16} />
              <Title>y : </Title>
              <CoordinateInput defaultValue={lastCoordinate.y} type="text" ref={screenshotInputY} />
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
        <FightModule />
      </Block>
      <Spacing height={16} />
      <Block>
        <SoleilModule />
      </Block>
    </Wrapper>
  );
};
Modules.displayName = 'Modules';

const Wrapper = styled.div`
  position: relative;
  margin-left: 16px;
  flex-grow: 1;
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
