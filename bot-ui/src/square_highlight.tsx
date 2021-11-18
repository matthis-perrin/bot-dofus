import React, {CSSProperties, FC} from 'react';
import styled from 'styled-components';

import {SQUARE_SIZE} from '../../common/src/model';

interface SquareProps {
  color: string;
  filled?: boolean;
  style?: CSSProperties;
  children?: JSX.Element;
}

export const SquareHighlight: FC<SquareProps> = ({color, filled, style, children}) => {
  const w = SQUARE_SIZE.width;
  const h = SQUARE_SIZE.height;
  return (
    <Wrapper style={style}>
      <Svg viewBox={`0 0 ${w} ${h}`}>
        {/* left, top, right, bottom */}
        <path
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={4}
          d={`
            M 0 ${h / 2}
            L ${w / 2} 0
            L ${w} ${h / 2}
            L ${w / 2} ${h}
            L 0 ${h / 2}
          `}
        />
      </Svg>
      {children}
    </Wrapper>
  );
};
SquareHighlight.displayName = 'SquareHighlight';

const Wrapper = styled.div`
  position: relative;
  width: ${SQUARE_SIZE.width / 2}px;
  height: ${SQUARE_SIZE.height / 2}px;
  pointer-events: none;
`;

const Svg = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
`;
