import React, { useEffect, useRef } from "react";
import { publishAudioLevel } from "../../services/audioLevelBridge";
import audioProcessorUrl from "./AudioProcessor.ts?worker&url";
import { useSettings } from "../../hooks/useSettings";

interface VisualizerProps {
    audioRef: React.RefObject<HTMLAudioElement>;
    isPlaying: boolean;
}

// Global map to store source nodes to prevent "MediaElementAudioSourceNode" double-connection errors
const sourceMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
const contextMap = new WeakMap<HTMLAudioElement, AudioContext>();

const BAR_COUNT = 96;
const FFT_SIZE = 1024;
const BAR_GAP = 4;

const Visualizer: React.FC<VisualizerProps> = ({ audioRef, isPlaying }) => {
    const { visualizerStyle } = useSettings();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Effect 1: Audio Context and Worklet Initialization
    useEffect(() => {
        if (!isPlaying) {
            publishAudioLevel(0);
        }
    }, [isPlaying]);

    useEffect(() => {
        const initAudio = async () => {
            if (!audioRef.current) return;
            const audioEl = audioRef.current;

            let ctx = contextMap.get(audioEl);
            if (!ctx) {
                ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                contextMap.set(audioEl, ctx);
            }
            audioContextRef.current = ctx;

            if (ctx.state === "suspended" && isPlaying) {
                await ctx.resume();
            }

            // Always create and store the analyser node
            if (!analyserNodeRef.current) {
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.8;
                analyserNodeRef.current = analyser;
            }

            // Load AudioWorklet
            if (!workletNodeRef.current) {
                try {
                    console.log("Visualizer: Loading AudioWorklet module...");
                    await ctx.audioWorklet.addModule(audioProcessorUrl);
                    console.log("Visualizer: AudioWorklet module loaded successfully.");
                } catch (e) {
                    console.warn("Visualizer: AudioWorklet module might already exist", e);
                }

                try {
                    const workletNode = new AudioWorkletNode(ctx, "audio-processor");
                    workletNode.port.onmessage = (e) => {
                        if (e.data?.type === "LEVEL" && typeof e.data.level === "number") {
                            publishAudioLevel(e.data.level);
                        }
                    };
                    workletNodeRef.current = workletNode;
                    console.log("Visualizer: AudioWorkletNode created.");
                } catch (e) {
                    console.error("Visualizer: Failed to create AudioWorkletNode", e);
                }
            }

            // Connect Source -> Analyser -> Worklet & Destination
            const analyser = analyserNodeRef.current;
            const workletNode = workletNodeRef.current;
            
            if (analyser) {
                if (!sourceMap.has(audioEl)) {
                    const source = ctx.createMediaElementSource(audioEl);
                    source.connect(analyser);
                    analyser.connect(ctx.destination);
                    if (workletNode) analyser.connect(workletNode);
                    sourceMap.set(audioEl, source);
                } else {
                    const source = sourceMap.get(audioEl);
                    if (source) {
                        try { 
                            source.disconnect();
                            source.connect(analyser);
                            analyser.connect(ctx.destination);
                            if (workletNode) analyser.connect(workletNode);
                        } catch (e) { }
                    }
                }
            }
        };

        if (isPlaying) {
            initAudio();
        }

        return () => {
            // Cleanup logic if needed
        };
    }, [isPlaying, audioRef]);

    // Effect 2: Worker Initialization
    useEffect(() => {
        if (!isPlaying) {
            if (workerRef.current) {
                workerRef.current.postMessage({ type: "DESTROY" });
                workerRef.current.terminate();
                workerRef.current = null;
            }
            return;
        }

        const canvasEl = canvasRef.current;
        if (!canvasEl) {
            return;
        }

        if (workerRef.current) {
            return;
        }

        const isOffscreenSupported = !!canvasEl.transferControlToOffscreen;
        if (!isOffscreenSupported) {
            console.warn("Visualizer: OffscreenCanvas not available, skipping worker");
            return;
        }

        try {
            const worker = new Worker(new URL("./VisualizerWorker.ts", import.meta.url), {
                type: "module"
            });
            workerRef.current = worker;

            const dpr = window.devicePixelRatio || 1;
            const targetW = visualizerStyle === "circular" ? 1200 : 1000;
            const targetH = visualizerStyle === "circular" ? 1200 : 80;
            canvasEl.width = targetW * dpr;
            canvasEl.height = targetH * dpr;

            const offscreen = canvasEl.transferControlToOffscreen();

            const channel = new MessageChannel();

            worker.postMessage(
                {
                    type: "INIT",
                    canvas: offscreen,
                    config: {
                        barCount: BAR_COUNT,
                        gap: BAR_GAP,
                        fftSize: FFT_SIZE,
                        smoothingTimeConstant: 0.5,
                        dpr: dpr,
                        style: visualizerStyle
                    },
                    port: channel.port1
                },
                [offscreen, channel.port1]
            );

            const sendFFTToWorker = () => {
                if (analyserNodeRef.current && workerRef.current) {
                    const dataArray = new Uint8Array(analyserNodeRef.current.frequencyBinCount);
                    analyserNodeRef.current.getByteFrequencyData(dataArray);
                    workerRef.current.postMessage({ type: "FFT_DATA", data: dataArray });
                }
                animationFrameRef.current = requestAnimationFrame(sendFFTToWorker);
            };
            sendFFTToWorker();
        } catch (e) {
            console.error("Visualizer: Failed to initialize worker", e);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (workerRef.current) {
                workerRef.current.postMessage({ type: "DESTROY" });
                workerRef.current.terminate();
                workerRef.current = null;
            }
            publishAudioLevel(0);
        };
    }, [isPlaying]);

    // Effect 3: Sync visualizer configuration
    useEffect(() => {
        if (!workerRef.current) return;

        workerRef.current.postMessage({
            type: "UPDATE_CONFIG",
            config: { style: visualizerStyle }
        });

        // Also inform the worker of the updated effective dimensions
        const dpr = window.devicePixelRatio || 1;
        const targetW = visualizerStyle === "circular" ? 1200 : 1000;
        const targetH = visualizerStyle === "circular" ? 1200 : 80;
        workerRef.current.postMessage({
            type: "RESIZE",
            width: targetW * dpr,
            height: targetH * dpr
        });
    }, [visualizerStyle]);

    if (!isPlaying) return <div className={`w-full ${visualizerStyle === "circular" ? "aspect-square" : "h-10"}`}></div>;

    return (
        <canvas
            ref={canvasRef}
            className={`w-full transition-opacity duration-500 ${visualizerStyle === "circular"
                    ? "w-full h-full max-w-[90vw] max-h-[90vh] aspect-square object-contain"
                    : "h-10"
                }`}
        />
    );
};

export default Visualizer;
