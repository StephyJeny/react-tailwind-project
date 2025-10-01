import React, { useMemo } from "react";
import { useApp } from "../state/AppContext";
import { format } from "date-fns";
import BalanceOverTime from "../components/charts/BalanceOverTime";
import SpendingByCategory from "../components/charts/SpendingByCategory";

export default function Dashboard() {
  const { transactions } = useApp();

  const { income, expenses, balance } = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((a,b)=>a+Number(b.amount||0),0);
    const expenses = transactions.filter(t => t.type === "expense").reduce((a,b)=>a+Number(b.amount||0),0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <Stat title="Income" value={income} variant="green" />
        <Stat title="Expenses" value={expenses} variant="red" />
        <Stat title="Balance" value={balance} variant="indigo" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
          <h2 className="font-medium mb-2">Balance Over Time</h2>
          <BalanceOverTime />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
          <h2 className="font-medium mb-2">Spending by Category</h2>
          <SpendingByCategory />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
        <h2 className="font-medium mb-3">Recent Transactionss</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left opacity-70">
              <tr>
                <th className="py-2">Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Note</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(t => (
                <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2">{format(new Date(t.date), "yyyy-MM-dd")}</td>
                  <td className={t.type === "income" ? "text-green-600" : "text-red-600"}>{t.type}</td>
                  <td>{t.category}</td>
                  <td className="opacity-80">{t.note}</td>
                  <td className="text-right font-medium">{Number(t.amount).toLocaleString(undefined,{style:"currency",currency:"USD"})}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td className="py-4 opacity-60" colSpan={5}>No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, variant }) {
  const colors = {
    green: "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    red: "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    indigo:"bg-indigo-50 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200"
  };
  return (
    <div className={`rounded-xl p-4 border border-gray-200 dark:border-gray-800 ${colors[variant]}`}>
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-2xl font-semibold mt-1">
        {Number(value).toLocaleString(undefined,{style:"currency",currency:"USD"})}
      </div>
    </div>
  );
}
