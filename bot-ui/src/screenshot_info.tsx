import React from 'react';

import {useServerState} from './events';

export const ScreenshotInfo: React.FC = () => {
  const serverState = useServerState();
  return (
    <div>
      <div>{`Coordonnées : ${serverState.coordinate.label} (${serverState.coordinate.score})`}</div>
      <div>{`Soleils : `}</div>
      <table>
        <tr>
          <th>x</th>
          <th>y</th>
          <th>label</th>
          <th>score</th>
        </tr>
        {serverState.soleil.map(s => (
          <tr key={`${s.x},${s.y}`}>
            <td>{s.x}</td>
            <td>{s.y}</td>
            <td>{s.label}</td>
            <td>{s.score}</td>
          </tr>
        ))}
      </table>
    </div>
  );
};
ScreenshotInfo.displayName = 'ScreenshotInfo';

// const Img = styled.img``;
