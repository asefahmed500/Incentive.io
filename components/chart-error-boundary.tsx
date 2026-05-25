"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  title?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Specialized error boundary for chart components
 * Provides inline error recovery without full page reload
 */
export class ChartErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Chart error boundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              {this.props.title || "Chart"} Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              {this.state.error?.message || "Unable to load chart data. Please try again."}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleRetry}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap any component in a ChartErrorBoundary
 */
export function withChartErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  title?: string
): React.FC<P & { onRetry?: () => void }> {
  return function WrappedComponent(props: P & { onRetry?: () => void }) {
    return (
      <ChartErrorBoundary title={title} onRetry={props.onRetry}>
        <Component {...props} />
      </ChartErrorBoundary>
    );
  };
}
