import Constants from 'expo-constants';

/**
 * Récupère la version de l'application depuis les constantes Expo
 * @returns La version de l'application (ex: "0.0.1")
 */
export const getAppVersion = (): string => {
  return Constants.expoConfig?.version || '0.0.1';
};

