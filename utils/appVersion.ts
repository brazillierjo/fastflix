import Constants from 'expo-constants';

/**
 * Récupère la version de l'application depuis les constantes Expo
 * @returns La version de l'application (ex: "0.0.1")
 */
export const getAppVersion = (): string => {
  return Constants.expoConfig?.version || '0.0.1';
};

/**
 * Récupère le numéro de build de l'application
 * @returns Le numéro de build ou undefined si non disponible
 */
export const getBuildNumber = (): string | undefined => {
  return Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString();
};

/**
 * Récupère les informations complètes de version
 * @returns Un objet contenant la version et le build
 */
export const getVersionInfo = () => {
  return {
    version: getAppVersion(),
    buildNumber: getBuildNumber(),
    fullVersion: getBuildNumber() ? `${getAppVersion()} (${getBuildNumber()})` : getAppVersion(),
  };
};