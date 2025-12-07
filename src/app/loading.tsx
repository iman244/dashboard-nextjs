import { Spinner } from "@/components/ui/spinner";
import React from "react";

const Loading = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Spinner className="size-8" />
      </div>
    </div>
  );
};

export default Loading;
