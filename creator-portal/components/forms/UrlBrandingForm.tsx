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
        <h2 className="text-2xl font-bold text-white mb-4">Event URL & Branding</h2>
        <p className="text-paradigm-muted">Customize your event's web address and branding.</p>
      </div>

      {/* URL Slug */}
      <div>
        <label className="block text-sm font-medium text-paradigm-text mb-2">
          Event URL Slug *
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-paradigm-muted">events.cloudpeers.com/e/</span>
          <input
            {...register('urlBranding.customSlug')}
            type="text"
            placeholder="sarahs-30th"
            className="flex-1 px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        {errors.urlBranding?.customSlug && (
          <p className="mt-1 text-sm text-red-600">
            {errors.urlBranding.customSlug.message}
          </p>
        )}
        <p className="mt-1 text-sm text-paradigm-muted">Only lowercase letters, numbers, and hyphens</p>
      </div>

      {/* Custom Subdomain (Premium) */}
      <div className="p-6 bg-gradient-to-br from-paradigm-gold/10 to-paradigm-gold/10 rounded-lg border-2 border-paradigm-gold/40">
        <div className="flex items-start gap-3 mb-4">
          <input
            {...register('urlBranding.customSubdomain.enabled')}
            type="checkbox"
            className="mt-1 w-6 h-6 text-paradigm-gold rounded focus:ring-paradigm-gold"
          />
          <div>
            <h3 className="text-lg font-bold text-white">Custom Subdomain (Premium)</h3>
            <p className="text-sm text-paradigm-muted mt-1">
              Get a branded URL like <strong>yourname.redheli.com</strong>
            </p>
          </div>
        </div>

        {subdomainEnabled && (
          <div className="ml-9 space-y-4">
            <div>
              <label className="block text-sm font-medium text-paradigm-text mb-2">Subdomain</label>
              <div className="flex items-center gap-2">
                <input
                  {...register('urlBranding.customSubdomain.subdomain')}
                  type="text"
                  placeholder="sarahs30th"
                  className="flex-1 px-4 py-2 border border-paradigm-gold/40 rounded-lg focus:ring-2 focus:ring-paradigm-gold"
                />
                <span className="text-sm text-paradigm-muted">.</span>
                <select
                  {...register('urlBranding.customSubdomain.provider')}
                  className="px-4 py-2 border border-paradigm-gold/40 rounded-lg focus:ring-2 focus:ring-paradigm-gold"
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
      <div className="p-4 bg-paradigm-panel rounded-lg border border-white/10">
        <p className="text-sm font-medium text-paradigm-text mb-1">Your event will be at:</p>
        <p className="text-lg font-mono text-paradigm-purple-light break-all">{eventUrl}</p>
      </div>

      {/* Branding (Optional) */}
      <div className="p-6 bg-paradigm-deep-black rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Custom Branding (Optional)</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-paradigm-text mb-2">Organization Name</label>
            <input
              {...register('urlBranding.branding.organizationName')}
              type="text"
              placeholder="cloudpeers Events"
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-paradigm-text mb-2">Logo URL</label>
            <input
              {...register('urlBranding.branding.logoUrl')}
              type="url"
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-paradigm-text mb-2">Primary Color</label>
              <input
                {...register('urlBranding.branding.colors.primary')}
                type="color"
                defaultValue="#FF6B6B"
                className="w-full h-12 border border-white/10 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-paradigm-text mb-2">Secondary Color</label>
              <input
                {...register('urlBranding.branding.colors.secondary')}
                type="color"
                defaultValue="#4ECDC4"
                className="w-full h-12 border border-white/10 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-paradigm-text mb-2">Accent Color</label>
              <input
                {...register('urlBranding.branding.colors.accent')}
                type="color"
                defaultValue="#FFE66D"
                className="w-full h-12 border border-white/10 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
