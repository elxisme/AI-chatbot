import OpenAI from "openai";
import { Message } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR 
});

export interface NigerianLegalAssistant {
  createAssistant(): Promise<string>;
  sendMessage(assistantId: string, threadId: string | null, message: string, files?: string[]): Promise<{
    response: string;
    threadId: string;
  }>;
  analyzeDocument(fileContent: string, fileName: string): Promise<string>;
}

export class OpenAIService implements NigerianLegalAssistant {
  private assistantId: string | null = null;

  async createAssistant(): Promise<string> {
    if (this.assistantId) return this.assistantId;

    const assistant = await openai.beta.assistants.create({
      name: "Nigerian Legal AI Assistant",
      instructions: `You are a specialized Nigerian Legal AI Assistant with deep expertise in Nigerian law, legal system, and jurisprudence.

Key areas of expertise:
- Nigerian Constitution and constitutional law
- Corporate law and business regulations in Nigeria
- Contract law under Nigerian jurisdiction
- Criminal law and procedure in Nigeria
- Civil procedure and litigation
- Property law and Land Use Act
- Employment and labor law
- Tax law and regulations
- Banking and finance law
- Oil and gas law
- Immigration law
- Family law under Nigerian customary and statutory law

Always provide responses that are:
- Specific to Nigerian legal context
- Professional and accurate
- Practical and actionable
- Cite relevant Nigerian statutes, cases, or regulations when applicable
- Include disclaimers about seeking qualified legal counsel for specific cases

Format your responses in clear, structured manner with appropriate headings and bullet points when helpful.

IMPORTANT: Always include a disclaimer that this AI provides general legal information and users should consult with qualified Nigerian legal counsel for specific legal matters.`,
      model: "gpt-4o",
      tools: [{ type: "file_search" }]
    });

    this.assistantId = assistant.id;
    return assistant.id;
  }

  async sendMessage(assistantId: string, threadId: string | null, message: string, files?: string[]): Promise<{
    response: string;
    threadId: string;
  }> {
    let thread;
    
    if (threadId) {
      thread = await openai.beta.threads.retrieve(threadId);
    } else {
      thread = await openai.beta.threads.create();
    }

    // Add message to thread
    let messageContent: any = { role: "user", content: message };
    
    if (files && files.length > 0) {
      messageContent.attachments = files.map(fileId => ({
        file_id: fileId,
        tools: [{ type: "file_search" }]
      }));
    }

    await openai.beta.threads.messages.create(thread.id, messageContent);

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });

    // Wait for completion
    // @ts-ignore - OpenAI API type definition mismatch
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // @ts-ignore - OpenAI API type definition mismatch
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === 'failed') {
      throw new Error(`Assistant run failed: ${runStatus.last_error?.message}`);
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];
    
    if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
      return {
        response: lastMessage.content[0].text.value,
        threadId: thread.id
      };
    }

    throw new Error('No valid response from assistant');
  }

  async analyzeDocument(fileContent: string, fileName: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Nigerian Legal AI Assistant. Analyze the provided document for compliance with Nigerian law, identify potential legal issues, and provide actionable recommendations."
        },
        {
          role: "user",
          content: `Please analyze this legal document: "${fileName}"\n\nDocument content:\n${fileContent}\n\nProvide a comprehensive analysis focusing on Nigerian legal compliance, potential issues, and recommendations.`
        }
      ],
      max_tokens: 2000
    });

    return response.choices[0].message.content || "Unable to analyze document";
  }

  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    const file = await openai.files.create({
      file: new File([fileBuffer], fileName),
      purpose: 'assistants'
    });

    return file.id;
  }
}

export const openaiService = new OpenAIService();
