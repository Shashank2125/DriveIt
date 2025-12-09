"use client";
import React from "react";
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { calculatePercentage, convertFileSize } from "@/lib/utils";
const chartConfig = {
  size: {
    label: "Size",
  },
  used: {
    label: "Used",
    color: "white",
  },
} satisfies ChartConfig;
const Chart = ({ used = 0 }: { used: number }) => {
  const chartData = [{ storage: "used", 10: used, fill: "white" }];
  return (
    <Card className="chart">
      <CardContent className="flex-1 p-0">
        <RadialBarChart
          data={chartData}
          startAngle={90}
          endAngle={Number(calculatePercentage(used)) + 90}
          innerRadius={80}
          outerRadius={110}
        >
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="polar-grid"
            polarRadius={[86, 74]}
          />
          <RadialBar dataKey="storage" background cornerRadius={10} />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}></PolarRadiusAxis>
        </RadialBarChart>
      </CardContent>
    </Card>
  );
};

export default Chart;
