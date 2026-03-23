import dotenv from 'dotenv';
dotenv.config();

import { DatabaseService } from './database/prisma.service';
import { RAGEngine } from './rag/rag-engine.service';
import { MCPServer } from './mcp/mcp-server';
import { ToolRegistry } from './mcp/tool-registry';
import { AgentManager } from './agents/agent-manager';
import { SlackBot } from './slack/slack-bot';
import { startWebhookServer } from './webhook/complaint-webhook';
import { validateConfig } from './config';
import { logger } from './utils/logger';

class GovComplaintSystem {
  private ragEngine!: RAGEngine;
  private mcpServer!: MCPServer;
  private agentManager!: AgentManager;
  private slackBot!: SlackBot;

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Government Complaint Resolution System...');

      validateConfig();

      // 1. Connect to database
      logger.info('Connecting to database...');
      await DatabaseService.connect();

      // 2. Initialize RAG Engine
      logger.info('Initializing RAG Engine...');
      this.ragEngine = new RAGEngine();
      await this.ragEngine.initialize();

      // 3. Initialize MCP Server
      logger.info('Initializing MCP Server...');
      this.mcpServer = new MCPServer(this.ragEngine);

      // 4. Initialize Agent Manager (before Slack so we can pass it to webhook)
      logger.info('Initializing Department Agent Manager...');
      this.agentManager = new AgentManager(this.mcpServer, this.ragEngine);
      await this.agentManager.initialize();

      // 5. Initialize Slack Bot
      logger.info('Initializing Slack Bot...');
      this.slackBot = new SlackBot(this.agentManager, this.ragEngine);

      // 6. Register base (non-Slack-dependent) tools
      logger.info('Registering complaint management tools...');
      this.registerBaseTools();

      // 7. Register Slack-dependent tools (need app instance)
      this.registerSlackTools();

      logger.info('✅ Government Complaint Resolution System initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize system:', error);
      throw error;
    }
  }

  private registerBaseTools(): void {
    // Memory / RAG
    this.mcpServer.registerTool(ToolRegistry.createRetrieveMemoryTool(this.ragEngine));
    this.mcpServer.registerTool(ToolRegistry.createStoreMemoryTool(this.ragEngine));

    // Complaint management
    this.mcpServer.registerTool(ToolRegistry.createSubmitComplaintTool());
    this.mcpServer.registerTool(ToolRegistry.createGetComplaintByIdTool());
    this.mcpServer.registerTool(ToolRegistry.createUpdateComplaintStatusTool());
    this.mcpServer.registerTool(ToolRegistry.createEscalateComplaintTool());
    this.mcpServer.registerTool(ToolRegistry.createRouteComplaintToDeptTool());

    // Cross-dept document/permission
    this.mcpServer.registerTool(ToolRegistry.createGetComplaintDependenciesTool());

    // Inter-agent + audit
    this.mcpServer.registerTool(ToolRegistry.createSendAgentMessageTool());
    this.mcpServer.registerTool(ToolRegistry.createLogAuditTool());

    logger.info('Base tools registered');
  }

  private registerSlackTools(): void {
    const slackApp = this.slackBot.getApp();

    // Tools that need the Slack client
    this.mcpServer.registerTool(ToolRegistry.createSendSlackMessageTool(slackApp));
    this.mcpServer.registerTool(ToolRegistry.createNotifyOfficerTool(slackApp));
    this.mcpServer.registerTool(ToolRegistry.createRequestDeptDocumentOrPermissionTool(slackApp));
    this.mcpServer.registerTool(ToolRegistry.createFulfillDocumentRequestTool(slackApp));

    logger.info('Slack-dependent tools registered');
  }

  async start(): Promise<void> {
    try {
      await this.initialize();

      // Start Slack bot
      await this.slackBot.start();

      // Start citizen portal webhook server
      startWebhookServer(this.agentManager);

      logger.info('🚀 Government Complaint Resolution System is running');
      logger.info('Active agents:', this.agentManager.getAgentNames());

    } catch (error) {
      logger.error('Failed to start system:', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Government Complaint System...');
    try {
      if (this.slackBot) await this.slackBot.stop();
      if (this.agentManager) this.agentManager.stopMessagePolling();
      await DatabaseService.disconnect();
      logger.info('✅ System shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

const app = new GovComplaintSystem();

app.start().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

process.on('SIGINT',  async () => { await app.shutdown(); process.exit(0); });
process.on('SIGTERM', async () => { await app.shutdown(); process.exit(0); });

process.on('uncaughtException', async (err) => {
  logger.error('Uncaught exception:', err);
  await app.shutdown().catch(() => {});
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  logger.error('Unhandled rejection:', reason);
  await app.shutdown().catch(() => {});
  process.exit(1);
});

export default app;
