import React from "react";
import { getTrafficLightStatus } from "@/utils/negotiation";

interface VarianceIndicatorProps {
  current: number;
  target?: number;
}

export const VarianceIndicator: React.FC<VarianceIndicatorProps> = ({
  current,
  target,
}) => {
  if (!target || target === 0) return null;

  const diff = current - target;
  const percentage = (diff / target) * 100;
  const status = getTrafficLightStatus(percentage);

  let colorClass = "bg-gray-100 text-gray-800";
  if (status === "red") colorClass = "bg-red-100 text-red-800";
  if (status === "green") colorClass = "bg-green-100 text-green-800";
  if (status === "yellow") colorClass = "bg-yellow-100 text-yellow-800";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {percentage > 0 ? "+" : ""}
      {percentage.toFixed(1)}%
    </span>
  );
};
