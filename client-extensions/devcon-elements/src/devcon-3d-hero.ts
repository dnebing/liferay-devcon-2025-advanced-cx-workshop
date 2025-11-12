/**
 * <devcon-3d-hero>
 * Displays a 3D model using Google's <model-viewer> component.
 *
 * Props (attributes):
 * - src: string (GLB/GLTF URL)
 * - poster: string (image URL to show before model loads)
 * - alt: string (accessible alt text)
 * - caption: string (localized or contextual caption)
 * - autoRotate: boolean (spin automatically)
 * - ar: boolean (enable AR button)
 * - cameraOrbit: string (initial camera angle)
 *
 * Slot:
 * - <slot name="cta"></slot>  → For a custom call-to-action under the model
 */

import {LitElement, html, css, nothing} from 'lit';
import {property} from 'lit/decorators.js';

export class Devcon3dHero extends LitElement {
  // --- Properties ---
  @property({reflect: true}) src = '';
  @property({reflect: true}) poster = '';
  @property({reflect: true}) alt = '';
  @property({reflect: true}) caption = '';
  @property({type: Boolean, reflect: true}) autoRotate = false;
  @property({type: Boolean, reflect: true}) ar = false;
  @property({reflect: true}) cameraOrbit = '0deg 75deg 2.5m';

  // --- Styling ---
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
    }

    model-viewer {
      width: var(--devcon-3d-width, 400px);
      height: var(--devcon-3d-height, 400px);
      background-color: var(--devcon-3d-bg, transparent);
    }

    figcaption {
      font-size: 1rem;
      font-weight: 500;
      color: var(--devcon-3d-caption-color, #333);
    }

    ::slotted([slot="cta"]) {
      margin-top: 0.5rem;
    }
  `;

  // --- Render ---
  render() {
    if (!this.src) return html`<p>No model source provided</p>`;

    return html`
      <figure>
        <model-viewer
          src=${this.src}
          poster=${this.poster || nothing}
          alt=${this.alt || nothing}
          camera-orbit=${this.cameraOrbit}
          ?ar=${this.ar}
          ?auto-rotate=${this.autoRotate}
          shadow-intensity="1"
          camera-controls
          touch-action="pan-y"
          style="border-radius: 8px; overflow: hidden;">
        </model-viewer>

        ${this.caption
          ? html`<figcaption>${this.caption}</figcaption>`
          : nothing}

        <slot name="cta"></slot>
      </figure>
    `;
  }
}

customElements.define('devcon-three-d-hero', Devcon3dHero);
