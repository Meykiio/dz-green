export const info = {
  about: {
    eyebrow: "À propos",
    hero: "Une carte pour chaque arbre d'Algérie.",
    lead:
      "Les plantations en Algérie ont lieu partout et ne sont presque jamais consignées. Algérie Verte est un lieu ouvert, géré par la communauté, pour tout rassembler sur une carte : ce qui a été planté, où, et si quelqu'un s'en occupe encore.",
    flow: {
      youReport: "Vous signalez",
      youReportBody: " une plantation, un soin ou un feu. Sans compte.",
      review: "Un bénévole relit",
      reviewBody: " des modérateurs locaux, par wilaya.",
      map: "C'est sur la carte",
      mapBody: " pour tout le monde.",
    },
    independent: {
      title: "Indépendant",
      body:
        "Cette plateforme n'est affiliée à aucune page, association ou institution particulière. Elle appartient à tous ceux qui plantent en Algérie. Tout le monde peut contribuer, avec ou sans compte — et chaque arbre sur la carte encourage le prochain à en planter un.",
    },
    reviewed: {
      title: "Relu avant publication",
      body:
        "Les plantations sont relues par des modérateurs bénévoles de la wilaya où elles ont été signalées. C'est ce qui garde les comptes honnêtes. Votre lien de suivi montre le statut dès qu'il change — en attente, approuvée, ou non approuvée, avec la note du modérateur quand il y en a une.",
    },
    immediate: {
      title: "Soins et feux, immédiats",
      body:
        "Tout le monde peut enregistrer un arrosage ou une vérification sur n'importe quel site approuvé — sans propriété ni affectation. Les feux passent sans relecture et apparaissent tout de suite sur la carte, parce que la vitesse compte plus que la forme.",
    },
    notEmergency: {
      title: "Ce n'est pas un service d'urgence",
      body:
        "Algérie Verte est une carte communautaire. Personne n'est de garde ici. En danger immédiat, contactez directement la Protection Civile au 14 ou 1021. Signaler un feu ici n'envoie pas de secours.",
    },
    privacy: {
      title: "Confidentialité, en termes simples",
      body:
        "Les signalements fonctionnent sans compte. Nous ne stockons jamais les adresses IP brutes — seulement des empreintes à sens unique pour ralentir le spam. Le secret de votre appareil tourne chaque jour et n'est jamais stocké en clair. Le nom et le téléphone des rapporteurs de feu restent sur le serveur, inaccessibles depuis la carte.",
    },
    back: "Retour à la carte",
    plantCta: "Planter un arbre",
  },
  privacy: {
    eyebrow: "Confidentialité",
    hero: "Vos données, en termes simples.",
    lead:
      "Algérie Verte collecte le minimum nécessaire pour faire tourner une carte publique et la garder honnête. Cette page dit exactement ce que c'est — et ce que ce n'est jamais.",
    public: {
      title: "Public sur la carte",
      body:
        "Ce que vous envoyez avec une plantation, un soin ou un feu : la photo, la wilaya, la commune, l'espèce et le nombre d'arbres, les dates, votre nom affiché si vous en ajoutez un, et le lieu que vous avez choisi. C'est le but de la plateforme — tout le monde peut le voir.",
    },
    never: {
      title: "Jamais public",
      phone:
        "Votre numéro de téléphone (si vous en ajoutez un sur le formulaire plante ou feu). Il existe pour qu'un modérateur puisse appeler et vérifier un signalement avant de l'approuver. Il est stocké côté serveur uniquement — aucun visiteur, aucune API publique et aucun autre utilisateur ne peut le lire, jamais. Il n'est ni partagé ni vendu.",
      ip:
        "Votre adresse IP et l'identifiant de votre appareil. Ils sont stockés uniquement sous forme d'empreintes à sens unique, pour stopper le spam et les vagues. Les valeurs brutes ne sont jamais écrites.",
      email:
        "Votre email (seulement si vous créez un compte — la plupart des gens n'en créent jamais). Utilisé uniquement pour la connexion.",
      push:
        "Les abonnements aux alertes feu (seulement si vous les activez). Votre navigateur nous donne une adresse de notification privée plus une wilaya optionnelle — pas de compte, pas de nom. Désactiver les alertes supprime l'abonnement du serveur.",
    },
    where: {
      title: "Où ça vit",
      body:
        "La base de données tourne sur Supabase et le site sur Vercel — vos signalements peuvent être stockés sur des serveurs hors d'Algérie. Des statistiques d'usage anonymes (pages vues) sont collectées par Vercel Analytics ; il n'y a ni publicité ni suivi sur d'autres sites. Le thème et les préférences restent dans le stockage local de votre navigateur.",
    },
    rights: {
      title: "Vos droits",
      body:
        "Selon la loi algérienne (Loi 18-07 sur la protection des données personnelles), vous pouvez demander à voir, corriger ou supprimer les données personnelles qui vous concernent — y compris un numéro de téléphone que vous avez soumis. Ouvrez un ticket sur GitHub et dites ce dont vous avez besoin. Les plantations approuvées restent sur la carte publique (elles sont la carte), mais tout ce qui vous identifie personnellement peut être retiré sur demande.",
    },
    who: {
      title: "Qui gère ça",
      body:
        "Algérie Verte est un projet communautaire géré par Sifeddine Mebarki (Meykiio), Alger — pas une entreprise, pas un organisme public. Questions sur cette page : même lien GitHub ci-dessus.",
    },
    termsLink: "conditions d'utilisation",
  },
  terms: {
    eyebrow: "Conditions d'utilisation",
    hero: "Le deal, simplement.",
    lead:
      "Algérie Verte est une carte gérée par la communauté. L'utiliser, c'est accepter quelques règles simples qui gardent la carte fiable.",
    honest: {
      title: "Des signalements honnêtes",
      body:
        "Ne signalez que ce qui est réel : des plantations qui ont eu lieu, des soins que vous avez vraiment donnés, des feux que vous voyez vraiment. Les signalements faux ou abusifs sont rejetés, et la barrière anti-abus limite les vagues répétées. Ce que vous publiez est public — publiez en conséquence.",
    },
    moderation: {
      title: "Modération bénévole",
      body:
        "Les plantations sont relues par des modérateurs bénévoles avant d'apparaître. Ils peuvent approuver, rejeter et laisser une note (visible sur votre lien de suivi). Leur décision garde les comptes honnêtes ; ce n'est une certification gouvernementale de rien.",
    },
    emergency: {
      title: "Pas un service d'urgence",
      emergencyLead: "Les feux signalés sur cette carte sont de l'information communautaire, rien de plus.",
      emergencyCall: "En cas de danger, appelez d'abord la Protection Civile au 14 ou 1021.",
      emergencyTail:
        "Cette plateforme ne dépêche pas de secours, n'alerte pas les autorités, et ne doit jamais être votre seul appel à l'aide.",
    },
    warranty: {
      title: "Aucune garantie",
      body:
        "La carte est construite à partir de signalements communautaires — elle peut être incomplète, fausse ou dépassée. Ne vous y fiez pas pour la sécurité, les déplacements ou des décisions juridiques. La plateforme est fournie telle quelle, gérée par des bénévoles, sans garantie de disponibilité. Vos photos restent les vôtres ; en les publiant, vous autorisez le projet à les afficher sur la carte. Le code est open source sous AGPL-3.0.",
    },
    issues: "Questions : ouvrez un ticket sur",
    privacyLink: "page de confidentialité",
  },
  volunteer: {
    eyebrow: "Devenir bénévole",
    hero: "Chaque point vert commence par une personne.",
    lead:
      "Des plantations sont signalées, des arbres sont arrosés, et — ces jours-ci, des jours durs — des feux sont surveillés. La carte n'est vraie qu'à la hauteur des gens qui l'entretiennent. Nous constituons une petite équipe locale dans chaque wilaya, et nous cherchons des gens comme vous.",
    whatTitle: "Ce que font les bénévoles",
    what: {
      reviewTitle: "Relire les plantations.",
      reviewBody: " Quelques minutes par semaine : cette photo montre-t-elle bien ce qu'on dit ?",
      triageTitle: "Trier les feux signalés.",
      triageBody: " Vérifier, marquer résolu, signaler les fausses alertes — pour que la carte reste utile.",
      rallyTitle: "Mobiliser votre région.",
      rallyBody:
        " Parlez-en à vos voisins, votre association, votre ville. La carte grandit par le bouche à oreille.",
    },
    askTitle: "Ce qu'on demande",
    askBody:
      "De l'honnêteté et quelques minutes, quelques fois par semaine. Aucune expérience requise — on vous guide dans l'outil ensemble.",
    neverTitle: "Ce qu'on ne demande jamais",
    neverBody:
      "De l'argent, du matériel, ou d'aller combattre le feu. Nous sommes une carte communautaire, pas un service d'urgence — en danger, appelez d'abord la Protection Civile au 14 ou 1021.",
    formTitle: "Parlez-nous de vous",
    formLead:
      "Un formulaire court. Nous les lisons tous, et nous répondons par email ou WhatsApp — c'est le seul moyen par lequel on vous contacte.",
    review24: "Nous examinons chaque candidature en 24 heures max.",
    accountSignedIn: "Connecté en tant que {email} — votre candidature est liée à ce compte.",
    signinTitle: "Créez un compte pour être bénévole",
    signinBody:
      "Les modérateurs travaillent depuis un compte. Créez-en un (20 secondes) ou connectez-vous — puis revenez ici pour postuler. Nous examinons chaque candidature en 24 heures max.",
    signinCta: "Créer un compte / Se connecter",
  },
  volunteerForm: {
    name: "Votre nom *",
    email: "Email *",
    emailPlaceholder: "vous@exemple.com",
    phone: "Téléphone / WhatsApp (pour vous joindre vite)",
    phonePlaceholder: "05 XX XX XX XX",
    wilaya: "Votre wilaya *",
    chooseWilaya: "Choisissez votre wilaya",
    extra: "Envie d'aider aussi ailleurs ?",
    extraPlaceholder: "ex. aussi les wilayas voisines",
    intents: "Je peux aider à (plusieurs choix) *",
    intent: {
      review: "Relire les plantations",
      triage: "Trier les feux signalés",
      organize: "Mobiliser ma région",
      share: "Faire passer le mot",
      other: "Autre",
    },
    time: "Combien de temps avez-vous ?",
    timePlaceholder: "ex. 10 minutes, quelques soirs par semaine",
    message: "Quelque chose à nous faire savoir ?",
    messagePlaceholder: "Votre ville, votre groupe, votre motivation — tout",
    privacy:
      "Ce formulaire va directement aux mainteneurs. Vos informations restent privées — lues uniquement par nous, jamais affichées sur la carte.",
    sending: "Envoi…",
    submit: "Envoyer ma proposition d'aide",
    doneTitle: "Merci — c'est bien reçu.",
    doneBody:
      "Nous lisons chaque candidature et nous vous contacterons par email ou WhatsApp. D'ici là, la meilleure aide est un signalement vrai : continuez d'utiliser la carte.",
    toastError: "Envoi impossible. Réessayez.",
  },
  auth: {
    titleSignin: "Se connecter",
    titleSignup: "Créer un compte",
    intro:
      "Les comptes servent uniquement aux modérateurs et au suivi de vos propres contributions. Plantations, soins et feux fonctionnent sans compte.",
    email: "Email",
    password: "Mot de passe",
    wait: "Patientez…",
    signin: "Se connecter",
    signup: "Créer un compte",
    toggleSignup: "Besoin d'un compte ? Inscrivez-vous",
    toggleSignin: "Déjà un compte ? Connectez-vous",
    toastOk: "Compte créé. Vous pouvez vous connecter.",
    toastError: "Une erreur est survenue.",
    genericAuthError:
      "Connexion impossible — vérifiez vos informations et réessayez. Un compte par email.",
  },
  receipt: {
    eyebrow: "Reçu",
    heading: "Votre signalement",
    checking: "Vérification…",
    notFound: "Ce lien ne correspond à aucun signalement",
    notFoundBody:
      "Les liens de suivi sont affichés une seule fois, juste après l'envoi. Vérifiez les fautes de frappe — si vous l'avez perdu, il est irrécupérable (nous ne pouvons pas dire quel signalement était le vôtre, et c'est voulu).",
    submitted: "Envoyé le {date}",
    pendingMsg:
      "Un modérateur bénévole va l'examiner sous peu. Revenez sur cette page plus tard — elle se met à jour toute seule.",
    approvedMsg:
      "C'est en ligne. Merci — chaque arbre sur la carte encourage le prochain à en planter un.",
    back: "Retour à la carte",
    kind: {
      planting: "Plantation d'arbres",
      care: "Soin",
      fire: "Signalement de feu",
      fallback: "Signalement",
    },
    status: {
      pending: "En cours de relecture",
      approved: "Approuvé — sur la carte",
      rejected: "Non approuvé",
      published: "Publié sur la carte",
      active: "Actif",
      resolved: "Résolu",
      falseAlarm: "Marqué comme fausse alerte",
    },
  },
};
