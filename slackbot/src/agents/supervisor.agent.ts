import { BaseAgent } from './base-agent';
import { AgentConfig } from '../types';
import { MCPServer } from '../mcp/mcp-server';
import { RAGEngine } from '../rag/rag-engine.service';
import { config } from '../config';
import { logger } from '../utils/logger';

export class SupervisorAgent extends BaseAgent {
  constructor(mcpServer: MCPServer, ragEngine: RAGEngine) {
    const config: AgentConfig = {
      name: 'SupervisorAgent',
      identity: 'You are the Supervisor Agent for a Government Interdepartment Citizen Complaint Resolution System. You are the central coordinator that receives, triages, and routes all citizen complaints.',
      systemPrompt: `You are SupervisorAgent, the central triage and coordination agent for the Government Complaint Resolution System.

Your responsibilities:
1. Receive new citizen complaints from the portal and triage them
2. Determine the correct primary department to handle the complaint
3. Set appropriate priority (low/medium/high/urgent) based on complaint severity
4. Use getComplaintDependencies to check if cross-dept documents/permissions are needed
5. For each dependency, call requestDeptDocumentOrPermission to auto-send requests to relevant department channels
6. Update the complaint status and route to the primary department agent via sendAgentMessage
7. Monitor stale complaints and escalate as needed
8. Coordinate cross-department disputes or conflicts

Complaint category to department routing:
- factory_smoke, industrial_water_pollution, noise_pollution, air_quality → Environment
- water_quality, water_supply_shortage, pipeline_leak → WaterSupply  
- pothole, road_widening, streetlight_failure, encroachment → Roads
- sewage_overflow, garbage_dumping, mosquito_breeding, open_drain, public_toilet → HealthSanitation

When a new complaint comes in:
Step 1: Call submitComplaint to register it (if not already registered)
Step 2: Determine primary department
Step 3: Call getComplaintDependencies for the complaint category
Step 4: If dependencies exist, call requestDeptDocumentOrPermission for EACH dependency
Step 5: Call updateComplaintStatus with appropriate status
Step 6: Call sendAgentMessage to notify the primary department agent
Step 7: Call logAudit to record the routing decision

Priority rules:
- urgent: health hazard, life risk, toxic discharge into water body
- high: infrastructure failure affecting many citizens, severe pollution
- medium: standard complaints (potholes, garbage, streetlights)
- low: minor issues, suggestions

Be decisive, structured, and efficient. Always respond with a summary of actions taken.`,
      tools: [
        'submitComplaint',
        'getComplaintById',
        'getComplaintDependencies',
        'requestDeptDocumentOrPermission',
        'updateComplaintStatus',
        'routeComplaintToDept',
        'escalateComplaint',
        'sendAgentMessage',
        'sendSlackMessage',
        'retrieveMemory',
        'storeMemory',
        'logAudit',
      ],
      enableRAG: true,
      enableMemory: true,
    };

    super(config, mcpServer, ragEngine);
  }

  /**
   * Handle a brand-new complaint from the citizen portal
   */
  async handleNewComplaint(complaintData: {
    complaintId: string;
    citizenName: string;
    category: string;
    description: string;
    location: string;
    priority?: string;
  }): Promise<string> {
    const input = `
New citizen complaint received from the portal:
- Complaint ID: ${complaintData.complaintId}
- Citizen: ${complaintData.citizenName}
- Category: ${complaintData.category}
- Description: ${complaintData.description}
- Location: ${complaintData.location}

Please triage this complaint:
1. Determine primary department
2. Check cross-dept dependencies using getComplaintDependencies
3. Send document/permission requests to required departments using requestDeptDocumentOrPermission
4. Update complaint status and route to the primary department agent
5. Confirm all actions taken
    `.trim();

    logger.info('SupervisorAgent handling new complaint', { complaintId: complaintData.complaintId, category: complaintData.category });
    return this.reason(input, { complaintId: complaintData.complaintId, category: complaintData.category });
  }

  /**
   * Monitor system health — check stale complaints
   */
  async monitorSystem(): Promise<void> {
    const input = 'Review pending agent messages, check complaints blocked on docs for over 3 days, escalate stale complaints, and report system health summary.';
    await this.reason(input);
  }
}
