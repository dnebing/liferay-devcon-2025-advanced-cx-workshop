import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { keyed } from 'lit/directives/keyed.js';

// 1. Define the data structure (Unchanged)
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

// 2. Define the types for the Liferay/Prism global objects
declare global {
  interface Window {
    Liferay: {
      authToken: string;
      ThemeDisplay: {
        getSiteGroupId: () => number;
      };
    };
    Prism: {
      highlightAllUnder: (element: Element | Document | ShadowRoot) => void;
    };
  }
}

/**
 * A global cache for our adopted stylesheet.
 */
let prismStyleSheet: CSSStyleSheet | null = null;

@customElement('fragment-viewer')
export class FragmentViewer extends LitElement {
  
  // --- State Properties (Unchanged) ---

  @state()
  private _fragments: FragmentDetail[] = [];
  @state()
  private _selectedId: number | null = null;
  @state()
  private _isLoading = true;
  @state()
  private _error: string | null = null;
  
  // --- Lifecycle Methods (Unchanged) ---

  async connectedCallback() {
    super.connectedCallback();

    if (this.shadowRoot) {
      if (prismStyleSheet) {
        // Style sheet is already cached, just adopt it.
        this.shadowRoot.adoptedStyleSheets = [
          ...this.shadowRoot.adoptedStyleSheets,
          prismStyleSheet
        ];
      } else {
        // Style sheet not cached, let's find and fetch it.
        const prismLink = document.querySelector('link[href*="prism.css"]') as HTMLLinkElement;
        
        if (prismLink) {
          try {
            // Fetch the CSS text from the URL Liferay loaded
            const response = await fetch(prismLink.href);
            const cssText = await response.text();
            
            // Create a new stylesheet and cache it
            prismStyleSheet = new CSSStyleSheet();
            await prismStyleSheet.replace(cssText);
            
            // Adopt the new stylesheet
            this.shadowRoot.adoptedStyleSheets = [
              ...this.shadowRoot.adoptedStyleSheets,
              prismStyleSheet
            ];
          } catch (e) {
            console.error("FragmentViewer: Failed to fetch and adopt prism.css", e);
          }
        } else {
           console.warn("FragmentViewer: Could not find prism.css <link> tag to adopt.");
        }
      }
    }

    // Now, fetch the data
    await this.fetchFragmentData();
  }

  // Helper function (Unchanged)
  private _waitFor(globalName: string, timeout = 3000): Promise<any> {
    return new Promise((resolve, reject) => {
      let checkCount = 0;
      const intervalTime = 100;
      const maxChecks = timeout / intervalTime;
      const interval = setInterval(() => {
        // @ts-ignore
        if (window[globalName]) {
          clearInterval(interval);
          // @ts-ignore
          resolve(window[globalName]);
        } else if (checkCount > maxChecks) {
          clearInterval(interval);
          reject(new Error(`'${globalName}' not found after ${timeout}ms`));
        }
        checkCount++;
      }, intervalTime);
    });
  }

  // updated() method (Unchanged)
  async updated() {
    if (this._selectedId && !this._isLoading) {
      try {
        const Prism = await this._waitFor('Prism');
        if (this.shadowRoot) {
          Prism.highlightAllUnder(this.shadowRoot);
        }
      } catch (e) {
        console.error("FragmentViewer Error:", e, "Did prism.js load?");
      }
    }
  }

  // --- Data Fetching (Unchanged) ---

  async fetchFragmentData() {
    this._isLoading = true;
    this._error = null;
    try {
      const authToken = window.Liferay?.authToken;
      const siteId = window.Liferay?.ThemeDisplay.getSiteGroupId();
      if (!authToken || !siteId) {
        throw new Error('Liferay context (authToken or siteId) not found.');
      }
      const apiEndpoint = `/o/c/fragmentdetails/scopes/${siteId}?sort=fragmentName:asc`;
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

  // --- Event Handlers (Unchanged) ---

  private _handleSelect(id: number) {
    this._selectedId = id;
  }

  // --- Render Helpers ---

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
            ? keyed(selectedFragment.id, this._renderDetail(selectedFragment))
            : html`<div class="placeholder">Select a fragment from the list to see its details.</div>`
          }
        </div>
      </div>
    `;
  }

  private _renderDetail(fragment: FragmentDetail) {
    return html`
      <div class="detail-content">
        <h2>${fragment.fragmentName}</h2>
        <p class="description">${fragment.description}</p>
        
        <h3>Usage Details</h3>
        <div class="usage-details">
          ${unsafeHTML(fragment.usageSteps)}
        </div>

        <h3>Configuration</h3>
        ${this._renderCodeBlock(fragment.configuration, 'json')}

        <h3>JavaScript</h3>
        ${this._renderCodeBlock(fragment.javaScript, 'javascript')}

        <h3>HTML (FreeMarker)</h3>
        ${this._renderCodeBlock(fragment.html, 'liferay-ftl')}

        <h3>CSS</h3>
        ${this._renderCodeBlock(fragment.css, 'css')}
      </div>
    `;
  }

  // UPDATED type signature
  private _renderCodeBlock(code: string, language: 'json' | 'javascript' | 'liferay-ftl' | 'css') {
    if (!code || code.trim() === '') {
      return nothing;
    }
    return html`
      <div class="code-block">
        <pre class="line-numbers" style="white-space: pre-wrap;"><code class="language-${language}">${code}</code></pre>
      </div>
    `;
  }

  // --- Main Render Method (Unchanged) ---

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

    /* --- Left List Panel (Unchanged) --- */
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
      background-color: #f0f2f0;
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

    /* --- Right Detail Panel (Unchanged) --- */
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

    /* --- Code Block (Unchanged) --- */
    h3 {
      margin-top: 2rem;
    }
    .code-toolbar {
      margin: 10px 0;
    }
    pre {
      max-height: 300px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    /* --- Usage Details (Unchanged) --- */
    .usage-details {
      margin-top: 0.5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #eee;
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

    /*
     * --- ⭐️⭐️⭐️ UPDATED PRISM TOOLBAR OVERRIDES ⭐️⭐️⭐️ ---
     */
    
    /* 1. Move the whole toolbar left and add your margins */
    .code-toolbar > .toolbar {
      right: 35px; /* Moves it left, away from scrollbar */
      z-index: 10;
      
      /* Your requested layout fixes */
      margin-top: 5px;
      margin-right: 15px;
    }

    /* 2. Target the button for new size and colors (Unchanged) */
    .copy-to-clipboard-button {
      font-size: 1.05em !important;
      padding: 0.4em 0.8em !important;
      background: #e0eafc !important;
      color: #005fff !important;
      border: 1px solid #005fff !important;
      box-shadow: 0 1px 1px rgba(0,0,0,0.1) !important;
      border-radius: 0.5em !important;
    }

    /* 3. Target the button's hover state (Unchanged) */
    .copy-to-clipboard-button:hover {
      background: #005fff !important;
      color: #ffffff !important;
    }

    /* 4. Style the "Copied!" success state (Unchanged) */
    .copy-to-clipboard-button[data-copy-state="copy-success"] {
      background: #ccebc5 !important;
      color: #276221 !important;
    }
  `;
}
