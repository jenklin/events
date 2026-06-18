#!/usr/bin/env node

/**
 * cloudpeers Events - Event Page Generator
 *
 * Generates customized event landing pages from templates with cloudpeers branding
 *
 * Usage: tsx generate.ts <config.json>
 * Example: tsx generate.ts ../../configs/tech-meetup-dec2025.json
 */

import * as fs from 'fs';
import * as path from 'path';
import type { EventConfig } from '../../shared/types/event';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateScheduleHTML(schedule: EventConfig['schedule']): string {
  return schedule.map(item => `
    <div class="bg-paradigm-panel rounded-xl p-6 shadow-sm border border-white/10 hover:shadow-md transition-shadow">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <div class="w-20 h-20 rounded-lg bg-gradient-to-br from-maroon to-tan flex items-center justify-center">
            <span class="text-white font-bold text-lg">${item.time.split(':')[0]}:${item.time.split(':')[1]}</span>
          </div>
        </div>
        <div class="flex-1">
          <div class="flex items-start justify-between">
            <h4 class="text-lg font-semibold text-white">${item.title}</h4>
            <span class="inline-block px-3 py-1 bg-tan-light text-maroon text-xs font-semibold rounded-full">
              ${item.type}
            </span>
          </div>
          ${item.description ? `<p class="text-paradigm-muted mt-2">${item.description}</p>` : ''}
          ${item.speaker ? `
            <div class="flex items-center gap-2 mt-3 text-sm text-paradigm-muted">
              <span>${item.speaker}</span>
            </div>
          ` : ''}
          ${item.duration ? `
            <div class="flex items-center gap-2 mt-2 text-sm text-paradigm-muted">
              <span>${item.duration} minutes</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('\n');
}

function generateSpeakerCards(speakers: EventConfig['speakers']): string {
  if (!speakers || speakers.length === 0) return '';

  return speakers.map(speaker => `
    <div class="bg-paradigm-panel rounded-xl p-6 shadow-sm border border-white/10 hover:shadow-md transition-shadow">
      <div class="flex items-start gap-4">
        ${speaker.photo ? `
          <img src="${speaker.photo}" alt="${speaker.name}" class="w-20 h-20 rounded-full object-cover">
        ` : `
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-maroon to-tan flex items-center justify-center">
            <span class="text-white font-bold text-2xl">${speaker.name.charAt(0)}</span>
          </div>
        `}
        <div class="flex-1">
          <h4 class="text-xl font-bold text-white">${speaker.name}</h4>
          <p class="text-sm text-maroon font-medium mb-2">${speaker.title}</p>
          <p class="text-paradigm-muted text-sm mb-3">${speaker.bio}</p>
          <div class="flex items-center gap-3">
            ${speaker.linkedin ? `
              <a href="${speaker.linkedin}" target="_blank" class="text-paradigm-muted hover:text-maroon transition-colors">
                LinkedIn
              </a>
            ` : ''}
            ${speaker.twitter ? `
              <a href="${speaker.twitter}" target="_blank" class="text-paradigm-muted hover:text-maroon transition-colors">
                Twitter
              </a>
            ` : ''}
            ${speaker.website ? `
              <a href="${speaker.website}" target="_blank" class="text-paradigm-muted hover:text-maroon transition-colors">
                Website
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('\n');
}

function generateCustomFields(customFields?: EventConfig['registration']['customFields']): string {
  if (!customFields || customFields.length === 0) return '';

  return customFields.map(field => {
    switch (field.type) {
      case 'text':
        return `
          <div>
            <label class="block text-sm font-medium text-paradigm-text mb-2">
              ${field.label}${field.required ? ' *' : ''}
            </label>
            <input
              type="text"
              x-model="registration.custom.${field.id}"
              ${field.required ? 'required' : ''}
              class="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              placeholder="${field.placeholder || ''}"
            >
          </div>
        `;

      case 'textarea':
        return `
          <div>
            <label class="block text-sm font-medium text-paradigm-text mb-2">
              ${field.label}${field.required ? ' *' : ''}
            </label>
            <textarea
              x-model="registration.custom.${field.id}"
              ${field.required ? 'required' : ''}
              rows="3"
              class="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              placeholder="${field.placeholder || ''}"
            ></textarea>
          </div>
        `;

      case 'select':
        return `
          <div>
            <label class="block text-sm font-medium text-paradigm-text mb-2">
              ${field.label}${field.required ? ' *' : ''}
            </label>
            <select
              x-model="registration.custom.${field.id}"
              ${field.required ? 'required' : ''}
              class="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
            >
              <option value="">Select...</option>
              ${field.options?.map(opt => `<option value="${opt}">${opt}</option>`).join('\n')}
            </select>
          </div>
        `;

      default:
        return '';
    }
  }).join('\n');
}

async function generateEvent(configPath: string): Promise<void> {
  log('cloudpeers Event Generator', 'cyan');
  log('─'.repeat(50), 'cyan');

  // Check if config file exists
  if (!fs.existsSync(configPath)) {
    log(`Config file not found: ${configPath}`, 'red');
    process.exit(1);
  }

  log(`Loading config: ${configPath}`, 'blue');

  // Load configuration
  const configContent = fs.readFileSync(configPath, 'utf8');
  const config: EventConfig = JSON.parse(configContent);

  log(`Config loaded: ${config.event.title}`, 'green');

  // Read template
  const templatePath = path.join(__dirname, '../templates/default.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  log(`Generating event page...`, 'blue');

  // Generate dynamic content
  const scheduleHTML = generateScheduleHTML(config.schedule);
  const speakerCards = generateSpeakerCards(config.speakers);
  const customFieldsHTML = generateCustomFields(config.registration.customFields);

  // Define replacements
  const replacements: Record<string, string> = {
    '{{EVENT_ID}}': config.event.id,
    '{{EVENT_TITLE}}': config.event.title,
    '{{EVENT_DATE}}': config.event.date,
    '{{EVENT_TIME}}': config.event.time,
    '{{EVENT_LOCATION}}': config.event.location,
    '{{EVENT_CATEGORY}}': config.event.category,
    '{{EVENT_DESCRIPTION}}': config.event.description,
    '{{META_DESCRIPTION}}': config.event.whatToExpect.intro,
    '{{WHAT_TO_EXPECT_CONTENT}}': config.event.whatToExpect.content,
    '{{SCHEDULE_ITEMS}}': scheduleHTML,
    '{{SPEAKER_CARDS}}': speakerCards,
    '{{HAS_SPEAKERS}}': (config.speakers && config.speakers.length > 0).toString(),
    '{{HAS_GALLERY}}': ((config as any).gallery?.enabled || false).toString(),
    '{{GALLERY_URL}}': (config as any).gallery?.viewerUrl || '#',
    '{{COLLECT_PHONE}}': config.registration.collectPhone.toString(),
    '{{CUSTOM_FIELDS}}': customFieldsHTML,
    '{{SUPABASE_URL}}': config.integrations.supabaseUrl,
    '{{SUPABASE_ANON_KEY}}': config.integrations.supabaseAnonKey,
  };

  // Apply replacements
  for (const [key, value] of Object.entries(replacements)) {
    template = template.replace(new RegExp(key, 'g'), value);
  }

  // Determine output path
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFileName = `${config.event.slug}.html`;
  const outputPath = path.join(outputDir, outputFileName);

  // Write output file
  fs.writeFileSync(outputPath, template, 'utf8');

  log('─'.repeat(50), 'cyan');
  log(`Event page generated successfully!`, 'green');
  log(`Output: ${outputPath}`, 'blue');
  log(`Event: ${config.event.title}`, 'blue');
  log(`Date: ${config.event.date} at ${config.event.time}`, 'blue');
  log(`Schedule items: ${config.schedule.length}`, 'blue');
  log(`Speakers: ${config.speakers?.length || 0}`, 'blue');
  log('─'.repeat(50), 'cyan');
  log(`\nNext steps:`, 'yellow');
  log(`   1. Review the generated page: ${outputPath}`, 'yellow');
  log(`   2. Deploy to your hosting platform`, 'yellow');
  log(`   3. Test registration flow`, 'yellow');
  log(`   4. Share with attendees!`, 'yellow');
}

// Main execution
const configPath = process.argv[2];

if (!configPath) {
  log('Usage: tsx generate.ts <config.json>', 'red');
  log('Example: tsx generate.ts ../../configs/tech-meetup-dec2025.json', 'yellow');
  process.exit(1);
}

generateEvent(configPath).catch(error => {
  log(`Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
