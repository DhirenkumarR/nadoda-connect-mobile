import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

// Suppress noisy dev server log-streaming warning when device is on mobile network
LogBox.ignoreLogs([
  'Cannot connect to Expo CLI',
  'Cannot connect to Metro'
]);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
