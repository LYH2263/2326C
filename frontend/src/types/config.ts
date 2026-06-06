export interface FeatureFlags {
  enableRegistration: boolean;
  enableExperiments: boolean;
  enableHealthRecords: boolean;
  enableFeedingRecords: boolean;
}

export interface PublicConfig {
  appTitle: string;
  featureFlags: FeatureFlags;
  maintenanceMode: boolean;
  announcement: string;
  env: string;
}
