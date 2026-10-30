import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type BackButtonProps = {
  fallbackTo?: string;
  className?: string;
};

export default function BackButton({ fallbackTo = "/boutique", className = "" }: BackButtonProps) {
  const navigate = useNavigate();

  function goBack() {
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === "number" && historyIndex > 0) navigate(-1);
    else navigate(fallbackTo);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={`mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground ${className}`}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Retour
    </button>
  );
}
