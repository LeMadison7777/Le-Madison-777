import { Component, type PropsWithChildren } from "react";

type State = { failed: boolean; error?: Error };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(error: Error): State {
    return { failed: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Madclothes could not render this page", error, errorInfo);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
          <div className="max-w-md text-center">
            <h1 className="font-display text-3xl font-bold">Une erreur est survenue</h1>
            <p className="mt-3 text-muted-foreground">
              La page n'a pas pu être affichée correctement. Vous pouvez recharger l'application ou retourner à la page d'accueil.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Recharger la page
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-medium text-foreground transition-colors hover:bg-white/10"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
