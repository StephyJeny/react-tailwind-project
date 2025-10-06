import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";

export default function Login() {
  const [name, setName] = useState("");
  const nav = useNavigate();
  const { setUser } = useApp();

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setUser({ name });
    nav("/", { replace: true });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={submit}
        className="w-[95%] max-w-sm space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow"
      >
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Sign in</h1>
        <p className="text-sm opacity-70 text-gray-600 dark:text-gray-300">Just enter a name to simulate login.</p>
        <input
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="w-full rounded-md bg-indigo-600 hover:bg-indigo-700 text-white py-2">
          Continue
        </button>
      </form>
    </div>
  );
}
