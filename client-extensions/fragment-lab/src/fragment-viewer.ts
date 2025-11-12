import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// 1. Define the data structure based on your YAML
interface FragmentDetail {
  id: number;
  fragmentName: string;
  description: string;
  configuration: string;
  javaScript: string;
  html: string;
  css: string;
  usageSteps: string;
}

// 2. Define the types for the Liferay global object
declare global {
  interface Window {
    Liferay: {
      authToken: string;
      ThemeDisplay: {
        getSiteGroupId: () => number; // This is the scopeKey
      };
    };
  }
}

@customElement('fragment-viewer')
export class FragmentViewer extends LitElement {
  
  // --- State Properties ---

  @state()
  private _fragments: FragmentDetail[] = [];

  @state()
  private _selectedId: number | null = null;

  @state()
  private _isLoading = true;

  @state()
  private _error: string | null = null;
  
  // --- Lifecycle Methods ---

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchFragmentData();
  }

  // --- Data Fetching ---

  async fetchFragmentData() {
    this._isLoading = true;
    this._error = null;

    try {
      // 1. Get Liferay auth token and Site ID (scopeKey)
      const authToken = window.Liferay?.authToken;
      const siteId = window.Liferay?.ThemeDisplay.getSiteGroupId();

      if (!authToken || !siteId) {
        throw new Error('Liferay context (authToken or siteId) not found.');
      }

      // 2. Define your API endpoint based on the YAML
      const apiEndpoint = `/o/c/fragmentdetails/scopes/${siteId}?sort=fragmentName:asc`;

      // 3. Make the authenticated fetch request
      const response = await fetch(apiEndpoint, {
        headers: {
          'x-csrf-token': authToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this._fragments = data.items || [];
      
    } catch (e: any) {
      console.error(e);
      this._error = e.message || 'Failed to fetch fragment data.';
    } finally {
      this._isLoading = false;
    }
  }

  // --- Event Handlers ---

  private _handleSelect(id: number) {
    this._selectedId = id;
  }

  private _copyToClipboard(text: string, event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    navigator.clipboard.writeText(text).then(() => {
      // Add "copied" class for CSS flash and update text
      button.classList.add('copied');
      button.innerHTML = 'Copied!';
      button.disabled = true;
      
      // Remove feedback after 1.5 seconds
      setTimeout(() => {
        button.classList.remove('copied');
        button.innerHTML = '📋 Copy';
        button.disabled = false;
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // Optional: add an error flash
      button.innerHTML = 'Error!';
      setTimeout(() => {
        button.innerHTML = '📋 Copy';
      }, 1500);
    });
  }

  // --- Render Helpers ---

  /**
   * Renders the main view: list on left, detail on right.
   */
  private _renderLayout() {
    const selectedFragment = this._fragments.find(
      (f) => f.id === this._selectedId
    );

    return html`
      <div class="container">
        <div class="list-panel">
          ${this._fragments.map(
            (fragment) => html`
              <div
                class="list-item ${fragment.id === this._selectedId ? 'selected' : ''}"
                @click=${() => this._handleSelect(fragment.id)}
              >
                <strong>${fragment.fragmentName}</strong>
                <p>${fragment.description}</p>
              </div>
            `
          )}
        </div>

        <div class="detail-panel">
          ${selectedFragment
            ? this._renderDetail(selectedFragment)
            : html`<div class="placeholder">Select a fragment from the list to see its details.</div>`
          }
        </div>
      </div>
    `;
  }

  /**
   * Renders the detail view for a specific fragment.
   */
  // <-- UPDATED: Reordered this method
  private _renderDetail(fragment: FragmentDetail) {
    return html`
      <div class="detail-content">
        <h2>${fragment.fragmentName}</h2>
        <p class="description">${fragment.description}</p>
        
        <h3>Usage Details</h3>
        <div class="usage-details">
          ${unsafeHTML(fragment.usageSteps)}
        </div>

        ${this._renderCodeBlock('Configuration', fragment.configuration)}
        ${this._renderCodeBlock('JavaScript', fragment.javaScript)}
        ${this._renderCodeBlock('HTML', fragment.html)}
        ${this._renderCodeBlock('CSS', fragment.css)}
      </div>
    `;
  }

  /**
   * Renders a single code block with a title and copy button.
   */
  private _renderCodeBlock(title: string, code: string) {
    if (!code || code.trim() === '') {
      return nothing;
    }

    return html`
      <div class="code-block">
        <div class="header">
          <strong>${title}</strong>
          <button class="copy-btn" @click=${(e: MouseEvent) => this._copyToClipboard(code, e)}>
            📋 Copy
          </button>
        </div>
        <pre><code>${code}</code></pre>
      </div>
    `;
  }

  // --- Main Render Method ---

  render() {
    if (this._isLoading) {
      return html`<p>Loading fragments...</p>`;
    }

    if (this._error) {
      return html`<p class="error"><strong>Error:</strong> ${this._error}</p>`;
    }

    if (this._fragments.length === 0) {
      return html`<p>No fragments found.</p>`;
    }

    return this._renderLayout();
  }

  // --- Styles ---

  static styles = css`
    :host {
      display: block;
      font-family: Arial, sans-serif;
      border: 1px solid #ccc;
      border-radius: 8px;
      overflow: hidden;
      height: 70vh;
      min-height: 400px;
    }

    .container {
      display: flex;
      height: 100%;
    }

    /* --- Left List Panel --- */

    .list-panel {
      width: 35%;
      min-width: 250px;
      background: #f9f9f9;
      border-right: 1px solid #ccc;
      overflow-y: auto;
    }

    .list-item {
      padding: 1rem;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .list-item:hover {
      background-color: #f0f0f0;
    }

    .list-item.selected {
      background-color: #e0eafc;
      border-left: 4px solid #005fff;
      padding-left: calc(1rem - 4px);
    }

    .list-item p {
      font-size: 0.9em;
      color: #555;
      margin: 0.25rem 0 0 0;
      white-space: normal;
      word-break: break-word;
    }

    /* --- Right Detail Panel --- */

    .detail-panel {
      flex: 1;
      overflow-y: auto;
    }
    
    .detail-content {
       padding: 1.5rem;
    }

    .placeholder {
      padding: 2rem;
      text-align: center;
      color: #777;
      font-size: 1.1em;
    }
    
    h2 {
      margin-top: 0;
    }
    
    .description {
      font-size: 1.1em;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 1rem;
    }

    /* --- Code Block --- */

    .code-block {
      margin: 1.5rem 0;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .code-block .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f7f7f7;
      padding: 0.5rem 1rem;
      border-bottom: 1px solid #ddd;
    }
    
    .copy-btn {
      font-size: 0.8em;
      padding: 0.25rem 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
    }
    
    .copy-btn.copied {
      background-color: #ccebc5;
      border-color: #a8dba3;
      color: #276221;
    }

    pre {
      margin: 0;
      background: #fafafa;
      padding: 1rem;
      overflow-x: auto;
      max-height: 300px;
      font-family: 'Courier New', Courier, monospace;
    }
    
    code {
      font-size: 0.9em;
    }

    /* --- Usage Details --- */

    .usage-details {
      margin-top: 0.5rem; /* Reduced margin a bit */
      margin-bottom: 1.5rem; /* Added margin to separate from code blocks */
      padding-bottom: 1.5rem; /* Added padding */
      border-bottom: 1px solid #eee; /* Separator */
    }

    .usage-details p {
      line-height: 1.6;
      margin-top: 0;
    }

    .usage-details code {
      background: #f0f0f0;
      padding: 2px 4px;
      border-radius: 3px;
    }
    
    .error {
      color: #d8000c;
      background-color: #ffbaba;
      border: 1px solid #d8000c;
      padding: 1rem;
      margin: 1rem;
    }
  `;
}


