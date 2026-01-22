import React, { useState } from "react";
import { 
  UserCircleIcon, 
  KeyIcon, 
  BellIcon, 
  ShieldExclamationIcon,
  SunIcon,
  MoonIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useApp } from "../state/AppContext";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import LanguageSelector from "../components/LanguageSelector";

export default function Settings() {
  const { user, clearAll, theme, toggleTheme, t, reducedMotionOverride, setReducedMotionOverride, changePassword } = useApp();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: t('nav_dashboard') === 'nav_dashboard' ? 'Profile' : t('Profile'), icon: UserCircleIcon },
    { id: 'security', label: t('Security') || 'Security', icon: KeyIcon },
    { id: 'preferences', label: t('nav_settings') === 'nav_settings' ? 'Preferences' : t('Preferences'), icon: BellIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('nav_settings')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your account settings and preferences.</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-6">
            {activeTab === 'profile' && <ProfileSection user={user} />}
            {activeTab === 'security' && <SecuritySection />}
            {activeTab === 'preferences' && (
              <PreferencesSection 
                theme={theme} 
                toggleTheme={toggleTheme} 
                clearAll={clearAll} 
                t={t}
                reducedMotionOverride={reducedMotionOverride}
                setReducedMotionOverride={setReducedMotionOverride}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ user }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      bio: 'Frontend Developer & UI/UX Enthusiast'
    }
  });

  const onSubmit = (data) => {
    // Mock update
    toast.success("Profile updated successfully!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-bold">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Picture</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">JPG, GIF or PNG. Max size of 800K</p>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Upload new photo
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input 
              {...register('name')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input 
              {...register('email')}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-70 cursor-not-allowed" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
          <textarea 
            {...register('bio')}
            rows={4}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" 
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Save Changes
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function SecuritySection() {
  const schema = z.object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange'
  });

  const onSubmit = async (data) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success("Password updated successfully!");
      reset();
    } catch (error) {
      toast.error(error.message || "Failed to update password");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
          <input {...register('currentPassword')} type="password" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" />
          {errors.currentPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
          <input {...register('newPassword')} type="password" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" />
          {errors.newPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
          <input {...register('confirmPassword')} type="password" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>}
        </div>
        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Update Password
        </button>
      </form>
    </motion.div>
  );
}

function PreferencesSection({ theme, toggleTheme, clearAll, t, reducedMotionOverride, setReducedMotionOverride }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('appearance')}</h3>
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <MoonIcon className="h-6 w-6 text-indigo-400" /> : <SunIcon className="h-6 w-6 text-amber-500" />}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('dark_mode')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('adjust_appearance')}</p>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('language')}</h3>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <LanguageSelector />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('reduce_motion')}</h3>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('reduce_motion_desc')}</p>
          </div>
          <div className="flex gap-2">
            {['auto','on','off'].map(mode => (
              <button
                key={mode}
                onClick={() => setReducedMotionOverride(mode)}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  reducedMotionOverride === mode
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700'
                }`}
              >
                {t(`reduce_motion_${mode}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
          <ShieldExclamationIcon className="h-5 w-5" />
          {t('danger_zone')}
        </h3>
        <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
          <h4 className="font-medium text-red-900 dark:text-red-200">{t('delete_all_data')}</h4>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1 mb-4">
            This will permanently delete all your transactions and reset your account data. This action cannot be undone.
          </p>
          <button 
            onClick={() => {
              if(window.confirm(t('delete_all_data_confirm'))) {
                clearAll();
                toast.success('All data cleared successfully');
              }
            }} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            {t('clear_all_data_button')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

