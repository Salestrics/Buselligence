import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("UI error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950 text-slate-100">
          <div className="max-w-lg space-y-4">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-slate-400">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
