import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 max-w-2xl w-full">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Etwas ist schief gelaufen</h2>
                        <p className="text-gray-300 mb-4">Ein Fehler hat das Laden der Anwendung verhindert:</p>
                        <pre className="bg-black/50 p-4 rounded-lg overflow-auto text-sm font-mono text-red-300 mb-4">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <details className="text-gray-400 text-xs">
                            <summary className="cursor-pointer hover:text-white mb-2">Stack Trace anzeigen</summary>
                            <pre className="whitespace-pre-wrap">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors"
                        >
                            Seite neu laden
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
