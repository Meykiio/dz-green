import type { FormsMessages } from "../en/forms";

export const forms: FormsMessages = {
  field: {
    optionalSuffix: " (facultatif)",
    requiredMark: " *",
  },
  photo: {
    take: "Prendre ou choisir une photo",
    preparing: "Préparation de la photo…",
    remove: "Retirer la photo",
    selectedAlt: "Sélectionnée",
    errorRead: "Impossible de lire cette photo. Essayez-en une autre.",
  },
  location: {
    wilaya: "Wilaya",
    chooseWilaya: "Choisir une wilaya",
    autoFilled: "Détectée depuis votre point — modifiez-la ici si elle est erronée.",
    commune: "Commune",
    exactTitle: "Emplacement exact (facultatif)",
    exactHint:
      "Utilisé une seule fois pour poser votre point — jamais stocké, jamais suivi. Sans cela, le signalement est marqué au niveau de la wilaya.",
    useMyLocation: "Utiliser ma position",
    hideMap: "Masquer la carte",
    adjustOnMap: "Ajuster sur la carte",
    removePin: "Retirer le point",
    pasteLink: "Ou collez un lien Google Maps",
    linkOk: "Point défini depuis le lien — ajustez-le ci-dessous si besoin.",
    linkBad:
      "Impossible de lire les coordonnées de ce lien. Ouvrez le lieu dans Google Maps, copiez l'URL complète depuis la barre d'adresse et collez-la.",
    pinAt: "Point à {lat}, {lng}",
    accuracy: "précision ±{meters} m ({quality})",
    adjustPinHint: "— ajustez le point si besoin",
    excellent: "excellente",
    good: "bonne",
    rough: "approximative",
    poor: "faible",
  },
  plant: {
    title: "J'ai planté un arbre",
    intro:
      "La photo et l'emplacement sont requis pour que le relevé soit fiable. Aucun compte nécessaire.",
    photoLabel: "Photo de la plantation",
    numTrees: "Nombre d'arbres",
    datePlanted: "Date de plantation",
    species: "Espèce",
    speciesPlaceholder: "pin d'Alep, olivier, eucalyptus…",
    notes: "Notes",
    yourNameGroup: "Votre nom ou groupe",
    submit: "Envoyer la plantation",
    reviewNote:
      "Les plantations sont vérifiées par des modérateurs bénévoles avant d'apparaître sur la carte.",
    errPhotoWilaya: "Ajoutez une photo et choisissez une wilaya d'abord.",
    doneTitle: "Merci — en cours d'examen",
    doneIntro:
      "Un modérateur bénévole approuvera votre plantation sous peu. Une fois approuvée, elle apparaît sur la carte pour tout le monde.",
    donePrivacy:
      "Public sur la carte : votre photo, la wilaya, la commune, l'espèce, le nombre d'arbres, la date et le nom affiché. Jamais public : votre IP ou votre appareil (stockés uniquement sous forme d'empreintes).",
    logAnother: "En enregistrer un autre",
  },
  care: {
    title: "Enregistrer un entretien",
    intro:
      "Chacun peut entretenir n'importe quel site — sans propriété ni affectation. Publication immédiate.",
    site: "Site",
    chooseSite: "Choisir un site de plantation",
    noSites: "Aucun site approuvé pour l'instant — ajoutez d'abord une plantation.",
    optionTrees: "{count} arbres",
    whatDidYouDo: "Qu'avez-vous fait ?",
    actionWatered: "Arrosé",
    actionChecked: "Vérifié",
    actionNeedsAttention: "Besoin d'attention",
    actionOther: "Autre",
    date: "Date",
    photoLabel: "Photo",
    notes: "Notes",
    yourName: "Votre nom",
    submit: "Enregistrer l'entretien",
    errChooseSite: "Choisissez le site que vous avez entretenu.",
    doneTitle: "Entretien enregistré",
    doneIntro:
      "Merci — c'est aussitôt sur la carte. Les entretiens ne nécessitent pas de vérification.",
  },
  fire: {
    title: "Signaler un incendie",
    intro:
      "La wilaya suffit — tout le reste est facultatif. Les signalements sont publiés immédiatement.",
    disclaimer:
      "Appelez d'abord la Protection Civile : 14 ou 1021. Algérie Verte est une carte communautaire, pas un service d'urgence.",
    howBig: "Quelle ampleur ?",
    small: "Petit / naissant",
    large: "Grand / se propage",
    whatYouSee: "Que voyez-vous ?",
    photoLabel: "Photo",
    yourName: "Votre nom",
    phone: "Téléphone pour les modérateurs (privé)",
    submit: "Publier le signalement",
    errWilaya: "Choisissez une wilaya d'abord.",
    doneTitle: "Signalement publié",
    doneIntro:
      "Votre signalement est en ligne sur la carte. En cas de danger pour des personnes, appelez la Protection Civile au 14 ou 1021 — cette plateforme n'envoie pas de secours.",
    donePrivacy:
      "Public sur la carte : l'emplacement, la wilaya, l'ampleur, la description et la photo. Jamais public : votre nom et votre numéro — ils restent sur le serveur, hors d'atteinte de la carte.",
  },
  errGeneric: "Échec de l'envoi. Réessayez.",
};
