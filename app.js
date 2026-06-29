const STATE = {
  openRouterKey: null,
  serpApiKey: null,
  cvText: null,
  searchTerms: null,
  jobs: []
};

// Session storage keys
const STORAGE_KEYS = {
  openRouter: 'schumpeter_openrouter',
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

  if (STATE.openRouterKey) {
    document.getElementById('openrouter-key').value = STATE.openRouterKey;
    document.getElementById('serpapi-key').value = STATE.serpApiKey || '';
  }

  if (STATE.jobs && STATE.jobs.length > 0) {
    showResults();
  } else if (STATE.openRouterKey) {
    showUpload();
  }
}

function loadFromSession() {
  STATE.openRouterKey = sessionStorage.getItem(STORAGE_KEYS.openRouter);
  STATE.serpApiKey = sessionStorage.getItem(STORAGE_KEYS.serpApi);
  STATE.cvText = sessionStorage.getItem(STORAGE_KEYS.cvText);
  STATE.searchTerms = sessionStorage.getItem(STORAGE_KEYS.searchTerms);
  const storedJobs = sessionStorage.getItem(STORAGE_KEYS.jobs);
  STATE.jobs = storedJobs ? JSON.parse(storedJobs) : [];
}

function saveToSession() {
  sessionStorage.setItem(STORAGE_KEYS.openRouter, STATE.openRouterKey || '');
  sessionStorage.setItem(STORAGE_KEYS.serpApi, STATE.serpApiKey || '');
  sessionStorage.setItem(STORAGE_KEYS.cvText, STATE.cvText || '');
  sessionStorage.setItem(STORAGE_KEYS.searchTerms, STATE.searchTerms || '');
  sessionStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(STATE.jobs));
}

function attachListeners() {
  document.getElementById('save-keys').addEventListener('click', saveKeys);
  dropZone.addEventListener('click', () => cvInput.click());
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  cvInput.addEventListener('change', handleFileSelect);
  document.getElementById('start-over').addEventListener('click', startOver);

  // Keyboard shortcuts
  document.getElementById('openrouter-key').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveKeys();
  });
  document.getElementById('serpapi-key').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveKeys();
  });
}

function saveKeys() {
  const openRouterKey = document.getElementById('openrouter-key').value.trim();
  const serpApiKey = document.getElementById('serpapi-key').value.trim();

  if (!openRouterKey) {
    showError(setupSection, 'OpenRouter API key is required');
    return;
  }

  STATE.openRouterKey = openRouterKey;
  STATE.serpApiKey = serpApiKey;
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
