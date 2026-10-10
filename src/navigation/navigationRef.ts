import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Navigation for code that lives outside a navigator, such as the global sheets mounted next to
 * the main stack (they can't use useNavigation).
 */
export const navigationRef = createNavigationContainerRef<any>();

export function navigateTo(name: string, params?: object) {
  if (navigationRef.isReady()) navigationRef.navigate(name, params);
}
