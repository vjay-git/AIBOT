import { DashboardDataType, DatabaseType, SchemaType, UserType, ReportType, LLMModelType, ChatbotDataType, UserSettingsType, ChatMessage, ChatSession, ChatFolder } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock dashboard data
export const fetchDashboardData = async (): Promise<DashboardDataType> => {
  await delay(800);
  return {
    metrics: {
      products: 48000,
      orders: 20000,
      customers: 2567
    },
    chartData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      series: [
        [30, 40, 35, 50, 49, 60, 70, 91, 125, 150, 200, 190],
        [20, 30, 25, 40, 39, 50, 60, 81, 115, 140, 190, 180],
        [10, 20, 15, 30, 29, 40, 50, 71, 105, 130, 180, 170]
      ]
    },
    customerList: [
      { company: 'Catalog', about: 'Content curating app' },
      { company: 'Circooles', about: 'Design software' },
      { company: 'Command+R', about: 'Data prediction' },
      { company: 'Hourglass', about: 'Productivity app' },
      { company: 'Layers', about: 'Web app integrations' },
      { company: 'Quotient', about: 'Sales CRM' }
    ]
  };
};

// Interface for the ask_db request parameters
export interface AskDatabaseRequest {
  user_id: string;
  thread_id: string;
  question: string;
  dashboard: string;
  tile: string;
}

// Interface for the ask_db response
export interface AskDatabaseResponse {
  data: any;
  metadata: {
    query: string;
    time: string;
    dashboard: string;
    tile: string;
  };
}

// Mock ask_db API function
export const askDatabase = async (params: AskDatabaseRequest): Promise<AskDatabaseResponse> => {
  await delay(1000);
  
  // Mock response with class distribution data
  let responseData;
  
  if (params.question.toLowerCase().includes('distribution') && params.question.toLowerCase().includes('class')) {
    responseData = {
      data: {
        labels: ['Class A', 'Class B', 'Class C', 'Class D', 'Class E'],
        values: [35, 25, 15, 15, 10],
        type: 'pie'
      },
      metadata: {
        query: params.question,
        time: new Date().toISOString(),
        dashboard: params.dashboard,
        tile: params.tile
      }
    };
  } else {
    // Default response for other queries
    responseData = {
      data: {
        message: "Could not understand the query. Please try rephrasing.",
        type: 'text'
      },
      metadata: {
        query: params.question,
        time: new Date().toISOString(),
        dashboard: params.dashboard,
        tile: params.tile
      }
    };
  }
  
  return responseData;
};

// Mock database data
export const fetchDatabaseData = async (): Promise<DatabaseType> => {
  await delay(600);
  return {
    tables: [
      { name: 'GL_Accounts', inputFolder: 'GL_Company_code', processedFolder: 'GL_Company_code' },
      { name: 'Phoenix Baker', inputFolder: 'GL_Account_number', processedFolder: 'GL_Account_number' },
      { name: 'Lana Steiner', inputFolder: 'GL_Account_name', processedFolder: 'GL_Account_name' },
      { name: 'Lana Steiner', inputFolder: 'GL_Account_name', processedFolder: 'GL_Account_name' }
    ]
  };
};

// Mock schema data
export const fetchSchemaData = async (): Promise<SchemaType> => {
  await delay(700);
  return {
    fields: [
      { id: 'operation_id', name: 'Operation_ID', selected: true },
      { id: 'patient_id', name: 'Patient_ID', selected: true },
      { id: 'hospital_admission_id', name: 'Hospital_admission_ID', selected: false },
      { id: 'case_id', name: 'Case_ID', selected: false },
      { id: 'operation_data', name: 'Operation_data', selected: false },
      { id: 'age', name: 'Age', selected: false },
      { id: 'gender_of_patient', name: 'Gender_of_patient', selected: false },
      { id: 'weight_of_patient', name: 'Weight_of_patient', selected: false },
      { id: 'height_of_patient', name: 'Height_of_patient', selected: true },
      { id: 'patient_race', name: 'Patient_race', selected: true },
      { id: 'asa_classification_score', name: 'Asa_classification_score', selected: false },
      { id: 'emergency_operation_flag', name: 'Emergency_operation_flag', selected: false },
      { id: 'icd_operations_diagnosis_code', name: 'Icd_operations_diagnosis_code', selected: false },
      { id: 'operating_room_entry_time', name: 'Operating_room_entry_time', selected: false },
      { id: 'operating_room_exit_time', name: 'Operating_room_exit_time', selected: true },
      { id: 'operation_start_time', name: 'Operation_start_time', selected: false },
      { id: 'operation_end_time', name: 'Operation_end_time', selected: false },
      { id: 'admission_time', name: 'Admission_time', selected: false },
      { id: 'discharge_time', name: 'Discharge_time', selected: true },
      { id: 'anaesthesia_start_time', name: 'Anaesthesia_start_time', selected: false },
      { id: 'anaesthesia_end_time', name: 'Anaesthesia_end_time', selected: false },
      { id: 'cardiopulmonary_bypass_on-time', name: 'Cardiopulmonary_bypass_on-time', selected: false },
      { id: 'cardiopulmonary_bypass_off-time', name: 'Cardiopulmonary_bypass_off-time', selected: true },
      { id: 'icu_admission_time', name: 'Icu_admission_time', selected: false },
      { id: 'icu_discharge_time', name: 'Icu_discharge_time', selected: false },
      { id: 'in_hospital_death_time', name: 'In_hospital_death_time', selected: false }
    ]
  };
};

// Mock user management data
export const fetchUsers = async (): Promise<UserType[]> => {
  await delay(500);
  return [
    { id: '12445', name: 'Alex Carter', email: 'alex.carter@example.com', role: 'Manager', status: 'Active' },
    { id: '13869', name: 'Jamie Brooks', email: 'jamie.brooks@example.com', role: 'Sub Admin', status: 'Inactive' },
    { id: '12345', name: 'Lana Steiner', email: 'taylor.morgan@example.com', role: 'Employee', status: 'Active' },
    { id: '10745', name: 'Chris Dawson', email: 'chris.dawson@example.com', role: 'Employee', status: 'Active' },
    { id: '10793', name: 'Jordan Ellis', email: 'jordan.ellis@example.com', role: 'Sub Admin', status: 'Inactive' },
    { id: '09876', name: 'Casey Hunter', email: 'casey.hunter@example.com', role: 'Employee', status: 'Active' },
    { id: '98765', name: 'Sam Parker', email: 'sam.parker@example.com', role: 'Sub Admin', status: 'Active' },
    { id: '65432', name: 'Riley Bennett', email: 'riley.bennett@example.com', role: 'Employee', status: 'Inactive' },
    { id: '76595', name: 'Morgan Blake', email: 'morgan.blake@example.com', role: 'Employee', status: 'Active' }
  ];
};

// Mock reports data
export const fetchReports = async (): Promise<ReportType[]> => {
  await delay(600);
  return [
    { id: '12445', name: 'Alex Carter', email: 'alex.carter@example.com', role: 'Manager', lastModified: 'Dec 12, 2024' },
    { id: '13869', name: 'Jamie Brooks', email: 'jamie.brooks@example.com', role: 'Sub Admin', lastModified: 'Dec 10, 2024' },
    { id: '12345', name: 'Lana Steiner', email: 'taylor.morgan@example.com', role: 'Employee', lastModified: 'Dec 04, 2024' },
    { id: '10745', name: 'Chris Dawson', email: 'chris.dawson@example.com', role: 'Employee', lastModified: 'Dec 02, 2024' },
    { id: '10793', name: 'Jordan Ellis', email: 'jordan.ellis@example.com', role: 'Sub Admin', lastModified: 'Nov 24, 2024' },
    { id: '09876', name: 'Casey Hunter', email: 'casey.hunter@example.com', role: 'Employee', lastModified: 'Nov 20, 2024' },
    { id: '98765', name: 'Sam Parker', email: 'sam.parker@example.com', role: 'Sub Admin', lastModified: 'Nov 15, 2024' },
    { id: '65432', name: 'Riley Bennett', email: 'riley.bennett@example.com', role: 'Employee', lastModified: 'Nov 12, 2024' },
    { id: '76595', name: 'Morgan Blake', email: 'morgan.blake@example.com', role: 'Employee', lastModified: 'Nov 07, 2024' }
  ];
};

// Mock LLM models data
export const fetchLLMModels = async (): Promise<LLMModelType> => {
  await delay(700);
  return {
    availableModels: [
      { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
      { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
      { id: 'llama-2', name: 'Llama 2', provider: 'Meta' },
      { id: 'palm', name: 'PaLM', provider: 'Google' }
    ],
    selectedModel: 'gpt-4',
    configurations: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  };
};

// Mock chatbot conversation data
export const fetchChatbotData = async (): Promise<ChatbotDataType> => {
  
  // Load data from localStorage if available
  const storedData = typeof window !== 'undefined' ? localStorage.getItem('chatbotData') : null;
  
  if (storedData) {
    return JSON.parse(storedData);
  }
  
  // Initial mock data
  const initialData: ChatbotDataType = {
    username: 'Anush',
    chatSessions: [
      {
        id: '101bcef9-9e3d-48a0-9d91-d8a2a2f55747',
        title: 'Patient age metrics',
        bookmarked: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        messages: [
          {
            id: 'msg1',
            sender: 'user',
            text: 'Can you show me the age distribution of patients?',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg2',
            sender: 'bot',
            text: 'Here is the age distribution of patients: 20-30 years: 15%, 30-40 years: 25%, 40-50 years: 30%, 50-60 years: 20%, 60+ years: 10%',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10000).toISOString()
          }
        ]
      },
      {
        id: '92406b27-22fa-416e-bea4-e87051386cac',
        title: 'Demographics',
        bookmarked: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        messages: [
          {
            id: 'msg3',
            sender: 'user',
            text: 'What are the demographics of our patient population?',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg4',
            sender: 'bot',
            text: 'Our patient demographics are as follows: Gender: 45% Male, 55% Female. Ethnicity: 60% Caucasian, 15% African American, 18% Hispanic, 7% Asian/Pacific Islander.',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 15000).toISOString()
          }
        ]
      },
      {
        id: '4ec3eadf-43a1-4e34-8c25-aaf258eb116b',
        title: 'Department & Doctor',
        bookmarked: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        messages: [
          {
            id: 'msg5',
            sender: 'user',
            text: 'Which department has the highest patient volume?',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg6',
            sender: 'bot',
            text: 'The Emergency Department has the highest patient volume with an average of 120 patients per day, followed by Internal Medicine with 85 patients per day.',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 8000).toISOString()
          }
        ]
      },
      
    ],
    folders: [
      { id: 'patients', name: 'Patients' },
      { id: 'doctors', name: 'Doctors' },
      { id: 'branch', name: 'Branch' },
      { id: 'financials', name: 'Financials' },
      { id: 'prediction', name: 'Prediction' }
    ]
  };
  
  // Store initial data in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatbotData', JSON.stringify(initialData));
  }
  
  return initialData;
};

// Chat session API mock functions
export const fetchChatSessions = async (): Promise<ChatSession[]> => {
  const data = await fetchChatbotData();
  return data.chatSessions;
};

export const fetchChatById = async (id: string): Promise<ChatSession | null> => {
  await delay(300);
  const data = await fetchChatbotData();
  return data.chatSessions.find(chat => chat.id === id) || null;
};

export const createNewChat = async (): Promise<ChatSession> => {
  await delay(300);
  
  const newChat: ChatSession = {
    id: `chat-${Date.now()}`,
    title: 'New Chat',
    messages: [],
    bookmarked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to chatbot data
  const data = await fetchChatbotData();
  data.chatSessions.unshift(newChat);
  data.activeChatId = newChat.id;
  
  // Update localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatbotData', JSON.stringify(data));
  }
  
  return newChat;
};

export const sendMessage = async (chatId: string, text: string, replyToId?: string): Promise<ChatMessage> => {
  await delay(400);
  
  // Create user message
  const userMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender: 'user',
    text: text,
    timestamp: new Date().toISOString(),
    replyTo: replyToId
  };
  
  // Add user message to the chat
  const data = await fetchChatbotData();
  const chat = data.chatSessions.find(c => c.id === chatId);
  
  if (!chat) {
    throw new Error(`Chat with id ${chatId} not found`);
  }
  
  chat.messages.push(userMessage);
  chat.updatedAt = new Date().toISOString();
  
  // If this is the first message, update the chat title
  if (chat.messages.length === 1) {
    chat.title = text.length > 25 ? `${text.substring(0, 25)}...` : text;
  }
  
  // Update localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatbotData', JSON.stringify(data));
  }
  
  // Create bot response immediately without setTimeout - this was causing the refresh issue
  const botResponse = await generateBotResponse(text, replyToId, userMessage.id);
  
  // Get the latest data again
  const currentData = await fetchChatbotData();
  const currentChat = currentData.chatSessions.find(c => c.id === chatId);
  
  if (currentChat) {
    currentChat.messages.push(botResponse);
    currentChat.updatedAt = new Date().toISOString();
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatbotData', JSON.stringify(currentData));
    }
  }
  
  return botResponse; // Return bot response instead of user message
};

// Mock function to generate a bot response
const generateBotResponse = async (userText: string, replyToId?: string, replyToUserMessageId?: string): Promise<ChatMessage> => {
  let responseText = '';
  
  // Simple pattern matching for common questions with more detailed responses
  if (userText.toLowerCase().includes('patient') && userText.toLowerCase().includes('age')) {
    responseText = 'The average patient age is 42 years, with a distribution of: 0-18: 15%, 19-35: 22%, 36-50: 28%, 51-65: 20%, 65+: 15%. Our geriatric department has seen a 12% increase in patients over 65 in the last quarter.';
  } 
  else if (userText.toLowerCase().includes('doctor') || userText.toLowerCase().includes('physician')) {
    responseText = 'We have 45 doctors on staff across 12 departments. The most active departments are: Emergency (8 doctors), Internal Medicine (7 doctors), and Pediatrics (6 doctors). We recently added 3 new specialists in Cardiology and Neurology.';
  }
  else if (userText.toLowerCase().includes('demographics') || userText.toLowerCase().includes('population')) {
    responseText = 'Our patient demographics: Gender: 48% Male, 52% Female. Age groups: 0-18: 18%, 19-35: 24%, 36-50: 22%, 51-65: 19%, 65+: 17%. Geographic distribution: Urban: 65%, Suburban: 25%, Rural: 10%. Insurance coverage: Private: 58%, Medicare/Medicaid: 32%, Self-pay: 10%.';
  }
  else if (userText.toLowerCase().includes('hospital') && userText.toLowerCase().includes('stay')) {
    responseText = 'The average length of hospital stay is 4.3 days across all departments. This varies significantly by department: Maternity: 2.1 days, Surgery: 5.7 days, ICU: 8.2 days, Pediatrics: 3.4 days, Psychiatric: 9.6 days.';
  }
  else if (userText.toLowerCase().includes('emergency') || userText.toLowerCase().includes('er')) {
    responseText = 'Emergency department metrics: Average daily visits: 142 patients. Average wait time: 32 minutes. Peak hours are between 6-10 PM with 40% higher volume. Most common complaints: chest pain (17%), abdominal pain (14%), respiratory issues (12%), and trauma (10%).';
  }
  else if (userText.toLowerCase().includes('cost') || userText.toLowerCase().includes('billing')) {
    responseText = 'Our hospital\'s average costs per patient have increased by 4.2% from last year. The highest cost centers are Surgery ($4,200/day), ICU ($3,800/day), and Specialty Care ($2,900/day). Outpatient services average $450 per visit.';
  }
  else if (userText.toLowerCase().includes('satisfaction') || userText.toLowerCase().includes('survey')) {
    responseText = 'Patient satisfaction scores from our quarterly surveys show: Overall satisfaction: 87% (up 3% from last quarter). Highest scores: Nursing care (92%), Cleanliness (90%). Areas for improvement: Billing process (74%), Wait times (78%).';
  }
  else {
    // Enhanced generic response with some personalization
    const randomResponses = [
      `I understand your question about ${userText.substring(0, 20)}... Based on our hospital data, we can analyze this further. Would you like me to generate a detailed report with visualizations?`,
      `That's an interesting question about ${userText.substring(0, 20)}... I can provide some initial insights, but we could run a deeper analysis to get more comprehensive results. How would you like to proceed?`,
      `Looking at your question regarding ${userText.substring(0, 20)}... We have several relevant data points in our system. Would you prefer a high-level summary or a detailed breakdown by department?`,
      `Based on your inquiry about ${userText.substring(0, 20)}... I can see some patterns in our hospital data that might interest you. Should I focus on the most recent quarter or provide a year-over-year comparison?`
    ];
    
    // Select a random response from the array
    responseText = randomResponses[Math.floor(Math.random() * randomResponses.length)];
  }
  
  return {
    id: `bot-${Date.now()}`,
    sender: 'bot',
    text: responseText,
    timestamp: new Date().toISOString(),
    replyTo: replyToUserMessageId
  };
};

export const toggleBookmark = async (chatId: string): Promise<boolean> => {
  await delay(200);
  
  const data = await fetchChatbotData();
  const chat = data.chatSessions.find(c => c.id === chatId);
  
  if (!chat) {
    throw new Error(`Chat with id ${chatId} not found`);
  }
  
  chat.bookmarked = !chat.bookmarked;
  
  // Update localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatbotData', JSON.stringify(data));
  }
  
  return chat.bookmarked;
};

export const deleteChat = async (chatId: string): Promise<void> => {
  await delay(300);
  
  const data = await fetchChatbotData();
  const chatIndex = data.chatSessions.findIndex(c => c.id === chatId);
  
  if (chatIndex === -1) {
    throw new Error(`Chat with id ${chatId} not found`);
  }
  
  data.chatSessions.splice(chatIndex, 1);
  
  // If the deleted chat was the active one, set activeChatId to undefined
  if (data.activeChatId === chatId) {
    data.activeChatId = data.chatSessions.length > 0 ? data.chatSessions[0].id : undefined;
  }
  
  // Update localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatbotData', JSON.stringify(data));
  }
};

export const fetchFolders = async (): Promise<ChatFolder[]> => {
  const data = await fetchChatbotData();
  return data.folders;
};

// Create a new folder
export const createFolder = async (name: string): Promise<ChatFolder> => {
  await delay(300);
  
  const newFolder: ChatFolder = {
    id: `folder-${Date.now()}`,
    name
  };
  
  // Add to chatbot data
  const data = await fetchChatbotData();
  data.folders.push(newFolder);
  
  // Update localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatbotData', JSON.stringify(data));
  }
  
  return newFolder;
};

// Rename a folder
export const renameFolder = async (folderId: string, newName: string): Promise<ChatFolder> => {
  await delay(200);
  
  const data = await fetchChatbotData();
  const folder = data.folders.find(f => f.id === folderId);
  
  if (!folder) {
    throw new Error(`Folder with id ${folderId} not found`);
  }
  
  folder.name = newName;
  
  // Update localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatbotData', JSON.stringify(data));
  }
  
  return folder;
};

// Delete a folder
export const deleteFolder = async (folderId: string): Promise<void> => {
  await delay(300);
  
  const data = await fetchChatbotData();
  const folderIndex = data.folders.findIndex(f => f.id === folderId);
  
  if (folderIndex === -1) {
    throw new Error(`Folder with id ${folderId} not found`);
  }
  
  // Remove folder
  data.folders.splice(folderIndex, 1);
  
  // Remove folder assignment from chats
  data.chatSessions.forEach(chat => {
    if (chat.folderId === folderId) {
      chat.folderId = undefined;
    }
  });
  
  // Update localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatbotData', JSON.stringify(data));
  }
};

// Move chat to folder
export const moveToFolder = async (chatId: string, folderId: string | null): Promise<ChatSession> => {
  await delay(300);
  
  const data = await fetchChatbotData();
  const chat = data.chatSessions.find(c => c.id === chatId);
  
  if (!chat) {
    throw new Error(`Chat with id ${chatId} not found`);
  }
  
  // If folderId is null, remove from folder
  chat.folderId = folderId || undefined;
  
  // Update localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatbotData', JSON.stringify(data));
  }
  
  return chat;
};

// Get chats from folder
export const getChatsByFolder = async (folderId: string): Promise<ChatSession[]> => {
  await delay(300);
  
  const data = await fetchChatbotData();
  return data.chatSessions.filter(chat => chat.folderId === folderId);
};

// Mock user settings data
export const fetchUserSettings = async (): Promise<UserSettingsType> => {
  await delay(500);
  return {
    profile: {
      name: 'Anush Reddy',
      email: 'anush@upslide.in',
      role: 'Administrator'
    },
    customization: {
      companyLogo: null, // No logo uploaded yet
      themeColor: '#5B8DEF', // Blue by default
      mode: 'light', // Light mode by default
      language: 'en', // English by default
      welcomeMessage: 'Hi Anush, You can ask about Patient details'
    },
    security: {
      twoFactorEnabled: true,
      lastPasswordChange: '2023-05-10T08:30:00Z',
      lastLogin: '2023-06-18T09:45:22Z'
    }
  };
};

// Mock API method to return dashboard and AI tables info
export const fetchUserDashboardData = async () => {
  await delay(400);
  return {
    data: {
      username: "jdoe",
      default_dashboard: "sales_dashboard",
      dashboards: {
        sales_dashboard: {
          layout: "grid",
          widgets: ["chart1", "chart2"]
        }
      },
      ai_tables: {
        sales_data: {
          description: "Contains monthly sales records",
          last_updated: "2025-05-01"
        }
      }
    }
  };
};