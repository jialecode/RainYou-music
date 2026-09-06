import React, { createContext, useContext, useState, useEffect } from "react";

export type LyricAnimationMode = "default" | "3d" | "irregular";
export type VisualizerStyle = "default" | "circular" | "wave";
export type CoverStyle = "vinyl" | "rounded";

interface SettingsContextType {
    lyricAnimation: LyricAnimationMode;
    setLyricAnimation: (mode: LyricAnimationMode) => void;
    visualizerStyle: VisualizerStyle;
    setVisualizerStyle: (style: VisualizerStyle) => void;
    amplitudeAnimation: boolean;
    setAmplitudeAnimation: (enabled: boolean) => void;
    coverStyle: CoverStyle;
    setCoverStyle: (style: CoverStyle) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lyricAnimation, setLyricAnimationState] = useState<LyricAnimationMode>("default");
    const [visualizerStyle, setVisualizerStyleState] = useState<VisualizerStyle>("default");
    const [amplitudeAnimation, setAmplitudeAnimationState] = useState<boolean>(false);
    const [coverStyle, setCoverStyleState] = useState<CoverStyle>("vinyl");

    useEffect(() => {
        const savedLyric = localStorage.getItem("lyricAnimation");
        if (savedLyric === "default" || savedLyric === "3d" || savedLyric === "irregular") {
            setLyricAnimationState(savedLyric as LyricAnimationMode);
        }

        const savedVis = localStorage.getItem("visualizerStyle");
        if (savedVis === "default" || savedVis === "circular" || savedVis === "wave") {
            setVisualizerStyleState(savedVis as VisualizerStyle);
        }

        const savedAmp = localStorage.getItem("amplitudeAnimation");
        if (savedAmp !== null) {
            setAmplitudeAnimationState(savedAmp === "true");
        }

        const savedCover = localStorage.getItem("coverStyle");
        if (savedCover === "vinyl" || savedCover === "rounded") {
            setCoverStyleState(savedCover as CoverStyle);
        }
    }, []);

    const setLyricAnimation = (mode: LyricAnimationMode) => {
        setLyricAnimationState(mode);
        localStorage.setItem("lyricAnimation", mode);
    };

    const setVisualizerStyle = (style: VisualizerStyle) => {
        setVisualizerStyleState(style);
        localStorage.setItem("visualizerStyle", style);
    };

    const setAmplitudeAnimation = (enabled: boolean) => {
        setAmplitudeAnimationState(enabled);
        localStorage.setItem("amplitudeAnimation", String(enabled));
    };

    const setCoverStyle = (style: CoverStyle) => {
        setCoverStyleState(style);
        localStorage.setItem("coverStyle", style);
    };

    return (
        <SettingsContext.Provider value={{
            lyricAnimation, setLyricAnimation,
            visualizerStyle, setVisualizerStyle,
            amplitudeAnimation, setAmplitudeAnimation,
            coverStyle, setCoverStyle
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
