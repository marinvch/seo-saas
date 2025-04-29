import React from "react";

interface PageHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function PageHeader({
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col items-start gap-2 pb-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface PageHeaderHeadingProps {
  className?: string;
  children: React.ReactNode;
}

export function PageHeaderHeading({
  className,
  children,
  ...props
}: PageHeaderHeadingProps) {
  return (
    <h1
      className={`text-3xl font-bold tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h1>
  );
}

interface PageHeaderDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function PageHeaderDescription({
  className,
  children,
  ...props
}: PageHeaderDescriptionProps) {
  return (
    <p
      className={`text-muted-foreground text-lg ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}
