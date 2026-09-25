'use strict';

/* Static authored content loaded by tooling in the same order as the runtime.
   Camp conversations are loaded for their references, but are not permanent
   event IDs; permanentEvents deliberately excludes D.campConversations. */
const STATIC_CONTENT_FILES = Object.freeze([
  'src/03-data.js',
  'src/03f-npc-portraits.js',
  'src/03g-scenes.js',
  'src/03i-story-expansion.js',
  'src/03j-camp-conversations.js',
  'src/03k-main-evidence.js',
  'src/03l-main-recovery.js',
  'src/03m-finale-reading.js',
]);

function permanentEvents(D) {
  return [
    ...(D.events || []),
    ...(D.roadCheckInEvents || []),
    D.seoulOpenEvent,
    D.gateEvent,
    D.bridgeEvent,
    ...(D.seoulStops || []),
    D.onboardingMission,
    ...(D.openingDeparture || []),
  ].filter(Boolean);
}

module.exports = {STATIC_CONTENT_FILES, permanentEvents};
