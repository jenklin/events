'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventFormSchema, EventFormData, generateSlug } from '../lib/eventSchema';

// Form sections
import EventBasicsForm from './forms/EventBasicsForm';
import DateLocationForm from './forms/DateLocationForm';
import GuestSettingsForm from './forms/GuestSettingsForm';
import RsvpOptionsForm from './forms/RsvpOptionsForm';
import OptionalFeaturesForm from './forms/OptionalFeaturesForm';
import UrlBrandingForm from './forms/UrlBrandingForm';
import VisibilityForm from './forms/VisibilityForm';
import AdditionalDetailsForm from './forms/AdditionalDetailsForm';
import EventPreview from './EventPreview';

const STEPS = [
  { id: 1, name: 'Event Basics', component: EventBasicsForm },
  { id: 2, name: 'Date & Location', component: DateLocationForm },
  { id: 3, name: 'Guest Settings', component: GuestSettingsForm },
  { id: 4, name: 'RSVP Options', component: RsvpOptionsForm },
  { id: 5, name: 'Optional Features', component: OptionalFeaturesForm },
  { id: 6, name: 'URL & Branding', component: UrlBrandingForm },
  { id: 7, name: 'Visibility', component: VisibilityForm },
  { id: 8, name: 'Additional Details', component: AdditionalDetailsForm },
  { id: 9, name: 'Preview', component: EventPreview },
];

export default function EventCreatorWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventBasics: {
        coverImage: { type: 'preset', theme: 'classic' },
      },
      dateLocation: {
        timezone: 'America/New_York',
        hideLocationUntilRsvp: false,
      },
      guestSettings: {
        capacity: { enabled: false, enableWaitlist: false },
        plusOnes: { allowed: false, maxPerGuest: 1 },
        approval: {
          requireApproval: false,
          allowMutualInvites: true,
          allowGuestPhotos: true,
        },
      },
      rsvpOptions: {
        collectName: true,
        collectEmail: true,
        collectPhone: false,
        customQuestions: [],
      },
      potluck: {
        enabled: false,
        categories: ['Appetizer', 'Main Dish', 'Side Dish', 'Dessert', 'Drinks'],
        showWhatOthersBring: true,
      },
      music: {
        enabled: false,
        type: 'both',
        service: 'suno',
        maxSongsPerGuest: 1,
        showPlaylist: true,
      },
      urlBranding: {
        customSlug: '',
        customSubdomain: { enabled: false, provider: 'redheli.com' },
        branding: {
          colors: {
            primary: '#FF6B6B',
            secondary: '#4ECDC4',
            accent: '#FFE66D',
          },
        },
      },
      visibility: {
        isPublic: false,
        guestList: {
          showGuestNames: true,
          showGuestCount: true,
          showGuestPhotos: true,
          showActivityTimestamps: true,
        },
      },
      additional: {
        cost: { hasCost: false },
        schedule: [],
        enablePhotoGallery: true,
      },
      host: {
        name: '',
        email: '',
      },
    },
  });

  // Auto-generate slug from title
  const watchTitle = form.watch('eventBasics.title');
  if (watchTitle && !form.getValues('urlBranding.customSlug')) {
    form.setValue('urlBranding.customSlug', generateSlug(watchTitle), {
      shouldValidate: false,
    });
  }

  const nextStep = async () => {
    // Define which fields to validate for each step
    const stepFields: Record<number, any> = {
      1: ['eventBasics.title', 'eventBasics.coverImage'],
      2: [
        'dateLocation.date',
        'dateLocation.startTime',
        'dateLocation.venueName',
        'dateLocation.address',
      ],
      3: ['guestSettings'],
      4: ['rsvpOptions'],
      5: ['potluck', 'music'],
      6: ['urlBranding.customSlug'],
      7: ['visibility'],
      8: ['host.name', 'host.email', 'additional'],
    };

    // Validate only the current step's fields
    const fieldsToValidate = stepFields[currentStep];
    const isValid = fieldsToValidate
      ? await form.trigger(fieldsToValidate)
      : true;

    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else if (!isValid) {
      // Scroll to first error
      const errors = form.formState.errors;
      console.log('Validation errors:', errors);
      alert('Please fill in all required fields before continuing.');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: EventFormData, overwrite: boolean = false) => {
    setIsPublishing(true);
    try {
      console.log('Submitting event data:', data);

      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, overwrite }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Server response error:', result);

        // Check if it's a duplicate slug/subdomain error
        const isDuplicateSlug = result.error?.includes('is already taken');

        if (isDuplicateSlug && !overwrite) {
          // Prompt user to overwrite
          const confirmOverwrite = confirm(
            `${result.error}\n\nDo you want to overwrite the existing event with this new data?\n\n` +
            `Warning: This will permanently delete the existing event and all its data (RSVPs, photos, etc.).`
          );

          if (confirmOverwrite) {
            // Retry with overwrite flag
            setIsPublishing(false);
            await onSubmit(data, true);
            return;
          }
          return;
        }

        // Show detailed validation errors
        if (result.error === 'Validation failed' && result.details) {
          const errorMessages = result.details
            .map((err: any) => `${err.path.join('.')}: ${err.message}`)
            .join('\n');
          alert(`Validation failed:\n\n${errorMessages}`);
        } else {
          alert(`Failed to create event: ${result.error || 'Unknown error'}`);
        }
        return;
      }

      // Redirect to success page
      window.location.href = `/events/success?id=${result.eventId}`;
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Export current form data as JSON
  const exportFormData = () => {
    const currentData = form.getValues();
    const dataStr = JSON.stringify(currentData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `event-${currentData.urlBranding?.customSlug || 'draft'}-${Date.now()}.json`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import form data from JSON file
  const importFormData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);

          // Validate the imported data against the schema
          const validatedData = eventFormSchema.parse(jsonData);

          // Reset form with imported data
          form.reset(validatedData);

          alert('Event data imported successfully!');
        } catch (error: any) {
          console.error('Import error:', error);
          if (error.name === 'ZodError') {
            const errorMessages = error.errors
              .map((err: any) => `${err.path.join('.')}: ${err.message}`)
              .join('\n');
            alert(`Invalid JSON format:\n\n${errorMessages}`);
          } else {
            alert('Failed to import JSON file. Please check the file format.');
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Create Your Event
          </h1>
          <p className="text-slate-300">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
          </p>

          {/* Import/Export Buttons */}
          <div className="flex justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={importFormData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import JSON
            </button>
            <button
              type="button"
              onClick={exportFormData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <form onSubmit={form.handleSubmit((data) => onSubmit(data))}>
            <CurrentStepComponent form={form} />

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                ← Back
              </button>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium transition-all shadow-lg"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold transition-all shadow-lg disabled:opacity-50"
                >
                  {isPublishing ? 'Publishing...' : '🎉 Publish Event'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Step Indicators */}
        <div className="mt-8 flex justify-center gap-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition-all ${
                step.id === currentStep
                  ? 'bg-purple-500 w-8'
                  : step.id < currentStep
                  ? 'bg-green-500'
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
