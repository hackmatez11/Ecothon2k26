import { Department, ComplaintDependencyMap } from '../types';

export interface Config {
  slack: {
    botToken: string;
    signingSecret: string;
    appToken: string;
  };
  huggingface: {
    apiKey: string;
    llmModel: string;
    embeddingModel: string;
  };
  database: {
    url: string;
  };
  pinecone: {
    apiKey: string;
    index: string;
  };
  security: {
    encryptionKey: string;
  };
  app: {
    nodeEnv: string;
    logLevel: string;
    webhookPort: number;
  };
  // Department → Slack channel ID mapping
  departmentChannels: Record<Department, string>;
  // Complaint category → cross-dept document/permission dependencies
  complaintDependencies: ComplaintDependencyMap;
}

export const config: Config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || process.env.HUGGING_FACE_TOKEN || '',
    llmModel: process.env.HF_LLM_MODEL || 'google/flan-t5-base',
    embeddingModel: process.env.HF_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    index: process.env.PINECONE_INDEX || 'gov-complaint-memory',
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-replace',
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    webhookPort: parseInt(process.env.WEBHOOK_PORT || '4000', 10),
  },

  // --- Department Channel Mapping ---
  departmentChannels: {
    Environment:      process.env.SLACK_CHANNEL_ENVIRONMENT       || 'C_ENV_CHANNEL',
    WaterSupply:      process.env.SLACK_CHANNEL_WATER_SUPPLY      || 'C_WATER_CHANNEL',
    Roads:            process.env.SLACK_CHANNEL_ROADS             || 'C_ROADS_CHANNEL',
    HealthSanitation: process.env.SLACK_CHANNEL_HEALTH_SANITATION || 'C_HEALTH_CHANNEL',
    Supervisor:       process.env.SLACK_CHANNEL_SUPERVISOR        || 'C_SUPERVISOR_CHANNEL',
  },

  // --- Complaint Dependency Map ---
  complaintDependencies: {
    factory_smoke: [
      { fromDept: 'Environment', toDept: 'WaterSupply',       documentNeeded: 'River/water body pollution data near the site', deadlineDays: 3 },
      { fromDept: 'Environment', toDept: 'HealthSanitation',  documentNeeded: 'Public health impact report for the area',      deadlineDays: 3 },
    ],
    industrial_water_pollution: [
      { fromDept: 'Environment', toDept: 'HealthSanitation',  documentNeeded: 'Water sample lab test report',                  deadlineDays: 2 },
      { fromDept: 'Environment', toDept: 'Roads',             documentNeeded: 'Access route permission to inspection site',    deadlineDays: 1 },
    ],
    sewage_overflow: [
      { fromDept: 'HealthSanitation', toDept: 'WaterSupply',  documentNeeded: 'Pipeline/sewer map for the affected zone',     deadlineDays: 2 },
      { fromDept: 'HealthSanitation', toDept: 'Roads',        documentNeeded: 'Road access permission for maintenance crew',   deadlineDays: 1 },
    ],
    road_widening: [
      { fromDept: 'Roads', toDept: 'Environment',             documentNeeded: 'Environmental NOC for road expansion project',  deadlineDays: 5 },
      { fromDept: 'Roads', toDept: 'WaterSupply',             documentNeeded: 'Pipeline relocation approval and timeline',      deadlineDays: 4 },
    ],
    pothole: [],
    streetlight_failure: [],
    garbage_dumping: [
      { fromDept: 'HealthSanitation', toDept: 'Roads',        documentNeeded: 'Clearance for garbage vehicle access route',   deadlineDays: 1 },
    ],
    water_supply_shortage: [],
    water_quality: [
      { fromDept: 'WaterSupply', toDept: 'HealthSanitation',  documentNeeded: 'Water quality lab test results',               deadlineDays: 2 },
    ],
    mosquito_breeding: [
      { fromDept: 'HealthSanitation', toDept: 'WaterSupply',  documentNeeded: 'Stagnant water source identification report',  deadlineDays: 2 },
    ],
    noise_pollution: [
      { fromDept: 'Environment', toDept: 'Roads',             documentNeeded: 'Traffic or construction permit details',        deadlineDays: 2 },
    ],
    open_drain: [
      { fromDept: 'HealthSanitation', toDept: 'WaterSupply',  documentNeeded: 'Drainage map and maintenance schedule',        deadlineDays: 3 },
      { fromDept: 'HealthSanitation', toDept: 'Roads',        documentNeeded: 'Site access permission for repair crew',       deadlineDays: 1 },
    ],
    encroachment: [
      { fromDept: 'Roads', toDept: 'Environment',             documentNeeded: 'Land use clearance report',                    deadlineDays: 4 },
    ],
  },
};

export function validateConfig(): void {
  const missing: string[] = [];

  if (!config.slack.botToken) missing.push('SLACK_BOT_TOKEN');
  if (!config.slack.signingSecret) missing.push('SLACK_SIGNING_SECRET');
  if (!config.slack.appToken) missing.push('SLACK_APP_TOKEN');
  if (!config.huggingface.apiKey) missing.push('HUGGINGFACE_API_KEY / HUGGING_FACE_TOKEN');
  if (!config.database.url) missing.push('DATABASE_URL');
  if (!config.pinecone.apiKey) missing.push('PINECONE_API_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
}
