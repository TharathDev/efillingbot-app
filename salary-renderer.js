document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('salary-form');
    const resultsDiv = document.getElementById('results');
    const terminal = document.getElementById('terminal');
    const toggleTerminal = document.getElementById('toggle-terminal');
  
    // Terminal toggle functionality
    toggleTerminal.addEventListener('click', () => {
      terminal.classList.toggle('collapsed');
      toggleTerminal.textContent = terminal.classList.contains('collapsed') ? '▲' : '▼';
    });
  
    // Clear button functionality
    document.querySelectorAll('.clear-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const textarea = e.target.closest('.textarea-container').querySelector('textarea');
        textarea.value = '';
      });
    });
  
    // Paste functionality
    window.pasteToTextJsContent = async () => {
      const text = await navigator.clipboard.readText();
      document.getElementById('textJsContent').value = text;
    };
  
    window.pasteToJsonData = async () => {
      const text = await navigator.clipboard.readText();
      document.getElementById('jsonData').value = text;
    };
  
    // Process form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const textJsContent = document.getElementById('textJsContent').value;
      let jsonData;
      
      try {
        jsonData = JSON.parse(document.getElementById('jsonData').value);
      } catch (error) {
        alert('Invalid JSON data. Please check your input.');
        return;
      }
  
      resultsDiv.innerHTML = 'Processing...';
      terminal.innerHTML = '';
  
      try {
        const result = await window.electronAPI.processSalary(textJsContent, jsonData);
        
        let resultHtml = '<h3>Processing Complete</h3>';
        resultHtml += `<p>✅ Successfully Processed: ${result.successfulInvoices.length}</p>`;
        resultHtml += `<p>❌ Failed: ${result.failedInvoices.length}</p>`;
        
        if (result.errors.length > 0) {
          resultHtml += '<h4>Errors:</h4><ul>';
          result.errors.forEach(error => {
            resultHtml += `<li>${error.employee || ''}: ${error.error}</li>`;
          });
          resultHtml += '</ul>';
        }
        
        resultsDiv.innerHTML = resultHtml;
      } catch (error) {
        resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
      }
    });
  
    // Navigation
    document.getElementById('switch-to-invoice').addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  
    // Progress updates
    window.electronAPI.onProcessingProgress((event, message) => {
      const line = document.createElement('div');
      line.textContent = message;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;
    });
  });