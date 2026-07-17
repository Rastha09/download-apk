import { Link } from "react-router-dom";
import { ShieldAlert, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const AdminOnlyNotice = () => {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <section className="max-w-xl mx-auto border border-border bg-card rounded p-6 md:p-8 text-center space-y-5">
      <div className="w-14 h-14 mx-auto rounded bg-secondary flex items-center justify-center">
        <ShieldAlert className="w-7 h-7 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold uppercase tracking-wider text-foreground">
          {t("adminOnly.title")}
        </h2>
        <p className="text-sm text-muted-foreground font-mono">
          {t("adminOnly.body")}
        </p>
      </div>
      {!user && (
        <Button asChild className="h-11 font-bold uppercase tracking-wider">
          <Link to="/auth">
            <LogIn className="w-4 h-4" />
            {t("adminOnly.login")}
          </Link>
        </Button>
      )}
    </section>
  );
};
