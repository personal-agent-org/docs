import { createI18n } from 'vue-i18n';

export type SiteLocale = 'en' | 'de';

export const messages = {
  en: {
    nav: {
      about: 'About',
      marketplace: 'Marketplace',
      docs: 'Docs',
      documentation: 'Documentation',
      organizations: 'For organizations',
      github: 'GitHub',
      open: 'Open navigation',
      main: 'Main navigation',
      language: 'Language',
      cloud: 'Cloud',
      cloudConnect: 'Cloud Connect',
      hosted: 'Hosted Personal Agent',
    },
    sponsor: {
      label: 'Sponsored by',
      claim: 'the sovereign alternative to OpenRouter',
    },
    footer: {
      slogan: 'Your world, handled.',
      explore: 'Explore',
      project: 'Project',
      license: 'MIT license',
    },
    home: {
      meta: 'An agent you can trust.',
      seoDescription:
        'Use private AI agents across web, desktop, terminal, Android and voice hardware on a local-first, self-hostable platform with explicit trust controls.',
      kicker: 'Open source · local first · self-hostable',
      title: 'An agent',
      titleAccent: 'you can trust.',
      lead: 'A self-hostable LLM chat and agent platform on a durable runtime. Per-user agents use tools, browse your data, drive connected computers and browsers, run integrations, react to events, and act proactively on your behalf.',
      getStarted: 'Get started',
      viewGithub: 'View on GitHub',
      preview: 'Personal Agent product preview',
      mainChat: 'Main chat',
      inbox: 'Inbox',
      agenda: 'Agenda',
      files: 'Files',
      sessions: 'Sessions',
      newSession: 'New session',
      recentActivity: 'Recent activity',
      noSessions: 'No sessions yet',
      greeting: 'Good to see you',
      message: 'Send a message…',
      auto: 'Auto',
      integrations: 'Integrations',
      standard: 'Standard',
      normalChat: 'Normal chat',
      coding: 'Coding',
      codingHint: 'Recommended for development',
      trigger: 'Trigger',
      run: 'Run',
      result: 'Result',
      principles: {
        private: 'Private by design',
        open: 'Open source',
        durable: 'Durable execution',
        governance: 'Fail-closed governance',
      },
      clients: {
        eyebrow: 'Five ways in · one Personal Agent',
        title: 'Your assistant, wherever you are.',
        copy: 'Move naturally between browser, desktop, phone and terminal, or simply speak. Every client connects to the Personal Agent instance you choose.',
        webTitle: 'Web',
        webCopy:
          'The complete experience in any modern browser, with nothing to install on your device.',
        webMeta: 'Browser · complete experience',
        desktopTitle: 'Desktop',
        desktopCopy:
          'A native Linux client with tray integration and notifications for conversations that stay close at hand.',
        desktopMeta: 'Linux · native notifications',
        tuiTitle: 'Terminal',
        tuiCopy:
          'Streaming chat, sessions, agents and controls in a fast, keyboard-first terminal interface.',
        tuiMeta: 'Rust TUI · keyboard first',
        appTitle: 'Mobile app',
        appCopy:
          'Connect Android to your self-hosted instance with native push, deep links and sharing.',
        appMeta: 'Android · native companion',
        voiceTitle: 'Voice assistant',
        voiceCopy:
          'Get Alexa-style hands-free access through Home Assistant Voice PE: wake word, natural request and a governed response through the speaker.',
        voiceMeta: 'Home Assistant Voice PE · local hardware',
      },
      trust: {
        eyebrow: 'Privacy · explicit trust · local first',
        title: 'Your data does not have to trust the cloud.',
        copy: 'Run the core platform and compatible models on infrastructure you choose. If you enable an external provider, every request must clear an explicit trust gate before protected context can leave your boundary.',
        link: 'Read security & privacy',
        modelLabel: 'Personal Agent trust model',
        boundary: 'Your trust boundary',
        localFirst: 'Local-first core',
        systemOfRecord: 'System of record',
        coreData: 'Chats · memory · workflows · encrypted secrets',
        dataClass: 'Data class',
        orgFloor: 'Organization floor',
        integrationTier: 'Integration',
        requirement: 'effective requirement',
        singleGate: 'One gate on every run path',
        gateRule: 'provider tier ≥ required tier',
        failClosed: 'Fail closed',
        clearedOnly: 'cleared routes only',
        internal: 'Internal',
        internalHint: 'own / on-prem',
        regulated: 'Regulated',
        regulatedHint: 'cleared external',
        standard: 'Unregulated',
        standardHint: 'enabled external',
        blocked: 'No cleared provider? No request leaves the boundary.',
        assurances: {
          localTitle: 'Your instance is the system of record',
          localCopy:
            'Chats, memory and workflows live with the deployment you choose. The full core can run on your infrastructure.',
          modelsTitle: 'Models earn access',
          modelsCopy:
            'Local, regulated and other enabled providers only receive data their configured tier permits.',
          defaultTitle: 'Failure means stop',
          defaultCopy:
            'Auto-routing, fallbacks, sub-agents and background runs all use the same fail-closed rule.',
          scopedTitle: 'Capabilities stay separated',
          scopedCopy:
            'Device credentials are scoped, Computer Service cannot read chats, and untrusted content loses privileged tools.',
        },
      },
      section1Title: 'One system for the world around you.',
      section1Copy:
        'Conversation is only the surface. Personal Agent connects memory, tools, durable execution and policy underneath it.',
      features: {
        memoryTitle: 'World-state memory',
        memoryCopy:
          'A bitemporal, causal graph connects live entities and long-term memory with provenance.',
        durableTitle: 'Tasks that keep going',
        durableCopy:
          'Agents and workflows keep running, survive interruption, and return results to the conversation.',
        chatTitle: 'Chat & agents',
        chatCopy:
          'Models, modes, security, sub-agents, voice, rewind and run revert in each conversation.',
        integrationsTitle: 'Deep integrations',
        integrationsCopy:
          'Tools, agents, entities, surfaces, cards and message providers share one capability model.',
        devicesTitle: 'Connected devices',
        devicesCopy:
          'Computer and browser services provide scoped host capabilities without granting chat access.',
        securityTitle: 'Security & governance',
        securityCopy:
          'Data classification, scoped credentials, budgets and explicit policy at every model boundary.',
      },
      architectureTitle: 'Powerful by design.\nControlled by default.',
      architectureCopy:
        'Every request passes through the same governed path, whether it runs inline or continues durably in the background.',
      architectureLink: 'Explore the architecture',
      flowLabel: 'Request processing flow',
      context: 'Context',
      chatWorld: 'Chat + world state',
      contextDetail: 'memory · entities · integrations',
      classified: 'classified',
      governance: 'Governance',
      policyGate: 'Fail-closed policy gate',
      policyDetail: 'identity · permissions · data class',
      approved: 'approved',
      inline: 'Inline',
      immediate: 'Immediate answer',
      durable: 'Durable',
      completion: 'Run to completion',
      marketplaceTitle: 'Extend it around your world.',
      marketplaceCopy:
        'The marketplace brings reusable capabilities into Personal Agent without weakening its permission and governance model.',
      kinds: {
        agents: 'Agents',
        agentsCopy: 'Purpose-built agents with defined capabilities and governed delegation.',
        skills: 'Skills',
        skillsCopy: 'Progressively disclosed expertise that agents load only when it is relevant.',
        integrations: 'Integrations',
        integrationsCopy:
          'Connections to services and data that contribute tools and capabilities.',
      },
      browse: 'Browse {kind}',
      startHere: 'Start here',
      readDocs: 'Read the documentation',
    },
    organizations: {
      meta: 'For organizations',
      seoDescription:
        'Deploy Personal Agent for companies and public institutions with controlled infrastructure, identity, data and governed execution.',
      eyebrow: 'For companies and public institutions',
      title: 'AI assistance under your control.',
      lead: 'Operate Personal Agent in an environment that matches your security, governance and data-sovereignty requirements—from a dedicated cloud deployment to your own infrastructure.',
      contact: 'Talk to us',
      explore: 'Explore the platform',
      trustLabel: 'Built for accountable deployment',
      trustTitle: 'Automation that fits your organization—not the other way around.',
      trustCopy:
        'Personal Agent combines conversational access with durable workflows, scoped tools and explicit policy. Teams gain practical automation while administrators retain control over identity, models, data and execution.',
      pillars: {
        controlTitle: 'Deployment control',
        controlCopy:
          'Run in a dedicated environment or on infrastructure you operate. Keep architectural and operational ownership where your requirements demand it.',
        identityTitle: 'Identity & access',
        identityCopy:
          'Connect organizational identity, define roles and scopes, and separate employee, service and device credentials.',
        governanceTitle: 'Governed execution',
        governanceCopy:
          'Apply explicit permissions, data classification, budgets and approval boundaries to tools, agents and workflows.',
        extensibilityTitle: 'Controlled extensibility',
        extensibilityCopy:
          'Adopt integrations, skills and agents through a capability model that makes requested access visible before rollout.',
      },
      sectorsLabel: 'One platform, different operating models',
      sectorsTitle: 'For regulated teams and public responsibility.',
      businessTitle: 'Companies',
      businessCopy:
        'Connect internal systems, automate recurring work and give teams a consistent assistant without surrendering control of operational data.',
      publicTitle: 'Government & public sector',
      publicCopy:
        'Design deployments around organizational boundaries, transparent policy and self-operated infrastructure—without making unsupported compliance promises.',
      partnershipTitle: 'Plan your deployment with us.',
      partnershipCopy:
        'We can discuss architecture, integration scope, rollout stages and operational ownership with your technical and procurement teams.',
      email: 'Email',
      phone: 'Phone',
      placeholder: 'Placeholder contact',
      response: 'For initial project and procurement conversations.',
    },
    cloudConnect: {
      meta: 'Cloud Connect',
      seoDescription:
        'Connect securely to your self-hosted Personal Agent from supported apps without exposing your home network or opening router ports.',
      eyebrow: 'For self-hosted Personal Agent',
      status: 'In preparation',
      title: 'At home on your server. Available wherever you are.',
      lead: 'Cloud Connect is the simple connection service for privately operated Personal Agent instances. Reach your assistant from your apps without exposing your home network or manually maintaining remote-access infrastructure.',
      primary: 'Follow the launch',
      selfHost: 'Self-host Personal Agent',
      promiseLabel: 'Keep the instance. Lose the networking chores.',
      promiseTitle: 'A managed bridge to your self-hosted Personal Agent.',
      promiseCopy:
        'Your Personal Agent and its data remain on the system you operate. Cloud Connect handles the connection layer between your instance and supported clients.',
      features: {
        accessTitle: 'Secure remote connection',
        accessCopy:
          'Connect supported apps without opening inbound router ports or publishing the instance directly on the internet.',
        discoveryTitle: 'Simple app setup',
        discoveryCopy:
          'Link clients through a stable Personal Agent identity instead of copying changing addresses and certificates between devices.',
        pushTitle: 'Reliable notifications',
        pushCopy:
          'Receive event and workflow notifications while payloads and access remain scoped to the connected instance.',
        controlTitle: 'Client-side control',
        controlCopy:
          'Connection credentials stay with your clients. Cloud Connect is not a second chat store and does not become the owner of your instance data.',
      },
      distinction: 'Looking for a service that also operates the Personal Agent instance?',
      hostedLink: 'Explore Personal Agent Cloud',
      note: 'The final feature set, pricing and availability will be announced before launch.',
    },
    hosted: {
      meta: 'Personal Agent Cloud',
      seoDescription:
        'A planned hosted Personal Agent offering with managed deployment, updates, monitoring and recovery.',
      eyebrow: 'Managed Personal Agent',
      status: 'In preparation',
      title: 'Your Personal Agent, without operating the platform yourself.',
      lead: 'Personal Agent Cloud is the planned managed offering for people who want a dedicated Personal Agent experience without maintaining servers, updates and backups.',
      primary: 'Register interest',
      compare: 'See Cloud Connect',
      valueLabel: 'A managed home for your agent',
      valueTitle: 'Start with the product—not the infrastructure.',
      valueCopy:
        'We operate the platform lifecycle while you retain control of your account, connected services and the capabilities you grant to agents and workflows.',
      features: {
        managedTitle: 'Managed operations',
        managedCopy:
          'Platform deployment, updates, monitoring and recovery are handled as part of the service.',
        privateTitle: 'Dedicated boundaries',
        privateCopy:
          'The service is designed around clear tenant, identity and credential boundaries rather than a shared public chat surface.',
        appsTitle: 'Ready for Personal Agent apps',
        appsCopy:
          'Connect supported desktop, terminal and mobile clients through the same discovery-based setup used across the platform.',
        portabilityTitle: 'A path to self-hosting',
        portabilityCopy:
          'The hosted offer is being designed to avoid locking the product experience to one operating model.',
      },
      audienceTitle: 'Two ways to run Personal Agent.',
      selfTitle: 'Self-host + Cloud Connect',
      selfCopy:
        'You operate the Personal Agent instance; Cloud Connect simplifies remote client access.',
      hostedTitle: 'Personal Agent Cloud',
      hostedCopy: 'We operate the Personal Agent platform and its supporting services for you.',
      note: 'Hosting regions, service levels, migration options and pricing will be published before orders open.',
    },
    marketplace: {
      meta: 'Marketplace',
      seoDescription:
        'Discover agents, skills, integrations and workflows built for the Personal Agent capability and governance model.',
      title: 'Marketplace',
      intro:
        'Browse agents, skills, integrations, and workflows. Adopted items run in your context with your data classification, integrations, model, and governance.',
      search: 'Search the marketplace',
      filter: 'Filter by type',
      all: 'All',
      agents: 'Agents',
      skills: 'Skills',
      integrations: 'Integrations',
      workflows: 'Workflows',
      item: 'item',
      items: 'items',
      emptyTitle: 'No matching items',
      emptyCopy: 'Try another term or reset the type filter.',
      clear: 'Clear filters',
      verified: 'Verified publisher',
      by: 'by {publisher}',
      details: 'View details',
      what: 'What it does',
      capabilities: 'Requested capabilities',
      preview: 'Catalog preview',
      installNote:
        'Installation will connect to your Personal Agent instance and always show the exact permissions before adoption.',
      install: 'Install from your instance',
      notFound: 'Marketplace item not found',
      back: 'Back to marketplace',
    },
    docs: {
      title: 'Documentation',
      filter: 'Filter documentation',
      notFound: 'Page not found',
      notFoundCopy: 'This documentation page does not exist.',
      home: 'Documentation home',
      groups: {
        gettingStarted: 'Getting started',
        userGuide: 'User guide',
        administration: 'Administration',
        architecture: 'Architecture',
        development: 'Development',
        design: 'Design notes',
        comparisons: 'Comparisons',
        more: 'More',
      },
    },
    notFound: {
      meta: 'Not found',
      title: 'That path is uncharted.',
      copy: 'The page may have moved, or it never existed.',
      back: 'Back home',
    },
  },
  de: {
    nav: {
      about: 'Über',
      marketplace: 'Marktplatz',
      docs: 'Doku',
      documentation: 'Dokumentation',
      organizations: 'Für Organisationen',
      github: 'GitHub',
      open: 'Navigation öffnen',
      main: 'Hauptnavigation',
      language: 'Sprache',
      cloud: 'Cloud',
      cloudConnect: 'Cloud Connect',
      hosted: 'Personal Agent Hosting',
    },
    sponsor: {
      label: 'Gesponsert von',
      claim: 'die souveräne Alternative zu OpenRouter',
    },
    footer: {
      slogan: 'Deine Welt. Erledigt.',
      explore: 'Entdecken',
      project: 'Projekt',
      license: 'MIT-Lizenz',
    },
    home: {
      meta: 'Ein Agent, dem du vertrauen kannst.',
      seoDescription:
        'Nutze private KI-Agenten im Web, auf Desktop, Terminal, Android und Voice-Hardware – local first, selbst hostbar und mit explizitem Vertrauensmodell.',
      kicker: 'Open Source · Local First · selbst hostbar',
      title: 'Ein Agent,',
      titleAccent: 'dem du vertrauen kannst.',
      lead: 'Eine selbst hostbare LLM-Chat- und Agentenplattform auf einer dauerhaften Laufzeitumgebung. Persönliche Agenten nutzen Werkzeuge und deine Daten, steuern verbundene Computer und Browser, führen Integrationen aus, reagieren auf Ereignisse und handeln proaktiv für dich.',
      getStarted: 'Loslegen',
      viewGithub: 'Auf GitHub ansehen',
      preview: 'Vorschau der Personal-Agent-Oberfläche',
      mainChat: 'Hauptchat',
      inbox: 'Posteingang',
      agenda: 'Agenda',
      files: 'Dateien',
      sessions: 'Sitzungen',
      newSession: 'Neue Sitzung',
      recentActivity: 'Letzte Aktivitäten',
      noSessions: 'Noch keine Sitzungen',
      greeting: 'Schön, dich zu sehen',
      message: 'Nachricht senden…',
      auto: 'Automatisch',
      integrations: 'Integrationen',
      standard: 'Standard',
      normalChat: 'Normaler Chat',
      coding: 'Programmieren',
      codingHint: 'Für Entwicklung empfohlen',
      trigger: 'Auslöser',
      run: 'Lauf',
      result: 'Ergebnis',
      principles: {
        private: 'Privat by Design',
        open: 'Open Source',
        durable: 'Dauerhafte Ausführung',
        governance: 'Ausfallsichere Regeln',
      },
      clients: {
        eyebrow: 'Fünf Zugänge · ein Personal Agent',
        title: 'Dein Assistent, wo immer du ihn brauchst.',
        copy: 'Wechsle nahtlos zwischen Browser, Desktop, Smartphone und Terminal – oder sprich einfach. Jeder Client verbindet sich mit der Personal-Agent-Instanz deiner Wahl.',
        webTitle: 'Web',
        webCopy:
          'Das vollständige Erlebnis in jedem modernen Browser – ohne Installation auf deinem Gerät.',
        webMeta: 'Browser · vollständiges Erlebnis',
        desktopTitle: 'Desktop',
        desktopCopy:
          'Ein nativer Linux-Client mit Tray-Integration und Benachrichtigungen für schnell erreichbare Unterhaltungen.',
        desktopMeta: 'Linux · native Benachrichtigungen',
        tuiTitle: 'Terminal',
        tuiCopy:
          'Streaming-Chat, Sitzungen, Agenten und Steuerung in einer schnellen, tastaturzentrierten Oberfläche.',
        tuiMeta: 'Rust TUI · tastaturzentriert',
        appTitle: 'Mobile-App',
        appCopy:
          'Verbinde Android mit deiner selbst gehosteten Instanz – inklusive Push, Deep Links und Teilen.',
        appMeta: 'Android · nativer Begleiter',
        voiceTitle: 'Sprachassistent',
        voiceCopy:
          'Nutze Personal Agent freihändig wie Alexa über Home Assistant Voice PE: Aktivierungswort, natürliche Anfrage und geregelte Antwort über den Lautsprecher.',
        voiceMeta: 'Home Assistant Voice PE · lokale Hardware',
      },
      trust: {
        eyebrow: 'Datenschutz · explizites Vertrauen · Local First',
        title: 'Deine Daten müssen nicht der Cloud vertrauen.',
        copy: 'Betreibe die Kernplattform und kompatible Modelle auf der Infrastruktur deiner Wahl. Aktivierst du einen externen Anbieter, muss jede Anfrage eine explizite Vertrauensprüfung bestehen, bevor geschützter Kontext deine Grenze verlassen darf.',
        link: 'Sicherheit & Datenschutz lesen',
        modelLabel: 'Vertrauensmodell von Personal Agent',
        boundary: 'Deine Vertrauensgrenze',
        localFirst: 'Local-first-Kern',
        systemOfRecord: 'Führendes System',
        coreData: 'Chats · Gedächtnis · Workflows · verschlüsselte Secrets',
        dataClass: 'Datenklasse',
        orgFloor: 'Organisationsvorgabe',
        integrationTier: 'Integration',
        requirement: 'effektive Anforderung',
        singleGate: 'Eine Prüfung auf jedem Ausführungspfad',
        gateRule: 'Anbieterstufe ≥ erforderliche Stufe',
        failClosed: 'Standardmäßig gesperrt',
        clearedOnly: 'nur freigegebene Wege',
        internal: 'Intern',
        internalHint: 'eigene Infrastruktur',
        regulated: 'Reguliert',
        regulatedHint: 'geprüft extern',
        standard: 'Unreguliert',
        standardHint: 'aktiviert extern',
        blocked: 'Kein freigegebener Anbieter? Keine Anfrage verlässt die Grenze.',
        assurances: {
          localTitle: 'Deine Instanz ist das führende System',
          localCopy:
            'Chats, Gedächtnis und Workflows liegen im gewählten Betrieb. Der vollständige Kern kann auf deiner Infrastruktur laufen.',
          modelsTitle: 'Modelle müssen sich Zugriff verdienen',
          modelsCopy:
            'Lokale, regulierte und andere aktivierte Anbieter erhalten nur Daten, die ihre konfigurierte Stufe erlaubt.',
          defaultTitle: 'Im Zweifel wird gestoppt',
          defaultCopy:
            'Auto-Routing, Fallbacks, Unteragenten und Hintergrundläufe verwenden dieselbe Fail-closed-Regel.',
          scopedTitle: 'Fähigkeiten bleiben getrennt',
          scopedCopy:
            'Gerätezugänge sind begrenzt, Computer Service kann keine Chats lesen und nicht vertrauenswürdige Inhalte verlieren privilegierte Werkzeuge.',
        },
      },
      section1Title: 'Ein System für die Welt um dich herum.',
      section1Copy:
        'Die Unterhaltung ist nur die Oberfläche. Darunter verbindet Personal Agent Gedächtnis, Werkzeuge, dauerhafte Ausführung und Richtlinien.',
      features: {
        memoryTitle: 'Weltzustands-Gedächtnis',
        memoryCopy:
          'Ein bitemporaler, kausaler Graph verbindet aktuelle Entitäten und Langzeitgedächtnis samt Herkunft.',
        durableTitle: 'Aufgaben, die weiterlaufen',
        durableCopy:
          'Agenten und Workflows laufen weiter, überstehen Unterbrechungen und liefern Ergebnisse in die Unterhaltung zurück.',
        chatTitle: 'Chat & Agenten',
        chatCopy:
          'Modelle, Modi, Sicherheit, Unteragenten, Sprache, Zurückspulen und Rücknahme von Läufen in jeder Unterhaltung.',
        integrationsTitle: 'Tiefe Integrationen',
        integrationsCopy:
          'Werkzeuge, Agenten, Entitäten, Oberflächen, Karten und Nachrichtenanbieter teilen ein gemeinsames Fähigkeitsmodell.',
        devicesTitle: 'Verbundene Geräte',
        devicesCopy:
          'Computer- und Browserdienste stellen begrenzte Host-Fähigkeiten bereit, ohne Zugriff auf Chats zu erhalten.',
        securityTitle: 'Sicherheit & Governance',
        securityCopy:
          'Datenklassifizierung, begrenzte Zugangsdaten, Budgets und explizite Regeln an jeder Modellgrenze.',
      },
      architectureTitle: 'Leistungsfähig entworfen.\nStandardmäßig kontrolliert.',
      architectureCopy:
        'Jede Anfrage durchläuft denselben geregelten Pfad – unabhängig davon, ob sie direkt oder dauerhaft im Hintergrund ausgeführt wird.',
      architectureLink: 'Architektur entdecken',
      flowLabel: 'Verarbeitung einer Anfrage',
      context: 'Kontext',
      chatWorld: 'Chat + Weltzustand',
      contextDetail: 'Gedächtnis · Entitäten · Integrationen',
      classified: 'klassifiziert',
      governance: 'Governance',
      policyGate: 'Ausfallsichere Richtlinienprüfung',
      policyDetail: 'Identität · Berechtigungen · Datenklasse',
      approved: 'freigegeben',
      inline: 'Direkt',
      immediate: 'Sofortige Antwort',
      durable: 'Dauerhaft',
      completion: 'Bis zum Abschluss ausführen',
      marketplaceTitle: 'Erweitere es für deine Welt.',
      marketplaceCopy:
        'Der Marktplatz bringt wiederverwendbare Fähigkeiten in Personal Agent, ohne das Berechtigungs- und Governance-Modell zu schwächen.',
      kinds: {
        agents: 'Agenten',
        agentsCopy: 'Spezialisierte Agenten mit definierten Fähigkeiten und geregelter Delegation.',
        skills: 'Skills',
        skillsCopy: 'Gezielt geladene Expertise, die Agenten nur bei Bedarf verwenden.',
        integrations: 'Integrationen',
        integrationsCopy:
          'Verbindungen zu Diensten und Daten, die Werkzeuge und Fähigkeiten bereitstellen.',
      },
      browse: '{kind} ansehen',
      startHere: 'Hier starten',
      readDocs: 'Dokumentation lesen',
    },
    organizations: {
      meta: 'Für Organisationen',
      seoDescription:
        'Personal Agent für Unternehmen und öffentliche Einrichtungen – mit kontrollierter Infrastruktur, Identität, Datenhaltung und Ausführung.',
      eyebrow: 'Für Unternehmen und öffentliche Einrichtungen',
      title: 'KI-Unterstützung unter Ihrer Kontrolle.',
      lead: 'Betreiben Sie Personal Agent in einer Umgebung, die zu Ihren Anforderungen an Sicherheit, Governance und Datensouveränität passt – von einer dedizierten Cloud-Installation bis zur eigenen Infrastruktur.',
      contact: 'Kontakt aufnehmen',
      explore: 'Plattform entdecken',
      trustLabel: 'Für verantwortbaren Betrieb entwickelt',
      trustTitle: 'Automatisierung, die zu Ihrer Organisation passt – nicht umgekehrt.',
      trustCopy:
        'Personal Agent verbindet dialogbasierten Zugang mit dauerhaften Workflows, begrenzten Werkzeugen und expliziten Richtlinien. Teams erhalten praktische Automatisierung, während Administratoren Identität, Modelle, Daten und Ausführung kontrollieren.',
      pillars: {
        controlTitle: 'Kontrolle über den Betrieb',
        controlCopy:
          'Betreiben Sie die Plattform in einer dedizierten Umgebung oder auf eigener Infrastruktur. Architektur und Betrieb bleiben dort in Ihrer Verantwortung, wo Ihre Anforderungen es verlangen.',
        identityTitle: 'Identität & Zugriff',
        identityCopy:
          'Binden Sie die Identität Ihrer Organisation an, definieren Sie Rollen und Geltungsbereiche und trennen Sie Mitarbeiter-, Dienst- und Gerätezugänge.',
        governanceTitle: 'Geregelte Ausführung',
        governanceCopy:
          'Wenden Sie explizite Berechtigungen, Datenklassen, Budgets und Freigabegrenzen auf Werkzeuge, Agenten und Workflows an.',
        extensibilityTitle: 'Kontrollierte Erweiterbarkeit',
        extensibilityCopy:
          'Führen Sie Integrationen, Skills und Agenten über ein Fähigkeitsmodell ein, das benötigte Zugriffe vor dem Rollout sichtbar macht.',
      },
      sectorsLabel: 'Eine Plattform, unterschiedliche Betriebsmodelle',
      sectorsTitle: 'Für regulierte Teams und öffentliche Verantwortung.',
      businessTitle: 'Unternehmen',
      businessCopy:
        'Verbinden Sie interne Systeme, automatisieren Sie wiederkehrende Arbeit und geben Sie Teams einen einheitlichen Assistenten, ohne die Kontrolle über Betriebsdaten abzugeben.',
      publicTitle: 'Behörden & öffentlicher Sektor',
      publicCopy:
        'Richten Sie den Betrieb an Organisationsgrenzen, transparenten Richtlinien und selbst betriebener Infrastruktur aus – ohne unbelegte Compliance-Versprechen.',
      partnershipTitle: 'Planen Sie Ihren Einsatz mit uns.',
      partnershipCopy:
        'Wir besprechen Architektur, Integrationsumfang, Rollout-Phasen und Betriebsverantwortung mit Ihren Technik- und Beschaffungsteams.',
      email: 'E-Mail',
      phone: 'Telefon',
      placeholder: 'Platzhalter-Kontakt',
      response: 'Für erste Projekt- und Beschaffungsgespräche.',
    },
    cloudConnect: {
      meta: 'Cloud Connect',
      seoDescription:
        'Verbinde unterstützte Apps sicher mit deinem selbst gehosteten Personal Agent – ohne Heimnetz-Freigabe oder offene Router-Ports.',
      eyebrow: 'Für selbst gehosteten Personal Agent',
      status: 'In Vorbereitung',
      title: 'Zu Hause auf deinem Server. Erreichbar, wo immer du bist.',
      lead: 'Cloud Connect ist der einfache Verbindungsdienst für privat betriebene Personal-Agent-Instanzen. Erreiche deinen Assistenten aus deinen Apps, ohne dein Heimnetz zu veröffentlichen oder selbst Infrastruktur für den Fernzugriff zu pflegen.',
      primary: 'Über den Start informieren',
      selfHost: 'Personal Agent selbst hosten',
      promiseLabel: 'Die eigene Instanz behalten. Den Netzwerkaufwand abgeben.',
      promiseTitle: 'Eine verwaltete Brücke zu deinem selbst gehosteten Personal Agent.',
      promiseCopy:
        'Personal Agent und seine Daten bleiben auf dem von dir betriebenen System. Cloud Connect übernimmt die Verbindungsschicht zwischen deiner Instanz und unterstützten Clients.',
      features: {
        accessTitle: 'Sichere Verbindung unterwegs',
        accessCopy:
          'Verbinde unterstützte Apps, ohne eingehende Router-Ports zu öffnen oder die Instanz direkt im Internet zu veröffentlichen.',
        discoveryTitle: 'Einfache App-Einrichtung',
        discoveryCopy:
          'Verbinde Clients über eine stabile Personal-Agent-Identität, statt wechselnde Adressen und Zertifikate zwischen Geräten zu kopieren.',
        pushTitle: 'Zuverlässige Benachrichtigungen',
        pushCopy:
          'Erhalte Hinweise zu Ereignissen und Workflows, während Inhalte und Zugriffe auf die verbundene Instanz begrenzt bleiben.',
        controlTitle: 'Kontrolle beim Client',
        controlCopy:
          'Verbindungszugänge bleiben bei deinen Clients. Cloud Connect ist kein zweiter Chat-Speicher und übernimmt nicht die Eigentümerschaft an deinen Instanzdaten.',
      },
      distinction: 'Du suchst einen Dienst, der auch die Personal-Agent-Instanz betreibt?',
      hostedLink: 'Personal Agent Cloud entdecken',
      note: 'Der endgültige Funktionsumfang, Preise und Verfügbarkeit werden vor dem Start veröffentlicht.',
    },
    hosted: {
      meta: 'Personal Agent Cloud',
      seoDescription:
        'Das geplante Hosting-Angebot für Personal Agent mit verwalteter Bereitstellung, Updates, Überwachung und Wiederherstellung.',
      eyebrow: 'Verwalteter Personal Agent',
      status: 'In Vorbereitung',
      title: 'Dein Personal Agent, ohne die Plattform selbst zu betreiben.',
      lead: 'Personal Agent Cloud ist das geplante verwaltete Angebot für Menschen, die eine eigene Personal-Agent-Umgebung möchten, ohne Server, Updates und Backups selbst zu pflegen.',
      primary: 'Interesse anmelden',
      compare: 'Cloud Connect ansehen',
      valueLabel: 'Ein verwaltetes Zuhause für deinen Agenten',
      valueTitle: 'Mit dem Produkt starten – nicht mit der Infrastruktur.',
      valueCopy:
        'Wir betreiben den Lebenszyklus der Plattform. Du behältst die Kontrolle über dein Konto, verbundene Dienste und die Fähigkeiten, die du Agenten und Workflows gewährst.',
      features: {
        managedTitle: 'Verwalteter Betrieb',
        managedCopy:
          'Bereitstellung, Updates, Überwachung und Wiederherstellung der Plattform gehören zum Dienst.',
        privateTitle: 'Klare Grenzen',
        privateCopy:
          'Der Dienst wird um klare Mandanten-, Identitäts- und Zugangsgrenzen entworfen – nicht als gemeinsame öffentliche Chatoberfläche.',
        appsTitle: 'Für Personal-Agent-Apps bereit',
        appsCopy:
          'Verbinde unterstützte Desktop-, Terminal- und Mobil-Clients über dieselbe Discovery-basierte Einrichtung wie im übrigen Produkt.',
        portabilityTitle: 'Ein Weg zum Selbsthosting',
        portabilityCopy:
          'Das Hosting-Angebot wird so entworfen, dass das Produkterlebnis nicht an ein einziges Betriebsmodell gebunden ist.',
      },
      audienceTitle: 'Zwei Wege, Personal Agent zu betreiben.',
      selfTitle: 'Selbst hosten + Cloud Connect',
      selfCopy:
        'Du betreibst die Personal-Agent-Instanz; Cloud Connect vereinfacht den Client-Zugriff von unterwegs.',
      hostedTitle: 'Personal Agent Cloud',
      hostedCopy:
        'Wir betreiben die Personal-Agent-Plattform und ihre unterstützenden Dienste für dich.',
      note: 'Hosting-Regionen, Service-Level, Migrationsmöglichkeiten und Preise werden vor Bestellstart veröffentlicht.',
    },
    marketplace: {
      meta: 'Marktplatz',
      seoDescription:
        'Entdecke Agenten, Skills, Integrationen und Workflows für das Fähigkeits- und Governance-Modell von Personal Agent.',
      title: 'Marktplatz',
      intro:
        'Entdecke Agenten, Skills, Integrationen und Workflows. Übernommene Inhalte laufen in deinem Kontext mit deiner Datenklassifizierung, deinen Integrationen, deinem Modell und deinen Regeln.',
      search: 'Marktplatz durchsuchen',
      filter: 'Nach Typ filtern',
      all: 'Alle',
      agents: 'Agenten',
      skills: 'Skills',
      integrations: 'Integrationen',
      workflows: 'Workflows',
      item: 'Eintrag',
      items: 'Einträge',
      emptyTitle: 'Keine passenden Einträge',
      emptyCopy: 'Versuche einen anderen Begriff oder setze den Typfilter zurück.',
      clear: 'Filter löschen',
      verified: 'Verifizierter Anbieter',
      by: 'von {publisher}',
      details: 'Details ansehen',
      what: 'Funktion',
      capabilities: 'Angeforderte Fähigkeiten',
      preview: 'Katalogvorschau',
      installNote:
        'Die Installation verbindet sich mit deiner Personal-Agent-Instanz und zeigt vor der Übernahme immer die genauen Berechtigungen.',
      install: 'Aus deiner Instanz installieren',
      notFound: 'Marktplatz-Eintrag nicht gefunden',
      back: 'Zurück zum Marktplatz',
    },
    docs: {
      title: 'Dokumentation',
      filter: 'Dokumentation filtern',
      notFound: 'Seite nicht gefunden',
      notFoundCopy: 'Diese Dokumentationsseite existiert nicht.',
      home: 'Start der Dokumentation',
      groups: {
        gettingStarted: 'Erste Schritte',
        userGuide: 'Benutzerhandbuch',
        administration: 'Administration',
        architecture: 'Architektur',
        development: 'Entwicklung',
        design: 'Designnotizen',
        comparisons: 'Vergleiche',
        more: 'Mehr',
      },
    },
    notFound: {
      meta: 'Nicht gefunden',
      title: 'Dieser Pfad ist unbekannt.',
      copy: 'Die Seite wurde möglicherweise verschoben oder hat nie existiert.',
      back: 'Zur Startseite',
    },
  },
} as const;

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
});

export function detectPreferredLocale(): SiteLocale {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem('personal-agent.locale');
  if (stored === 'de' || stored === 'en') return stored;
  return window.navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function setSiteLocale(locale: SiteLocale, persist = true): void {
  i18n.global.locale.value = locale;
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
  if (persist && typeof window !== 'undefined') {
    window.localStorage.setItem('personal-agent.locale', locale);
  }
}
