/**
 * Client-facing error strings. Server code keeps English as the source of
 * truth; `mapServerError` rewrites known messages into a localized string so
 * the UI is never English-flavoured for Arabic users.
 */
export const errors = {
  toasts: {
    generic: "Could not submit. Try again.",
    offlineQueued: "You're offline — we'll send this as soon as you reconnect.",
    offlineSent: "Your submission was sent.",
    offlineFailed: "Could not send your submission. Please try again.",
  },
  mapServer: {
    futureDate: "Date can't be in the future.",
    locPair: "Location needs both latitude and longitude, or neither.",
    generic: "Something went wrong. Please try again.",
    outsideAlgeria:
      "That location isn't inside a mapped wilaya. Please move the pin onto Algeria.",
    badWilaya: "Choose a valid wilaya.",
    siteUnavailable: "That planting site is not available yet.",
    tooFast: "That was too fast — please try again.",
    rateLimit: "You've sent a lot of reports in the last hour. Please try again later.",
    deviceLimit: "Too many submissions from this device. Please try again later.",
    imgUnsupported: "Unsupported image format.",
    imgTooLarge: "Photo is too large.",
    imgSave: "Could not save the photo. Please try again.",
    feedbackSave: "Could not save feedback. Try again.",
    volunteerSave: "Could not send your application. Try again.",
    requireAdmin: "You need administrator access to do that.",
    notModerator: "That user is not a moderator.",
    needSignin: "Sign in to see your activity.",
  },
};
