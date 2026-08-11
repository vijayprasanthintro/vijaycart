import { Component } from 'react';

// Catches render-time errors in the route tree so a single component crash
// shows a recoverable message instead of a blank page. "Retry" reloads the app
// (clearing any transient session state); the failure can also be reported to
// support via mailto with a copy of the error message.
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        if (this.props.onError) this.props.onError(error, info);
    }

    handleRetry = () => {
        window.location.reload();
    };

    render() {
        if (!this.state.error) return this.props.children;

        const message = String((this.state.error && this.state.error.message) || 'Something went wrong');
        const mailto = `mailto:help@vijaycart.com?subject=VijayCart%20error&body=${encodeURIComponent(message)}`;

        return (
            <div className="eb-wrap">
                <div className="eb-card">
                    <div className="eb-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i></div>
                    <h1>Oops, something went wrong</h1>
                    <p>The page hit an unexpected error. Try reloading — your cart and saved items are safe.</p>
                    <pre className="eb-detail">{message}</pre>
                    <div className="eb-actions">
                        <button type="button" className="eb-btn eb-btn--primary" onClick={this.handleRetry}>
                            <i className="fa fa-refresh mr-2" aria-hidden="true"></i>Reload Page
                        </button>
                        <a className="eb-btn eb-btn--ghost" href={mailto}>Report this error</a>
                    </div>
                </div>
            </div>
        );
    }
}
