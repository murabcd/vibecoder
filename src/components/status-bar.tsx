import React from "react";

interface StatusBarProps {
  status: string;
}

export default function StatusBar({ status }: StatusBarProps) {
  return (
    <div className="w-[calc(100%-1cm)] mx-auto px-3 py-1 text-xs text-muted-foreground bg-muted/50 rounded-t-md shadow-sm text-center md:text-left border-x border-t border-input">
      {status}
    </div>
  );
}
