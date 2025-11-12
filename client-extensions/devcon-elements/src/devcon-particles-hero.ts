import {LitElement, html, css} from 'lit';
import {property} from 'lit/decorators.js';

// Keep types light to avoid version friction
type TsParticles = {
  load: (id: string, options: any) => Promise<void>;
};

export class DevconParticlesHero extends LitElement {
  /** Visual preset */
  @property({reflect: true}) preset: 'links' | 'stars' | 'bubbles' | 'snow' = 'links';

  /** Base color for particles/links (CSS color) */
  @property({reflect: true}) color = '#4b9fff';

  /** How many particles to try to render (engine adapts to perf) */
  @property({type: Number, reflect: true}) density = 50;

  /** Interactivity: hover repulse/attract/off */
  @property({reflect: true}) hover: 'repulse' | 'attract' | 'off' = 'repulse';

  /** Click action: push/remove/off — renamed to avoid HTMLElement.click() conflict */
  @property({attribute: 'click-mode', reflect: true})
  clickMode: 'push' | 'remove' | 'off' = 'push';

  /** Background color/gradient under the canvas; 'transparent' shows page */
  @property({reflect: true}) background = 'transparent';

  /** Blur the background for a frosted-glass feel behind content */
  @property({type: Boolean, reflect: true}) backdropBlur = false;

  /** Shadow behind foreground content to improve readability */
  @property({type: Boolean, reflect: true}) contentShadow = true;

  /** Internal id for the canvas container */
  private _id = `devcon-particles-${Math.random().toString(36).slice(2)}`;
  private _engine: TsParticles | null = null;
  private _loadedOnce = false;

  static styles = css`
    :host {
      display: block;
      position: relative;
      /* Customize the section height and content width */
      --devcon-hero-height: 360px;
      --devcon-hero-max-width: 960px;

      /* Foreground content styling */
      --devcon-content-bg: rgba(255,255,255,0.06);
      --devcon-content-radius: 16px;
      --devcon-content-padding: 1rem 1.25rem;
    }

    .wrap {
      position: relative;
      min-height: var(--devcon-hero-height);
      isolation: isolate;
      overflow: hidden;
      border-radius: var(--devcon-hero-radius, 0);
    }

    /* Particles canvas holder */
    .bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      background: var(--devcon-hero-background, transparent);
      will-change: transform;
      contain: layout paint;
      filter: var(--devcon-hero-filter, none);
    }

    /* Foreground content */
    .content {
      position: relative;
      z-index: 1;
      max-width: var(--devcon-hero-max-width);
      margin: 0 auto;
      height: 100%;

      display: grid;
      align-items: center;
      justify-items: start;
      padding: var(--devcon-hero-padding, 1.25rem);

      /* optional backdrop blur on the area behind the content grid */
      backdrop-filter: var(--devcon-content-backdrop, none);
    }

    .content-inner {
      background: var(--devcon-content-bg);
      padding: var(--devcon-content-padding);
      border-radius: var(--devcon-content-radius);
      box-shadow: var(--devcon-content-shadow, none);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._maybeLoad();
  }

  protected firstUpdated(): void {
    this._initParticles();
  }

  protected updated(changed: Map<string, unknown>): void {
    if (
      this._loadedOnce &&
      (changed.has('preset') ||
        changed.has('density') ||
        changed.has('color') ||
        changed.has('hover') ||
        changed.has('clickMode') ||
        changed.has('background') ||
        changed.has('backdropBlur') ||
        changed.has('contentShadow'))
    ) {
      this._initParticles();
    }
  }

  private async _maybeLoad() {
    if (this._engine) return;
    // Dynamic import so Vite can code-split
    const [{ tsParticles }, { loadSlim }] = await Promise.all([
      import('tsparticles-engine'),
      import('tsparticles-slim')
    ]);
    await (loadSlim as any)(tsParticles);
    this._engine = tsParticles as unknown as TsParticles;
  }

  private _options() {
    const interactivityEvents: any = { onHover: { enable: false }, onClick: { enable: false } };
    if (this.hover !== 'off') {
      interactivityEvents.onHover = { enable: true, mode: this.hover };
    }
    if (this.clickMode !== 'off') {
      interactivityEvents.onClick = { enable: true, mode: this.clickMode };
    }

    // Base shapes per preset
    const shape = (() => {
      switch (this.preset) {
        case 'stars':   return { type: 'star' };
        case 'bubbles': return { type: 'circle' };
        case 'snow':    return { type: 'circle' };
        default:        return { type: 'circle' }; // links uses circles + links
      }
    })();

    const move = (() => {
      switch (this.preset) {
        case 'snow':
          return { enable: true, speed: 1.2, direction: 'bottom', outModes: 'out' };
        case 'bubbles':
          return { enable: true, speed: 1, direction: 'none', outModes: 'out' };
        default:
          return { enable: true, speed: 1.6, direction: 'none', outModes: 'out' };
      }
    })();

    const linkConf = this.preset === 'links'
      ? { enable: true, distance: 130, color: this.color, opacity: 0.4 }
      : { enable: false };

    const size = this.preset === 'snow'
      ? { value: { min: 1, max: 3 } }
      : this.preset === 'stars'
      ? { value: { min: 1, max: 2.5 } }
      : { value: { min: 1, max: 3 } };

    const opacity = this.preset === 'snow'
      ? { value: { min: 0.6, max: 1 } }
      : { value: { min: 0.4, max: 0.9 } };

    return {
      background: { color: this.background },
      detectRetina: true,
      fpsLimit: 60,
      interactivity: {
        events: interactivityEvents,
        modes: {
          repulse: { distance: 120, duration: 0.4 },
          attract: { distance: 100, duration: 0.2, factor: 1 },
          push: { quantity: 4 },
          remove: { quantity: 2 },
        }
      },
      particles: {
        number: { value: this.density, density: { enable: true, area: 800 } },
        color: { value: this.color },
        links: linkConf,
        move,
        opacity,
        size,
        shape,
      }
    };
  }

  private async _initParticles() {
    await this._maybeLoad();
    if (!this._engine) return;

    const bg = this.renderRoot?.querySelector('.bg') as HTMLElement | null;
    if (bg) {
      (bg.style as any).background = this.background;
      (bg.style as any).filter = this.backdropBlur ? 'blur(2px) saturate(120%)' : 'none';
    }
    const content = this.renderRoot?.querySelector('.content-inner') as HTMLElement | null;
    if (content) {
      content.style.boxShadow = this.contentShadow ? '0 6px 28px rgba(0,0,0,0.18)' : 'none';
    }

    await this._engine.load(this._id, this._options());
    this._loadedOnce = true;
  }

  render() {
    return html`
      <section class="wrap">
        <div id=${this._id} class="bg" aria-hidden="true"></div>
        <div class="content" role="group">
          <div class="content-inner">
            <slot></slot>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define('devcon-particles-hero', DevconParticlesHero);

