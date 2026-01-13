import React, { useState } from "react";

import { useApp } from "../state/AppContext";

export default function Transactions() {
  const { t } = useApp();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('transactions')}</h1>
      <AddTransactionForm />
      <TransactionTable />
    </div>
  );
}

function AddTransactionForm() {
  const { addTx, t } = useApp();
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "General",
    date: new Date().toISOString().slice(0,10),
    note: ""
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.amount) return;
    addTx({ ...form, amount: Number(form.amount) });
    setForm({ ...form, amount: "", note: "" });
  };

  return (
    <form onSubmit={submit} className="grid md:grid-cols-5 gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
      <select className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-2"
        value={form.type} onChange={(e)=>setForm(f=>({...f,type:e.target.value}))}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <input type="number" step="0.01" placeholder={t('amount')}
        className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-2"
        value={form.amount} onChange={(e)=>setForm(f=>({...f,amount:e.target.value}))}/>
      <input placeholder={t('category_label')} className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-2"
        value={form.category} onChange={(e)=>setForm(f=>({...f,category:e.target.value}))}/>
      <input type="date" className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-2"
        value={form.date} onChange={(e)=>setForm(f=>({...f,date:e.target.value}))}/>
      <div className="md:col-span-5 flex gap-3">
        <input placeholder={t('note_optional')} className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-2"
          value={form.note} onChange={(e)=>setForm(f=>({...f,note:e.target.value}))}/>
        <button className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-4">{t('add')}</button>
      </div>
    </form>
  );
}

function TransactionTable() {
  const { transactions, deleteTx, t } = useApp();
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left opacity-70">
          <tr>
            <th className="py-2">{t('date')}</th>
            <th>{t('type')}</th>
            <th>{t('category_label')}</th>
            <th>{t('note')}</th>
            <th className="text-right">{t('amount')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800">
              <td className="py-2">{t.date}</td>
              <td className={t.type === "income" ? "text-green-600" : "text-red-600"}>{t.type}</td>
              <td>{t.category}</td>
              <td className="opacity-80">{t.note}</td>
              <td className="text-right font-medium">{Number(t.amount).toLocaleString(undefined,{style:"currency",currency:"USD"})}</td>
              <td className="text-right">
                <button onClick={()=>deleteTx(t.id)} className="text-red-600 hover:underline">{t('delete')}</button>
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr><td className="py-4 opacity-60" colSpan={6}>{t('no_transactions_yet')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
