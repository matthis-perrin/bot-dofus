import React, {Fragment, MouseEvent, MouseEventHandler, useCallback, useState} from 'react';
import styled from 'styled-components';

import {
  Coordinate,
  imageCoordinateToMapCoordinate,
  mapCoordinateToImageCoordinate,
  soleilCoordinateToMapCoordinate,
} from '../../common/src/coordinates';
import {gameCoordinates, HORIZONTAL_SQUARES, VERTICAL_SQUARES} from '../../common/src/model';
import {formatCoordinate} from './format';
import {Block} from './fragments';
import {SquareHighlight} from './square_highlight';
import {useServerState, useSquareFetching} from './stores';

function mapCoordinateToCssStyles(coordinate: Coordinate): React.CSSProperties {
  const {x, y} = mapCoordinateToImageCoordinate(coordinate);
  return {
    position: 'absolute',
    left: x,
    top: y,
  };
}

export const ScreenshotView: React.FC = () => {
  const serverState = useServerState();
  const {fetcher} = useSquareFetching();

  const soleils = serverState.soleil.filter(s => s.label === 'OK');

  const getCoordinate = useCallback((e: MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.x;
    const y = e.clientY - rect.y;

    const c = imageCoordinateToMapCoordinate({x, y});
    if (c.x < 0 || c.x >= HORIZONTAL_SQUARES || c.y < 0 || c.y >= 2 * VERTICAL_SQUARES - 1) {
      return;
    }
    return c;
  }, []);

  const [hoveredSquare, setHoveredSquare] = useState<Coordinate | undefined>();
  const handleMouseMove = useCallback<MouseEventHandler>(
    e => {
      const c = getCoordinate(e);
      if (c === undefined || fetcher === undefined) {
        return;
      }
      setHoveredSquare(c);
    },
    [fetcher, getCoordinate]
  );
  const handleClick = useCallback<MouseEventHandler>(
    e => {
      const c = getCoordinate(e);
      if (c === undefined || fetcher === undefined) {
        return;
      }
      fetcher.onSquareClick(c);
    },
    [fetcher, getCoordinate]
  );

  const selectedSquares = fetcher?.selectedSquares ?? [];

  return (
    <Block style={{flexShrink: 0}}>
      <Wrapper>
        <Img
          style={{width: gameCoordinates.width, height: gameCoordinates.height}}
          src={`data:image/png;base64,${serverState.screenshot.image}`}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
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
          );
        })}
        {fetcher && hoveredSquare ? (
          <SquareHighlight
            style={mapCoordinateToCssStyles(hoveredSquare)}
            color={fetcher.hoverColor}
            filled
          ></SquareHighlight>
        ) : (
          <Fragment />
        )}
        {selectedSquares.map(s => (
          <SquareHighlight
            key={formatCoordinate(s.coordinate)}
            style={mapCoordinateToCssStyles(s.coordinate)}
            color={s.color}
          >
            {s.content}
          </SquareHighlight>
        ))}
      </Wrapper>
    </Block>
  );
};
ScreenshotView.displayName = 'ScreenshotView';

const Wrapper = styled.div`
  position: relative;
`;
const Img = styled.img``;
