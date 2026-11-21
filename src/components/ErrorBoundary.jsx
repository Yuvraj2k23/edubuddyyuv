import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Top-level React Error Boundary to guarantee resilient recovery on unexpected runtime errors.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error, info) {
    console.error('EduBuddy ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-boundary-shell" role="alert">
          <div className="card error-boundary-card">
            <AlertTriangle size={32} className="accent-rose" aria-hidden="true" />
            <h1>Something went wrong in EduBuddy</h1>
            <p className="muted-sm">{this.state.errorMessage}</p>
            <button type="button" className="btn-primary mt-3" onClick={this.handleReset}>
              <RotateCcw size={15} aria-hidden="true" /> Reload Workspace
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
