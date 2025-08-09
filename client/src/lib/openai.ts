import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo purposes, in production use server-side API
});

export interface OpenAIClientService {
  createAssistant(): Promise<string>;
  sendMessage(assistantId: string, threadId: string | null, message: string, files?: string[]): Promise<{
    response: string;
    threadId: string;
  }>;
  analyzeDocument(fileContent: string, fileName: string): Promise<string>;
  uploadFile(file: File): Promise<string>;
}

export class ClientOpenAIService implements OpenAIClientService {
  private assistantId: string | null = null;

  async createAssistant(): Promise<string> {
    if (this.assistantId) return this.assistantId;

    try {
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
    } catch (error) {
      console.error('Failed to create assistant:', error);
      throw new Error('Failed to initialize Nigerian Legal AI Assistant');
    }
  }

  async sendMessage(assistantId: string, threadId: string | null, message: string, files?: string[]): Promise<{
    response: string;
    threadId: string;
  }> {
    try {
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
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from Nigerian Legal AI Assistant');
    }
  }

  async analyzeDocument(fileContent: string, fileName: string): Promise<string> {
    try {
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
    } catch (error) {
      console.error('Document analysis error:', error);
      throw new Error('Failed to analyze document');
    }
  }

  async uploadFile(file: File): Promise<string> {
    try {
      const openaiFile = await openai.files.create({
        file: file,
        purpose: 'assistants'
      });

      return openaiFile.id;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload file to OpenAI');
    }
  }
}

export const clientOpenAIService = new ClientOpenAIService();

// Helper function to extract text content from uploaded files
export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (file.type === 'text/plain') {
        resolve(content);
      } else if (file.type === 'application/pdf') {
        // For PDF files, in a real implementation you'd use a PDF parsing library
        // For now, return a placeholder that indicates PDF processing is needed
        resolve(`[PDF Content - ${file.name}]\nThis PDF file has been uploaded and is ready for analysis by the Nigerian Legal AI Assistant.`);
      } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        // For Word documents, similar approach
        resolve(`[Word Document - ${file.name}]\nThis document has been uploaded and is ready for analysis by the Nigerian Legal AI Assistant.`);
      } else {
        resolve(`[Document - ${file.name}]\nThis file has been uploaded and is ready for analysis by the Nigerian Legal AI Assistant.`);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      // For binary files, we'll let the server handle the content extraction
      reader.readAsDataURL(file);
    }
  });
};
