import React from "react";

interface Props {
  children: React.ReactNode;
  /** Optional override for the fallback UI */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary so a render-time crash in any child doesn't blank
 * the whole popup with a white screen. Shows a friendly recovery UI with a
 * "Try again" button that resets the boundary's state.
 *
 * React error boundaries only catch render-phase errors; unhandled async
 * rejections still escape. App.tsx separately listens for window
 * "unhandledrejection" events.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep this minimal — we don't have telemetry routing in the popup.
    // eslint-disable-next-line no-console
    console.error("[CineMan ErrorBoundary]", error, info?.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    const err = this.state.error || new Error("Unknown error");
    if (this.props.fallback) return this.props.fallback(err, this.reset);

    return (
      <div
        role="alert"
        className="flex min-h-[280px] w-full flex-col items-center justify-center gap-3 px-4 py-8 text-center"
      >
        <div className="text-3xl" aria-hidden="true">
          🎬
        </div>
        <h2 className="text-base font-semibold text-white">
          Something broke while loading CineMan.
        </h2>
        <p className="max-w-xs text-sm text-zinc-300">
          {err.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={this.reset}
          className="mt-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          Try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
