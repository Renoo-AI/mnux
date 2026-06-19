'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys && prevProps.resetKeys) {
        const hasKeyChanged = resetKeys.some(
          (key, index) => key !== prevProps.resetKeys?.[index]
        );
        if (hasKeyChanged) {
          this.reset();
        }
      }
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-error-container rounded-full flex items-center justify-center animate-scale-up">
                <AlertTriangle className="w-10 h-10 text-error" />
              </div>
            </div>
            
            <h1 className="font-display text-headline-md text-primary mb-2">
              Something went wrong
            </h1>
            
            <p className="text-on-surface-variant mb-6">
              We&apos;re sorry, but something unexpected happened. Please try refreshing the page or go back.
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-6 p-4 bg-surface-container-low rounded-xl text-left overflow-auto max-h-40">
                <p className="text-error font-mono text-sm whitespace-pre-wrap">
                  {error.message}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.reset}
                className="bg-primary text-on-primary rounded-full px-6 hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoBack}
                className="border border-outline-variant text-primary rounded-full px-6 hover:bg-surface-container-low"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="border border-outline-variant text-primary rounded-full px-6 hover:bg-surface-container-low"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
