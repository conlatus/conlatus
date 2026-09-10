"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type WindowState = "closed" | "minimized" | "open" | "maximized";

interface InterviewWindowContextType {
  windowState: WindowState;
  setWindowState: (state: WindowState) => void;
  isMicOn: boolean;
  setIsMicOn: (state: boolean) => void;
  isCamOn: boolean;
  setIsCamOn: (state: boolean) => void;
  isScreenSharing: boolean;
  setIsScreenSharing: (state: boolean) => void;
  activeApp: string | null;
  setActiveApp: (app: string | null) => void;
}

const InterviewWindowContext = createContext<InterviewWindowContextType | undefined>(undefined);

export function InterviewWindowProvider({ children }: { children: ReactNode }) {
  const [windowState, setWindowState] = useState<WindowState>("open");
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeApp, setActiveApp] = useState<string | null>("Interview");

  return (
    <InterviewWindowContext.Provider
      value={{
        windowState,
        setWindowState,
        isMicOn,
        setIsMicOn,
        isCamOn,
        setIsCamOn,
        isScreenSharing,
        setIsScreenSharing,
        activeApp,
        setActiveApp,
      }}
    >
      {children}
    </InterviewWindowContext.Provider>
  );
}

export function useInterviewWindow() {
  const context = useContext(InterviewWindowContext);
  if (context === undefined) {
    throw new Error("useInterviewWindow must be used within an InterviewWindowProvider");
  }
  return context;
}
