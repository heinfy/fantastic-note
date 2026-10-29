export type Brush = 'flow' | 'dust' | 'geometry';

export interface PaintSettings {
  brush: Brush;
  colors: string[];
  background: string;
  size: number;
  intensity: number;
}

interface Point {
  x: number;
  y: number;
}

interface Particle extends Point {
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  duration: number;
}

/** Static artwork and animated particles are separate, so clearing a frame never erases a stroke. */
export class PaintEngine {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private artwork: HTMLCanvasElement;
  private art: CanvasRenderingContext2D;
  private settings: PaintSettings;
  private width = 0;
  private height = 0;
  private ratio = 1;
  private previous: Point | null = null;
  private distance = 0;
  private stampDistance = 0;
  private particles: Particle[] = [];
  private frame: number | null = null;
  private lastTime = 0;
  private paused = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, settings: PaintSettings) {
    this.canvas = canvas;
    this.artwork = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const art = this.artwork.getContext('2d');
    if (!context || !art) throw new Error('浏览器暂时无法打开画布，请尝试刷新页面。');
    this.context = context;
    this.art = art;
    this.settings = settings;
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  resize(width: number, height: number): void {
    if (width < 1 || height < 1 || this.disposed) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (width === this.width && height === this.height && ratio === this.ratio) return;

    const snapshot = document.createElement('canvas');
    snapshot.width = this.artwork.width;
    snapshot.height = this.artwork.height;
    snapshot.getContext('2d')?.drawImage(this.artwork, 0, 0);
    if (this.width && this.height) {
      const scaleX = width / this.width;
      const scaleY = height / this.height;
      this.particles.forEach((particle) => {
        particle.x *= scaleX;
        particle.y *= scaleY;
      });
    }
    this.width = width;
    this.height = height;
    this.ratio = ratio;
    this.end();
    for (const layer of [this.canvas, this.artwork]) {
      layer.width = Math.round(width * ratio);
      layer.height = Math.round(height * ratio);
    }
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.art.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (snapshot.width && snapshot.height) this.art.drawImage(snapshot, 0, 0, width, height);
    this.render();
  }

  setSettings(settings: PaintSettings): void {
    if (this.settings.brush !== settings.brush) this.end();
    this.settings = settings;
    this.render();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.stopFrame();
    this.render();
  }

  begin(point: Point): void {
    this.previous = point;
    this.distance = 0;
    this.stampDistance = 0;
    if (this.settings.brush === 'flow') this.drawFlow(point, point);
    else if (this.settings.brush === 'geometry') this.drawGeometry(point);
    else this.emitDust(point);
    this.render();
  }

  move(point: Point): void {
    if (!this.previous) return;
    const start = this.previous;
    const distance = Math.hypot(point.x - start.x, point.y - start.y);
    // Limit interpolation work even when a pointer jumps across the entire canvas.
    const steps = Math.min(32, Math.max(1, Math.ceil(distance / 6)));
    for (let step = 1; step <= steps; step++) {
      const next = {
        x: start.x + ((point.x - start.x) * step) / steps,
        y: start.y + ((point.y - start.y) * step) / steps,
      };
      const segment = distance / steps;
      this.distance += segment;
      this.stampDistance += segment;
      if (this.settings.brush === 'flow') this.drawFlow(this.previous, next);
      else if (this.settings.brush === 'dust') {
        if (this.stampDistance >= 5) {
          this.emitDust(next);
          this.stampDistance = 0;
        }
      } else if (this.stampDistance >= Math.max(12, this.settings.size * 0.65)) {
        this.drawGeometry(next);
        this.stampDistance = 0;
      }
      this.previous = next;
    }
    this.render();
  }

  end(): void {
    this.previous = null;
  }

  clear(): void {
    this.end();
    this.stopFrame();
    this.particles = [];
    this.art.clearRect(0, 0, this.width, this.height);
    this.render();
  }

  inspire(): void {
    if (!this.width || !this.height) return;
    this.clear();
    const phase = Math.random() * Math.PI * 2;
    const lines = this.settings.brush === 'geometry' ? 3 : 5;
    for (let line = 0; line < lines; line++) {
      const points = this.settings.brush === 'dust' ? 25 : 85;
      for (let step = 0; step <= points; step++) {
        const t = step / points;
        const point = {
          x: this.width * (0.12 + t * 0.76),
          y: this.height * (0.5 + Math.sin(t * Math.PI * 2 + phase + line * 0.32) * 0.19 + (line - 2) * 0.025),
        };
        if (step === 0) this.begin(point);
        else this.move(point);
      }
      this.end();
    }
    this.render();
  }

  async exportPng(): Promise<Blob> {
    this.render();
    // Snapshot immediately; particles can keep moving while PNG encoding completes.
    const snapshot = document.createElement('canvas');
    snapshot.width = this.canvas.width;
    snapshot.height = this.canvas.height;
    const context = snapshot.getContext('2d');
    if (!context) throw new Error('图片生成失败，请再试一次。');
    context.drawImage(this.canvas, 0, 0);
    return new Promise((resolve, reject) => {
      snapshot.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('图片生成失败，请再试一次。'));
      }, 'image/png');
    });
  }

  destroy(): void {
    this.disposed = true;
    this.stopFrame();
    this.particles = [];
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private colorAt(position: number): string {
    const { colors } = this.settings;
    const index = ((position % colors.length) + colors.length) % colors.length;
    const first = colors[Math.floor(index)];
    const second = colors[(Math.floor(index) + 1) % colors.length];
    const fraction = index % 1;
    const channels = [1, 3, 5].map((offset) => {
      const a = parseInt(first.slice(offset, offset + 2), 16);
      const b = parseInt(second.slice(offset, offset + 2), 16);
      return Math.round(a + (b - a) * fraction);
    });
    return `rgb(${channels.join(',')})`;
  }

  private drawFlow(from: Point, to: Point): void {
    const { size, intensity } = this.settings;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    this.art.save();
    this.art.lineCap = 'round';
    this.art.lineJoin = 'round';
    this.art.globalAlpha = 0.35 + intensity / 170;
    for (let strand = 0; strand < 3; strand++) {
      const offset = (strand - 1) * size * 0.3;
      const dx = -Math.sin(angle) * offset;
      const dy = Math.cos(angle) * offset;
      const color = this.colorAt(this.distance / 140 + strand * 0.5);
      this.art.strokeStyle = color;
      this.art.fillStyle = color;
      this.art.lineWidth = size * (strand === 1 ? 0.45 : 0.24);
      if (from.x === to.x && from.y === to.y) {
        this.art.beginPath();
        this.art.arc(to.x + dx, to.y + dy, this.art.lineWidth / 2, 0, Math.PI * 2);
        this.art.fill();
      } else {
        this.art.beginPath();
        this.art.moveTo(from.x + dx, from.y + dy);
        this.art.lineTo(to.x + dx, to.y + dy);
        this.art.stroke();
      }
    }
    this.art.restore();
  }

  private drawGeometry(point: Point): void {
    const { colors, size, intensity } = this.settings;
    const count = 1 + Math.floor(intensity / 35);
    for (let i = 0; i < count; i++) {
      const radius = size * (0.25 + Math.random() * 0.55);
      const shape = Math.floor(Math.random() * 3);
      this.art.save();
      this.art.translate(point.x + (Math.random() - 0.5) * size * 1.6, point.y + (Math.random() - 0.5) * size * 1.6);
      this.art.rotate(Math.random() * Math.PI);
      this.art.globalAlpha = 0.3 + Math.random() * 0.45;
      this.art.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      this.art.beginPath();
      if (shape === 0) this.art.arc(0, 0, radius, 0, Math.PI * 2);
      else if (shape === 1) this.art.rect(-radius, -radius, radius * 2, radius * 2);
      else {
        this.art.moveTo(0, -radius);
        this.art.lineTo(radius, radius * 0.8);
        this.art.lineTo(-radius, radius * 0.8);
        this.art.closePath();
      }
      this.art.fill();
      this.art.restore();
    }
  }

  private emitDust(point: Point): void {
    const { colors, size, intensity } = this.settings;
    const count = 2 + Math.floor(intensity / 15);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 32;
      const duration = 1.8 + Math.random() * 2;
      this.particles.push({
        x: point.x + (Math.random() - 0.5) * size,
        y: point.y + (Math.random() - 0.5) * size,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1 + Math.random() * size * 0.16,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: duration,
        duration,
      });
    }
    if (this.particles.length > 600) this.particles.splice(0, this.particles.length - 600);
  }

  private render(): void {
    if (this.disposed || !this.width || !this.height) return;
    this.context.globalAlpha = 1;
    this.context.fillStyle = this.settings.background;
    this.context.fillRect(0, 0, this.width, this.height);
    this.context.drawImage(this.artwork, 0, 0, this.width, this.height);
    for (const particle of this.particles) {
      this.context.globalAlpha = Math.min(1, particle.life / particle.duration) * 0.85;
      this.context.fillStyle = particle.color;
      this.context.beginPath();
      this.context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.context.fill();
    }
    this.context.globalAlpha = 1;
    if (this.particles.length && !this.paused && !document.hidden && this.frame === null) {
      this.lastTime = performance.now();
      this.frame = requestAnimationFrame(this.animate);
    }
  }

  private animate = (time: number): void => {
    this.frame = null;
    const delta = Math.min((time - this.lastTime) / 1000, 0.06);
    this.lastTime = time;
    for (const particle of this.particles) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.life -= delta;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
    this.render();
  };

  private stopFrame(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  private onVisibilityChange = (): void => {
    this.stopFrame();
    if (!document.hidden) this.render();
  };
}
