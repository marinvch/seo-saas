"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "../../lib/utils";;

interface Step {
  label: string;
  description?: string;
}

interface StepsProps {
  steps: Step[];
  activeStep: number;
  className?: string;
}

export function Steps({ steps, activeStep, className }: StepsProps) {
  return (
    <div className={cn("flex w-full justify-between", className)}>
      {steps.map((step, index) => {
        const isActive = activeStep === index;
        const isCompleted = activeStep > index;

        return (
          <div
            key={index}
            className={cn(
              "flex flex-1 flex-col items-center",
              index !== 0 && "border-t-2",
              isCompleted ? "border-primary" : "border-gray-200 dark:border-gray-700"
            )}
          >
            <div className="flex items-center justify-center relative">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
            </div>
            <div className="mt-2 text-center">
              <div
                className={cn(
                  "text-xs font-medium",
                  isActive || isCompleted ? "text-primary" : "text-gray-500 dark:text-gray-400"
                )}
              >
                {step.label}
              </div>
              {step.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}