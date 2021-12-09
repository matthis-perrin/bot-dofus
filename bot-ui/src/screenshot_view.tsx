import React, {Fragment, MouseEvent, MouseEventHandler, useCallback, useState} from 'react';
import styled from 'styled-components';

import {
  Coordinate,
  GAME_HEIGHT,
  GAME_WIDTH,
  HORIZONTAL_SQUARES,
  imageCoordinateToMapCoordinate,
  mapCoordinateToImageCoordinate,
  VERTICAL_SQUARES,
} from '../../common/src/coordinates';
import {formatCoordinate} from './format';
import {Block} from './fragments';
import {SquareHighlight} from './square_highlight';
import {useServerState, useSquareFetching, useSquareOverlay} from './stores';

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
  const {fishFetcher, soleilFetcher} = useSquareFetching();
  const {overlay} = useSquareOverlay();

  const fetcher = fishFetcher ?? soleilFetcher;
  const soleils = serverState.soleil;

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
  const overlaySquares = overlay ?? [];

  return (
    <Block style={{flexShrink: 0}}>
      <Wrapper>
        <Img
          style={{width: GAME_WIDTH, height: GAME_HEIGHT}}
          src={`data:image/png;base64,${serverState.screenshot}`}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
        />
        {soleils.map(s => {
          const pixelCoordinates = mapCoordinateToImageCoordinate({
            x: s.coordinate.x,
            y: s.coordinate.y,
          });
          return (
            <SquareHighlight
              key={`${s.coordinate.x},${s.coordinate.y}`}
              style={{position: 'absolute', left: pixelCoordinates.x, top: pixelCoordinates.y}}
              borderColor="red"
            ></SquareHighlight>
          );
        })}
        {fetcher && hoveredSquare ? (
          <SquareHighlight
            style={mapCoordinateToCssStyles(hoveredSquare)}
            fillColor={fetcher.hoverColor}
          ></SquareHighlight>
        ) : (
          <Fragment />
        )}
        {selectedSquares.map(s => (
          <SquareHighlight
            key={formatCoordinate(s.coordinate)}
            style={mapCoordinateToCssStyles(s.coordinate)}
            borderColor={s.borderColor}
            fillColor={s.fillColor}
          >
            {s.content}
          </SquareHighlight>
        ))}
        {overlaySquares.map(s => (
          <SquareHighlight
            key={formatCoordinate(s.coordinate)}
            style={mapCoordinateToCssStyles(s.coordinate)}
            fillColor={s.color}
          ></SquareHighlight>
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
