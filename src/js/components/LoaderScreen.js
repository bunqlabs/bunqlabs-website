export default class LoaderScreen {
  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'loader-overlay';
    this.el.innerHTML = `
      <style>
        #loader-overlay {position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:9999;transition:opacity .6s;}
        #loader-overlay.loaded {opacity:0;pointer-events:none;}
        #loader-overlay .inner {text-align:center;color:#fff;font-family:sans-serif;}
        #loader-overlay .bar {width:200px;height:4px;background:#333;margin-top:16px;overflow:hidden;}
        #loader-overlay .bar .fill {width:100%;height:100%;background:#fff;transform-origin:left;transform:scaleX(0);transition:transform .2s ease-out;}
      </style>
      <div class="inner">
        <div id="loading-text">0%</div>
        <div class="bar"><div class="fill"></div></div>
      </div>`;
    document.body.appendChild(this.el);
    this.textEl = this.el.querySelector('#loading-text');
    this.fillEl = this.el.querySelector('.fill');
  }
  /** Update progress (0‑1) */
  setProgress(t) {
    const pct = Math.floor(t * 100);
    this.textEl.textContent = pct + '%';
    this.fillEl.style.transform = `scaleX(${t})`;
  }
  /** Fade out & remove */
  hide() {
    this.el.classList.add('loaded');
    setTimeout(() => this.el.remove(), 800);
  }
}
