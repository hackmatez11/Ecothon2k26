import { HfInference } from '@huggingface/inference';
import { AgentConfig, ReasoningStep, RAGContext } from '../types';
import { MCPServer } from '../mcp/mcp-server';
import { RAGEngine } from '../rag/rag-engine.service';
import { logger } from '../utils/logger';
import { AuditService } from '../database/audit.service';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || process.env.HUGGING_FACE_TOKEN);

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected mcpServer: MCPServer;
  protected ragEngine: RAGEngine;
  private conversationHistory: string[] = [];

  constructor(
    config: AgentConfig,
    mcpServer: MCPServer,
    ragEngine: RAGEngine
  ) {
    this.config = config;
    this.mcpServer = mcpServer;
    this.ragEngine = ragEngine;
  }

  /**
   * Main reasoning loop using Thought/Action/Tool/Observation pattern
   */
  async reason(input: string, context?: Record<string, any>): Promise<string> {
    logger.info(`${this.config.name} starting reasoning`, { input: input.substring(0, 100) });

    try {
      // Step 1: Retrieve RAG context if enabled
      let ragContext: RAGContext | undefined;
      if (this.config.enableRAG) {
        ragContext = await this.ragEngine.buildContext(input, {
          limit: 5,
          minSimilarity: 0.7,
        });
      }

      // Step 2: Build enhanced system prompt with context
      const systemPrompt = this.buildSystemPrompt(ragContext, context);

      // Step 3: Reasoning loop
      let maxIterations = 5;
      let iteration = 0;
      let finalResponse = '';
      const reasoningSteps: ReasoningStep[] = [];

      while (iteration < maxIterations) {
        iteration++;
        logger.info(`${this.config.name} iteration ${iteration}`);

        // Get LLM response
        const llmResponse = await this.callLLM(systemPrompt, input, reasoningSteps);

        // Parse reasoning step
        const step = this.parseReasoningStep(llmResponse);
        reasoningSteps.push(step);

        logger.info(`${this.config.name} - Thought: ${step.thought}`);
        logger.info(`${this.config.name} - Action: ${step.action}`);

        // Execute action based on reasoning
        if (step.action === 'respond') {
          finalResponse = step.observation || llmResponse.replace(/Thought:.*|Action:.*|Tool:.*|ToolInput:.*|Observation:.*/gs, '').trim() || llmResponse;
          break;
        } else if (step.action === 'tool_call' && step.tool && step.toolInput) {
          // Execute tool
          try {
            const toolResult = await this.mcpServer.executeTool(step.tool, step.toolInput);
            step.observation = JSON.stringify(toolResult);
            logger.info(`${this.config.name} - Tool result: ${step.observation.substring(0, 200)}`);
          } catch (error: any) {
            step.observation = `Tool execution failed: ${error.message}`;
            logger.error(`${this.config.name} - Tool error:`, error);
          }
        } else if (step.action === 'delegate') {
          // Delegate to another agent via MCP
          if (step.toolInput) {
            await this.mcpServer.executeTool('sendAgentMessage', {
              ...step.toolInput,
              from: this.config.name,
            });
            step.observation = 'Message sent to another agent';
          }
        } else if (step.action === 'wait') {
          // Wait for more information
          finalResponse = step.observation || 'I need more information to proceed.';
          break;
        }

        // Safety check
        if (iteration >= maxIterations) {
          finalResponse = 'I\'ve reached my reasoning limit. Let me summarize what I found.';
        }
      }

      // Step 4: Store interaction in memory if enabled
      if (this.config.enableMemory) {
        await this.ragEngine.storeMemory({
          content: `${this.config.name} processed: ${input} -> ${finalResponse}`,
          source: 'agent_message',
          metadata: {
            agentName: this.config.identity,
            iterations: iteration,
          },
        });
      }

      // Step 5: Audit log
      await AuditService.logAudit({
        agentName: this.config.name,
        action: 'reasoning_completed',
        details: {
          input: input.substring(0, 200),
          iterations: iteration,
          steps: reasoningSteps.length,
        },
      });

      logger.info(`${this.config.name} reasoning completed`, { iterations: iteration });
      return finalResponse;

    } catch (error) {
      logger.error(`${this.config.name} reasoning failed:`, error);
      throw error;
    }
  }

  /**
   * Build enhanced system prompt with RAG context
   */
  private buildSystemPrompt(ragContext?: RAGContext, context?: Record<string, any>): string {
    let prompt = `${this.config.identity}\n\n${this.config.systemPrompt}`;

    // Add RAG context
    if (ragContext) {
      prompt += `\n\n${ragContext.contextString}`;
    }

    // Add additional context
    if (context) {
      prompt += `\n\nAdditional context: ${JSON.stringify(context)}`;
    }

    // Add available tools
    const toolDefinitions = this.mcpServer.getToolDefinitions(this.config.tools);
    if (toolDefinitions.length > 0) {
      prompt += `\n\nAvailable tools:\n${JSON.stringify(toolDefinitions, null, 2)}`;
    }

    // Add reasoning instructions
    prompt += `\n\nYou must reason following this pattern:
Thought: [Your internal reasoning]
Action: [Choose one: tool_call, respond, delegate, wait]
Tool: [If action is tool_call, specify the tool name]
ToolInput: [If action is tool_call, provide valid JSON]
Observation: [Note the result]

When ready to finish, use Action: respond.`;

    return prompt;
  }

  /**
   * Call Hugging Face LLM via chat completion (instruct models).
   * Default: Qwen/Qwen2.5-7B-Instruct — confirmed chat-completion compatible on HF router.
   * Override via HF_LLM_MODEL env var. Must be a chat/instruct model.
   */
  private async callLLM(
    systemPrompt: string,
    userInput: string,
    previousSteps: ReasoningStep[]
  ): Promise<string> {
    const model = process.env.HF_LLM_MODEL || 'Qwen/Qwen2.5-7B-Instruct';

    let userMessage = `${userInput}\n\n`;
    if (previousSteps.length > 0) {
      const stepsText = previousSteps.map(s =>
        `Thought: ${s.thought}\nAction: ${s.action}\n${s.tool ? `Tool: ${s.tool}\n` : ''}${s.observation ? `Observation: ${s.observation}\n` : ''}`
      ).join('\n');
      userMessage += `Previous steps:\n${stepsText}\n\nNext Step:`;
    } else {
      userMessage += `Reasoning Start:`;
    }

    const result = await hf.chatCompletion({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 512,
      temperature: 0.1,
    });

    return result.choices[0]?.message?.content ?? '';
  }

  /**
   * Parse response into reasoning step
   */
  private parseReasoningStep(response: string): ReasoningStep {
    // Attempt to extract fields from the text response
    const thoughtMatch = response.match(/Thought:\s*(.+?)(?=\n|Action:|$)/is);
    const actionMatch = response.match(/Action:\s*(.+?)(?=\n|Tool:|$)/i);
    const toolMatch = response.match(/Tool:\s*(.+?)(?=\n|ToolInput:|$)/i);
    const toolInputMatch = response.match(/ToolInput:\s*(\{[\s\S]*?\})\s*(?=\n|Observation:|$)/is);
    const observationMatch = response.match(/Observation:\s*(.+?)(?=\n|$)/is);

    const step: ReasoningStep = {
      thought: thoughtMatch?.[1]?.trim() || 'Analyzing...',
      action: this.parseAction(actionMatch?.[1]?.trim() || 'respond'),
    };

    if (step.action === 'tool_call') {
      step.tool = toolMatch?.[1]?.trim();
      if (toolInputMatch) {
        try {
          step.toolInput = JSON.parse(toolInputMatch[1].trim());
        } catch (error) {
          logger.error('Failed to parse tool input JSON:', toolInputMatch[1]);
        }
      }
    }

    if (observationMatch) {
      step.observation = observationMatch[1]?.trim();
    }

    return step;
  }

  private parseAction(actionStr: string): 'tool_call' | 'respond' | 'delegate' | 'wait' {
    const normalized = actionStr.toLowerCase();
    if (normalized.includes('tool')) return 'tool_call';
    if (normalized.includes('delegate')) return 'delegate';
    if (normalized.includes('wait')) return 'wait';
    return 'respond';
  }

  async processAgentMessage(message: { from: string; intent: string; payload: Record<string, any> }): Promise<any> {
    logger.info(`${this.config.name} received message from ${message.from}`, { intent: message.intent });
    const input = `Agent ${message.from} sent a message. Intent: ${message.intent}. Payload: ${JSON.stringify(message.payload)}`;
    return this.reason(input, { fromAgent: message.from, intent: message.intent });
  }

  protected addToHistory(message: string): void {
    this.conversationHistory.push(message);
    if (this.conversationHistory.length > 10) this.conversationHistory.shift();
  }

  getName(): string { return this.config.name; }
}
