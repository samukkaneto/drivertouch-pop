import { requireNativeView } from 'expo';
import * as React from 'react';

import { SafeAcceptBridgeViewProps } from './SafeAcceptBridge.types';

const NativeView: React.ComponentType<SafeAcceptBridgeViewProps> =
  requireNativeView('SafeAcceptBridge');

export default function SafeAcceptBridgeView(props: SafeAcceptBridgeViewProps) {
  return <NativeView {...props} />;
}
