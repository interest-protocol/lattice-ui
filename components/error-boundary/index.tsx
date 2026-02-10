import { Button, Div, Span } from '@stylin.js/elements';
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { ACCENT, ACCENT_HOVER } from '@/constants/colors';

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
        <Div
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          p="2rem"
          bg="#0D1117"
          color="#FFFFFF"
        >
          <Div
            display="flex"
            flexDirection="column"
            alignItems="center"
            maxWidth="400px"
            textAlign="center"
            gap="1.5rem"
          >
            <Span fontSize="3rem" role="img" aria-label="Error">
              &#x26A0;
            </Span>
            <Div display="flex" flexDirection="column" gap="0.5rem">
              <Span fontSize="1.5rem" fontWeight="600">
                Something went wrong
              </Span>
              <Span fontSize="0.875rem" color="#FFFFFF80">
                An unexpected error occurred. You can try again or refresh the
                page.
              </Span>
            </Div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Div
                width="100%"
                p="1rem"
                bg="#FFFFFF0D"
                borderRadius="0.5rem"
                overflow="auto"
                maxHeight="200px"
              >
                <Span
                  fontSize="0.75rem"
                  fontFamily="monospace"
                  color="#FF6B6B"
                  whiteSpace="pre-wrap"
                  wordBreak="break-all"
                >
                  {this.state.error.message}
                </Span>
              </Div>
            )}
            <Div display="flex" gap="1rem">
              <Button
                py="0.75rem"
                px="1.5rem"
                bg={ACCENT}
                color="white"
                fontSize="0.875rem"
                fontWeight="600"
                borderRadius="0.5rem"
                border="none"
                cursor="pointer"
                nHover={{ bg: ACCENT_HOVER }}
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
              <Button
                py="0.75rem"
                px="1.5rem"
                bg="transparent"
                color="white"
                fontSize="0.875rem"
                fontWeight="600"
                borderRadius="0.5rem"
                border="1px solid #FFFFFF1A"
                cursor="pointer"
                nHover={{ bg: '#FFFFFF0D' }}
                onClick={this.handleRefresh}
              >
                Refresh Page
              </Button>
            </Div>
          </Div>
        </Div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
