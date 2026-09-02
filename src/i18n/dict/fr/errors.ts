/**
 * Client-facing error strings. Server code keeps English as the source of
 * truth; `mapServerError` rewrites known messages into a localized string.
 */
export const errors = {
  toasts: {
    generic: "Envoi impossible. Réessayez.",
    offlineQueued: "Vous êtes hors ligne — nous l'enverrons dès que vous serez reconnecté.",
    offlineSent: "Votre signalement a été envoyé.",
    offlineFailed: "Impossible d'envoyer votre signalement. Réessayez.",
  },
  mapServer: {
    futureDate: "La date ne peut pas être dans le futur.",
    locPair: "La localisation demande latitude ET longitude, ou aucune des deux.",
    generic: "Une erreur est survenue. Réessayez.",
    outsideAlgeria:
      "Ce point n'est pas dans une wilaya cartographiée. Déplacez le repère sur l'Algérie.",
    badWilaya: "Choisissez une wilaya valide.",
    siteUnavailable: "Ce site de plantation n'est pas encore disponible.",
    tooFast: "C'était trop rapide — réessayez.",
    rateLimit: "Vous avez envoyé beaucoup de signalements cette heure-ci. Réessayez plus tard.",
    deviceLimit: "Trop de signalements depuis cet appareil. Réessayez plus tard.",
    imgUnsupported: "Format d'image non pris en charge.",
    imgTooLarge: "La photo est trop lourde.",
    imgSave: "Impossible d'enregistrer la photo. Réessayez.",
    feedbackSave: "Impossible d'enregistrer le message. Réessayez.",
    volunteerSave: "Impossible d'envoyer votre candidature. Réessayez.",
    requireAdmin: "Il faut un accès administrateur pour faire cela.",
    notModerator: "Cet utilisateur n'est pas modérateur.",
    needSignin: "Connectez-vous pour voir votre activité.",
  },
};
