import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { PaintEngine, type Brush, type PaintSettings } from './engine';
import styles from './styles.module.css';

const PRESETS = [
  { name: '落日橘', colors: ['#ed704a', '#f2ae54', '#d85c79', '#7359a6'], background: '#fff5e9' },
  { name: '薄荷汽水', colors: ['#38a99b', '#87cfb4', '#77b5dc', '#d7b764'], background: '#eff9f5' },
  { name: '午夜霓虹', colors: ['#af8dff', '#f677ad', '#52d8d2', '#739afa'], background: '#181c32' },
  { name: '奶油莫兰迪', colors: ['#b3867b', '#9bafa1', '#91a5ba', '#c4ae80'], background: '#f6f1e8' },
];

const BRUSHES: { id: Brush; name: string; description: string }[] = [
  { id: 'flow', name: '流光', description: '把颜色连成柔软的线，随手画一条自己的风景。' },
  { id: 'dust', name: '星尘', description: '散落的星尘会慢慢飘走，暂停可以留住这个瞬间。' },
  { id: 'geometry', name: '几何', description: '让圆、方块和三角形相遇，拼出自由的抽象图案。' },
];

const DEFAULT_SETTINGS: PaintSettings = {
  brush: 'flow',
  colors: PRESETS[0].colors,
  background: PRESETS[0].background,
  size: 28,
  intensity: 55,
};
const STORAGE_KEY = 'fantastic-note:color-playground:v1';
const isColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

function loadSettings(): PaintSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || !['flow', 'dust', 'geometry'].includes(saved.brush)
      || !Array.isArray(saved.colors) || saved.colors.length !== 4 || !saved.colors.every(isColor)
      || !isColor(saved.background) || !Number.isFinite(saved.size) || !Number.isFinite(saved.intensity)) {
      return DEFAULT_SETTINGS;
    }
    return {
      brush: saved.brush,
      colors: saved.colors,
      background: saved.background,
      size: Math.min(64, Math.max(8, saved.size)),
      intensity: Math.min(100, Math.max(10, saved.intensity)),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

type IconName = Brush | 'shuffle' | 'spark' | 'pause' | 'play' | 'clear' | 'download';

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    flow: 'M3 15c4-10 6 10 10 0s6 6 8-5M3 9c4-10 6 10 10 0s6 6 8-5',
    dust: 'M12 3v6m-3-3h6M5 13v6m-3-3h6M19 13v6m-3-3h6',
    geometry: 'M4 3h7v7H4zM17 3l4 7h-8zM7 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6M16 16h5v5h-5z',
    shuffle: 'M3 6h3c5 0 7 12 12 12h3m-3-3 3 3-3 3M3 18h3c2 0 4-3 5-6m3-4c1-1 2-2 4-2h3m-3-3 3 3-3 3',
    spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
    pause: 'M8 5v14M16 5v14',
    play: 'm8 4 12 8-12 8Z',
    clear: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function ColorPlayground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PaintEngine | null>(null);
  const activePointer = useRef<number | null>(null);
  const [settings, setSettings] = useState<PaintSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [initializationError, setInitializationError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const loaded = loadSettings();
    setSettings(loaded);
    let engine: PaintEngine;
    try {
      engine = new PaintEngine(canvas, loaded);
    } catch (error) {
      setInitializationError((error as Error).message);
      return;
    }
    engineRef.current = engine;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    engine.setPaused(reducedMotion.matches);
    setPaused(reducedMotion.matches);
    const onMotionPreference = (event: MediaQueryListEvent) => setPaused(event.matches);
    reducedMotion.addEventListener('change', onMotionPreference);
    let initialized = false;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      engine.resize(width, height);
      if (!initialized) {
        engine.inspire();
        initialized = true;
        setReady(true);
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', onMotionPreference);
      engine.destroy();
      engineRef.current = null;
      activePointer.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    engineRef.current?.setSettings(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Painting also works when the browser disallows local storage.
    }
  }, [settings, ready]);

  useEffect(() => { engineRef.current?.setPaused(paused); }, [paused]);

  const brush = BRUSHES.find((item) => item.id === settings.brush)!;
  const selectedPreset = PRESETS.find((preset) => preset.colors.every((color, index) => color === settings.colors[index]));
  const updateSettings = (changes: Partial<PaintSettings>) => setSettings((previous) => ({ ...previous, ...changes }));

  const pointFromEvent = (event: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) => {
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!ready || activePointer.current !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointer.current = event.pointerId;
    engineRef.current?.begin(pointFromEvent(event, event.currentTarget));
    setNotice('');
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== event.pointerId) return;
    event.preventDefault();
    const events = event.nativeEvent.getCoalescedEvents?.();
    const samples = events?.length ? events : [event.nativeEvent];
    for (const sample of samples) engineRef.current?.move(pointFromEvent(sample, event.currentTarget));
  };

  const onPointerEnd = (event: PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== event.pointerId) return;
    engineRef.current?.end();
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const randomPalette = () => {
    const hue = Math.random() * 360;
    const colors = [0, 32, 155, 205].map((offset) => {
      const h = ((hue + offset) % 360) / 60;
      const saturation = 0.55;
      const lightness = 0.6;
      const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
      const x = chroma * (1 - Math.abs(h % 2 - 1));
      const groups = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]];
      return '#' + groups[Math.floor(h)].map((channel) => Math.round((channel + lightness - chroma / 2) * 255).toString(16).padStart(2, '0')).join('');
    });
    updateSettings({ colors });
    setNotice('遇见一组新颜色，试着画下一笔。');
  };

  const download = async () => {
    if (!engineRef.current || saving) return;
    setSaving(true);
    setNotice('');
    try {
      const blob = await engineRef.current.exportPng();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `color-playground-${Date.now()}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setNotice('图片已生成，保存你喜欢的这一刻。');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '下载失败，请再试一次。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.playground}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}><span className={styles.eyebrowLine} /> PLAY WITH COLOR</p>
            <h1>色彩游乐场<span className={styles.titleDot}>。</span></h1>
            <p className={styles.intro}>不用想好画什么，让颜色跟着你的手，自由生长。</p>
          </div>
          <div className={styles.headerNote}>
            <div className={styles.colorStrip} aria-hidden="true">
              {settings.colors.map((color, index) => <span key={index} style={{ backgroundColor: color }} />)}
            </div>
            <span>一点颜色，很多可能。</span>
          </div>
        </header>

        <div className={styles.workspace}>
          <section className={styles.board} aria-label="绘画工作区">
            <div className={styles.boardHeader}>
              <div className={styles.canvasTitle}><span className={styles.statusDot} /> 自由画布</div>
              <span className={styles.canvasHint}>按住拖动，也可以用手指画</span>
            </div>
            <div className={styles.canvasFrame}>
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                aria-label="色彩画布，按住鼠标或用手指拖动绘画，也可以点击来点灵感自动生成图案"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
                onLostPointerCapture={onPointerEnd}
              >浏览器需要支持 Canvas 才能绘画。</canvas>
              {!ready && <div className={styles.canvasLoading} role="status">{initializationError || '正在准备你的画布…'}</div>}
              <span className={styles.canvasSignature} aria-hidden="true">a little color, a little wonder</span>
            </div>
            <div className={styles.actions}>
              <button className={styles.textButton} disabled={!ready} onClick={() => { engineRef.current?.clear(); setNotice('画布已清空，开始新的创作。'); }}>
                <Icon name="clear" /> 清空画布
              </button>
              <button className={styles.textButton} disabled={!ready} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
                <Icon name={paused ? 'play' : 'pause'} /> {paused ? '继续动画' : '暂停动画'}
              </button>
              <button className={styles.downloadButton} disabled={!ready || saving} onClick={download}>
                <Icon name="download" /> {saving ? '正在生成…' : '下载图片'}
              </button>
            </div>
            <div className={styles.boardFooter}>
              <span>{paused ? '动画已暂停，仍然可以继续画。' : '流光与几何会留下，星尘会慢慢飘散。'}</span>
              <span>PNG · 包含背景</span>
            </div>
          </section>

          <aside className={styles.panel} aria-label="画笔与配色设置">
            <div className={styles.panelSection}>
              <div className={styles.sectionHeading}><h2>选一支画笔</h2><span>01</span></div>
              <div className={styles.brushes}>
                {BRUSHES.map((item) => (
                  <button key={item.id} className={`${styles.brushButton} ${settings.brush === item.id ? styles.brushActive : ''}`} aria-pressed={settings.brush === item.id} onClick={() => updateSettings({ brush: item.id })}>
                    <Icon name={item.id} /><span>{item.name}</span>
                  </button>
                ))}
              </div>
              <p className={styles.brushDescription}>{brush.description}</p>
              <div className={styles.sliderField}>
                <label htmlFor="brush-size">画笔大小 <output>{settings.size}</output></label>
                <input id="brush-size" type="range" min="8" max="64" value={settings.size} onChange={(event) => updateSettings({ size: Number(event.target.value) })} />
              </div>
              <div className={styles.sliderField}>
                <label htmlFor="brush-intensity">{settings.brush === 'flow' ? '色彩浓度' : '散落密度'} <output>{settings.intensity}</output></label>
                <input id="brush-intensity" type="range" min="10" max="100" value={settings.intensity} onChange={(event) => updateSettings({ intensity: Number(event.target.value) })} />
              </div>
            </div>

            <div className={styles.panelSection}>
              <div className={styles.sectionHeading}><h2>今天的颜色</h2><span>02</span></div>
              <div className={styles.presets}>
                {PRESETS.map((preset) => (
                  <button key={preset.name} className={`${styles.preset} ${selectedPreset?.name === preset.name ? styles.presetActive : ''}`} aria-pressed={selectedPreset?.name === preset.name} onClick={() => updateSettings({ colors: preset.colors, background: preset.background })}>
                    <span className={styles.presetColors} aria-hidden="true">{preset.colors.map((color) => <span key={color} style={{ backgroundColor: color }} />)}</span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
              <div className={styles.customColors}>
                <span>自己调色</span>
                <div>{settings.colors.map((color, index) => (
                  <label key={index} className={styles.colorInput} style={{ backgroundColor: color }} title={`调整第 ${index + 1} 个颜色`}>
                    <input type="color" aria-label={`画笔颜色 ${index + 1}`} value={color} onChange={(event) => updateSettings({ colors: settings.colors.map((current, colorIndex) => colorIndex === index ? event.target.value : current) })} />
                  </label>
                ))}</div>
              </div>
              <label className={styles.backgroundField}>
                <span>画布背景</span>
                <span className={styles.backgroundValue}><span className={styles.backgroundSwatch} style={{ backgroundColor: settings.background }}><input type="color" aria-label="画布背景颜色" value={settings.background} onChange={(event) => updateSettings({ background: event.target.value })} /></span><span>{settings.background.toUpperCase()}</span></span>
              </label>
              <p className={styles.paletteHint}>配色用于新笔触，背景会即时更新。</p>
            </div>

            <div className={styles.inspirationActions}>
              <button className={styles.secondaryButton} onClick={randomPalette}><Icon name="shuffle" /> 随机配色</button>
              <button className={styles.inspireButton} disabled={!ready} title="替换当前画面，生成一幅新图案" onClick={() => { engineRef.current?.inspire(); setNotice('新图案准备好了，接着画也很不错。'); }}><Icon name="spark" /> 来点灵感</button>
            </div>
          </aside>
        </div>

        <div className={styles.pageFooter}>
          <p className={styles.notice} role="status" aria-live="polite">{notice || '没有标准答案，每一笔都算数。'}</p>
          <p>配色与参数会留在这个浏览器里，画作记得下载保存。</p>
        </div>
      </div>
    </main>
  );
}
