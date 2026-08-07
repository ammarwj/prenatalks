import type { ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="w-full max-w-md rounded-3xl border border-border bg-white shadow-soft">
      <CardHeader className="px-7 pt-7 text-center sm:px-8 sm:pt-8">
        <p className="text-xs font-bold uppercase tracking-wide text-primary-text">
          {eyebrow}
        </p>
        <h1 className="font-display mt-1.5 text-2xl font-extrabold text-foreground">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="px-7 pb-7 sm:px-8 sm:pb-8">{children}</CardContent>
      {footer ? (
        <p className="pb-7 text-center text-sm text-muted-foreground sm:pb-8">
          {footer}
        </p>
      ) : null}
    </Card>
  );
}
