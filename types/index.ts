// Updated types.ts with correct interfaces based on API response

export interface NavItem {
  id: string;
  title: string;
  route: string;
}

export interface SubNavItem {
  id: string;
  title: string;
  parentId: string;
}

// Fixed ChatFolder interface to match actual bookmark structure
export interface ChatFolder {
  id: string;
  name: string;
  bookmark_id?: string; // API uses this field
  bookmark_name?: string; // API uses this field  
  queries?: Array<{
    query_id: string | string[]; // Can be string or array of strings
    messages?: any[];
  }>;
}

// Updated ChatMessage interface
export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string | any;
  timestamp: string;
  replyTo?: string;
  type?: 'text' | 'search_query' | 'search_result' | 'db_answer' | 'tabular' | 'audio' | 'pdf' | 'xlsx' | 'docx' | 'file' | 'table';
  bookmarked?: boolean;
  rawAnswer?: any;
  queryId?: string;
  bookmarkId?: string;
}

// Updated ChatSession interface
export interface ChatSession {
  id: string;
  title: string;
  messages: any[]; // Keep as any[] to match actual usage
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
  bookmarkId?: string;
  queryIds?: string[];
}

export interface DashboardDataType {
  metrics: {
    products: number;
    orders: number;
    customers: number;
  };
  chartData: {
    labels: string[];
    series: number[][];
  };
  customerList: {
    company: string;
    about: string;
  }[];
}

export interface DatabaseType {
  tables: {
    name: string;
    inputFolder: string;
    processedFolder: string;
  }[];
}

export interface DatabaseTableRow {
  id: string;
  name: string;
  inputFolder: string;
  processedFolder: string;
}

export interface AlignmentRow {
  id: string;
  aiTable: string;
  aiField1: string;
  aiField2: string;
  systemDefaultValue: string;
}

export interface SchemaType {
  fields: {
    id: string;
    name: string;
    selected: boolean;
  }[];
}

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
}

export interface ReportType {
  id: string;
  name: string;
  email: string;
  role: string;
  lastModified: string;
}

export interface LLMModelType {
  availableModels: {
    id: string;
    name: string;
    provider: string;
  }[];
  selectedModel: string;
  configurations: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
}

export interface ChatbotDataType {
  username: string;
  chatSessions: ChatSession[];
  folders: ChatFolder[];
  activeChatId?: string;
}

export interface UserSettingsType {
  profile: {
    name: string;
    email: string;
    role: string;
  };
  customization: {
    companyLogo: string | null;
    themeColor: string;
    mode: 'light' | 'dark' | 'auto';
    language: string;
    welcomeMessage: string;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    lastLogin: string;
  };
}