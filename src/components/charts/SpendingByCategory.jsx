import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { useApp } from "../../state/AppContext";

export default function SpendingByCategory() {
  const { transactions } = useApp();

  const data = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  if (data.length === 0) return <div className="text-sm opacity-70">No expenses yet.</div>;

  const COLORS = ["#6366f1","#22c55e","#ef4444","#f59e0b","#06b6d4","#a855f7","#84cc16"];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie dataKey="value" data={data} innerRadius={50} outerRadius={80} paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
