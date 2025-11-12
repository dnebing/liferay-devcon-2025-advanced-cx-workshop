import {LitElement, html, css} from 'lit';
import {property, queryAssignedElements} from 'lit/decorators.js';

/**
 * <devcon-tilt-carousel>
 * - Works with default slot OR <div slot="drop-slot-container"><lfr-drop-zone/></div>
 * - Container mode: finds the first node with multiple element children → those children are slides.
 * - Wraps each slide’s contents in a light-DOM .devcon-slide-wrap and animates that wrapper.
 * - Critical: all transforms include inline perspective(...) so 3D never depends on ancestors.
 * - Forces slide parent to overflow:visible and an optional centered max width.
 * - Autosizes to active slide (ResizeObserver + image-load).
 * - Optional CSS vars:
 *     --devcon-carousel-height: 300px;
 *     --devcon-carousel-width:  640px;   (new) to keep perspective dramatic on wide pages
 *     --devcon-perspective:     900px;   (used in multi-root mode only)
 */
export class DevconTiltCarousel extends LitElement {
  @property({type: Boolean, reflect: true}) autoplay = true;
  @property({type: Number, reflect: true}) interval = 4000;
  @property({type: Number, reflect: true}) perspective = 900; // lower = stronger
  @property({type: Number, reflect: true}) tilt = 20;

  @queryAssignedElements({slot: 'drop-slot-container'}) private _named!: HTMLElement[];
  @queryAssignedElements() private _default!: HTMLElement[];

  private _idx = 0;
  private _timer?: number;
  private _resizeObs?: ResizeObserver;

  static styles = css`
    :host {
      /* light reset so theme inheritance doesn’t surprise us */
      all: unset;
      display: block;
      position: relative;
      box-sizing: border-box;
      contain: layout style paint;
      perspective: var(--devcon-perspective, 900px); /* multi-root fallback only */
    }
    *, *::before, *::after { box-sizing: border-box; }

    .viewport {
      all: revert;
      position: relative;
      overflow: visible !important; /* ensure 3D overflows aren’t clipped */
      height: var(--devcon-carousel-height, auto);
      min-height: 1px;
      contain: layout style paint;
    }

    /* ===== Multi-root mode (simple) ===== */
    ::slotted(.slide) {
      position: absolute; inset: 0;
      opacity: 0;
      transform: translateX(100%) rotateY(0deg);
      transition: transform .45s ease, opacity .45s ease;
      will-change: transform, opacity;
      backface-visibility: hidden;
    }
    ::slotted(.slide.active) {
      opacity: 1;
      transform: translateX(0) rotateY(0deg);
      z-index: 2;
    }
    ::slotted(.slide.exit-left) {
      transform: translateX(-70%) rotateY(calc(var(--tilt, 20) * 1deg));
      z-index: 1;
    }

    .controls {
      display:flex; gap:.5rem; justify-content:center; margin-top:.5rem;
    }
    button {
      border:1px solid #ced4da; background:#fff; padding:.25rem .5rem; border-radius:.5rem; cursor:pointer;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this._onKeydown);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._stop();
    this.removeEventListener('keydown', this._onKeydown);
    this._resizeObs?.disconnect();
  }

  private _assignedRoots(): HTMLElement[] {
    return (this._named && this._named.length ? this._named : this._default) ?? [];
  }

  /** Walk down until a node has multiple element children; that node’s children are slides. */
  private _findSlideParent(root: HTMLElement): HTMLElement | null {
    let node: HTMLElement | null = root;
    while (node && node.children.length === 1) node = node.children[0] as HTMLElement;
    return node;
  }

  private _containerMode():
    | { slideParent: HTMLElement; slides: HTMLElement[] }
    | null {
    const roots = this._assignedRoots();
    if (!roots.length) return null;
    if (roots.length === 1) {
      const slideParent = this._findSlideParent(roots[0])!;
      if (!slideParent) return null;
      const slides = Array.from(slideParent.children).filter(
        (n): n is HTMLElement => n.nodeType === 1
      );
      return { slideParent, slides };
    }
    return null;
  }

  private _multiRootSlides(): HTMLElement[] {
    return this._assignedRoots() as HTMLElement[];
  }

  private _start(count: number) {
    if (this.autoplay && count > 1) this._timer = window.setInterval(() => this.next(), this.interval);
  }
  private _stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = undefined; }
  }

  private _onKeydown = (e: Event) => {
    const ev = e as KeyboardEvent;
    if (ev.key === 'ArrowRight') { this.next(); ev.preventDefault(); }
    if (ev.key === 'ArrowLeft')  { this.prev(); ev.preventDefault(); }
  };

  next() { this._go(this._idx + 1); }
  prev() { this._go(this._idx - 1); }

  /* ===== Helpers ===== */

  /** Build a transform string with local perspective baked in. */
  private _tf(x: string, deg: number) {
    return `perspective(${this.perspective}px) translateX(${x}) rotateY(${deg}deg)`;
  }

  private _sizeToActive(slideParent: HTMLElement, active?: HTMLElement) {
    if (!active) return;

    const set = () => {
      slideParent.style.position = 'relative';
      slideParent.style.overflow = 'visible';                 // <-- ensure no clipping
      slideParent.style.transformStyle = 'preserve-3d';

      // Keep the parent from being 2,000px wide so perspective reads well
      // You can override via: style="--devcon-carousel-width: 640px"
      const maxW = getComputedStyle(this).getPropertyValue('--devcon-carousel-width') || '640px';
      slideParent.style.width = `min(100%, ${maxW.trim()})`;
      slideParent.style.marginLeft = 'auto';
      slideParent.style.marginRight = 'auto';

      const rect = active.getBoundingClientRect();
      if (rect.height > 0) slideParent.style.minHeight = `${Math.ceil(rect.height)}px`;
    };
    requestAnimationFrame(set);

    this._resizeObs ??= new ResizeObserver(() => set());
    this._resizeObs.disconnect();
    this._resizeObs.observe(active);

    active.querySelectorAll('img').forEach(img => {
      const el = img as HTMLImageElement;
      if (!el.complete) el.addEventListener('load', () => set(), { once: true });
    });
  }

  /** Ensure each slide has a single child wrapper we animate. */
  private _ensureWrap(slide: HTMLElement): HTMLElement {
    const existing = slide.querySelector<HTMLElement>(':scope > .devcon-slide-wrap');
    if (existing) return existing;

    const wrap = document.createElement('div');
    wrap.className = 'devcon-slide-wrap';
    slide.insertBefore(wrap, slide.firstChild);

    const kids = Array.from(slide.childNodes);
    kids.forEach(node => { if (node !== wrap) wrap.appendChild(node); });

    slide.style.position = 'absolute';
    slide.style.inset = '0';
    slide.style.willChange = 'opacity';
    slide.style.transition = 'opacity .45s ease';

    wrap.style.width = '100%';
    wrap.style.height = '100%';
    wrap.style.willChange = 'transform';
    wrap.style.transition = 'transform .45s ease';
    wrap.style.backfaceVisibility = 'hidden';
    wrap.style.transformOrigin = '50% 50%';

    return wrap;
  }

  private _initContainerMode(slideParent: HTMLElement, slides: HTMLElement[]) {
    slides.forEach((slide, i) => {
      const wrap = this._ensureWrap(slide);
      if (i === 0) {
        slide.style.zIndex = '2';
        slide.style.opacity = '1';
        wrap.style.transformOrigin = '50% 50%';
        wrap.style.transform = this._tf('0', 0);
        slide.setAttribute('aria-hidden', 'false');
      } else {
        slide.style.zIndex = '1';
        slide.style.opacity = '0';
        wrap.style.transformOrigin = '100% 50%';
        wrap.style.transform = this._tf('100%', -this.tilt);
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    this._sizeToActive(slideParent, slides[0]);
  }

  private _applyStateContainer(slideParent: HTMLElement, slides: HTMLElement[], oldIdx: number) {
    const next = slides[this._idx];
    const prev = slides[oldIdx];
    const nextWrap = next && this._ensureWrap(next);
    const prevWrap = prev && this._ensureWrap(prev);

    // Bring next in
    if (next && nextWrap) {
      next.style.zIndex = '2';
      next.style.opacity = '1';
      nextWrap.style.transformOrigin = '50% 50%';
      nextWrap.style.transform = this._tf('0', 0);
      next.setAttribute('aria-hidden', 'false');
    }

    // Hide all non-active/non-prev
    slides.forEach((s, i) => {
      if (i !== this._idx && i !== oldIdx) {
        s.style.zIndex = '1';
        s.style.opacity = '0';
        s.setAttribute('aria-hidden', 'true');
      }
    });

    // Animate prev out (tilt + slide) visibly, then hide it
    if (prev && prevWrap) {
      prev.style.zIndex = '1';
      prev.style.opacity = '1';
      prevWrap.style.transformOrigin = '0% 50%';
      prevWrap.style.transform = this._tf('-70%', this.tilt);

      const onEnd = (ev: TransitionEvent) => {
        if (ev.propertyName !== 'transform') return;
        prev.style.opacity = '0';
        prev.setAttribute('aria-hidden', 'true');
        prev.removeEventListener('transitionend', onEnd);
      };
      prev.addEventListener('transitionend', onEnd);
    }

    this._sizeToActive(slideParent, next);
  }

  private _applyStateMultiRoot(slides: HTMLElement[]) {
    slides.forEach((el, i) => {
      el.classList.add('slide');
      el.classList.toggle('active', i === this._idx);
      el.classList.toggle('exit-left', false);
      el.setAttribute('aria-hidden', String(i !== this._idx));
    });
  }

  private _go(newIndex: number) {
    const container = this._containerMode();
    if (container) {
      const { slideParent, slides } = container;
      const count = slides.length;
      if (count <= 1) return;
      const old = this._idx;
      this._idx = (newIndex + count) % count;
      this._applyStateContainer(slideParent, slides, old);
      this.style.setProperty('--tilt', String(this.tilt));
      this.dispatchEvent(new CustomEvent('slide:change', { detail: { index: this._idx } }));
      return;
    }

    // Multi-root
    const slides = this._multiRootSlides();
    const count = slides.length;
    if (count <= 1) return;
    const old = this._idx;
    this._idx = (newIndex + count) % count;
    slides[old]?.classList.remove('exit-left');
    this._applyStateMultiRoot(slides);
    slides[old]?.classList.add('exit-left');
    this.style.setProperty('--tilt', String(this.tilt));
    this.dispatchEvent(new CustomEvent('slide:change', { detail: { index: this._idx } }));
  }

  firstUpdated() {
    // multi-root fallback only; container mode uses inline perspective()
    this.style.setProperty('--devcon-perspective', `${this.perspective}px`);

    const container = this._containerMode();
    if (container) {
      const { slideParent, slides } = container;
      this._idx = 0;
      this._initContainerMode(slideParent, slides);
      this._start(slides.length);
      return;
    }

    // Multi-root
    const slides = this._multiRootSlides();
    this._idx = 0;
    slides.forEach((el, i) => {
      el.classList.add('slide');
      el.setAttribute('aria-hidden', String(i !== 0));
    });
    this._applyStateMultiRoot(slides);
    this._start(slides.length);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('autoplay') || changed.has('interval')) {
      this._stop();
      const container = this._containerMode();
      const count = container ? container.slides.length : this._multiRootSlides().length;
      this._start(count);
    }
    if (changed.has('perspective')) {
      // sync for multi-root; container mode uses inline perspective()
      this.style.setProperty('--devcon-perspective', `${this.perspective}px`);
    }
  }

  render() {
    return html`
      <div class="viewport" tabindex="0" aria-roledescription="carousel" aria-live="polite">
        <slot></slot>
        <slot name="drop-slot-container"></slot>
      </div>
      <div class="controls">
        <button type="button" @click=${this.prev} aria-label="Previous">&#9664;</button>
        <button type="button" @click=${this.next} aria-label="Next">&#9654;</button>
      </div>
    `;
  }
}

customElements.define('devcon-tilt-carousel', DevconTiltCarousel);

