import React, {MouseEventHandler, useCallback, useState} from 'react';
import styled from 'styled-components';

import {gameCoordinates, SQUARE_SIZE} from '../../common/model';
import {useServerState} from './events';
import {Block} from './fragments';
import {SquareHighlight} from './square_highlight';

interface Position {
  x: number;
  y: number;
}

function soleilCoordinateToMapCoordinate(coordinate: Position): Position {
  return {
    x: coordinate.x,
    y: coordinate.y * 2,
  };
}

function mapCoordinateToImageCoordinate(coordinate: Position): Position {
  const {x, y} = coordinate;

  return {
    x: ((y % 2 === 0 ? x : x + 0.5) * SQUARE_SIZE.width) / 2,
    y: (y * SQUARE_SIZE.height) / 4,
  };
}

function imageCoordinateToMapCoordinate(coordinate: Position): Position {
  let {x, y} = coordinate;

  // Get the "soleil" coordinate (i.e coordinate as if we had square tiles)
  let px = Math.floor(x / (SQUARE_SIZE.width / 2));
  let py = Math.floor(y / (SQUARE_SIZE.height / 2));

  // Normalize the x/y coordinate to get the location within the "soleil" coordinate (min 0, max 1)
  x = x / (SQUARE_SIZE.width / 2) - px;
  y = y / (SQUARE_SIZE.height / 2) - py;

  console.log(px, py, x, y);

  // Transform the soleil coordinate to map coordinate
  py *= 2;

  // Adjuste the final coordinate based on which "triangle" we are
  if (y >= 0.5) {
    if (x >= 0.5) {
      if (x - 0.5 + (y - 0.5) > 0.5) {
        py++;
      }
    } else if (0.5 - x + (y - 0.5) > 0.5) {
      px--;
      py++;
    }
  } else if (x >= 0.5) {
    if (x - 0.5 + (0.5 - y) > 0.5) {
      py--;
    }
  } else if (0.5 - x + (0.5 - y) > 0.5) {
    px--;
    py--;
  }
  console.log(px, py);
  return {x: px, y: py};
}

export const ScreenshotView: React.FC = () => {
  const serverState = useServerState();
  const soleils = serverState.soleil.filter(s => s.label === 'OK');
  const [hoveredSquare, setHoveredSquare] = useState<Position>({x: 0, y: 0});

  const handleMouseMove = useCallback<MouseEventHandler>(e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.x;
    const y = e.clientY - rect.y;
    setHoveredSquare(imageCoordinateToMapCoordinate({x, y}));
  }, []);

  const hoveredSquareCoordinate = mapCoordinateToImageCoordinate(hoveredSquare);

  return (
    <Block style={{flexShrink: 0}}>
      <Wrapper>
        <Img
          style={{width: gameCoordinates.width, height: gameCoordinates.height}}
          src={`data:image/png;base64,${serverState.screenshot.image}`}
          onMouseMove={handleMouseMove}
        />
        {soleils.map(s => {
          const pixelCoordinates = mapCoordinateToImageCoordinate(
            soleilCoordinateToMapCoordinate({x: s.x, y: s.y})
          );
          return (
            <SquareHighlight
              key={`${s.x},${s.y}`}
              style={{position: 'absolute', left: pixelCoordinates.x, top: pixelCoordinates.y}}
              color="red"
            ></SquareHighlight>
            // <SoleilWrapper
            //   key={`${s.x},${s.y}`}
            //   style={{
            //     left: (s.x * SQUARE_SIZE.width) / 2,
            //     top: (s.y * SQUARE_SIZE.height) / 2,
            //   }}
            // >{`${Math.round(s.score * 100 * 100) / 100}%`}</SoleilWrapper>
          );
        })}
        <SquareHighlight
          style={{
            position: 'absolute',
            left: hoveredSquareCoordinate.x,
            top: hoveredSquareCoordinate.y,
          }}
          color="#223679"
        ></SquareHighlight>
      </Wrapper>
    </Block>
  );
};
ScreenshotView.displayName = 'ScreenshotView';

const Wrapper = styled.div`
  position: relative;
`;
const Img = styled.img``;
const SoleilWrapper = styled.div`
  position: absolute;
  border: solid 2px red;
  width: ${SQUARE_SIZE.width / 2}px;
  height: ${SQUARE_SIZE.height / 2}px;
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  font-size: 10px;
  font-weight: 500;
`;
