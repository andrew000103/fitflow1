export const foodApiEnv = {
  mfdsApiKey: process.env.EXPO_PUBLIC_MFDS_API_KEY?.trim() || '',
  usdaApiKey: process.env.EXPO_PUBLIC_USDA_API_KEY?.trim() || '',
};

export function hasMfdsApiKey() {
  return foodApiEnv.mfdsApiKey.length > 0;
}

export function hasUsdaApiKey() {
  return foodApiEnv.usdaApiKey.length > 0;
}
