import React, { useMemo } from "react";
import { useApp } from "../state/AppContext";
import { format } from "date-fns";
import BalanceOverTime from "../components/charts/BalanceOverTime";
import SpendingByCategory from "../components/charts/SpendingByCategory";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { transactions, reducedMotion, t } = useApp();

  const { income, expenses, balance } = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((a,b)=>a+Number(b.amount||0),0);
    const expenses = transactions.filter(t => t.type === "expense").reduce((a,b)=>a+Number(b.amount||0),0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const recent = transactions.slice(0, 5);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={reducedMotion ? undefined : container}
      initial={reducedMotion ? undefined : "hidden"}
      animate={reducedMotion ? undefined : "show"}
      className="space-y-6"
    >
      <motion.h1 variants={reducedMotion ? undefined : item} className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
        {t('nav_dashboard')}
      </motion.h1>

      <motion.div variants={reducedMotion ? undefined : item} className="grid sm:grid-cols-3 gap-4">
        <Stat title="Total Income" value={income} variant="green" />
        <Stat title="Total Expenses" value={expenses} variant="red" />
        <Stat title="Current Balance" value={balance} variant="indigo" />
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={reducedMotion ? undefined : item} className="rounded-xl border border-white/20 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md p-6">
          <h2 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-100">Balance History</h2>
          <BalanceOverTime />
        </motion.div>
        <motion.div variants={reducedMotion ? undefined : item} className="rounded-xl border border-white/20 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md p-6">
          <h2 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-100">Spending Distribution</h2>
          <SpendingByCategory />
        </motion.div>
      </div>

      <motion.div variants={reducedMotion ? undefined : item} className="rounded-xl border border-white/20 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md p-6">
        <h2 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-100">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left opacity-70 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-2">Date</th>
                <th className="px-2">Type</th>
                <th className="px-2">Category</th>
                <th className="px-2">Note</th>
                <th className="text-right px-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recent.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-2">{format(new Date(t.date), "MMM dd, yyyy")}</td>
                  <td className="px-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.type === "income" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-2">{t.category}</td>
                  <td className="px-2 opacity-80 max-w-[200px] truncate">{t.note}</td>
                  <td className={`text-right px-2 font-medium ${
                    t.type === "income" ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                  }`}>
                    {t.type === "expense" ? "-" : "+"}
                    {Number(t.amount).toLocaleString(undefined,{style:"currency",currency:"USD"})}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td className="py-8 text-center opacity-60" colSpan={5}>No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ title, value, variant }) {
  const styles = {
    green: "from-green-500/10 to-emerald-500/10 border-green-200/50 text-green-700 dark:text-green-400 dark:border-green-800/50",
    red: "from-red-500/10 to-rose-500/10 border-red-200/50 text-red-700 dark:text-red-400 dark:border-red-800/50",
    indigo: "from-indigo-500/10 to-blue-500/10 border-indigo-200/50 text-indigo-700 dark:text-indigo-400 dark:border-indigo-800/50"
  };
  
  return (
    <div className={`rounded-xl p-6 border bg-gradient-to-br backdrop-blur-sm shadow-lg ${styles[variant]} dark:bg-opacity-20`}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="text-3xl font-bold mt-2 tracking-tight">
        {Number(value).toLocaleString(undefined,{style:"currency",currency:"USD"})}
      </div>
    </div>
  );
}
