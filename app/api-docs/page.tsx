'use client';

import { useState } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import PrimaryButton from '@/components/PrimaryButton';
import GhostButton from '@/components/GhostButton';

// API Endpoint documentation
const ENDPOINTS = [
  {
    id: 'checkins-list',
    method: 'GET',
    path: '/api/v1/checkins',
    title: 'List Check-ins',
    description: 'Retrieve a paginated list of your check-ins.',
    scope: 'read:checkins',
    parameters: [
      { name: 'limit', type: 'integer', required: false, default: '20', description: 'Number of check-ins to return (max 100)' },
      { name: 'offset', type: 'integer', required: false, default: '0', description: 'Offset for pagination' },
      { name: 'order', type: 'string', required: false, default: 'desc', description: 'Sort order by created_at (asc or desc)' },
    ],
    response: `{
  "data": [
    {
      "id": "uuid",
      "lagScore": 42,
      "driftCategory": "moderate",
      "weakestDimension": "sleep",
      "scoreDelta": -5,
      "answers": {
        "energy": 3,
        "sleep": 2,
        "structure": 4,
        "initiation": 3,
        "engagement": 3,
        "sustainability": 3
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}`,
    curlExample: `curl -X GET "https://your-app.com/api/v1/checkins?limit=10" \\
  -H "Authorization: Bearer llk_your_api_key"`,
  },
  {
    id: 'checkins-create',
    method: 'POST',
    path: '/api/v1/checkins',
    title: 'Create Check-in',
    description: 'Submit a new weekly check-in with dimension scores.',
    scope: 'write:checkins',
    requestBody: `{
  "answers": {
    "energy": 3,
    "sleep": 2,
    "structure": 4,
    "initiation": 3,
    "engagement": 4,
    "sustainability": 3
  }
}`,
    response: `{
  "id": "uuid",
  "lagScore": 42,
  "driftCategory": "moderate",
  "weakestDimension": "sleep",
  "scoreDelta": -5,
  "tip": {
    "focus": "Sleep consistency",
    "constraint": "Go to bed within a 30-minute window for the next 3 nights",
    "choice": "Choose your target bedtime"
  },
  "createdAt": "2024-01-15T10:30:00Z"
}`,
    curlExample: `curl -X POST "https://your-app.com/api/v1/checkins" \\
  -H "Authorization: Bearer llk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"answers":{"energy":3,"sleep":2,"structure":4,"initiation":3,"engagement":4,"sustainability":3}}'`,
  },
  {
    id: 'stats',
    method: 'GET',
    path: '/api/v1/stats',
    title: 'Get Statistics',
    description: 'Retrieve your check-in statistics and trends.',
    scope: 'read:stats',
    response: `{
  "summary": {
    "totalCheckins": 25,
    "checkinsLast30Days": 4,
    "averageLagScore": 38,
    "currentStreak": 3,
    "lastCheckinAt": "2024-01-15T10:30:00Z",
    "scoreTrend": "improving",
    "mostCommonWeakness": "sleep"
  },
  "dimensions": {
    "averages": {
      "energy": 3.5,
      "sleep": 2.8,
      "structure": 3.9,
      "initiation": 3.2,
      "engagement": 3.7,
      "sustainability": 3.4
    },
    "weakestBreakdown": {
      "sleep": 12,
      "energy": 8,
      "initiation": 5
    }
  },
  "driftCategories": {
    "aligned": 5,
    "mild": 10,
    "moderate": 8,
    "heavy": 2,
    "critical": 0
  },
  "weeklyHistory": [
    { "week": "2024-01-08", "count": 1, "averageScore": 42 }
  ]
}`,
    curlExample: `curl -X GET "https://your-app.com/api/v1/stats" \\
  -H "Authorization: Bearer llk_your_api_key"`,
  },
  {
    id: 'webhooks-list',
    method: 'GET',
    path: '/api/v1/webhooks',
    title: 'List Webhooks',
    description: 'Retrieve your registered webhook subscriptions.',
    scope: 'read:checkins',
    response: `{
  "data": [
    {
      "id": "uuid",
      "url": "https://your-server.com/webhook",
      "events": ["checkin.completed"],
      "isActive": true,
      "createdAt": "2024-01-10T08:00:00Z",
      "lastDeliveryAt": "2024-01-15T10:30:00Z",
      "lastDeliveryStatus": "success",
      "consecutiveFailures": 0
    }
  ]
}`,
    curlExample: `curl -X GET "https://your-app.com/api/v1/webhooks" \\
  -H "Authorization: Bearer llk_your_api_key"`,
  },
  {
    id: 'webhooks-create',
    method: 'POST',
    path: '/api/v1/webhooks',
    title: 'Create Webhook',
    description: 'Register a new webhook subscription to receive events.',
    scope: 'write:checkins',
    requestBody: `{
  "url": "https://your-server.com/webhook",
  "events": ["checkin.completed"]
}`,
    response: `{
  "id": "uuid",
  "url": "https://your-server.com/webhook",
  "events": ["checkin.completed"],
  "signingSecret": "whsec_...",  // Only returned once!
  "isActive": true,
  "createdAt": "2024-01-10T08:00:00Z"
}`,
    curlExample: `curl -X POST "https://your-app.com/api/v1/webhooks" \\
  -H "Authorization: Bearer llk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://your-server.com/webhook","events":["checkin.completed"]}'`,
  },
  {
    id: 'webhooks-delete',
    method: 'DELETE',
    path: '/api/v1/webhooks',
    title: 'Delete Webhook',
    description: 'Remove a webhook subscription.',
    scope: 'write:checkins',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Webhook ID to delete' },
    ],
    response: `{
  "message": "Webhook deleted successfully"
}`,
    curlExample: `curl -X DELETE "https://your-app.com/api/v1/webhooks?id=webhook_uuid" \\
  -H "Authorization: Bearer llk_your_api_key"`,
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-bg0 text-text0">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-text0">API Documentation</h1>
            <p className="text-text2 mt-1">Integrate Life-Lag into your applications</p>
          </div>
          <Link href="/home">
            <GhostButton>Back to Dashboard</GhostButton>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'overview'
                ? 'bg-white/10 text-text0'
                : 'text-text2 hover:text-text1 hover:bg-white/5'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSection('authentication')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'authentication'
                ? 'bg-white/10 text-text0'
                : 'text-text2 hover:text-text1 hover:bg-white/5'
            }`}
          >
            Authentication
          </button>
          <button
            onClick={() => setActiveSection('rate-limits')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'rate-limits'
                ? 'bg-white/10 text-text0'
                : 'text-text2 hover:text-text1 hover:bg-white/5'
            }`}
          >
            Rate Limits
          </button>
          <button
            onClick={() => setActiveSection('webhooks')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'webhooks'
                ? 'bg-white/10 text-text0'
                : 'text-text2 hover:text-text1 hover:bg-white/5'
            }`}
          >
            Webhooks
          </button>
          <button
            onClick={() => setActiveSection('endpoints')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'endpoints'
                ? 'bg-white/10 text-text0'
                : 'text-text2 hover:text-text1 hover:bg-white/5'
            }`}
          >
            Endpoints
          </button>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">Getting Started</h2>
              <p className="text-text1 mb-4">
                The Life-Lag API allows you to programmatically create check-ins, retrieve your data,
                and receive real-time notifications via webhooks. All endpoints are REST-based and
                return JSON responses.
              </p>
              <div className="bg-white/5 rounded-lg p-4 font-mono text-sm">
                <span className="text-text2">Base URL:</span>{' '}
                <span className="text-emerald-400">https://your-app.com/api/v1</span>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">Quick Start</h2>
              <ol className="list-decimal list-inside space-y-3 text-text1">
                <li>
                  <strong>Get an API Key:</strong> Generate one in{' '}
                  <Link href="/settings" className="text-emerald-400 hover:underline">
                    Settings
                  </Link>
                </li>
                <li>
                  <strong>Make your first request:</strong> Use the API key in the Authorization header
                </li>
                <li>
                  <strong>Handle responses:</strong> All responses are JSON with consistent error formatting
                </li>
              </ol>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">Response Format</h2>
              <p className="text-text1 mb-4">
                Successful responses return data directly. Error responses include an error message:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-emerald-400 mb-2">Success (200)</h3>
                  <pre className="bg-white/5 rounded-lg p-4 text-sm overflow-x-auto">
                    {`{
  "data": [...],
  "pagination": {...}
}`}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-400 mb-2">Error (4xx/5xx)</h3>
                  <pre className="bg-white/5 rounded-lg p-4 text-sm overflow-x-auto">
                    {`{
  "error": "Error message here"
}`}
                  </pre>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Authentication Section */}
        {activeSection === 'authentication' && (
          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">API Key Authentication</h2>
              <p className="text-text1 mb-4">
                All API requests require authentication using an API key. Include your key in the
                Authorization header:
              </p>
              <div className="bg-white/5 rounded-lg p-4 font-mono text-sm mb-4">
                <span className="text-text2">Authorization:</span>{' '}
                <span className="text-emerald-400">Bearer llk_your_api_key_here</span>
              </div>
              <p className="text-text1 mb-4">Or use the X-API-Key header:</p>
              <div className="bg-white/5 rounded-lg p-4 font-mono text-sm">
                <span className="text-text2">X-API-Key:</span>{' '}
                <span className="text-emerald-400">llk_your_api_key_here</span>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">API Key Security</h2>
              <ul className="list-disc list-inside space-y-2 text-text1">
                <li>API keys are prefixed with <code className="bg-white/10 px-1 rounded">llk_</code></li>
                <li>Keys are only shown once at creation - store them securely</li>
                <li>Never expose keys in client-side code or public repositories</li>
                <li>Revoke compromised keys immediately in Settings</li>
              </ul>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">Scopes</h2>
              <p className="text-text1 mb-4">
                API keys have scopes that limit what actions they can perform:
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <code className="text-emerald-400">read:checkins</code>
                  <span className="text-text2 text-sm">Read check-in history</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <code className="text-blue-400">write:checkins</code>
                  <span className="text-text2 text-sm">Create new check-ins</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <code className="text-purple-400">read:stats</code>
                  <span className="text-text2 text-sm">Read statistics and trends</span>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Rate Limits Section */}
        {activeSection === 'rate-limits' && (
          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">Rate Limiting</h2>
              <p className="text-text1 mb-4">
                API requests are rate limited to ensure fair usage. Limits vary by tier:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 px-4 text-text2 font-medium">Tier</th>
                      <th className="py-3 px-4 text-text2 font-medium">Requests</th>
                      <th className="py-3 px-4 text-text2 font-medium">Window</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-text1">Standard</td>
                      <td className="py-3 px-4 text-text1">60</td>
                      <td className="py-3 px-4 text-text2">per minute</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-text1">Premium</td>
                      <td className="py-3 px-4 text-text1">300</td>
                      <td className="py-3 px-4 text-text2">per minute</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">Rate Limit Headers</h2>
              <p className="text-text1 mb-4">
                Every response includes headers with rate limit information:
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <code className="text-emerald-400">X-RateLimit-Limit</code>
                  <span className="text-text2 text-sm">Maximum requests per window</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <code className="text-blue-400">X-RateLimit-Remaining</code>
                  <span className="text-text2 text-sm">Requests remaining in window</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <code className="text-purple-400">X-RateLimit-Reset</code>
                  <span className="text-text2 text-sm">Unix timestamp when window resets</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <code className="text-amber-400">Retry-After</code>
                  <span className="text-text2 text-sm">Seconds to wait (only on 429)</span>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Webhooks Section */}
        {activeSection === 'webhooks' && (
          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">Webhook Events</h2>
              <p className="text-text1 mb-4">
                Register webhooks to receive real-time notifications when events occur:
              </p>
              <div className="space-y-3">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-emerald-400">checkin.completed</code>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Available</span>
                  </div>
                  <p className="text-text2 text-sm">Triggered when a new check-in is created</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">Webhook Payload</h2>
              <p className="text-text1 mb-4">
                Webhook payloads are signed for security. Verify the signature using your signing secret:
              </p>
              <pre className="bg-white/5 rounded-lg p-4 text-sm overflow-x-auto">
                {`// Headers
X-Webhook-Signature: t=1704067200,v1=abc123...
X-Webhook-Event: checkin.completed

// Payload
{
  "event": "checkin.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "checkinId": "uuid",
    "lagScore": 42,
    "driftCategory": "moderate",
    "weakestDimension": "sleep",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}`}
              </pre>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-semibold text-text0 mb-4">Signature Verification</h2>
              <p className="text-text1 mb-4">
                To verify a webhook signature:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-text1">
                <li>Extract timestamp (t) and signature (v1) from X-Webhook-Signature header</li>
                <li>Concatenate: <code className="bg-white/10 px-1 rounded">{`{timestamp}.{payload}`}</code></li>
                <li>Compute HMAC-SHA256 of concatenated string with your signing secret</li>
                <li>Compare computed signature with v1 value</li>
                <li>Reject if timestamp is more than 5 minutes old (replay protection)</li>
              </ol>
            </GlassCard>
          </div>
        )}

        {/* Endpoints Section */}
        {activeSection === 'endpoints' && (
          <div className="space-y-6">
            {ENDPOINTS.map((endpoint) => (
              <GlassCard key={endpoint.id}>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span
                    className={`px-3 py-1 text-sm font-mono font-bold rounded border ${
                      METHOD_COLORS[endpoint.method]
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-lg text-text0">{endpoint.path}</code>
                  <span className="text-xs bg-white/10 text-text2 px-2 py-1 rounded">
                    {endpoint.scope}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-text0 mb-2">{endpoint.title}</h3>
                <p className="text-text1 mb-4">{endpoint.description}</p>

                {endpoint.parameters && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text2 mb-2">Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="py-2 px-3 text-text2">Name</th>
                            <th className="py-2 px-3 text-text2">Type</th>
                            <th className="py-2 px-3 text-text2">Required</th>
                            <th className="py-2 px-3 text-text2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.parameters.map((param) => (
                            <tr key={param.name} className="border-b border-white/5">
                              <td className="py-2 px-3 font-mono text-emerald-400">{param.name}</td>
                              <td className="py-2 px-3 text-text2">{param.type}</td>
                              <td className="py-2 px-3 text-text2">
                                {param.required ? 'Yes' : `No${(param as any).default ? ` (default: ${(param as any).default})` : ''}`}
                              </td>
                              <td className="py-2 px-3 text-text1">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {endpoint.requestBody && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text2 mb-2">Request Body</h4>
                    <pre className="bg-white/5 rounded-lg p-4 text-sm overflow-x-auto">
                      {endpoint.requestBody}
                    </pre>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text2 mb-2">Response</h4>
                  <pre className="bg-white/5 rounded-lg p-4 text-sm overflow-x-auto">
                    {endpoint.response}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-text2">Example</h4>
                    <button
                      onClick={() => copyToClipboard(endpoint.curlExample, endpoint.id)}
                      className="text-xs text-text2 hover:text-text1"
                    >
                      {copiedCode === endpoint.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-white/5 rounded-lg p-4 text-sm overflow-x-auto">
                    {endpoint.curlExample}
                  </pre>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-text2 mt-12">
          <p>Need help? Contact support or check the source code.</p>
        </div>
      </div>
    </div>
  );
}
