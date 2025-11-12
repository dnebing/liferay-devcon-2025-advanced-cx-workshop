/**
 * <devcon-lottie-cta>
 * Animated call-to-action button using a Lottie player.
 *
 * Props (attributes):
 * - src: string (URL to .lottie or .json animation)
 * - label: string (CTA label)
 * - href: string (link URL; if empty, acts as a button)
 * - autoplay: boolean
 * - loop: boolean
 * - speed: number
 *
 * Events:
 * - "cta:click"  detail: { href?: string }
 *
 * A11y:
 * - The animation gets aria-hidden="true".
 * - The anchor/button carries the accessible label.
 */

import {LitElement, html, css, nothing} from 'lit';
import {property} from 'lit/decorators.js';

export class DevconLottieCta extends LitElement {
  /** Size of the animation in pixels */
  @property({type: Number, reflect: true}) size = 64;

  static styles = css`
  :host {
    display: inline-flex;
    align-items: center;   /* vertical centering */
    /* remove the generic gap so we control spacing precisely */
  }

  .anim {
    width: var(--devcon-lottie-size, 48px);
    height: var(--devcon-lottie-size, 48px);
    line-height: 0;

    /* keep the player centered inside the box and prevent squish */
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* helpful to avoid inline element quirks */
  dotlottie-player {
    display: block;
  }

  .cta {
    display: inline-flex;
    align-items: center;
    /* fixed 20px left gap from the animation */
    margin-left: 20px;

    text-decoration: none;
    padding: .5rem .75rem;
    border-radius: .5rem;
    border: 1px solid var(--devcon-cta-border, transparent);
    background: var(--devcon-cta-bg, #0b5fff);
    color: var(--devcon-cta-fg, #fff);
    font-weight: 600;
    cursor: pointer;
  }

  .cta:focus {
    outline: 2px solid var(--devcon-cta-outline, #0b5fff);
    outline-offset: 2px;
  }
`;

  /** URL to the animation (json or .lottie) */
  @property({reflect: true}) src = '';

  /** CTA label (also used as accessible name) */
  @property({reflect: true}) label = 'Do the thing';

  /** Destination URL (if empty, behaves like a button) */
  @property({reflect: true}) href = '';

  /** Autoplay animation */
  @property({type: Boolean, reflect: true}) autoplay = false;

  /** Loop animation */
  @property({type: Boolean, reflect: true}) loop = false;

  /** Playback speed */
  @property({type: Number, reflect: true}) speed = 1;

  private _onActivate = (e: Event) => {
    // If acting as button, prevent navigation
    if (!this.href) e.preventDefault();
    this.dispatchEvent(new CustomEvent('cta:click', { detail: { href: this.href || undefined } }));
  }

  render() {
    const sizePx = `${this.size}px`;

    // We don't import the player here; the fragment's import map loads it.
    // That keeps the element generic and hot-swappable.
    const Anim = this.src
      ? html`
        <div class="anim" style="--devcon-lottie-size:${sizePx}" aria-hidden="true">
          <dotlottie-player
            src=${this.src}
            ?autoplay=${this.autoplay}
            ?loop=${this.loop}
            speed=${String(this.speed)}
            style="width:${sizePx};height:${sizePx}">
          </dotlottie-player>
        </div>`
      : nothing;

    const Tag = (this.href ? 'a' : 'button') as keyof HTMLElementTagNameMap;

    return html`
      ${Anim}
      <${Tag}
        class="cta"
        href=${this.href || nothing}
        @click=${this._onActivate}
        aria-label=${this.label}
        title=${this.label}>
        ${this.label}
      </${Tag}>
    `;
  }
}

customElements.define('devcon-lottie-cta', DevconLottieCta);

