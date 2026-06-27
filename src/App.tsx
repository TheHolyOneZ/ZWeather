import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TrayPopover } from "@/views/TrayPopover";
import { Dashboard } from "@/views/Dashboard";
import { Toaster } from "@/components/ui/Toaster";
import { CinematicIntro } from "@/components/intro/CinematicIntro";
import { isIntroEnabled } from "@/lib/introPreference";

const windowLabel = getCurrentWindow().label;

export default function App() {


  const [showIntro, setShowIntro] = useState(
    () => windowLabel === "main" && isIntroEnabled(),
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
