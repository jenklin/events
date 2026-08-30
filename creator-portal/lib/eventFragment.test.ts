/** Run: npx tsx --tsconfig tsconfig.json lib/eventFragment.test.ts (from creator-portal) */
import { buildEventFragment, eventFragmentFor, assertNoHiddenLocationLeak } from './eventFragment';
import { validateFragment } from './a2ui/validator';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) pass++; else { fail++; console.error('  ✗', m); } };

const base = { slug: 'xmas-2026', title: 'Winter gathering', date: '2026-12-20', startTime: '18:00', timezone: 'America/Los_Angeles', venueName: 'The Old Firehouse', plusCode: '849VQJ2M+2X', coordinates: { lat: 37.7955, lng: -122.3937 }, eventUrl: 'https://events.cloudpeers.com/e/xmas-2026', galleryUrl: 'https://events.cloudpeers.com/e/xmas-2026/gallery', published: true as const };

// shown location
const shown = buildEventFragment({ ...base, locationHidden: false });
const v1 = validateFragment(shown);
ok(v1.valid, `shown-location event validates under Connector: ${v1.errors.map((e) => e.message).join(' | ')}`);
ok(shown.components.map((c) => c.type).join(',') === 'community-activity,collaboration-prompt,network-map', 'trio');
ok((shown.components[1].props as any).consent_required === true && /never receives your name/.test((shown.components[1].props as any).consent_statement), 'gallery consent explicit');
ok(/address, password and guest list never leave/.test((shown.components[1].props as any).privacy_notice), 'host rules in the privacy notice');
ok(((shown.components[2].props as any).nodes as any[]).every((n) => n.relationship !== 'guest'), 'guests never mapped');

// hidden location: the projection already strips venue/coords; the fragment must carry none
const hidden = buildEventFragment({ ...base, venueName: '', plusCode: undefined, coordinates: undefined, locationHidden: true });
const v2 = validateFragment(hidden);
ok(v2.valid, `hidden-location event validates: ${v2.errors.map((e) => e.message).join(' | ')}`);
ok(/hidden until guests RSVP/.test((hidden.components[1].props as any).privacy_notice), 'hidden rule stated');
ok(!JSON.stringify(hidden).includes('37.79') && !JSON.stringify(hidden).includes('849VQJ'), 'no coordinate or Plus Code anywhere');

// leak refusal: a hidden event whose input still carried a coordinate/venue is refused, not served
let threw = false; try { buildEventFragment({ ...base, locationHidden: true }); } catch { threw = true; }
ok(threw, 'hidden + coordinate in input → refused');
threw = false; try { assertNoHiddenLocationLeak({ ...hidden, components: [{ type: 'text', props: { body: 'meet at 849VQJ2M+2X' } }] } as any); } catch { threw = true; }
ok(threw, 'Plus Code in prose → refused');
threw = false; try { assertNoHiddenLocationLeak({ ...hidden, components: [{ type: 'text', props: { body: 'The Old Firehouse, 7pm' } }] } as any, 'The Old Firehouse'); } catch { threw = true; }
ok(threw, 'venue name in prose → refused');

// wrapper never throws
const r = eventFragmentFor({ ...base, locationHidden: true });
ok(!r.fragment && !!r.invalid && /leak/.test(r.invalid[0]), 'wrapper returns a named refusal');
ok(!!eventFragmentFor({ ...base, locationHidden: false }).fragment, 'wrapper returns a fragment for a shown event');

console.log(`eventFragment: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
