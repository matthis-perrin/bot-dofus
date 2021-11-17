import React, {ChangeEventHandler, Fragment, useCallback, useMemo} from 'react';
import styled from 'styled-components';

import {BLUE_GRAY_0D, ORANGE, WHITE_AA} from './colors';

const height = 20;
const width = 40;
const background = BLUE_GRAY_0D;
const untoggledColor = WHITE_AA;
const toggledColor = ORANGE;

interface ToggleProps {
  toggled: boolean;
  syncState: React.Dispatch<React.SetStateAction<boolean>> | ((toggled: boolean) => void);
  label?: string | JSX.Element;
}

export const Toggle: React.FC<ToggleProps> = ({toggled, label, syncState}) => {
  const id = useMemo(() => Math.random().toString(36).slice(2), []);

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    e => syncState(e.currentTarget.checked),
    [syncState]
  );

  return (
    <Wrapper>
      <Input
        checked={toggled}
        onChange={handleChange}
        // eslint-disable-next-line react/forbid-component-props
        id={id}
        type="checkbox"
      />
      <ToggleLabel toggled={toggled} htmlFor={id} />
      {label === undefined ? <Fragment /> : <Label htmlFor={id}>{label}</Label>}
    </Wrapper>
  );
};
Toggle.displayName = 'Toggle';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`;
const Input = styled.input`
  display: none;
`;
const ToggleLabel = styled.label<{toggled: boolean}>`
  box-sizing: border-box;
  background: ${background};
  border-radius: ${height}px;
  padding: 2px;
  transition: all 0.4s ease;
  outline: 0;
  display: block;
  width: ${width}px;
  height: ${height}px;
  position: relative;
  cursor: pointer;
  user-select: none;
  &::selection {
    background: none;
  }
  &:after,
  &:before {
    position: relative;
    display: block;
    content: '';
    width: 50%;
    height: 100%;
  }
  &:before {
    display: none;
  }
  &:after {
    left: ${p => (p.toggled ? 50 : 0)}%;
    border-radius: 50%;
    background: ${p => (p.toggled ? toggledColor : untoggledColor)};
    transition: all 0.2s ease;
  }
`;
const Label = styled.label`
  margin-left: 8px;
`;
