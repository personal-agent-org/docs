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
      plus: 'PA+',
      hosted: 'Cloud',
      login: 'Log in',
      register: 'Sign up',
      logout: 'Log out',
    },
    sponsor: {
      label: 'Sponsored by',
      claim: 'the sovereign alternative to OpenRouter',
    },
    auth: {
      completing: 'Completing secure login…',
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
      lead: 'One agent for your world. It connects your services and devices, understands your context and gets things done for you. On your terms. Under your control.',
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
        openWeb: 'Open web app',
        download: 'Download',
        voiceTitle: 'Voice assistant',
        voiceCopy:
          'Get Alexa-style hands-free access through Home Assistant Voice PE: wake word, natural request and a governed response through the speaker.',
        voiceMeta: 'Home Assistant Voice PE · local hardware',
      },
      trust: {
        eyebrow: 'Privacy · explicit trust · local first',
        title: 'You should not entrust your data to the cloud.',
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
        'Deploy provider-independent Personal Agent for organizations with OIDC, budgets, an open ecosystem, consulting, support and custom development.',
      eyebrow: 'For companies and public institutions',
      title: 'AI assistance under your control.',
      lead: 'Operate Personal Agent in an environment that matches your security, governance and data-sovereignty requirements, from a dedicated cloud deployment to your own infrastructure.',
      contact: 'Talk to us',
      explore: 'Explore the platform',
      trustLabel: 'Built for accountable deployment',
      trustTitle: 'Automation that fits your organization, not the other way around.',
      trustCopy:
        'Personal Agent combines conversational access with durable workflows, scoped tools and explicit policy. Teams gain practical automation while administrators retain control over identity, models, data and execution.',
      pillars: {
        controlTitle: 'Deployment control',
        controlCopy:
          'Run in a dedicated environment or on infrastructure you operate. Keep architectural and operational ownership where your requirements demand it.',
        identityTitle: 'Identity & access',
        identityCopy:
          'Connect your identity provider through OIDC, define roles and scopes, and separate employee, service and device credentials.',
        governanceTitle: 'Governed execution',
        governanceCopy:
          'Apply explicit permissions, data classification, budgets and approval boundaries to tools, agents and workflows.',
        extensibilityTitle: 'Controlled extensibility',
        extensibilityCopy:
          'Adopt integrations, skills and agents through a capability model that makes requested access visible before rollout.',
      },
      servicesLabel: 'Services for successful adoption',
      servicesTitle: 'A partner for planning, rollout and operation.',
      servicesCopy:
        'We help your organization turn Personal Agent into a dependable part of its environment, from the first architecture decision through productive operation.',
      services: {
        consultingTitle: 'Consulting & implementation',
        consultingCopy:
          'Plan architecture, security boundaries, use cases, integrations and rollout stages together with our technical team.',
        supportTitle: 'Professional support',
        supportCopy:
          'Get direct assistance for deployment, upgrades, operations and incident analysis with support options matched to your requirements.',
        customTitle: 'Custom development',
        customCopy:
          'Commission individual features, workflows and integrations for your systems while keeping them aligned with the platform architecture.',
      },
      enterpriseLabel: 'Business capabilities',
      enterpriseTitle: 'Identity, governance and operations for organizations.',
      enterpriseCopy:
        'Business deployments combine the open platform with the controls needed for shared, accountable use across teams and organizational boundaries.',
      enterprise: {
        oidcTitle: 'OIDC & single sign-on',
        oidcCopy:
          'Connect Keycloak, Entra ID, Okta or another standards-based identity provider and keep authentication under organizational control.',
        rolesTitle: 'Roles & scoped access',
        rolesCopy:
          'Control access to agents, tools, integrations and administration through explicit roles and permissions.',
        policyTitle: 'Policies & approvals',
        policyCopy:
          'Apply data classes, model trust levels, budgets and approval boundaries consistently across execution paths.',
        auditTitle: 'Auditability & observability',
        auditCopy:
          'Make system activity, durable runs, infrastructure health and policy decisions available for accountable operations.',
        deploymentTitle: 'Dedicated deployment',
        deploymentCopy:
          'Operate in a dedicated cloud environment, your data center or another infrastructure model selected for your requirements.',
        lifecycleTitle: 'Managed lifecycle',
        lifecycleCopy:
          'Establish controlled updates, monitoring, backup, recovery and support processes for production operation.',
        budgetsTitle: 'Budgets & cost control',
        budgetsCopy:
          'Set usage and cost limits by user, agent or organizational scope and make consumption visible before it becomes an operational surprise.',
        providersTitle: 'Provider independence',
        providersCopy:
          'Use local models or select and combine external providers by policy without binding the platform to one large AI vendor.',
        ecosystemTitle: 'Open ecosystem',
        ecosystemCopy:
          'Extend the platform with open agents, skills, integrations and workflows instead of depending on a closed vendor catalog.',
      },
      sectorsLabel: 'One platform, different operating models',
      sectorsTitle: 'For regulated teams and public responsibility.',
      businessTitle: 'Companies',
      businessCopy:
        'Connect internal systems, automate recurring work and give teams a consistent assistant without surrendering control of operational data.',
      publicTitle: 'Government & public sector',
      publicCopy:
        'Design deployments around organizational boundaries, transparent policy and self-operated infrastructure without making unsupported compliance promises.',
      partnershipTitle: 'Plan your deployment with us.',
      partnershipCopy:
        'Discuss architecture, integration scope, custom features, support requirements, rollout stages and operational ownership with our team.',
      email: 'Email',
      phone: 'Phone',
      placeholder: 'Placeholder contact',
      response: 'For initial project and procurement conversations.',
    },
    plus: {
      meta: 'Personal Agent+ | Managed extras for self-hosting',
      seoDescription:
        'Add secure remote access, encrypted backups, managed webhooks, voice services and real-time relays to your self-hosted Personal Agent.',
      eyebrow: 'Managed extras for self-hosting',
      status: 'In preparation',
      title: 'More convenience. Still yours.',
      lead: 'Personal Agent+ adds managed services to your self-hosted Personal Agent. Your instance stays on your system while PA+ takes care of secure access, recovery and selected cloud infrastructure.',
      price: '$9.99 / month',
      priceNote: 'Taxes included. Cancel anytime.',
      primary: 'Follow the PA+ launch',
      selfHost: 'Self-host Personal Agent',
      promiseLabel: 'Useful extras, not a requirement',
      promiseTitle: 'The cloud services that make self-hosting easier.',
      promiseCopy:
        'Personal Agent remains fully usable without a subscription. PA+ provides ready-to-use services where operating shared infrastructure yourself would otherwise take time and maintenance.',
      features: {
        accessTitle: 'Secure remote access',
        accessCopy:
          'Reach your instance through an encrypted outbound connection without opening router ports or exposing your home network.',
        backupTitle: 'Encrypted backup and restore',
        backupCopy:
          'Back up configuration, agents, skills and integrations with client-side encryption, then restore or migrate them to another system.',
        eventsTitle: 'Managed webhooks and events',
        eventsCopy:
          'Receive signed external events without publishing your backend. Endpoints remain revocable, scoped and protected against replay.',
        voiceTitle: 'Voice services',
        voiceCopy:
          'Use managed speech-to-text and text-to-speech when local processing is unavailable or you explicitly prefer a cloud provider.',
        realtimeTitle: 'Real-time relay',
        realtimeCopy:
          'Use managed WebRTC and TURN fallback for voice, screens and remote computer sessions when a direct connection is not possible.',
        discoveryTitle: 'Stable identity and domains',
        discoveryCopy:
          'Let clients discover your instance through a stable identity, managed HTTPS and, optionally, your own domain.',
      },
      foundationLabel: 'Open and local at the core',
      foundationTitle: 'PA+ adds convenience without taking the product away.',
      foundationCopy:
        'The apps, local authentication, computer tools, integrations and self-hosting remain available without PA+. You can also operate equivalent infrastructure yourself.',
      freePushTitle: 'Push stays free',
      freePushCopy:
        'Push notifications are available without a subscription. PA+ subscribers help fund the shared push infrastructure for everyone.',
      privateTitle: 'No access to chats',
      privateCopy:
        'PA+ uses a dedicated, narrowly scoped service token. It cannot read conversations and never becomes a second chat store.',
      openTitle: 'No forced cloud',
      openCopy:
        'Run your own remote access, backups, voice providers, webhooks and relays. PA+ is the managed option, not a lock-in mechanism.',
      supportLabel: 'Support the project',
      supportTitle: 'More convenience for you. A sustainable future for Personal Agent.',
      supportCopy:
        'Your subscription covers the infrastructure behind PA+ and helps fund security updates, clients, agents, skills, integrations and the open-source platform.',
      supportSustainability:
        'Personal Agent remains open source and self-hostable. To stay sustainable and independently developed, the project will ultimately rely on support from PA+ subscribers.',
      cancel: 'Cancel anytime',
      supportIncluded: 'Supports the open-source project',
      distinction: 'Want us to operate the Personal Agent instance as well?',
      hostedLink: 'Explore Personal Agent Cloud',
      note: 'PA+ is in preparation. Availability and technical limits will be published before subscriptions open.',
    },
    hosted: {
      meta: 'Personal Agent Cloud',
      seoDescription:
        'A planned hosted Personal Agent offering with managed deployment, updates, monitoring and recovery.',
      eyebrow: 'Managed Personal Agent',
      status: 'In preparation',
      title: 'Your Personal Agent, without operating the platform yourself.',
      lead: 'Personal Agent Cloud is the fully managed offering for people who want a dedicated Personal Agent experience without maintaining servers, updates or backups. Every PA+ service is included.',
      primary: 'Register interest',
      compare: 'See Personal Agent+',
      valueLabel: 'A managed home for your agent',
      valueTitle: 'Start with the product, not the infrastructure.',
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
        plusIncludedTitle: 'Everything in PA+',
        plusIncludedCopy:
          'Secure remote access, encrypted backups, managed events, voice services and real-time relays are included with Personal Agent Cloud.',
      },
      audienceTitle: 'Two ways to run Personal Agent.',
      selfTitle: 'Self-host + Personal Agent+',
      selfCopy:
        'You operate the Personal Agent instance; PA+ adds managed remote access and optional convenience services.',
      hostedTitle: 'Personal Agent Cloud',
      hostedCopy:
        'We operate the Personal Agent platform for you, including every service offered with Personal Agent+.',
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
      install: 'Install',
      security: {
        clean: 'Artifact scanned and approved',
        pending: 'Installation unavailable until the security review is complete',
      },
      quality: {
        bronze: 'Bronze quality',
        silver: 'Silver quality',
        gold: 'Gold quality',
        platinum: 'Platinum quality',
        reviewed: 'Reviewed against all requirements up to this level.',
        unrated: 'This integration has not been rated yet.',
      },
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
      plus: 'PA+',
      hosted: 'Cloud',
      login: 'Anmelden',
      register: 'Registrieren',
      logout: 'Abmelden',
    },
    sponsor: {
      label: 'Gesponsert von',
      claim: 'die souveräne Alternative zu OpenRouter',
    },
    auth: {
      completing: 'Sichere Anmeldung wird abgeschlossen…',
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
      lead: 'Ein Agent für deine Welt. Er verbindet deine Dienste und Geräte, versteht deinen Kontext und erledigt Dinge für dich. Nach deinen Regeln. Unter deiner Kontrolle.',
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
        openWeb: 'Web-App öffnen',
        download: 'Herunterladen',
        voiceTitle: 'Sprachassistent',
        voiceCopy:
          'Nutze Personal Agent freihändig wie Alexa über Home Assistant Voice PE: Aktivierungswort, natürliche Anfrage und geregelte Antwort über den Lautsprecher.',
        voiceMeta: 'Home Assistant Voice PE · lokale Hardware',
      },
      trust: {
        eyebrow: 'Datenschutz · explizites Vertrauen · Local First',
        title: 'Du solltest deine Daten nicht der Cloud anvertrauen.',
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
        'Anbieterunabhängiger Personal Agent für Organisationen mit OIDC, Budgetierung, offenem Ökosystem, Beratung, Support und individueller Entwicklung.',
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
          'Binden Sie Ihren Identity Provider über OIDC an, definieren Sie Rollen und Geltungsbereiche und trennen Sie Mitarbeiter-, Dienst- und Gerätezugänge.',
        governanceTitle: 'Geregelte Ausführung',
        governanceCopy:
          'Wenden Sie explizite Berechtigungen, Datenklassen, Budgets und Freigabegrenzen auf Werkzeuge, Agenten und Workflows an.',
        extensibilityTitle: 'Kontrollierte Erweiterbarkeit',
        extensibilityCopy:
          'Führen Sie Integrationen, Skills und Agenten über ein Fähigkeitsmodell ein, das benötigte Zugriffe vor dem Rollout sichtbar macht.',
      },
      servicesLabel: 'Leistungen für eine erfolgreiche Einführung',
      servicesTitle: 'Ein Partner für Planung, Rollout und Betrieb.',
      servicesCopy:
        'Wir helfen Ihrer Organisation, Personal Agent zuverlässig in die eigene Umgebung zu integrieren, von der ersten Architekturentscheidung bis zum produktiven Betrieb.',
      services: {
        consultingTitle: 'Beratung & Implementierung',
        consultingCopy:
          'Planen Sie Architektur, Sicherheitsgrenzen, Anwendungsfälle, Integrationen und Rollout-Phasen gemeinsam mit unserem technischen Team.',
        supportTitle: 'Professioneller Support',
        supportCopy:
          'Erhalten Sie direkte Unterstützung bei Bereitstellung, Updates, Betrieb und Fehleranalyse mit passenden Supportoptionen.',
        customTitle: 'Individuelle Entwicklung',
        customCopy:
          'Beauftragen Sie individuelle Funktionen, Workflows und Integrationen für Ihre Systeme, abgestimmt auf die Architektur der Plattform.',
      },
      enterpriseLabel: 'Business-Funktionen',
      enterpriseTitle: 'Identität, Governance und Betrieb für Organisationen.',
      enterpriseCopy:
        'Business-Installationen verbinden die offene Plattform mit den Kontrollen, die für eine gemeinsame und verantwortbare Nutzung über Teams und Organisationsgrenzen hinweg nötig sind.',
      enterprise: {
        oidcTitle: 'OIDC & Single Sign-on',
        oidcCopy:
          'Binden Sie Keycloak, Entra ID, Okta oder einen anderen standardbasierten Identity Provider an und behalten Sie die Authentifizierung unter eigener Kontrolle.',
        rolesTitle: 'Rollen & begrenzte Zugriffe',
        rolesCopy:
          'Steuern Sie den Zugriff auf Agenten, Werkzeuge, Integrationen und Administration über explizite Rollen und Berechtigungen.',
        policyTitle: 'Richtlinien & Freigaben',
        policyCopy:
          'Wenden Sie Datenklassen, Modell-Vertrauensstufen, Budgets und Freigabegrenzen konsistent auf alle Ausführungspfade an.',
        auditTitle: 'Auditierbarkeit & Observability',
        auditCopy:
          'Machen Sie Systemaktivitäten, dauerhafte Läufe, Infrastrukturzustand und Richtlinienentscheidungen für einen verantwortbaren Betrieb sichtbar.',
        deploymentTitle: 'Dedizierter Betrieb',
        deploymentCopy:
          'Betreiben Sie Personal Agent in einer dedizierten Cloud-Umgebung, im eigenen Rechenzentrum oder auf einer anderen passenden Infrastruktur.',
        lifecycleTitle: 'Geregelter Lebenszyklus',
        lifecycleCopy:
          'Etablieren Sie kontrollierte Updates, Monitoring, Backups, Wiederherstellung und Supportprozesse für den Produktivbetrieb.',
        budgetsTitle: 'Budgetierung & Kostenkontrolle',
        budgetsCopy:
          'Definieren Sie Nutzungs- und Kostenlimits pro Benutzer, Agent oder Organisationsbereich und machen Sie den Verbrauch frühzeitig sichtbar.',
        providersTitle: 'Anbieterunabhängigkeit',
        providersCopy:
          'Nutzen Sie lokale Modelle oder wählen und kombinieren Sie externe Anbieter nach Richtlinie, ohne die Plattform an einen großen KI-Anbieter zu binden.',
        ecosystemTitle: 'Offenes Ökosystem',
        ecosystemCopy:
          'Erweitern Sie die Plattform mit offenen Agenten, Skills, Integrationen und Workflows, statt von einem geschlossenen Herstellerkatalog abhängig zu sein.',
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
        'Besprechen Sie Architektur, Integrationsumfang, individuelle Funktionen, Supportbedarf, Rollout-Phasen und Betriebsverantwortung mit unserem Team.',
      email: 'E-Mail',
      phone: 'Telefon',
      placeholder: 'Platzhalter-Kontakt',
      response: 'Für erste Projekt- und Beschaffungsgespräche.',
    },
    plus: {
      meta: 'Personal Agent+ | Verwaltete Extras für Self-Hosting',
      seoDescription:
        'Ergänze deinen selbst gehosteten Personal Agent um sicheren Fernzugriff, verschlüsselte Backups, verwaltete Webhooks, Voice-Dienste und Echtzeit-Relays.',
      eyebrow: 'Verwaltete Extras für Self-Hosting',
      status: 'In Vorbereitung',
      title: 'Mehr Komfort. Weiterhin deins.',
      lead: 'Personal Agent+ ergänzt deinen selbst gehosteten Personal Agent um verwaltete Dienste. Deine Instanz bleibt auf deinem System, während PA+ sicheren Zugriff, Wiederherstellung und ausgewählte Cloud-Infrastruktur übernimmt.',
      price: '9,99 € / Monat',
      priceNote: 'Inklusive Steuern. Jederzeit kündbar.',
      primary: 'Über den PA+-Start informieren',
      selfHost: 'Personal Agent selbst hosten',
      promiseLabel: 'Sinnvolle Extras, keine Voraussetzung',
      promiseTitle: 'Die Cloud-Dienste, die Self-Hosting einfacher machen.',
      promiseCopy:
        'Personal Agent bleibt ohne Abonnement vollständig nutzbar. PA+ stellt fertige Dienste bereit, wenn der eigene Betrieb gemeinsamer Infrastruktur sonst Zeit und Wartung kosten würde.',
      features: {
        accessTitle: 'Sicherer Fernzugriff',
        accessCopy:
          'Erreiche deine Instanz über eine verschlüsselte ausgehende Verbindung, ohne Router-Ports zu öffnen oder dein Heimnetz zu veröffentlichen.',
        backupTitle: 'Verschlüsselte Backups',
        backupCopy:
          'Sichere Konfiguration, Agenten, Skills und Integrationen clientseitig verschlüsselt und stelle sie auf einem anderen System wieder her.',
        eventsTitle: 'Verwaltete Webhooks und Events',
        eventsCopy:
          'Empfange signierte externe Ereignisse, ohne dein Backend zu veröffentlichen. Endpunkte bleiben widerrufbar, begrenzt und vor Wiederholungen geschützt.',
        voiceTitle: 'Voice-Dienste',
        voiceCopy:
          'Nutze verwaltetes Speech-to-Text und Text-to-Speech, wenn lokale Verarbeitung nicht verfügbar ist oder du bewusst einen Cloud-Anbieter wählst.',
        realtimeTitle: 'Echtzeit-Relay',
        realtimeCopy:
          'Nutze verwaltetes WebRTC und TURN als Rückfall für Sprache, Bildschirme und entfernte Computer-Sitzungen, wenn keine direkte Verbindung möglich ist.',
        discoveryTitle: 'Stabile Identität und Domains',
        discoveryCopy:
          'Lass Clients deine Instanz über eine stabile Identität, verwaltetes HTTPS und optional deine eigene Domain finden.',
      },
      foundationLabel: 'Im Kern offen und lokal',
      foundationTitle: 'PA+ ergänzt Komfort, ohne dir das Produkt zu nehmen.',
      foundationCopy:
        'Apps, lokale Authentifizierung, Computer-Werkzeuge, Integrationen und Self-Hosting bleiben ohne PA+ verfügbar. Gleichwertige Infrastruktur kannst du auch selbst betreiben.',
      freePushTitle: 'Push bleibt kostenlos',
      freePushCopy:
        'Push-Benachrichtigungen stehen ohne Abonnement zur Verfügung. PA+-Abonnenten helfen dabei, die gemeinsame Push-Infrastruktur für alle zu finanzieren.',
      privateTitle: 'Kein Zugriff auf Chats',
      privateCopy:
        'PA+ verwendet ein eigenes, eng begrenztes Dienst-Token. Es kann keine Unterhaltungen lesen und wird niemals zu einem zweiten Chat-Speicher.',
      openTitle: 'Kein Cloud-Zwang',
      openCopy:
        'Betreibe Fernzugriff, Backups, Voice-Anbieter, Webhooks und Relays selbst. PA+ ist die verwaltete Option und kein Lock-in-Mechanismus.',
      supportLabel: 'Unterstütze das Projekt',
      supportTitle: 'Mehr Komfort für dich. Eine nachhaltige Zukunft für Personal Agent.',
      supportCopy:
        'Dein Abonnement finanziert die PA+-Infrastruktur sowie Sicherheitsupdates, Clients, Agenten, Skills, Integrationen und die offene Plattform.',
      supportSustainability:
        'Personal Agent bleibt Open Source und selbst hostbar. Damit das Projekt nachhaltig und unabhängig entwickelt werden kann, ist es langfristig auf die Unterstützung durch PA+-Abonnenten angewiesen.',
      cancel: 'Jederzeit kündbar',
      supportIncluded: 'Unterstützt das Open-Source-Projekt',
      distinction: 'Du möchtest auch die Personal-Agent-Instanz von uns betreiben lassen?',
      hostedLink: 'Personal Agent Cloud entdecken',
      note: 'PA+ ist in Vorbereitung. Verfügbarkeit und technische Grenzen werden vor dem Bestellstart veröffentlicht.',
    },
    hosted: {
      meta: 'Personal Agent Cloud',
      seoDescription:
        'Das geplante Hosting-Angebot für Personal Agent mit verwalteter Bereitstellung, Updates, Überwachung und Wiederherstellung.',
      eyebrow: 'Verwalteter Personal Agent',
      status: 'In Vorbereitung',
      title: 'Dein Personal Agent, ohne die Plattform selbst zu betreiben.',
      lead: 'Personal Agent Cloud ist das vollständig verwaltete Angebot für Menschen, die eine eigene Personal-Agent-Umgebung möchten, ohne Server, Updates oder Backups selbst zu pflegen. Alle PA+-Dienste sind enthalten.',
      primary: 'Interesse anmelden',
      compare: 'Personal Agent+ ansehen',
      valueLabel: 'Ein verwaltetes Zuhause für deinen Agenten',
      valueTitle: 'Mit dem Produkt starten. Nicht mit der Infrastruktur.',
      valueCopy:
        'Wir betreiben den Lebenszyklus der Plattform. Du behältst die Kontrolle über dein Konto, verbundene Dienste und die Fähigkeiten, die du Agenten und Workflows gewährst.',
      features: {
        managedTitle: 'Verwalteter Betrieb',
        managedCopy:
          'Bereitstellung, Updates, Überwachung und Wiederherstellung der Plattform gehören zum Dienst.',
        privateTitle: 'Klare Grenzen',
        privateCopy:
          'Der Dienst wird um klare Mandanten-, Identitäts- und Zugangsgrenzen entworfen, nicht als gemeinsame öffentliche Chatoberfläche.',
        appsTitle: 'Für Personal-Agent-Apps bereit',
        appsCopy:
          'Verbinde unterstützte Desktop-, Terminal- und Mobil-Clients über dieselbe Discovery-basierte Einrichtung wie im übrigen Produkt.',
        portabilityTitle: 'Ein Weg zum Selbsthosting',
        portabilityCopy:
          'Das Hosting-Angebot wird so entworfen, dass das Produkterlebnis nicht an ein einziges Betriebsmodell gebunden ist.',
        plusIncludedTitle: 'Alles aus PA+',
        plusIncludedCopy:
          'Sicherer Fernzugriff, verschlüsselte Backups, verwaltete Events, Voice-Dienste und Echtzeit-Relays sind in Personal Agent Cloud enthalten.',
      },
      audienceTitle: 'Zwei Wege, Personal Agent zu betreiben.',
      selfTitle: 'Selbst hosten + Personal Agent+',
      selfCopy:
        'Du betreibst die Personal-Agent-Instanz; PA+ ergänzt verwalteten Fernzugriff und optionale Komfortdienste.',
      hostedTitle: 'Personal Agent Cloud',
      hostedCopy:
        'Wir betreiben die Personal-Agent-Plattform für dich, einschließlich aller Dienste aus Personal Agent+.',
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
      install: 'Installieren',
      security: {
        clean: 'Artefakt geprüft und freigegeben',
        pending: 'Installation erst nach abgeschlossener Sicherheitsprüfung verfügbar',
      },
      quality: {
        bronze: 'Qualitätsstufe Bronze',
        silver: 'Qualitätsstufe Silber',
        gold: 'Qualitätsstufe Gold',
        platinum: 'Qualitätsstufe Platin',
        reviewed: 'Gegen alle Anforderungen bis zu dieser Stufe geprüft.',
        unrated: 'Diese Integration wurde noch nicht eingestuft.',
      },
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
