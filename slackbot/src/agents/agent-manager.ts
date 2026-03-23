import { BaseAgent } from './base-agent';
import { SupervisorAgent } from './supervisor.agent';
import { EnvironmentAgent } from './environment-dept.agent';
import { WaterSupplyAgent } from './water-supply.agent';
import { RoadsInfraAgent } from './roads-infra.agent';
import { HealthSanitationAgent } from './health-sanitation.agent';
import { MCPServer } from '../mcp/mcp-server';
import { RAGEngine } from '../rag/rag-engine.service';
import { prisma } from '../database/prisma.service';
import { logger } from '../utils/logger';

export class AgentManager {
  private agents: Map<string, BaseAgent> = new Map();
  private mcpServer: MCPServer;
  private ragEngine: RAGEngine;
  private messagePollingInterval?: NodeJS.Timeout;

  constructor(mcpServer: MCPServer, ragEngine: RAGEngine) {
    this.mcpServer = mcpServer;
    this.ragEngine = ragEngine;
  }

  /**
   * Initialize all government department agents
   */
  async initialize(): Promise<void> {
    const supervisor      = new SupervisorAgent(this.mcpServer, this.ragEngine);
    const environment     = new EnvironmentAgent(this.mcpServer, this.ragEngine);
    const waterSupply     = new WaterSupplyAgent(this.mcpServer, this.ragEngine);
    const roadsInfra      = new RoadsInfraAgent(this.mcpServer, this.ragEngine);
    const healthSanitation = new HealthSanitationAgent(this.mcpServer, this.ragEngine);

    this.agents.set(supervisor.getName(),       supervisor);
    this.agents.set(environment.getName(),      environment);
    this.agents.set(waterSupply.getName(),      waterSupply);
    this.agents.set(roadsInfra.getName(),       roadsInfra);
    this.agents.set(healthSanitation.getName(), healthSanitation);

    logger.info('All government department agents initialized', {
      agents: Array.from(this.agents.keys()),
    });

    this.startMessagePolling();
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getSupervisor(): SupervisorAgent | undefined {
    return this.agents.get('SupervisorAgent') as SupervisorAgent;
  }

  /**
   * Route message to a specific agent
   */
  async routeMessage(agentName: string, input: string, context?: Record<string, any>): Promise<string> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }
    return agent.reason(input, context);
  }

  /**
   * Poll for pending agent messages and route them
   */
  private startMessagePolling(): void {
    logger.info('Starting agent message polling');

    this.messagePollingInterval = setInterval(async () => {
      try {
        await this.processPendingMessages();
      } catch (error) {
        logger.error('Error processing pending messages:', error);
      }
    }, 5000);
  }

  private async processPendingMessages(): Promise<void> {
    const pendingMessages = await prisma.agentMessage.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    if (pendingMessages.length === 0) return;

    logger.info(`Processing ${pendingMessages.length} pending agent messages`);

    for (const message of pendingMessages) {
      try {
        await prisma.agentMessage.update({
          where: { id: message.id },
          data: { status: 'processing' },
        });

        const agent = this.agents.get(message.toAgent);
        if (!agent) {
          logger.error(`Target agent not found: ${message.toAgent}`);
          await prisma.agentMessage.update({
            where: { id: message.id },
            data: { status: 'failed', errorMessage: `Agent not found: ${message.toAgent}` },
          });
          continue;
        }

        const result = await agent.processAgentMessage({
          from: message.fromAgent,
          intent: message.intent,
          payload: message.payload as Record<string, any>,
        });

        await prisma.agentMessage.update({
          where: { id: message.id },
          data: { status: 'processed', processedAt: new Date(), result: { response: result } },
        });

        logger.info('Agent message processed', {
          messageId: message.id,
          from: message.fromAgent,
          to: message.toAgent,
        });

      } catch (error: any) {
        logger.error(`Failed to process agent message ${message.id}:`, error);
        await prisma.agentMessage.update({
          where: { id: message.id },
          data: { status: 'failed', errorMessage: error.message },
        });
      }
    }
  }

  stopMessagePolling(): void {
    if (this.messagePollingInterval) {
      clearInterval(this.messagePollingInterval);
      logger.info('Agent message polling stopped');
    }
  }

  getAgentNames(): string[] {
    return Array.from(this.agents.keys());
  }
}
