/** Run: npx tsx --tsconfig tsconfig.json lib/galleryLayer.test.ts (from creator-portal) */
import { selectGalleryLayer, isOwn, providerUrl, haversineM, type GalleryAssetRow } from './galleryLayer';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) pass++; else { fail++; console.error('  ✗', m); } };

const event = { rowId: 'ev-1', title: 'sunnymax', date: '2026-09-06', venueName: 'The Barn', coordinates: { lat: 37.7955, lng: -122.3937 }, hostEmail: 'Host@Example.com' };
const album = { id: 'alb-1', event_id: 'ev-1', is_private: true };
const assets: GalleryAssetRow[] = [
  { id: 'a1', album_id: 'alb-1', type: 'image', provider_id: 'cf-1', metadata: { uploaded_by_email: 'guest@example.com', uploaded_by_name: 'A guest' } },
  { id: 'a2', album_id: 'alb-1', type: 'video', provider: 'cloudflare-stream', provider_id: 'st-1' },            // host upload (no uploader)
  { id: 'a3', album_id: 'alb-1', type: 'image', provider_id: 'cf-3', uploader_email: 'me@example.com', uploader_name: 'Me' },
  { id: 'a4', album_id: 'alb-1', type: 'image', provider: 'gcs', provider_id: 'path/x.jpg', uploader_email: 'me@example.com' },
];

// ownership
ok(isOwn(assets[2], 'ME@example.com', event.hostEmail), 'own upload matches case-insensitively');
ok(!isOwn(assets[0], 'me@example.com', event.hostEmail), "another guest's upload is not own");
ok(isOwn(assets[1], 'host@example.com', event.hostEmail), 'host owns uploads with no uploader');
ok(!isOwn(assets[1], 'me@example.com', event.hostEmail), 'guest does not own host uploads');
ok(!isOwn(assets[2], null, event.hostEmail), 'anonymous owns nothing');

// a guest exporting: own image composes, own gcs withheld provider_unavailable, others not_owned
const g = selectGalleryLayer({ event, album, assets, requesterEmail: 'me@example.com', cfImagesHash: 'HASH' });
ok(g.has_layer === true, 'guest gets a layer');
if (g.has_layer) {
  ok(g.layer_id === 'gallery:alb-1' && g.entity_type === 'Event' && g.provenance === 'attested' && g.sovereignty_class === 'externalizable', 'contract fields');
  ok(g.media.length === 1 && g.media[0].url === 'https://imagedelivery.net/HASH/cf-3/public' && g.media[0].kind === 'image', 'only the own image composes');
  ok(g.withheld.map((w) => `${w.layer_id}:${w.reason}`).sort().join(',') === 'a1:not_owned,a2:not_owned,a4:provider_unavailable', 'everything else withheld with a reason');
  ok(g.withheld.find((w) => w.layer_id === 'a1')?.attribution === 'A guest', 'withheld keeps the contributor credit');
  ok(g.attribution.contributor === 'Me' && g.time?.at === '2026-09-06', 'contributor + event date carried');
  ok(!JSON.stringify(g).includes('example.com'), 'no email leaves the layer');
}

// the host exporting: host video (HLS) composes
const h = selectGalleryLayer({ event, album, assets, requesterEmail: 'host@example.com', cfImagesHash: 'HASH' });
ok(h.has_layer === true && h.media.length === 1 && h.media[0].kind === 'video' && h.media[0].mime === 'application/vnd.apple.mpegurl' && h.media[0].url.endsWith('/st-1/manifest/video.m3u8'), 'host video as HLS');

// anonymous: layer exists but everything withheld
const an = selectGalleryLayer({ event, album, assets, requesterEmail: null, cfImagesHash: 'HASH' });
ok(an.has_layer === true && an.media.length === 0 && an.withheld.length === 4 && an.withheld.every((w) => w.reason === 'not_owned'), 'anonymous ⇒ all withheld not_owned');

// no CF hash ⇒ own images withheld provider_not_configured
const nc = selectGalleryLayer({ event, album, assets, requesterEmail: 'me@example.com', cfImagesHash: null });
ok(nc.has_layer === true && nc.media.length === 0 && nc.withheld.find((w) => w.layer_id === 'a3')?.reason === 'provider_not_configured', 'missing delivery hash is named, not silent');

ok(selectGalleryLayer({ event, album, assets: [], requesterEmail: 'me@example.com' }).has_layer === false, 'empty album ⇒ no layer');
ok(providerUrl({ id: 'x', album_id: 'a', type: 'audio', provider_id: 'p' }, 'H').ok === false, 'unsupported kind withheld');
ok(Math.abs(haversineM(37.7955, -122.3937, 37.7955, -122.3937)) < 1 && haversineM(37.57, 126.98, 37.58, 126.98) > 1000, 'haversine sane');

console.log(`galleryLayer: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
