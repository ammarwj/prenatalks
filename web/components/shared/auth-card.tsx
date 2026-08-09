import type { ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="w-full max-w-md rounded-3xl border border-border bg-white shadow-soft">
      <CardHeader className="px-7 pt-7 text-center sm:px-8 sm:pt-8">
        <h1 className="font-display text-2xl font-extrabold text-foreground">
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
