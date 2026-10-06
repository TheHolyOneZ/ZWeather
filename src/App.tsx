import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TrayPopover } from "@/views/TrayPopover";
import { Dashboard } from "@/views/Dashboard";
import { Toaster } from "@/components/ui/Toaster";
import { CinematicIntro } from "@/components/intro/CinematicIntro";
import { isIntroEnabled } from "@/lib/introPreference";

declare global {
  interface Window {
    __ZW_REOPENED__?: boolean;
  }
}

const windowLabel = getCurrentWindow().label;

export default function App() {


  const [showIntro, setShowIntro] = useState(
    () => windowLabel === "main" && !window.__ZW_REOPENED__ && isIntroEnabled(),
  );

  if (windowLabel === "tray") {
    return (
      <>
        <TrayPopover />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Dashboard />
      <Toaster />
      <AnimatePresence>
        {showIntro && <CinematicIntro onFinish={() => setShowIntro(false)} />}
      </AnimatePresence>
    </>
  );
}
