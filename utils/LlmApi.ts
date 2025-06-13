// utils/llmApi.ts - Real LLM API Service (No Mocks)

export interface LLMSettings {
  action_model_type: string;
  action_ollama_endpoint: string;
  action_ollama_model: string;
  embedding_model_type: string;
  embedding_ollama_endpoint: string;
  embedding_ollama_model: string;
  gpt_api_base: string;
  gpt_api_key: string;
  gpt_api_version: string;
  gpt_deployment: string;
  gpt_model: string;
  primary_model_type: string;
  primary_ollama_endpoint: string;
  primary_ollama_model: string;
  response_model_type: string;
  response_ollama_endpoint: string;
  response_ollama_model: string;
  scrapper_model_type: string;
  scrapper_ollama_endpoint: string;
  scrapper_ollama_model: string;
  secondary_model_type: string;
  secondary_ollama_endpoint: string;
  secondary_ollama_model: string;
  // Optional fields for other providers
  [key: string]: string; // Allow dynamic fields
}

export const PROVIDER_OPTIONS = [
  { id: 'None', name: 'None', icon: '❌' },
  { id: 'Ollama', name: 'Ollama', icon: '🦙' },
  { id: 'GPT', name: 'GPT', icon: '🤖' },
  { id: 'HuggingFace', name: 'Hugging Face', icon: '🤗' },
  { id: 'Gemini', name: 'Gemini', icon: '💎' },
  { id: 'Claude', name: 'Claude', icon: '🎭' },
];

// Mock whitelisted websites for web scraping (only for UI)
export const WHITELISTED_WEBSITES = [
  { id: 'cloud4c', name: 'www.cloud4c.com', url: 'https://www.cloud4c.com' },
  { id: 'github', name: 'github.com', url: 'https://github.com' },
  { id: 'stackoverflow', name: 'stackoverflow.com', url: 'https://stackoverflow.com' },
  { id: 'medium', name: 'medium.com', url: 'https://medium.com' },
  { id: 'techcrunch', name: 'techcrunch.com', url: 'https://techcrunch.com' },
  { id: 'hackernews', name: 'news.ycombinator.com', url: 'https://news.ycombinator.com' },
  { id: 'reddit', name: 'reddit.com', url: 'https://reddit.com' },
  { id: 'aws', name: 'aws.amazon.com', url: 'https://aws.amazon.com' },
  { id: 'azure', name: 'azure.microsoft.com', url: 'https://azure.microsoft.com' },
  { id: 'gcp', name: 'cloud.google.com', url: 'https://cloud.google.com' },
];

export class LLMApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }

  // Fetch current LLM settings from real API
  async getLLMSettings(): Promise<LLMSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/llm_settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch LLM settings: ${response.status}`);
      }

      const data = await response.json();
      console.log('LLM Settings loaded:', data);
      return data;
    } catch (error) {
      console.error('Error fetching LLM settings:', error);
      throw error;
    }
  }

  // Save LLM settings to real API
  async saveLLMSettings(settings: Partial<LLMSettings>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/llm_settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`Failed to save LLM settings: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || 'Settings saved successfully',
      };
    } catch (error) {
      console.error('Error saving LLM settings:', error);
      throw error;
    }
  }

  // Test connection (simplified - just return current status)
  async testConnection(modelType: string, provider: string): Promise<{ connected: boolean; message: string }> {
    try {
      // For now, just check if the model type is configured
      const settings = await this.getLLMSettings();
      const typeKey = `${modelType}_model_type` as keyof LLMSettings;
      const isConfigured = settings[typeKey] && settings[typeKey] !== 'None';
      
      return {
        connected: !!isConfigured,
        message: isConfigured ? `${provider} model is configured` : `${provider} model not configured`,
      };
    } catch (error) {
      return {
        connected: false,
        message: 'Failed to check connection status',
      };
    }
  }
}

// Utility functions for working with LLM settings
export const getLLMConfigForModel = (settings: LLMSettings, modelType: string) => {
  const prefix = modelType.toLowerCase();
  
  return {
    modelType: settings[`${prefix}_model_type` as keyof LLMSettings] || 'None',
    ollamaEndpoint: settings[`${prefix}_ollama_endpoint` as keyof LLMSettings] || '',
    ollamaModel: settings[`${prefix}_ollama_model` as keyof LLMSettings] || '',
    // For other providers, we'll need to add more fields when your API supports them
  };
};

export const updateLLMConfigForModel = (
  settings: LLMSettings, 
  modelType: string, 
  config: any
): Partial<LLMSettings> => {
  const prefix = modelType.toLowerCase();
  const updates: Partial<LLMSettings> = {};

  if (config.modelType !== undefined) {
    updates[`${prefix}_model_type` as keyof LLMSettings] = config.modelType as any;
  }
  if (config.ollamaEndpoint !== undefined) {
    updates[`${prefix}_ollama_endpoint` as keyof LLMSettings] = config.ollamaEndpoint as any;
  }
  if (config.ollamaModel !== undefined) {
    updates[`${prefix}_ollama_model` as keyof LLMSettings] = config.ollamaModel as any;
  }

  return updates;
};

export const llmApiService = new LLMApiService();
