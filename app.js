const STATE = {
  aiProvider: 'openrouter',
  openRouterKey: null,
  awsAccessKey: null,
  awsSecretKey: null,
  awsRegion: 'us-east-1',
  serpApiKey: null,
  cvText: null,
  searchTerms: null,
  jobs: []
};

// Session storage keys
const STORAGE_KEYS = {
  aiProvider: 'schumpeter_provider',
  openRouter: 'schumpeter_openrouter',
  awsAccessKey: 'schumpeter_aws_access',
  awsSecretKey: 'schumpeter_aws_secret',
  awsRegion: 'schumpeter_aws_region',
  serpApi: 'schumpeter_serpapi',
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
function init() {
  loadFromSession();
  attachListeners();

  // Restore provider selection
  document.getElementById('ai-provider').value = STATE.aiProvider;
  toggleProviderConfig();

  // Restore API keys
  if (STATE.openRouterKey) {
    document.getElementById('openrouter-key').value = STATE.openRouterKey;
  }
  if (STATE.awsAccessKey) {
    document.getElementById('aws-access-key').value = STATE.awsAccessKey;
    document.getElementById('aws-secret-key').value = STATE.awsSecretKey;
    document.getElementById('aws-region').value = STATE.awsRegion;
  }
  if (STATE.serpApiKey) {
    document.getElementById('serpapi-key').value = STATE.serpApiKey;
  }

  if (STATE.jobs && STATE.jobs.length > 0) {
    showResults();
  } else if (STATE.openRouterKey || STATE.awsAccessKey) {
    showUpload();
  }
}

function loadFromSession() {
  STATE.aiProvider = sessionStorage.getItem(STORAGE_KEYS.aiProvider) || 'openrouter';
  STATE.openRouterKey = sessionStorage.getItem(STORAGE_KEYS.openRouter);
  STATE.awsAccessKey = sessionStorage.getItem(STORAGE_KEYS.awsAccessKey);
  STATE.awsSecretKey = sessionStorage.getItem(STORAGE_KEYS.awsSecretKey);
  STATE.awsRegion = sessionStorage.getItem(STORAGE_KEYS.awsRegion) || 'us-east-1';
  STATE.serpApiKey = sessionStorage.getItem(STORAGE_KEYS.serpApi);
  STATE.cvText = sessionStorage.getItem(STORAGE_KEYS.cvText);
  STATE.searchTerms = sessionStorage.getItem(STORAGE_KEYS.searchTerms);
  const storedJobs = sessionStorage.getItem(STORAGE_KEYS.jobs);
  STATE.jobs = storedJobs ? JSON.parse(storedJobs) : [];
}

function saveToSession() {
  sessionStorage.setItem(STORAGE_KEYS.aiProvider, STATE.aiProvider);
  sessionStorage.setItem(STORAGE_KEYS.openRouter, STATE.openRouterKey || '');
  sessionStorage.setItem(STORAGE_KEYS.awsAccessKey, STATE.awsAccessKey || '');
  sessionStorage.setItem(STORAGE_KEYS.awsSecretKey, STATE.awsSecretKey || '');
  sessionStorage.setItem(STORAGE_KEYS.awsRegion, STATE.awsRegion || 'us-east-1');
  sessionStorage.setItem(STORAGE_KEYS.serpApi, STATE.serpApiKey || '');
  sessionStorage.setItem(STORAGE_KEYS.cvText, STATE.cvText || '');
  sessionStorage.setItem(STORAGE_KEYS.searchTerms, STATE.searchTerms || '');
  sessionStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(STATE.jobs));
}

function attachListeners() {
  document.getElementById('ai-provider').addEventListener('change', toggleProviderConfig);
  document.getElementById('save-keys').addEventListener('click', saveKeys);
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
  document.getElementById('aws-access-key').addEventListener('keydown', enterToSave);
  document.getElementById('aws-secret-key').addEventListener('keydown', enterToSave);
  document.getElementById('aws-region').addEventListener('keydown', enterToSave);
  document.getElementById('serpapi-key').addEventListener('keydown', enterToSave);
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
  } else {
    const awsAccessKey = document.getElementById('aws-access-key').value.trim();
    const awsSecretKey = document.getElementById('aws-secret-key').value.trim();
    const awsRegion = document.getElementById('aws-region').value.trim();

    if (!awsAccessKey || !awsSecretKey) {
      showError(setupSection, 'AWS Access Key and Secret Key are required');
      return;
    }

    STATE.awsAccessKey = awsAccessKey;
    STATE.awsSecretKey = awsSecretKey;
    STATE.awsRegion = awsRegion || 'us-east-1';
  }

  STATE.serpApiKey = document.getElementById('serpapi-key').value.trim();
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
  const response = await callLLM([
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

async function searchJobs(searchTerms) {
  const jobs = [];

  // Use SerpAPI if available, otherwise use LLM to suggest searches
  if (STATE.serpApiKey) {
    for (const term of searchTerms.slice(0, 5)) {
      try {
        const serpResults = await searchWithSerpAPI(term);
        jobs.push(...serpResults);
      } catch (error) {
        console.warn('SerpAPI search failed:', error);
      }
    }
  }

  // Fallback: ask LLM to suggest job sources based on search terms
  if (jobs.length < 10) {
    const llmJobs = await getLLMJobSuggestions(searchTerms);
    jobs.push(...llmJobs);
  }

  return jobs;
}

async function searchWithSerpAPI(query) {
  const url = `https://serpapi.com/search?q=${encodeURIComponent(query + ' jobs')}&api_key=${STATE.serpApiKey}&num=10`;
  const response = await fetch(url);
  const data = await response.json();

  return (data.organic_results || []).map(result => ({
    title: result.title,
    company: result.displayed_link || 'Unknown',
    url: result.link,
    snippet: result.snippet
  }));
}

async function getLLMJobSuggestions(searchTerms) {
  const response = await callLLM([
    {
      role: 'user',
      content: `Based on these job search terms, suggest 15 realistic job opportunities that might be available. For each job, provide: title, company (can be generic like "Tech Startup" or "Healthcare Provider"), a realistic job board URL or company careers page, and a brief description.

Search terms: ${searchTerms.join(', ')}

Return as JSON array with objects containing: title, company, url, snippet`
    }
  ]);

  try {
    return JSON.parse(response);
  } catch {
    return [];
  }
}

async function rankJobs(cvText, searchTerms, jobs) {
  const response = await callLLM([
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
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STATE.openRouterKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Schumpeter Job Finder'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: messages
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
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

  // Sign request using AWS Signature V4
  const endpoint = `https://bedrock-runtime.${region}.amazonaws.com`;
  const path = `/model/${modelId}/invoke`;

  const signedRequest = await signAwsRequest(
    'POST',
    endpoint,
    path,
    JSON.stringify(body),
    region,
    'bedrock'
  );

  const response = await fetch(`${endpoint}${path}`, signedRequest);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bedrock API error: ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function signAwsRequest(method, endpoint, path, body, region, service) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const headers = {
    'Content-Type': 'application/json',
    'X-Amz-Date': amzDate,
    'Host': new URL(endpoint).host
  };

  // Create canonical request
  const canonicalUri = path;
  const canonicalQuerystring = '';
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
    .join('');
  const signedHeaders = Object.keys(headers)
    .map(key => key.toLowerCase())
    .sort()
    .join(';');

  const payloadHash = await sha256(body);
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  // Calculate signature
  const signingKey = await getSignatureKey(STATE.awsSecretKey, dateStamp, region, service);
  const signature = await hmacSha256(stringToSign, signingKey);

  // Add authorization header
  headers['Authorization'] = `${algorithm} Credential=${STATE.awsAccessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    method: method,
    headers: headers,
    body: body
  };
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(message, key) {
  const encoder = new TextEncoder();
  const keyBuffer = typeof key === 'string' ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(key, dateStamp, region, service) {
  const kDate = await hmacSha256Raw(dateStamp, `AWS4${key}`);
  const kRegion = await hmacSha256Raw(region, kDate);
  const kService = await hmacSha256Raw(service, kRegion);
  const kSigning = await hmacSha256Raw('aws4_request', kService);
  return kSigning;
}

async function hmacSha256Raw(message, key) {
  const encoder = new TextEncoder();
  const keyBuffer = typeof key === 'string' ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return new Uint8Array(signature);
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
