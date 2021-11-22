import React, {FormEventHandler, Fragment, useCallback, useState} from 'react';
import styled from 'styled-components';

import {SQUARE_SIZE} from '../../common/src/coordinates';
import {
  allFishDistance,
  allFishSize,
  allFishType,
  Fish,
  FishSize,
  FishType,
} from '../../common/src/model';
import {ORANGE} from './colors';
import {Block, Button} from './fragments';
import {Spacing} from './spacing';

interface FishFormProps {
  fish: Fish;
  canDelete: boolean;
  onSubmit: (
    type: FishType | undefined,
    size: FishSize | undefined,
    distance: number | undefined
  ) => Promise<void>;
  onCancel: () => void;
  onDelete: () => Promise<void>;
}

export const FishForm: React.FC<FishFormProps> = ({
  fish,
  canDelete,
  onSubmit,
  onCancel,
  onDelete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fishType, setFishType] = useState(fish.type);
  const [fishSize, setFishSize] = useState(fish.size);
  const [fishDistance, setFishDistance] = useState(fish.distance);

  const handleTypeChange = useCallback<FormEventHandler>(e => {
    const input = e.target as HTMLInputElement;
    setFishType(input.value as FishType);
  }, []);

  const handleSizeChange = useCallback<FormEventHandler>(e => {
    const input = e.target as HTMLInputElement;
    setFishSize(input.value as FishSize);
  }, []);

  const handleDistanceChange = useCallback<FormEventHandler>(e => {
    const input = e.target as HTMLInputElement;
    setFishDistance(parseFloat(input.value));
  }, []);

  const handleSubmit = useCallback(() => {
    setIsLoading(true);
    onSubmit(fishType, fishSize, fishDistance)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [fishDistance, fishSize, fishType, onSubmit]);
  const handleCancel = useCallback(() => onCancel(), [onCancel]);
  const handleDelete = useCallback(async () => onDelete(), [onDelete]);

  return (
    <Wrapper>
      <Line onChange={handleTypeChange}>
        <Title>Type</Title>
        <Spacing width={8} />
        {allFishType.map(t => (
          <Fragment key={t}>
            <Spacing width={8} />
            <RadioGroup>
              <Radio
                type="radio"
                // eslint-disable-next-line react/forbid-component-props
                id={t}
                name="fist-type"
                value={t}
                checked={fishType === t}
              />
              <Spacing width={4} />
              <label htmlFor={t}>{t}</label>
            </RadioGroup>
          </Fragment>
        ))}
      </Line>
      <Spacing height={16} />
      <Line onChange={handleSizeChange}>
        <Title>Taille</Title>
        <Spacing width={8} />
        {allFishSize.map(t => (
          <Fragment key={t}>
            <Spacing width={8} />
            <RadioGroup>
              <Radio
                type="radio"
                // eslint-disable-next-line react/forbid-component-props
                id={t}
                name="fist-size"
                value={t}
                checked={fishSize === t}
              />
              <Spacing width={4} />
              <label htmlFor={t}>{t}</label>
            </RadioGroup>
          </Fragment>
        ))}
      </Line>
      <Spacing height={16} />
      <Line onChange={handleDistanceChange}>
        <Title>Distance</Title>
        <Spacing width={8} />
        {allFishDistance.map(t => (
          <Fragment key={t}>
            <Spacing width={8} />
            <RadioGroup>
              <Radio
                type="radio"
                // eslint-disable-next-line react/forbid-component-props
                id={String(t)}
                name="fist-distance"
                value={t}
                checked={fishDistance === t}
              />
              <Spacing width={4} />
              <label htmlFor={String(t)}>{t}</label>
            </RadioGroup>
          </Fragment>
        ))}
      </Line>
      <Spacing height={32} />
      <Buttons>
        <span>
          <Button onClick={handleSubmit} disabled={isLoading}>
            Valider
          </Button>
          {canDelete ? (
            <Button onClick={handleDelete} disabled={isLoading}>
              Supprimer
            </Button>
          ) : (
            <Fragment />
          )}
        </span>
        <Button onClick={handleCancel} disabled={isLoading}>
          Annuler
        </Button>
      </Buttons>
    </Wrapper>
  );
};
FishForm.displayName = 'FishForm';

const width = 384;
const height = 128;

const Wrapper = styled(Block)`
  position: absolute;
  top: ${SQUARE_SIZE.height / 2}px;
  /* left: -${(width - SQUARE_SIZE.width / 2) / 2}px; */
  left: 0;
  width: ${width}px;
  height: ${height}px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  pointer-events: all;
  z-index: 1000;
`;

const Title = styled.div`
  color: ${ORANGE};
`;
const Line = styled.div`
  display: flex;
  align-items: center;
  * {
    line-height: 100%;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  align-items: center;
`;

const Radio = styled.input`
  margin: 0;
`;

const Buttons = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
