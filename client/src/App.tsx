import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ChatPage } from "./pages/ChatPage";
import { LandingPage } from "./pages/LandingPage";
import { BiPlatformPage } from "./pages/BiPlatformPage";
import { StudioPage } from "./pages/StudioPage";
import { OutboundPage } from "./pages/OutboundPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ManifestoPage } from "./pages/ManifestoPage";
import { WorkspacePage } from "./pages/WorkspacePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/outbound" element={<OutboundPage />} />
        <Route path="/platform" element={<BiPlatformPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/manifesto" element={<ManifestoPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
