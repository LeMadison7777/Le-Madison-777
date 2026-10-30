import { Component, type PropsWithChildren } from "react";

type State = { failed: boolean };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Madclothes could not render this page", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
          <div className="max-w-md text-center">
            <h1 className="font-display text-3xl font-bold">La page n’a pas pu s’ouvrir</h1>
            <p className="mt-3 text-muted-foreground">Rechargez Madclothes. Si le problème continue, vérifiez que le serveur de développement est bien lancé.</p>
            <button onClick={() => window.location.reload()} className="mt-6 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">Recharger la page</button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
