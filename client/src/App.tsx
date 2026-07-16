import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";

const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const ChatPage = lazy(() => import("./pages/ChatPage").then((m) => ({ default: m.ChatPage })));
const BiPlatformPage = lazy(() => import("./pages/BiPlatformPage").then((m) => ({ default: m.BiPlatformPage })));
const StudioPage = lazy(() => import("./pages/StudioPage").then((m) => ({ default: m.StudioPage })));
const OutboundPage = lazy(() => import("./pages/OutboundPage").then((m) => ({ default: m.OutboundPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const SignInPage = lazy(() => import("./pages/SignInPage").then((m) => ({ default: m.SignInPage })));
const SignUpPage = lazy(() => import("./pages/SignUpPage").then((m) => ({ default: m.SignUpPage })));
const ManifestoPage = lazy(() => import("./pages/ManifestoPage").then((m) => ({ default: m.ManifestoPage })));
const WorkspacePage = lazy(() => import("./pages/WorkspacePage").then((m) => ({ default: m.WorkspacePage })));
const CorePage = lazy(() => import("./pages/CorePage").then((m) => ({ default: m.CorePage })));
const KernelPage = lazy(() => import("./pages/KernelPage").then((m) => ({ default: m.KernelPage })));
const BuildPage = lazy(() => import("./pages/BuildPage").then((m) => ({ default: m.BuildPage })));
const DesktopPage = lazy(() => import("./pages/DesktopPage").then((m) => ({ default: m.DesktopPage })));
const StartPage = lazy(() => import("./pages/StartPage").then((m) => ({ default: m.StartPage })));
const WhyPage = lazy(() => import("./pages/WhyPage").then((m) => ({ default: m.WhyPage })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/outbound" element={<OutboundPage />} />
            <Route path="/platform" element={<BiPlatformPage />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/core" element={<CorePage />} />
            <Route path="/kernel" element={<KernelPage />} />
            <Route path="/build" element={<BuildPage />} />
            <Route path="/desktop" element={<DesktopPage />} />
            <Route path="/start" element={<StartPage />} />
            <Route path="/why" element={<WhyPage />} />
            <Route path="/manifesto" element={<ManifestoPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
