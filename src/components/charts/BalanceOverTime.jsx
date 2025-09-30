import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useApp } from "../../state/AppContext";
import { parseISO, compareAsc } from "date-fns";

export default function BalanceOverTime() {
  const { transactions } = useApp();

  const data = useMemo(() => {
    const sorted = [...transactions].sort((a,b)=>compareAsc(parseISO(a.date), parseISO(b.date)));
    let balance = 0;
    return sorted.map(t => {
      balance += t.type === "income" ? Number(t.amount) : -Number(t.amount);
      return { date: t.date, balance };
    });
  }, [transactions]);

  if (data.length === 0) return <div className="text-sm opacity-70">Add some transactions to see your balance over time.</div>;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="balance" stroke="currentColor" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
