import React, {Fragment, useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';

import {apiCall} from './api';

type Status = 'fetching' | 'sending' | 'idle';
type Batch = Record<string, 'yes' | 'no'>;

export const CharacterForm: React.FC = () => {
  const [status, setStatus] = useState<Status>('fetching');
  const [batch, setBatch] = useState<Batch | undefined>();

  const nextBatch = useCallback(() => {
    setStatus('fetching');
    apiCall('/all-characters')
      .then((res: string[]) => {
        setBatch(Object.fromEntries(res.map(name => [name, 'yes'])));
      })
      .catch(err => {
        alert(`Erreur lors de la récupération des images: ${String(err)}`);
        setBatch(undefined);
      })
      .finally(() => setStatus('idle'));
  }, []);

  useEffect(nextBatch, [nextBatch]);
  const handleKeyPress = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.key === 'Enter' && status === 'idle') {
        setStatus('sending');
        apiCall('/mark-character-batch', batch)
          .then(() => {
            nextBatch();
          })
          .catch(err => {
            alert(`Erreur lors du marquage: ${String(err)}`);
            setStatus('idle');
          });
      }
    },
    [batch, nextBatch, status]
  );

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <Fragment>
      {status !== 'idle' ? <Loader>{`${status.toUpperCase()}...`}</Loader> : <Fragment />}
      <Wrapper>
        {batch === undefined ? (
          <Fragment />
        ) : (
          Object.entries(batch).map(e => (
            <Img
              style={{
                borderColor: e[1] === 'yes' ? 'red' : undefined,
              }}
              key={e[0]}
              // onClick={() => console.log(e[0])}
              src={`/images/${e[0]}`}
            />
          ))
        )}
      </Wrapper>
    </Fragment>
  );
};
CharacterForm.displayName = 'CharacterForm';

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: auto;
`;

const Img = styled.img`
  height: 120px;
  border: solid 3px transparent;
  cursor: pointer;
  &:hover {
    border: solid 3px white;
  }
`;

const Loader = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  color: black;
  background-color: #ffffffaa;
`;
