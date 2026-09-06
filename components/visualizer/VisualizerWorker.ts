// VisualizerWorker.ts

export type WorkerMessage =
    | { type: "INIT"; canvas: OffscreenCanvas; config: VisualizerConfig; port: MessagePort }
    | { type: "FFT_DATA"; data: Uint8Array }
    | { type: "RESIZE"; width: number; height: number }
    | { type: "UPDATE_CONFIG"; config: Partial<VisualizerConfig> }
    | { type: "DESTROY" };

export interface VisualizerConfig {
    barCount: number;
    gap: number;
    fftSize: number;
    smoothingTimeConstant: number;
    dpr?: number;
    style?: "default" | "circular" | "wave";
}

const ctx: Worker = self as any;

let canvas: OffscreenCanvas | null = null;
let canvasCtx: OffscreenCanvasRenderingContext2D | null = null;
let config: VisualizerConfig | null = null;
let animationFrameId: number | null = null;
let workletPort: MessagePort | null = null;

let latestFftData: Uint8Array | null = null;

ctx.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { type } = e.data;

    switch (type) {
        case 'INIT': {
            const payload = e.data as { type: "INIT"; canvas: OffscreenCanvas; config: VisualizerConfig; port: MessagePort };
            canvas = payload.canvas;
            config = payload.config;
            canvasCtx = canvas.getContext('2d');
            
            // Still accept the port if we need it for something else, but we don't use it for AUDIO_DATA anymore
            workletPort = payload.port;

            startLoop();
            break;
        }
        case 'FFT_DATA': {
            const payload = e.data as { type: "FFT_DATA"; data: Uint8Array };
            latestFftData = payload.data;
            break;
        }
        case 'RESIZE': {
            const payload = e.data as { type: "RESIZE"; width: number; height: number };
            if (canvas) {
                canvas.width = payload.width;
                canvas.height = payload.height;
            }
            break;
        }
        case 'UPDATE_CONFIG': {
            const payload = e.data as { type: "UPDATE_CONFIG"; config: Partial<VisualizerConfig> };
            if (config) {
                config = { ...config, ...payload.config };
            }
            break;
        }
        case 'DESTROY': {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (workletPort) {
                workletPort.close();
            }
            canvas = null;
            canvasCtx = null;
            break;
        }
    }
};

function startLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    const loop = () => {
        if (canvas && canvasCtx && config) {
            draw(canvasCtx, canvas.width, canvas.height);
        }
        animationFrameId = requestAnimationFrame(loop);
    };
    loop();
}

let bars: number[] = [];

function draw(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number) {
    ctx.clearRect(0, 0, width, height);

    if (!config) return;

    const { barCount, gap, dpr = 1 } = config;

    if (bars.length !== barCount) {
        bars = new Array(barCount).fill(0);
    }

    let targetBars = new Array(barCount).fill(0);
    
    if (latestFftData && latestFftData.length > 0) {
        // We only care about the lower frequencies mostly, so we can ignore the top end
        // A typical 1024 bin FFT up to 22kHz has a lot of empty high end. Let's use first 60%
        const usableBins = Math.floor(latestFftData.length * 0.6);
        const step = Math.max(1, usableBins / barCount);
        
        for (let i = 0; i < barCount; i++) {
            let maxVal = 0;
            const start = Math.floor(i * step);
            const end = Math.floor(start + step);
            
            for (let j = start; j < end; j++) {
                if (j >= latestFftData.length) break;
                // Normalize 0-255 to 0.0-1.0
                const val = latestFftData[j] / 255.0;
                if (val > maxVal) maxVal = val;
            }
            
            // Apply a slight boost to higher frequencies so they show up
            const freqBoost = 1.0 + (i / barCount) * 0.5;
            targetBars[i] = Math.min(1.0, maxVal * freqBoost);
        }
    }

    // Savitzky-Golay Smoothing
    const smoothedTarget = new Array(barCount).fill(0);
    for (let i = 0; i < barCount; i++) {
        if (i < 2 || i >= barCount - 2) {
            smoothedTarget[i] = targetBars[i];
        } else {
            const y_m2 = targetBars[i - 2];
            const y_m1 = targetBars[i - 1];
            const y_0 = targetBars[i];
            const y_p1 = targetBars[i + 1];
            const y_p2 = targetBars[i + 2];
            
            const val = (-3 * y_m2 + 12 * y_m1 + 17 * y_0 + 12 * y_p1 - 3 * y_p2) / 35;
            smoothedTarget[i] = Math.max(0, val);
        }
    }
    targetBars = smoothedTarget;

    const effectiveHeight = height / dpr;
    const effectiveWidth = width / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Temporal smoothing
    for (let i = 0; i < barCount; i++) {
        const factor = 0.25; // How fast bars fall/rise
        bars[i] += (targetBars[i] - bars[i]) * factor;
    }

    ctx.fillStyle = '#ffffff';
    
    // Wave Style
    if (config.style === "wave") {
        ctx.beginPath();
        ctx.moveTo(0, effectiveHeight);
        
        const pathWidth = effectiveWidth / (barCount - 1);
        
        for (let i = 0; i < barCount; i++) {
            let amplitude = bars[i];
            if (amplitude > 1) amplitude = 1;
            
            const x = i * pathWidth;
            const y = effectiveHeight - amplitude * effectiveHeight * 0.8;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                const prevX = (i - 1) * pathWidth;
                const prevY = effectiveHeight - bars[i-1] * effectiveHeight * 0.8;
                const xc = (prevX + x) / 2;
                const yc = (prevY + y) / 2;
                ctx.quadraticCurveTo(prevX, prevY, xc, yc);
            }
        }
        
        ctx.lineTo(effectiveWidth, effectiveHeight - bars[barCount-1] * effectiveHeight * 0.8);
        ctx.lineTo(effectiveWidth, effectiveHeight);
        ctx.closePath();
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fill();
    } 
    // Circular Style
    else if (config.style === "circular") {
        const cx = effectiveWidth / 2;
        const cy = effectiveHeight / 2;
        const minDim = Math.min(effectiveWidth, effectiveHeight);
        const radius = minDim * 0.26;
        const barWidth = Math.max(3, (Math.PI * 2 * radius) / barCount - 2);

        // Center Glow Aura
        const centerGlow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.8);
        centerGlow.addColorStop(0, "rgba(244, 63, 94, 0.25)");
        centerGlow.addColorStop(0.5, "rgba(168, 85, 247, 0.15)");
        centerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = centerGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner glowing ring
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < barCount; i++) {
            let amplitude = bars[i];
            if (amplitude > 1) amplitude = 1;

            const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
            const barHeight = Math.max(6, amplitude * (minDim * 0.22));

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);

            // Dynamic gradient fill for radial bars
            const grad = ctx.createLinearGradient(0, radius, 0, radius + barHeight);
            grad.addColorStop(0, `hsla(${260 + (i / barCount) * 100}, 90%, 75%, 0.95)`);
            grad.addColorStop(1, `hsla(${340 + (i / barCount) * 80}, 95%, 65%, 0.4)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(-barWidth / 2, radius, barWidth, barHeight, barWidth / 2);
            ctx.fill();

            // Inner mirrored subtle bar stub
            const innerHeight = Math.max(2, amplitude * (minDim * 0.06));
            ctx.fillStyle = `hsla(${260 + (i / barCount) * 100}, 85%, 85%, 0.4)`;
            ctx.beginPath();
            ctx.roundRect(-barWidth / 2, radius - innerHeight - 6, barWidth, innerHeight, barWidth / 2);
            ctx.fill();

            ctx.restore();
        }
    } 
    // Default Bars
    else {
        const barWidth = Math.max(2, (effectiveWidth - gap * Math.max(0, barCount - 1)) / barCount);
        const span = barWidth + gap;
        
        // Let's mirror the bars around the center for a cooler look!
        const halfCount = Math.floor(barCount / 2);
        
        for (let i = 0; i < barCount; i++) {
            // Map index to create a mirror effect (center is highest frequencies)
            // or just center symmetry
            let mirroredIdx = i < halfCount ? i : barCount - 1 - i;
            // Let's make the center the low frequencies (bass)
            let dataIdx = halfCount - 1 - mirroredIdx;
            
            let amplitude = bars[dataIdx];
            if (amplitude > 1) amplitude = 1;

            const x = i * span;
            const barHeight = Math.max(4, amplitude * effectiveHeight * 0.8);
            const y = effectiveHeight / 2 - barHeight / 2;

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
            ctx.fill();
        }
    }

    ctx.restore();
}
