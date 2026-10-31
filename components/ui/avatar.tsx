"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarContextValue = {
  hasValidImage: boolean;
  setHasValidImage: React.Dispatch<React.SetStateAction<boolean>>;
};

const AvatarContext = React.createContext<AvatarContextValue | null>(null);

function Avatar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  const [hasValidImage, setHasValidImage] = React.useState(false);

  return (
    <AvatarContext.Provider value={{ hasValidImage, setHasValidImage }}>
      <span
        data-slot="avatar"
        className={cn(
          "relative flex size-8 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        {children}
      </span>
    </AvatarContext.Provider>
  );
}

function AvatarImage({
  className,
  src,
  alt = "",
  onError,
  onLoad,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const ctx = React.useContext(AvatarContext);
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    setErrored(false);
    ctx?.setHasValidImage(Boolean(src));
    return () => {
      ctx?.setHasValidImage(false);
    };
  }, [src]);

  if (!src || errored) {
    return null;
  }

  return (
    <img
      data-slot="avatar-image"
      src={src}
      alt={alt}
      loading="eager"
      decoding="sync"
      onLoad={(e) => {
        ctx?.setHasValidImage(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setErrored(true);
        ctx?.setHasValidImage(false);
        onError?.(e);
      }}
      className={cn("aspect-square size-full object-cover relative z-10", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  const ctx = React.useContext(AvatarContext);
  if (ctx?.hasValidImage) {
    return null;
  }
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
