import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // TODO: Send to error reporting service (e.g. Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-surface text-text">
          <div className="flex flex-col items-center max-w-[400px] text-center gap-6">
            <span className="text-5xl" role="img" aria-label="Error">
              &#x26A0;
            </span>
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-semibold">
                Something went wrong
              </span>
              <span className="text-sm text-text-muted">
                An unexpected error occurred. You can try again or refresh the
                page.
              </span>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="w-full p-4 bg-surface-light rounded-lg overflow-auto max-h-[200px]">
                <span className="text-xs font-mono text-error whitespace-pre-wrap break-all">
                  {this.state.error.message}
                </span>
              </div>
            )}
            <div className="flex gap-4">
              <button
                type="button"
                className="py-3 px-6 bg-accent text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-accent-hover"
                onClick={this.handleRetry}
              >
                Try Again
              </button>
              <button
                type="button"
                className="py-3 px-6 bg-transparent text-text text-sm font-semibold rounded-lg border border-surface-border cursor-pointer hover:bg-surface-light"
                onClick={this.handleRefresh}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
