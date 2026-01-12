'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [preferredDay, setPreferredDay] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        .select('preferred_checkin_day, preferred_checkin_time')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setPreferredDay(data.preferred_checkin_day || '');
        setPreferredTime(data.preferred_checkin_time || '');
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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
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
    <main className="min-h-screen px-4 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl sm:text-5xl font-light text-gray-900 mb-4">Settings</h1>
        </div>

        <div className="space-y-8">
          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-sm bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-sm text-gray-500">
              Your email cannot be changed here
            </p>
          </div>

          {/* Weekly Check-in Time */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Weekly Check-in Time (Optional)
              </label>
              <p className="text-sm text-gray-500">
                Set your preferred day and time for weekly check-ins
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkin-day" className="block text-sm font-medium text-gray-700 mb-2">
                  Day
                </label>
                <select
                  id="checkin-day"
                  value={preferredDay}
                  onChange={(e) => setPreferredDay(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
                <label htmlFor="checkin-time" className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  id="checkin-time"
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-sm hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-8 border-t border-gray-200 space-y-4">
          <Link
            href="/checkin"
            className="block w-full text-center px-6 py-3 bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition-colors duration-200"
          >
            Start Check-in
          </Link>
          
          <button
            onClick={handleSignOut}
            className="block w-full px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
