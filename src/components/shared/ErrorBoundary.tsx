import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === 'object' && 'error' in parsed) {
        readable = `Firestore ${parsed.operationType || 'operation'} on "${parsed.path || 'unknown'}": ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readable };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF4F6] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl p-6 sm:p-8 text-center shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)]">
            <div className="w-12 h-12 rounded-xl bg-[#FDF6E7] border border-[#F2D399] text-[#B45309] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-[#14241C] mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-[#4F6156] leading-relaxed mb-6 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.href = '/';
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#164A31] hover:bg-[#103825] text-white text-sm font-medium rounded-xl cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Storefront</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
