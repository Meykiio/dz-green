export const info = {
  about: {
    eyebrow: "About",
    hero: "One map for every tree in Algeria.",
    lead:
      "Planting in Algeria happens everywhere and is recorded almost nowhere. Green Algeria is an open, community-run place to put it all on one map: what was planted, where, and whether anyone is still looking after it.",
    flow: {
      youReport: "You report",
      youReportBody: " a planting, care, or a fire. No account.",
      review: "A volunteer reviews",
      reviewBody: " local moderators, per wilaya.",
      map: "It's on the map",
      mapBody: " for everyone.",
    },
    independent: {
      title: "Independent",
      body:
        "This platform is not affiliated with any single page, association or institution. It belongs to everyone planting in Algeria. Anyone can contribute, with or without an account — and every tree on the map nudges the next person to plant one.",
    },
    reviewed: {
      title: "Reviewed before it's public",
      body:
        "Planting submissions are reviewed by volunteer moderators in the wilaya they were reported in. That keeps the tree counts honest. Your receipt link shows the status the moment it changes — pending, approved, or not approved, with the moderator's note when there is one.",
    },
    immediate: {
      title: "Care and fire are immediate",
      body:
        "Anyone can log watering or a check-up on any approved site — no ownership, no assignment. Fire reports skip review entirely and appear on the map straight away, because speed matters more than tidiness there.",
    },
    notEmergency: {
      title: "This is not an emergency service",
      body:
        "Green Algeria is a community map. Nobody is on duty here. If there is immediate danger, contact Protection Civile directly on 14 or 1021. Reporting a fire here does not send help.",
    },
    privacy: {
      title: "Privacy, in plain terms",
      body:
        "Submissions work without an account. We never store raw IP addresses — only one-way hashes used to slow down spam. Your device secret rotates daily and is never stored raw. Reporter name and phone on fire reports stay on the server, unreachable from the map.",
    },
    back: "Back to the map",
    plantCta: "Plant a tree",
  },
  privacy: {
    eyebrow: "Privacy",
    hero: "Your data, in plain terms.",
    lead:
      "Green Algeria collects the minimum needed to run a public map and keep it honest. This page says exactly what that is — and what it never is.",
    public: {
      title: "Public on the map",
      body:
        "What you send with a planting, care log or fire report: the photo, wilaya, commune, species and tree count, dates, your display name if you add one, and the location you chose. That is the point of the platform — anyone can see it.",
    },
    never: {
      title: "Never public",
      phone:
        "Your phone number (if you add one on the plant or fire form). It exists so a moderator can call to verify a submission before approving it. It is stored server-side only — no visitor, no public API and no other user can read it, ever. It is never shared or sold.",
      ip:
        "Your IP address and device identifier. They are stored only as one-way hashes, used to stop spam and flooding. The raw values are never written down.",
      email:
        "Your email (only if you create an account — most people never do). Used for sign-in only.",
    },
    where: {
      title: "Where it lives",
      body:
        "The database runs on Supabase and the site on Vercel — your submissions may be stored on servers outside Algeria. Anonymous usage statistics (page views) are collected by Vercel Analytics; there is no advertising and no tracking across other sites. Theme and preferences stay in your own browser's local storage.",
    },
    rights: {
      title: "Your rights",
      body:
        "Under Algerian law (Law 18-07 on personal data protection) you can ask to see, correct or delete the personal data tied to you — including a phone number you submitted. Open an issue on GitHub and say what you need. Approved plantings stay on the public map (they are the map), but anything that identifies you personally can be removed on request.",
    },
    who: {
      title: "Who runs this",
      body:
        "Green Algeria is a community project run by Sifeddine Mebarki (Meykiio), Algiers — not a company, not a government body. Questions about this page: same GitHub link above.",
    },
    termsLink: "terms of use",
  },
  terms: {
    eyebrow: "Terms of use",
    hero: "The deal, plainly.",
    lead:
      "Green Algeria is a community-run map. Using it means accepting a few simple rules that keep the map trustworthy.",
    honest: {
      title: "Honest submissions",
      body:
        "Only report what is real: plantings that happened, care you actually gave, fires you actually see. Fake or abusive submissions are rejected, and the abuse gate limits repeat flooding. What you post is public — post accordingly.",
    },
    moderation: {
      title: "Volunteer moderation",
      body:
        "Plantings are reviewed by volunteer moderators before they appear. They can approve, reject, and leave a note (visible on your receipt link). Their call keeps the counts honest; it is not a government certification of anything.",
    },
    emergency: {
      title: "Not an emergency service",
      emergencyLead: "Fire reports on this map are community information, nothing more.",
      emergencyCall: "In any danger, call Protection Civile on 14 or 1021 first.",
      emergencyTail:
        "This platform does not dispatch help, does not alert authorities, and must never be your only call for help.",
    },
    warranty: {
      title: "No warranty",
      body:
        "The map is built from community submissions — it can be incomplete, wrong, or out of date. Do not rely on it for safety, travel, or legal decisions. The platform is provided as is, run by volunteers, with no guarantee of availability. Your photos stay yours; by posting you allow the project to display them on the map. The code is open source under AGPL-3.0.",
    },
    issues: "Questions: open an issue on",
    privacyLink: "privacy page",
  },
  volunteer: {
    eyebrow: "Volunteer with us",
    hero: "Every green dot starts with a person.",
    lead:
      "Plantings are being reported, trees are being watered, and — these days, hard days — fires are being watched. The map is only as true as the people who keep it. We're building a small local team in every wilaya, and we're looking for people like you.",
    whatTitle: "What volunteers do",
    what: {
      reviewTitle: "Review plantings.",
      reviewBody: " A few minutes a week: does this photo show what people say it does?",
      triageTitle: "Triage fire reports.",
      triageBody: " Verify, mark resolved, flag false alarms — so the community map stays useful.",
      rallyTitle: "Rally your area.",
      rallyBody:
        " Tell your neighbors, your association, your city. The map grows by word of mouth.",
    },
    askTitle: "What we ask",
    askBody:
      "Honesty and a few minutes, a few times a week. No experience needed — we'll walk you through the tool together.",
    neverTitle: "What we never ask",
    neverBody:
      "Money, equipment, or firefighting. We are a community map, not an emergency service — in danger, call Protection Civile on 14 or 1021 first.",
    formTitle: "Tell us about yourself",
    formLead:
      "A short form. We read every one, and we'll answer by email or WhatsApp — that's the only way we contact you.",
    review24: "We review every application within 24 hours max.",
    accountSignedIn: "Signed in as {email} — your application is linked to this account.",
    signinTitle: "Create an account to volunteer",
    signinBody:
      "Moderators work from an account. Create one (20 seconds) or sign in — then come back here to apply. We review every application within 24 hours max.",
    signinCta: "Create account / Sign in",
  },
  volunteerForm: {
    name: "Your name *",
    email: "Email *",
    emailPlaceholder: "you@example.com",
    phone: "Phone / WhatsApp (so we can reach you quickly)",
    phonePlaceholder: "05 XX XX XX XX",
    wilaya: "Your wilaya *",
    chooseWilaya: "Choose your wilaya",
    extra: "Also happy to help elsewhere?",
    extraPlaceholder: "e.g. Als also neighboring wilayas",
    intents: "I can help with (pick any) *",
    intent: {
      review: "Review plantings",
      triage: "Triage fire reports",
      organize: "Rally my area",
      share: "Spread the word",
      other: "Other",
    },
    time: "How much time do you have?",
    timePlaceholder: "e.g. 10 minutes, a few evenings a week",
    message: "Anything you want us to know?",
    messagePlaceholder: "Your town, your group, your motivation — anything",
    privacy:
      "This form goes straight to the maintainers. Your details stay private — they are read only by us, never shown on the map.",
    sending: "Sending…",
    submit: "Send my offer to help",
    doneTitle: "Thank you — we've got it.",
    doneBody:
      "We read every application and we'll reach out by email or WhatsApp. Until then, the best help is a true report: keep using the map.",
    toastError: "Could not send. Try again.",
  },
  auth: {
    titleSignin: "Sign in",
    titleSignup: "Create an account",
    intro:
      "Accounts are only for moderators and for keeping track of your own contributions. Planting, care and fire reports work without one.",
    email: "Email",
    password: "Password",
    wait: "Please wait…",
    signin: "Sign in",
    signup: "Create account",
    toggleSignup: "Need an account? Sign up",
    toggleSignin: "Already have an account? Sign in",
    toastOk: "Account created. You can sign in now.",
    toastError: "Something went wrong.",
    genericAuthError:
      "Couldn't sign in — check your details and try again. One account per email.",
  },
  receipt: {
    eyebrow: "Receipt",
    heading: "Your submission",
    checking: "Checking…",
    notFound: "This link doesn't match any submission",
    notFoundBody:
      "Receipt links are shown once, right after you submit. Check the link for typos — if you lost it, there is no way to recover it (we can't tell which submission was yours, and that's deliberate).",
    submitted: "Submitted {date}",
    pendingMsg:
      "A volunteer moderator will review it shortly. Check this page again later — it updates on its own.",
    approvedMsg:
      "It's live. Thank you — every tree on the map nudges the next person to plant one.",
    back: "Back to the map",
    kind: {
      planting: "Tree planting",
      care: "Care log",
      fire: "Fire report",
      fallback: "Submission",
    },
    status: {
      pending: "Under review",
      approved: "Approved — on the map",
      rejected: "Not approved",
      published: "Published on the map",
      active: "Active",
      resolved: "Resolved",
      falseAlarm: "Marked as false alarm",
    },
  },
};
