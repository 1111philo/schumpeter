const STATE = {
  aiProvider: 'openrouter',
  openRouterKey: null,
  openRouterModel: 'meta-llama/llama-3.2-3b-instruct:free',
  bedrockKey: null,
  awsRegion: 'us-east-1',
  cvText: null,
  searchTerms: null,
  jobs: []
};

// Session storage keys
const STORAGE_KEYS = {
  aiProvider: 'schumpeter_provider',
  openRouter: 'schumpeter_openrouter',
  openRouterModel: 'schumpeter_openrouter_model',
  bedrockKey: 'schumpeter_bedrock',
  awsRegion: 'schumpeter_aws_region',
  cvText: 'schumpeter_cv',
  searchTerms: 'schumpeter_terms',
  jobs: 'schumpeter_jobs'
};

// Elements
const setupSection = document.getElementById('setup');
const uploadSection = document.getElementById('upload');
const processingSection = document.getElementById('processing');
const resultsSection = document.getElementById('results');
const dropZone = document.getElementById('drop-zone');
const cvInput = document.getElementById('cv-input');
const cvStatus = document.getElementById('cv-status');
const statusText = document.getElementById('status-text');
const jobList = document.getElementById('job-list');

// Initialize
async function init() {
  loadFromSession();
  attachListeners();

  // Restore provider selection
  document.getElementById('ai-provider').value = STATE.aiProvider;
  toggleProviderConfig();

  // Load available models from OpenRouter
  await loadOpenRouterModels();

  // Restore API keys
  if (STATE.openRouterKey) {
    document.getElementById('openrouter-key').value = STATE.openRouterKey;
    document.getElementById('openrouter-model').value = STATE.openRouterModel;
  }
  if (STATE.bedrockKey) {
    document.getElementById('bedrock-key').value = STATE.bedrockKey;
    document.getElementById('aws-region').value = STATE.awsRegion;
  }

  if (STATE.jobs && STATE.jobs.length > 0) {
    showResults();
  } else if (STATE.openRouterKey || STATE.bedrockKey) {
    showUpload();
  }
}

async function loadOpenRouterModels() {
  try {
    // Check cache first
    const cached = sessionStorage.getItem('schumpeter_models');
    const cacheTime = sessionStorage.getItem('schumpeter_models_time');

    if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
      // Cache valid for 1 hour
      populateModelDropdown(JSON.parse(cached));
      return;
    }

    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) {
      console.warn('Failed to fetch models, using defaults');
      return;
    }

    const data = await response.json();
    const models = data.data || [];

    // Cache the models
    sessionStorage.setItem('schumpeter_models', JSON.stringify(models));
    sessionStorage.setItem('schumpeter_models_time', Date.now().toString());

    populateModelDropdown(models);
  } catch (error) {
    console.warn('Error loading models:', error);
  }
}

function populateModelDropdown(models) {
  const select = document.getElementById('openrouter-model');

  // Filter for free models and popular paid ones
  const freeModels = models.filter(m => m.id.includes(':free'));
  const popularPaid = models.filter(m =>
    m.id.includes('claude') ||
    m.id.includes('gpt-4') ||
    m.id.includes('gpt-3.5')
  ).slice(0, 5);

  // Clear existing options
  select.innerHTML = '';

  // Add free models
  if (freeModels.length > 0) {
    const freeGroup = document.createElement('optgroup');
    freeGroup.label = 'Free Models';
    freeModels.slice(0, 10).forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = `${model.name || model.id.split('/')[1]} (Free)`;
      freeGroup.appendChild(option);
    });
    select.appendChild(freeGroup);
  }

  // Add paid models
  if (popularPaid.length > 0) {
    const paidGroup = document.createElement('optgroup');
    paidGroup.label = 'Paid Models';
    popularPaid.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      const pricing = model.pricing?.prompt ? ` ($${(parseFloat(model.pricing.prompt) * 1000000).toFixed(2)}/1M)` : '';
      option.textContent = `${model.name || model.id.split('/')[1]}${pricing}`;
      paidGroup.appendChild(option);
    });
    select.appendChild(paidGroup);
  }

  // Set default if current selection not in list
  if (STATE.openRouterModel && !Array.from(select.options).find(opt => opt.value === STATE.openRouterModel)) {
    if (freeModels.length > 0) {
      STATE.openRouterModel = freeModels[0].id;
    }
  }
}

function loadFromSession() {
  const config = window.SCHUMPETER_CONFIG || {};

  STATE.aiProvider = sessionStorage.getItem(STORAGE_KEYS.aiProvider) || config.AI_PROVIDER || 'openrouter';
  STATE.openRouterKey = sessionStorage.getItem(STORAGE_KEYS.openRouter) || config.OPENROUTER_API_KEY || null;
  STATE.openRouterModel = sessionStorage.getItem(STORAGE_KEYS.openRouterModel) || config.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';
  STATE.bedrockKey = sessionStorage.getItem(STORAGE_KEYS.bedrockKey);
  STATE.awsRegion = sessionStorage.getItem(STORAGE_KEYS.awsRegion) || 'us-east-1';
  STATE.cvText = sessionStorage.getItem(STORAGE_KEYS.cvText);
  STATE.searchTerms = sessionStorage.getItem(STORAGE_KEYS.searchTerms);
  const storedJobs = sessionStorage.getItem(STORAGE_KEYS.jobs);
  STATE.jobs = storedJobs ? JSON.parse(storedJobs) : [];
}

function saveToSession() {
  sessionStorage.setItem(STORAGE_KEYS.aiProvider, STATE.aiProvider);
  sessionStorage.setItem(STORAGE_KEYS.openRouter, STATE.openRouterKey || '');
  sessionStorage.setItem(STORAGE_KEYS.openRouterModel, STATE.openRouterModel || 'meta-llama/llama-3.2-3b-instruct:free');
  sessionStorage.setItem(STORAGE_KEYS.bedrockKey, STATE.bedrockKey || '');
  sessionStorage.setItem(STORAGE_KEYS.awsRegion, STATE.awsRegion || 'us-east-1');
  sessionStorage.setItem(STORAGE_KEYS.cvText, STATE.cvText || '');
  sessionStorage.setItem(STORAGE_KEYS.searchTerms, STATE.searchTerms || '');
  sessionStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(STATE.jobs));
}

function attachListeners() {
  document.getElementById('ai-provider').addEventListener('change', toggleProviderConfig);
  document.getElementById('save-keys').addEventListener('click', saveKeys);
  document.getElementById('change-settings').addEventListener('click', showSetup);
  dropZone.addEventListener('click', () => cvInput.click());
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  cvInput.addEventListener('change', handleFileSelect);
  document.getElementById('start-over').addEventListener('click', startOver);

  // Keyboard shortcuts
  const enterToSave = (e) => {
    if (e.key === 'Enter') saveKeys();
  };
  document.getElementById('openrouter-key').addEventListener('keydown', enterToSave);
  document.getElementById('bedrock-key').addEventListener('keydown', enterToSave);
  document.getElementById('aws-region').addEventListener('keydown', enterToSave);
}

function toggleProviderConfig() {
  const provider = document.getElementById('ai-provider').value;
  const openrouterConfig = document.getElementById('openrouter-config');
  const bedrockConfig = document.getElementById('bedrock-config');

  if (provider === 'openrouter') {
    openrouterConfig.classList.remove('hidden');
    bedrockConfig.classList.add('hidden');
  } else {
    openrouterConfig.classList.add('hidden');
    bedrockConfig.classList.remove('hidden');
  }
}

function saveKeys() {
  const provider = document.getElementById('ai-provider').value;
  STATE.aiProvider = provider;

  if (provider === 'openrouter') {
    const openRouterKey = document.getElementById('openrouter-key').value.trim();
    if (!openRouterKey) {
      showError(setupSection, 'OpenRouter API key is required');
      return;
    }
    STATE.openRouterKey = openRouterKey;
    STATE.openRouterModel = document.getElementById('openrouter-model').value;
  } else {
    const bedrockKey = document.getElementById('bedrock-key').value.trim();
    const awsRegion = document.getElementById('aws-region').value.trim();

    if (!bedrockKey) {
      showError(setupSection, 'Bedrock API key is required');
      return;
    }

    STATE.bedrockKey = bedrockKey;
    STATE.awsRegion = awsRegion || 'us-east-1';
  }

  saveToSession();
  showUpload();
}

function handleDragOver(e) {
  e.preventDefault();
  dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  dropZone.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
}

async function processFile(file) {
  const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

  if (!validTypes.includes(file.type)) {
    showError(uploadSection, 'Please upload a PDF, DOC, DOCX, or TXT file');
    return;
  }

  cvStatus.classList.remove('hidden');
  cvStatus.innerHTML = `<p>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</p>`;

  try {
    const text = await extractText(file);
    STATE.cvText = text;
    saveToSession();
    await analyzeAndSearch(text);
  } catch (error) {
    showError(uploadSection, `Error processing file: ${error.message}`);
  }
}

async function extractText(file) {
  if (file.type === 'text/plain') {
    return await file.text();
  }

  if (file.type === 'application/pdf') {
    return await extractPdfText(file);
  }

  throw new Error('For DOC/DOCX files, please convert to TXT or PDF, or copy-paste your CV content.');
}

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  if (!fullText.trim()) {
    throw new Error('Could not extract text from PDF. It may be scanned/image-based. Please convert to TXT.');
  }

  return fullText;
}

async function analyzeAndSearch(cvText) {
  showProcessing('Analyzing your CV...');

  try {
    // Step 1: Extract search terms from CV
    statusText.textContent = 'Extracting relevant job search terms...';
    const searchTerms = await extractSearchTerms(cvText);
    STATE.searchTerms = searchTerms;
    saveToSession();

    // Step 2: Search for jobs
    statusText.textContent = 'Finding job opportunities...';
    const rawJobs = await searchJobs(searchTerms);

    // Step 3: Filter and rank jobs
    statusText.textContent = 'Matching jobs to your profile...';
    const rankedJobs = await rankJobs(cvText, searchTerms, rawJobs);

    STATE.jobs = rankedJobs;
    saveToSession();
    showResults();

  } catch (error) {
    showError(processingSection, error.message);
  }
}

async function extractSearchTerms(cvText) {
  const response = await callLLMWithRetry([
    {
      role: 'user',
      content: `Analyze this CV and extract 5-10 specific job search terms that would help find relevant job opportunities. Include job titles, key skills, and industries. Return as a JSON array of strings.

CV:
${cvText}

Return only the JSON array, no other text.`
    }
  ]);

  try {
    return JSON.parse(response);
  } catch {
    // Fallback: extract terms from response
    const terms = response.match(/"([^"]+)"/g)?.map(t => t.replace(/"/g, '')) || [];
    return terms.slice(0, 10);
  }
}

async function callLLMWithRetry(messages, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callLLM(messages);
    } catch (error) {
      lastError = error;

      // If rate limited and using OpenRouter, try next free model
      if (error.message.includes('Rate limit') && STATE.aiProvider === 'openrouter') {
        const cachedModels = sessionStorage.getItem('schumpeter_models');
        if (cachedModels) {
          const models = JSON.parse(cachedModels);
          const freeModels = models.filter(m => m.id.includes(':free'));
          const currentIndex = freeModels.findIndex(m => m.id === STATE.openRouterModel);

          if (currentIndex >= 0 && currentIndex < freeModels.length - 1) {
            const nextModel = freeModels[currentIndex + 1];
            console.log(`Switching to ${nextModel.id} due to rate limit`);
            STATE.openRouterModel = nextModel.id;
            saveToSession();
            continue; // Retry with new model
          }
        }
      }

      // For other errors or if no more models to try, throw
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
    }
  }

  throw lastError;
}

async function searchJobs(searchTerms) {
  console.log('Searching jobs with terms:', searchTerms);
  console.log('Getting LLM job suggestions...');

  const jobs = await getLLMJobSuggestions(searchTerms);

  console.log('LLM returned', jobs.length, 'jobs');
  console.log('Total jobs found:', jobs.length);

  return jobs;
}

async function getLLMJobSuggestions(searchTerms) {
  const response = await callLLMWithRetry([
    {
      role: 'user',
      content: `Based on these job search terms, suggest 15 realistic job opportunities that might be available. For each job, provide: title, company (can be generic like "Tech Startup" or "Healthcare Provider"), a realistic job board URL or company careers page, and a brief description.

Search terms: ${searchTerms.join(', ')}

Return as JSON array with objects containing: title, company, url, snippet`
    }
  ]);

  console.log('LLM job suggestions response:', response);

  try {
    const parsed = JSON.parse(response);
    console.log('Parsed jobs:', parsed);
    return parsed;
  } catch (error) {
    console.error('Failed to parse job suggestions:', error, 'Response:', response);
    return [];
  }
}

async function rankJobs(cvText, searchTerms, jobs) {
  const response = await callLLMWithRetry([
    {
      role: 'user',
      content: `Given this CV and these job opportunities, select the top 5-8 best matches. For each match, explain why it fits.

CV Summary: ${cvText.slice(0, 1000)}

Search Terms: ${searchTerms.join(', ')}

Jobs:
${JSON.stringify(jobs, null, 2)}

Return as JSON array with objects containing: title, company, url, matchReason (1-2 sentences explaining fit)`
    }
  ]);

  try {
    return JSON.parse(response);
  } catch {
    return jobs.slice(0, 5).map(job => ({
      ...job,
      matchReason: 'Matches your search criteria'
    }));
  }
}

async function callLLM(messages) {
  if (STATE.aiProvider === 'openrouter') {
    return await callOpenRouter(messages);
  } else {
    return await callBedrock(messages);
  }
}

async function callOpenRouter(messages) {
  const requestBody = {
    model: STATE.openRouterModel,
    messages: messages
  };

  console.log('OpenRouter request:', requestBody);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STATE.openRouterKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Schumpeter Job Finder'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenRouter error response:', JSON.stringify(errorData, null, 2));

    // Handle rate limits with helpful message
    if (response.status === 429) {
      const modelName = STATE.openRouterModel.split('/')[1];
      throw new Error(`Rate limit reached for ${modelName}. Try a different free model or wait a few minutes.`);
    }

    const errorMsg = errorData.error?.message || errorData.message || `API error: ${response.status}`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callBedrock(messages) {
  const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  const region = STATE.awsRegion;

  // Convert messages to Claude format
  const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system');

  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    messages: userMessages
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  // Use short-term API key (bearer token)
  const endpoint = `https://bedrock-runtime.${region}.amazonaws.com`;
  const path = `/model/${modelId}/invoke`;

  const response = await fetch(`${endpoint}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STATE.bedrockKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bedrock API error: ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function showSetup() {
  setupSection.classList.remove('hidden');
  uploadSection.classList.add('hidden');
  processingSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
}

function showUpload() {
  setupSection.classList.add('hidden');
  uploadSection.classList.remove('hidden');
  processingSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
}

function showProcessing(message) {
  setupSection.classList.add('hidden');
  uploadSection.classList.add('hidden');
  processingSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  statusText.textContent = message;
}

function showResults() {
  setupSection.classList.add('hidden');
  uploadSection.classList.add('hidden');
  processingSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');

  jobList.innerHTML = STATE.jobs.map(job => `
    <div class="job-card">
      <h3>${escapeHtml(job.title)}</h3>
      <div class="company">${escapeHtml(job.company)}</div>
      <div class="match-reason">${escapeHtml(job.matchReason || job.snippet || '')}</div>
      <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener">View opportunity →</a>
    </div>
  `).join('');
}

function showError(section, message) {
  const existing = section.querySelector('.error');
  if (existing) existing.remove();

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.textContent = message;
  section.appendChild(errorDiv);

  setTimeout(() => errorDiv.remove(), 5000);
}

function startOver() {
  if (confirm('Start over? This will clear your current results.')) {
    STATE.cvText = null;
    STATE.searchTerms = null;
    STATE.jobs = [];
    saveToSession();
    cvStatus.classList.add('hidden');
    cvInput.value = '';
    showUpload();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize app
init();
