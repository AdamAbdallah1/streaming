import { Component } from "react";
import Button from "./Button";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("Storefront crashed:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
          <h1 className="text-[17px] font-semibold text-ink">
            Something went wrong
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-ink-muted">
            The page could not be displayed. Reloading usually fixes it — if it
            keeps happening, message Cedars Tech on WhatsApp.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Reload
          </Button>
        </div>
      </div>
    );
  }
}
