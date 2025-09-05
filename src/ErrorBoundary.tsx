import React, { ReactNode, ErrorInfo } from 'react';
import { sendErrorToAPI } from './lib/errorReporting';

interface ErrorBoundaryProps {
    children: ReactNode;
    errorReportUrl?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state to render fallback UI
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Send error to your API
        if (this.props.errorReportUrl) {
            sendErrorToAPI(error, errorInfo, this.props.errorReportUrl, 'react');
        }
    }
    render(): ReactNode {
        // If there's no errorReportUrl, don't use error boundary, just render children
        if (!this.props.errorReportUrl) {
            return this.props.children;
        }

        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg text-center">
                        <div className="mb-6 flex justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">An Error Occurred</h1>
                        <p className="text-gray-600 mb-6">We apologize for the inconvenience.<br />Please try refreshing the page.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
