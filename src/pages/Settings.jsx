import React from "react";
import { useApp } from "../state/AppContext";

export default function Settings() {
  const { clearAll } = useApp();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
        <h2 className="font-medium mb-2">Danger zone</h2>
        <p className="text-sm opacity-70 mb-3">Clear all transactions from this device.</p>
        <button onClick={clearAll} className="rounded-md bg-red-600 hover:bg-red-700 text-white px-4 py-2">
          Clear Transactions
        </button>
      </div>
    </div>
  );
}
