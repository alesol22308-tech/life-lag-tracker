'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');
      setLoading(false);
    }

    loadSettings();
  }, [supabase, router]);

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
