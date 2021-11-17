import React, {FC} from 'react';

export const Spacing: FC<{height?: number; width?: number}> = ({
  width = '100%',
  height = '100%',
}) => <div style={{width, height}} />;
Spacing.displayName = 'Spacing';
