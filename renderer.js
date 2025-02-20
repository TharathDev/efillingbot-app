// Paste clipboard content into text areas
async function pasteToTextJsContent() {
  const text = await navigator.clipboard.readText();
  document.getElementById('textJsContent').value = text;
  updateBodyDataDisplay({}, {});
}

document.getElementById('switch-to-salary').addEventListener('click', () => {
  window.location.href = 'salary.html';
});

function clearTextJsContent() {
  document.getElementById('textJsContent').value = '';
  updateBodyDataDisplay();
}

async function pasteToJsonData() {
  const text = await navigator.clipboard.readText();
  try {
    const parsed = JSON.parse(text);
    document.getElementById('jsonData').value = JSON.stringify(parsed, null, 2);
    updateBodyDataDisplay({}, parsed);
  } catch (error) {
    document.getElementById('jsonData').value = '';
    alert('Invalid JSON format - please paste valid JSON data');
    updateBodyDataDisplay({}, {});
  }
}

function clearJsonData() {
  document.getElementById('jsonData').value = '';
  updateBodyDataDisplay();
}

// Update side panel with current form data
function updateBodyDataDisplay(textJsData = {}, jsonData = {}) {
  const bodyData = document.getElementById('body-data');
  
  try {
    // Extract body from textJsData similar to backend.js
    const bodyPattern = /"body":\s*"(.*?[^\\])"/s;
    const bodyMatch = textJsData.match(bodyPattern);
    const body = bodyMatch ? bodyMatch[1] : "Not found";
    const cleanedBody = body.replace(/^"|"$/g, '').replace(/\\"/g, '"');
    
    // Parse the body JSON to an object
    let bodyObject = {};
    try {
      bodyObject = JSON.parse(cleanedBody);
    } catch (error) {
      console.error("Failed to parse body JSON:", error);
    }

    // Add jsonData fields to bodyObject
    Object.entries(jsonData).forEach(([key, value]) => {
      if (key === "TOTAL_AMT" || key === "ACCOM_AMT") {
        bodyObject[key] = parseFloat(value.replace(/,/g, "").trim());
      } else {
        bodyObject[key] = value.trim();
      }
    });

    console.log("Request Body Data:", bodyObject);

    // Clear existing content
    bodyData.innerHTML = '';
    
    // Create grid items
    Object.entries(bodyObject).forEach(([key, value]) => {
      const keyElem = document.createElement('div');
      keyElem.className = 'key';
      keyElem.textContent = key;
      
      const valueElem = document.createElement('div');
      valueElem.className = 'value';
      valueElem.textContent = JSON.stringify(value, null, 2);
      
      bodyData.appendChild(keyElem);
      bodyData.appendChild(valueElem);
    });
    
  } catch (error) {
    bodyData.textContent = 'Invalid JSON data';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('invoice-form');
  const textJsContent = document.getElementById('textJsContent');
  const jsonData = document.getElementById('jsonData');
  const results = document.getElementById('results');
  const terminal = document.getElementById('terminal');
  const toggleTerminalBtn = document.getElementById('toggle-terminal');
  const bodyData = document.getElementById('body-data');
  let isTerminalExpanded = false;

  // Add clear button functionality
  const clearButtons = document.querySelectorAll('.clear-button');
  clearButtons[0].addEventListener('click', () => {
    document.getElementById('textJsContent').value = '';
    // Only update text JS content display
    const textJsContent = document.getElementById('textJsContent').value;
    try {
      const parsedTextJs = textJsContent ? JSON.parse(textJsContent) : {};
      updateBodyDataDisplay(parsedTextJs, {});
    } catch (error) {
      updateBodyDataDisplay({}, {});
    }
  });
  clearButtons[1].addEventListener('click', () => {
    document.getElementById('jsonData').value = '';
    // Only update JSON data display
    const jsonData = document.getElementById('jsonData').value;
    try {
      const parsedJson = jsonData ? JSON.parse(jsonData) : {};
      updateBodyDataDisplay({}, parsedJson);
    } catch (error) {
      updateBodyDataDisplay({}, {});
    }
  });

  // Remove existing paste buttons if they exist
  const existingTextJsBtn = document.getElementById('paste-textjs-btn');
  if (existingTextJsBtn) {
    existingTextJsBtn.remove();
  }
  const existingJsonBtn = document.getElementById('paste-json-btn');
  if (existingJsonBtn) {
    existingJsonBtn.remove();
  }

  // Setup form change listeners
  textJsContent.addEventListener('input', updateBodyDataDisplay);
  jsonData.addEventListener('input', updateBodyDataDisplay);

  // Terminal management functions
  function logToTerminal(message, type = 'info') {
    const p = document.createElement('p');
    p.textContent = message;
    p.className = type;
    terminal.appendChild(p);
    terminal.scrollTop = terminal.scrollHeight;
  }

  function toggleTerminal() {
    isTerminalExpanded = !isTerminalExpanded;
    terminal.classList.toggle('collapsed');
    toggleTerminalBtn.textContent = isTerminalExpanded ? '▼' : '▲';
  }

  // Setup terminal toggle
  toggleTerminalBtn.addEventListener('click', toggleTerminal);

  // Setup progress listener
  window.electronAPI.onProcessingProgress((event, message) => {
    logToTerminal(message, 
      message.includes('Processing') ? 'processing' :
      message.includes('successfully') ? 'success' :
      message.includes('Failed') ? 'error' : 'info'
    );
  });

  let invoiceHistory = [];

  function displayResults(response) {
    const table = document.createElement('table');
    table.classList.add('results-table');
    
    // Create table header
    const header = `
      <tr>
        <th>Invoice No</th>
        <th>Status</th>
        <th>Message</th>
      </tr>
    `;
    
    // Create table rows
    const rows = response.data.successfulInvoices.map(inv => `
      <tr class="${inv.message === 'OK' ? 'success' : 'warning'}">
        <td>${inv.inv_no}</td>
        <td>${inv.message === 'OK' ? 'Success' : 'Warning'}</td>
        <td>${inv.message}</td>
      </tr>
    `).join('');
    
    // Add failed invoices
    const failedRows = response.data.failedInvoices.map(inv => `
      <tr class="error">
        <td>${inv}</td>
        <td>Failed</td>
        <td>Processing error</td>
      </tr>
    `).join('');
    
    table.innerHTML = header + rows + failedRows;
    return table;
  }

  function updateHistoryDisplay() {
    results.innerHTML = '';
    invoiceHistory.forEach((response, index) => {
      const section = document.createElement('div');
      section.classList.add('history-section');
      
      const header = document.createElement('h3');
      header.textContent = `Processing Batch ${index + 1}`;
      section.appendChild(header);
      
      section.appendChild(displayResults(response));
      results.appendChild(section);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear terminal but keep results
    terminal.innerHTML = '';

    try {
      const response = await window.electronAPI.processInvoices(
        textJsContent.value,
        JSON.parse(jsonData.value)
      );

      // Add to history and update display
      invoiceHistory.push(response);
      updateHistoryDisplay();
    } catch (error) {
      results.innerHTML = `
        <h3>Error Processing Invoices</h3>
        <p>${error.message}</p>
      `;
      logToTerminal(`Error: ${error.message}`, 'error');
    }
  });
});
