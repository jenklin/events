'use client';

import { UseFormReturn } from 'react-hook-form';
import { EventFormData, getEventUrl } from '@/lib/eventSchema';

export default function UrlBrandingForm({ form }: { form: UseFormReturn<EventFormData> }) {
  const { register, watch, formState: { errors } } = form;

  const customSlug = watch('urlBranding.customSlug');
  const subdomainEnabled = watch('urlBranding.customSubdomain.enabled');
  const subdomain = watch('urlBranding.customSubdomain.subdomain');
  const provider = watch('urlBranding.customSubdomain.provider');

  const eventUrl = subdomainEnabled && subdomain
    ? `https://${subdomain}.${provider}`
    : `https://events.cloudpeers.com/e/${customSlug || 'your-event'}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Event URL & Branding</h2>
        <p className="text-slate-600">Customize your event's web address and branding.</p>
      </div>

      {/* URL Slug */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Event URL Slug *
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">events.cloudpeers.com/e/</span>
          <input
            {...register('urlBranding.customSlug')}
            type="text"
            placeholder="sarahs-30th"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        {errors.urlBranding?.customSlug && (
          <p className="mt-1 text-sm text-red-600">
            {errors.urlBranding.customSlug.message}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">Only lowercase letters, numbers, and hyphens</p>
      </div>

      {/* Custom Subdomain (Premium) */}
      <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-300">
        <div className="flex items-start gap-3 mb-4">
          <input
            {...register('urlBranding.customSubdomain.enabled')}
            type="checkbox"
            className="mt-1 w-6 h-6 text-amber-600 rounded focus:ring-amber-500"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-900">🌟 Custom Subdomain (Premium)</h3>
            <p className="text-sm text-slate-600 mt-1">
              Get a branded URL like <strong>yourname.redheli.com</strong>
            </p>
          </div>
        </div>

        {subdomainEnabled && (
          <div className="ml-9 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subdomain</label>
              <div className="flex items-center gap-2">
                <input
                  {...register('urlBranding.customSubdomain.subdomain')}
                  type="text"
                  placeholder="sarahs30th"
                  className="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-500">.</span>
                <select
                  {...register('urlBranding.customSubdomain.provider')}
                  className="px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="redheli.com">redheli.com</option>
                  <option value="cloudpeers.com">cloudpeers.com</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview URL */}
      <div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
        <p className="text-sm font-medium text-slate-700 mb-1">Your event will be at:</p>
        <p className="text-lg font-mono text-purple-600 break-all">{eventUrl}</p>
      </div>

      {/* Branding (Optional) */}
      <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Custom Branding (Optional)</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Organization Name</label>
            <input
              {...register('urlBranding.branding.organizationName')}
              type="text"
              placeholder="CloudPeers Events"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Logo URL</label>
            <input
              {...register('urlBranding.branding.logoUrl')}
              type="url"
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Primary Color</label>
              <input
                {...register('urlBranding.branding.colors.primary')}
                type="color"
                defaultValue="#FF6B6B"
                className="w-full h-12 border border-slate-300 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Color</label>
              <input
                {...register('urlBranding.branding.colors.secondary')}
                type="color"
                defaultValue="#4ECDC4"
                className="w-full h-12 border border-slate-300 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
              <input
                {...register('urlBranding.branding.colors.accent')}
                type="color"
                defaultValue="#FFE66D"
                className="w-full h-12 border border-slate-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
