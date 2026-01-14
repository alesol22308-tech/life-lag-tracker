'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDarkMode } from '@/lib/hooks/useDarkMode';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [email, setEmail] = useState('');
  const [preferredDay, setPreferredDay] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [emailReminderEnabled, setEmailReminderEnabled] = useState(true);
  const [smsReminderEnabled, setSmsReminderEnabled] = useState(false);
  const [smsPhoneNumber, setSmsPhoneNumber] = useState('');
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeMessage, setEmailChangeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      // Load user preferences
      const { data, error } = await supabase
        .from('users')
        .select('preferred_checkin_day, preferred_checkin_time, email_reminder_enabled, sms_reminder_enabled, sms_phone_number, dark_mode_enabled, reminder_enabled')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setPreferredDay(data.preferred_checkin_day || '');
        setPreferredTime(data.preferred_checkin_time || '');
        setEmailReminderEnabled(data.email_reminder_enabled ?? (data.reminder_enabled ?? true));
        setSmsReminderEnabled(data.sms_reminder_enabled ?? false);
        setSmsPhoneNumber(data.sms_phone_number || '');
        setDarkModeEnabled(data.dark_mode_enabled ?? false);
      }

      setLoading(false);
    }

    loadSettings();
  }, [supabase, router]);

  const handleSavePreferences = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredCheckinDay: preferredDay || null,
          preferredCheckinTime: preferredTime || null,
          emailReminderEnabled,
          smsReminderEnabled,
          smsPhoneNumber: smsReminderEnabled ? smsPhoneNumber : null,
          darkModeEnabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || 'Failed to save preferences');
        throw new Error(errorMsg);
      }

      // Sync dark mode state
      if (darkModeEnabled !== isDarkMode) {
        toggleDarkMode(darkModeEnabled);
      }
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      alert(error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      setEmailChangeMessage({ type: 'error', text: 'Please enter a new email address' });
      return;
    }

    setIsChangingEmail(true);
    setEmailChangeMessage(null);

    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email');
      }

      setEmailChangeMessage({ 
        type: 'success', 
        text: data.message || 'Check your email to confirm the new address' 
      });
      setNewEmail('');
    } catch (error: any) {
      setEmailChangeMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update email' 
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkModeEnabled(enabled);
    toggleDarkMode(enabled);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl sm:text-5xl font-light text-gray-900 dark:text-gray-100 mb-4">Settings</h1>
        </div>

        <div className="space-y-8">
          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Email Change Section */}
          <div className="card space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Change Email Address
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                To change your login email address:
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent"
              />
              <button
                onClick={handleUpdateEmail}
                disabled={isChangingEmail || !newEmail.trim()}
                className="px-4 py-2 bg-slate-700 dark:bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingEmail ? 'Updating...' : 'Update Email'}
              </button>
              {emailChangeMessage && (
                <p className={`text-sm ${emailChangeMessage.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {emailChangeMessage.text}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You&apos;ll receive a confirmation email at the new address to verify the change.
              </p>
            </div>
          </div>

          {/* Weekly Check-in Time */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Weekly Check-in Time (Optional)
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set your preferred day and time for weekly check-ins
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkin-day" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Day
                </label>
                <select
                  id="checkin-day"
                  value={preferredDay}
                  onChange={(e) => setPreferredDay(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent"
                >
                  <option value="">Not set</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div>
                <label htmlFor="checkin-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time
                </label>
                <input
                  id="checkin-time"
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Reminder Preferences */}
          <div className="card space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Reminder Preferences
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reminders will be sent on your preferred check-in day at your preferred time
              </p>
            </div>

            <div className="space-y-4">
              {/* Email Reminders */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email reminders
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive email reminders for weekly check-ins
                  </p>
                </div>
                <button
                  onClick={() => setEmailReminderEnabled(!emailReminderEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailReminderEnabled ? 'bg-slate-700 dark:bg-slate-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* SMS Reminders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      SMS reminders
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receive SMS reminders for weekly check-ins
                    </p>
                  </div>
                  <button
                    onClick={() => setSmsReminderEnabled(!smsReminderEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      smsReminderEnabled ? 'bg-slate-700 dark:bg-slate-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        smsReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Phone Number Input */}
                {smsReminderEnabled && (
                  <div>
                    <label htmlFor="sms-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="sms-phone"
                      type="tel"
                      value={smsPhoneNumber}
                      onChange={(e) => setSmsPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Include country code (e.g., +1 for US)
                    </p>
                  </div>
                )}
              </div>

              {(emailReminderEnabled || smsReminderEnabled) && (!preferredDay || !preferredTime) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Please set your preferred check-in day and time above for reminders to work.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dark Mode */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Dark Mode
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
              <button
                onClick={() => handleDarkModeToggle(!darkModeEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkModeEnabled ? 'bg-slate-700 dark:bg-slate-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkModeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="w-full px-6 py-3 bg-slate-700 dark:bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Actions */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <Link
            href="/home"
            className="block w-full text-center px-6 py-3 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-200 shadow-soft"
          >
            Return to Dashboard
          </Link>
          
          <Link
            href="/checkin"
            className="block w-full text-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            Start Check-in
          </Link>
          
          <button
            onClick={handleSignOut}
            className="block w-full px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
