"use client";

import { useState } from "react";
import LandingOverlay from "./LandingOverlay";

type ClientShellProps = {
  children: React.ReactNode;
};

export default function ClientShell({ children }: ClientShellProps) {
  const [showLanding, setShowLanding] = useState(true);

  return (
    <>
      {showLanding ? (
        <LandingOverlay onClose={() => setShowLanding(false)} />
      ) : null}
      {!showLanding ? children : null}
    </>
  );
}
