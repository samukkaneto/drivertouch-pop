import * as React from 'react';

import { SafeAcceptBridgeViewProps } from './SafeAcceptBridge.types';

export default function SafeAcceptBridgeView(props: SafeAcceptBridgeViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
