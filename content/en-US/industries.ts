import type { IndustryContent } from '../types';
import type { IndustryId } from '@/lib/i18n/routes';

/**
 * Industry pages. They describe what we can build for each sector —
 * they are not case studies and not a client list.
 */
export const industries: Record<IndustryId, IndustryContent> = {
  hospitality: {
    name: 'Hotels and inns',
    metaTitle: 'Websites and AI Chatbots for Hotels and Inns',
    metaDescription:
      'Website development for hotels, inns and B&Bs: direct booking paths, an AI chatbot on WhatsApp, multilingual sites for international guests and booking-system integrations.',
    heading: 'Technology for hotels and inns',
    summary: 'Websites built for direct bookings, automated guest messaging on WhatsApp and pages in several languages for international guests.',
    intro:
      'Hotels and inns depend on great photos, fast answers and a booking path with no friction. We build websites, chatbots and integrations that help a property win more direct bookings and answer guests at any hour — in English, Portuguese or Spanish.',
    challenges: [
      {
        title: 'Reliance on online travel agencies',
        text: 'When most bookings come through platforms like Booking.com and Airbnb, the property pays commission on every night and has little direct contact with the guest.',
      },
      {
        title: 'The same questions, all day',
        text: 'Availability, rates, breakfast, pets, parking: the front desk answers the same messages over and over, including late at night.',
      },
      {
        title: 'International guests without information in their language',
        text: 'Without a site in other languages, foreign travelers struggle to understand rooms, policies and how to book.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'A website built for direct booking',
        text: 'A fast site with photo galleries, rooms, amenities, a map and a short path to booking — through the booking engine you already use, a request form or WhatsApp.',
      },
      {
        service: 'ai',
        title: 'An AI assistant on WhatsApp and your site',
        text: 'It answers common questions from your property’s own information, collects dates and number of guests, and hands the conversation to the front desk to confirm.',
      },
      {
        service: 'automation',
        title: 'Automated guest messages',
        text: 'Booking confirmations, check-in instructions and review requests sent automatically, respecting guest consent.',
      },
      {
        service: 'software',
        title: 'Integrations and dashboards',
        text: 'Connections to your booking engine or channel manager (when the vendor offers an API) and dashboards showing occupancy and booking sources.',
      },
    ],
    features: [
      'Photo galleries optimized for mobile',
      'Room and amenity pages',
      'Site in English, Portuguese and Spanish',
      'Always-visible booking and WhatsApp buttons',
      'Map and directions',
      'Booking-source tracking in Google Analytics',
    ],
    note: {
      title: 'Integrations depend on your vendors',
      text: 'Connecting to booking engines, channel managers and travel agencies depends on each vendor’s API and rules. We check what is possible before proposing a solution.',
    },
    faq: [
      {
        question: 'Can our inn’s website take direct bookings?',
        answer:
          'Yes. The site can send guests to the booking engine you already use, to a booking-request form or to WhatsApp, depending on how you operate. The goal is the shortest possible path to a direct booking.',
      },
      {
        question: 'Can the chatbot tell guests what is available?',
        answer:
          'It can when it is connected to a booking system that exposes availability. Without an integration, the assistant answers general questions and passes booking requests to your front desk.',
      },
      {
        question: 'Is a multilingual website worth it for a hotel?',
        answer:
          'If you host international travelers, yes: guests understand rooms and policies in their own language, and each language version can show up in searches made in that language.',
      },
    ],
    whatsappMessage: 'Hello! I run a hotel or inn and would like to talk about a technology project.',
  },
  solar: {
    name: 'Solar energy',
    metaTitle: 'Websites, CRM and Automation for Solar Energy Companies',
    metaDescription:
      'Technology for solar installers and energy companies: websites that generate quote requests, a savings estimator, a proposal CRM and automated sales follow-up.',
    heading: 'Technology for solar energy companies',
    summary: 'Websites that generate quote requests, a savings estimator, a proposal CRM and installation tracking.',
    intro:
      'In solar, a sale starts with an electricity bill and ends with a well-managed installation. We build websites, software and automations that organize that path: capturing the request, preparing the proposal, tracking the installation and staying in touch afterward.',
    challenges: [
      {
        title: 'Unqualified quote requests',
        text: 'Many requests arrive without the basics — monthly bill, property type, location — and the team spends time chasing that information.',
      },
      {
        title: 'Proposals and follow-up scattered everywhere',
        text: 'Proposals sent by message and tracked in spreadsheets let good opportunities go cold.',
      },
      {
        title: 'No follow-through after installation',
        text: 'Once the system is installed, customers get little information, and maintenance and referral opportunities are lost.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'A website with a savings estimator',
        text: 'Clear service pages and an estimator that asks for the right inputs — like the average electricity bill — and shows an initial estimate, making clear that the final figure depends on a site assessment.',
      },
      {
        service: 'software',
        title: 'A proposal CRM',
        text: 'A pipeline from quote to installation, customer history, follow-up reminders and conversion reports.',
      },
      {
        service: 'ai',
        title: 'AI-assisted customer service',
        text: 'An assistant that answers common solar questions, collects the quote request details and schedules the site visit with your team.',
      },
      {
        service: 'automation',
        title: 'Automated project updates',
        text: 'Status messages on project and installation progress and, when the inverter manufacturer offers an API, dashboards with generation data.',
      },
    ],
    features: [
      'Quote form with the right technical inputs',
      'Savings estimator with a clear estimate disclaimer',
      'Sales pipeline from quote to installation',
      'Site-visit scheduling',
      'A gallery of installations completed by your company',
      'Lead-source reporting',
    ],
    note: {
      title: 'Estimates, not promises',
      text: 'Estimators should present figures as estimates, with the assumptions visible. Real savings depend on consumption, utility rates, sun exposure and local rules — and the site has to say so.',
    },
    faq: [
      {
        question: 'Can the website calculate solar savings?',
        answer:
          'It can show an initial estimate based on what the visitor enters, such as their average electricity bill. The result should appear as an estimate with its assumptions visible, and be confirmed by your technical team.',
      },
      {
        question: 'Do you build CRMs for solar installers?',
        answer:
          'Yes. The CRM follows your real sales steps — quote, site visit, proposal, contract and installation — with follow-up reminders and reporting.',
      },
      {
        question: 'Can we show generation data from installed systems?',
        answer:
          'When the inverter manufacturer or monitoring platform offers an API, yes. We review each manufacturer’s documentation before proposing the integration.',
      },
    ],
    whatsappMessage: 'Hello! I run a solar energy company and would like to talk about a technology project.',
  },
  veterinary: {
    name: 'Veterinary clinics',
    metaTitle: 'Websites and Online Booking for Veterinary Clinics',
    metaDescription:
      'Technology for veterinary clinics: a professional website, online appointment booking, vaccine reminders over WhatsApp and an AI assistant for common questions.',
    heading: 'Technology for veterinary clinics',
    summary: 'Online booking, vaccine and follow-up reminders, a professional website and automated answers to common questions.',
    intro:
      'A veterinary clinic juggles a full schedule, worried pet owners and a flood of messages. We build websites, software and automations that organize the calendar, remind owners about vaccines and follow-ups, and free your team to focus on the animals.',
    challenges: [
      {
        title: 'Overloaded phones and WhatsApp',
        text: 'Opening hours, exam prices, services and appointment requests all arrive through the same channel at the same time.',
      },
      {
        title: 'Missed vaccines and follow-ups',
        text: 'Without reminders, owners forget vaccine and follow-up dates, and the clinic loses continuity of care.',
      },
      {
        title: 'Scattered schedules and records',
        text: 'Paper calendars or disconnected tools make it hard to see the day’s load and each pet’s history.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'The clinic website',
        text: 'Services, team, hours, location and clear guidance — with the emergency contact up front when the clinic offers urgent care.',
      },
      {
        service: 'software',
        title: 'Online appointment booking',
        text: 'Owners book exams, vaccines or grooming through the site, following the scheduling rules you define.',
      },
      {
        service: 'automation',
        title: 'Automated reminders',
        text: 'Vaccine, deworming and follow-up reminders by WhatsApp or email, sent only to owners who agreed to be contacted.',
      },
      {
        service: 'ai',
        title: 'An assistant for common questions',
        text: 'It answers questions about hours, services and procedure prep, and sends anything that sounds urgent straight to your team.',
      },
    ],
    features: [
      'Online booking by service type',
      'Vaccine and follow-up reminders',
      'Owner and pet records',
      'Services and specialties pages',
      'WhatsApp button and location map',
      'A dashboard of the day’s appointments',
    ],
    note: {
      title: 'AI does not replace the veterinarian',
      text: 'The assistant does not diagnose or recommend treatment. It answers administrative questions and routes symptoms and emergencies to a licensed veterinarian.',
    },
    faq: [
      {
        question: 'Can pet owners book appointments on the website?',
        answer:
          'Yes. Online booking follows the clinic’s rules — appointment types, duration, staff and available times — and your team sees each booking in the dashboard.',
      },
      {
        question: 'How do vaccine reminders work?',
        answer:
          'Based on the recorded date, the system sends reminders by WhatsApp or email ahead of the due date, only to owners who opted in.',
      },
      {
        question: 'Can the chatbot advise in an emergency?',
        answer:
          'No. At any sign of an emergency, the assistant shares the clinic’s emergency contact and hands the conversation to your team. Diagnosis and clinical advice always come from the veterinarian.',
      },
    ],
    whatsappMessage: 'Hello! I run a veterinary clinic and would like to talk about a technology project.',
  },
  legal: {
    name: 'Law firms',
    metaTitle: 'Websites and Software for Law Firms',
    metaDescription:
      'Websites for law firms that respect attorney advertising rules, intake screening, a client portal, and deadline and document management.',
    heading: 'Technology for law firms',
    summary: 'Informative websites aligned with attorney advertising rules, intake screening, a client portal and deadline tracking.',
    intro:
      'Law firms need to convey trust without aggressive advertising, and to keep order in a routine full of deadlines, documents and clients asking for updates. We build websites and software that respect the profession’s rules and bring order to the firm’s day.',
    challenges: [
      {
        title: 'A web presence that does not convey authority',
        text: 'Generic sites do not explain practice areas clearly and do not set the firm apart.',
      },
      {
        title: 'Clients constantly asking for updates',
        text: 'Messages asking about case status take time away from attorneys and staff.',
      },
      {
        title: 'Deadlines and documents everywhere',
        text: 'Tracking deadlines, contracts and files across folders and spreadsheets raises the risk of missing an important date.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'An informative firm website',
        text: 'Practice areas explained in plain language, attorney profiles and contact channels, within applicable attorney advertising rules.',
      },
      {
        service: 'ai',
        title: 'Intake screening',
        text: 'A form or assistant that organizes the initial details of an inquiry and schedules a conversation with an attorney, without giving legal advice.',
      },
      {
        service: 'software',
        title: 'Client portal and deadline tracking',
        text: 'A secure area where clients follow their matter and upload documents, plus an internal dashboard of deadlines, tasks and owners.',
      },
      {
        service: 'automation',
        title: 'Routine automation',
        text: 'Deadline and meeting reminders, documents generated from templates and automatic file organization.',
      },
    ],
    features: [
      'Practice-area pages',
      'Consultation scheduling',
      'Client portal with secure access',
      'Deadline and task tracking',
      'Document templates',
      'Role-based access control',
    ],
    note: {
      title: 'Ethics and confidentiality come first',
      text: 'Website content should follow the attorney advertising rules that apply to your jurisdiction — informative, restrained and free of improper solicitation — and your bar association or ethics counsel should review it. Client data is handled with confidentiality and in line with applicable privacy law.',
    },
    faq: [
      {
        question: 'Will the website follow attorney advertising rules?',
        answer:
          'We build content that is informative and restrained, with no promises of results and no improper solicitation. Rules differ by state and country, so the firm always has the final review of the text.',
      },
      {
        question: 'Does the chatbot give legal advice?',
        answer: 'No. The assistant only organizes initial details and schedules a conversation with an attorney. Any analysis of the matter is done by the lawyer.',
      },
      {
        question: 'How are security and confidentiality handled?',
        answer:
          'Portals and systems use role-based access, encrypted connections and access logging. Data is handled in line with applicable privacy law and with the duty of professional confidentiality.',
      },
    ],
    whatsappMessage: 'Hello! I run a law firm and would like to talk about a technology project.',
  },
  construction: {
    name: 'Construction and remodeling',
    metaTitle: 'Software for Construction and Remodeling Companies',
    metaDescription:
      'Technology for builders and remodeling contractors: a website with a project portfolio, qualified quote requests, job tracking and photo reports for clients.',
    heading: 'Technology for construction and remodeling',
    summary: 'Websites with a project portfolio, organized quote requests, job tracking and photo progress reports for clients.',
    intro:
      'In construction and remodeling, trust comes from work done well and a client who stays informed. We build websites, software and automations that help you win quotes, run jobs in an orderly way and keep clients updated.',
    challenges: [
      {
        title: 'Quote requests without enough detail',
        text: 'Requests that arrive without dimensions, location, photos or scope take several rounds of back-and-forth before any estimate is possible.',
      },
      {
        title: 'Jobs tracked through loose messages',
        text: 'Photos, measurements and decisions scattered across chat groups make it hard to know what was agreed.',
      },
      {
        title: 'Costs and purchasing out of control',
        text: 'Without recording materials, purchases and labor by job, the real margin only shows up at the end — when it is too late to act.',
      },
    ],
    solutions: [
      {
        service: 'web',
        title: 'A website with a project portfolio',
        text: 'A presentation of your services, a gallery of your own completed projects and a quote form that asks for the right information.',
      },
      {
        service: 'software',
        title: 'Job tracking',
        text: 'Schedule, phases, purchases, materials and costs per job, with mobile access for the crew in the field.',
      },
      {
        service: 'automation',
        title: 'Client progress reports',
        text: 'Periodic updates with photos and phase progress, sent automatically or available in a client portal.',
      },
      {
        service: 'ai',
        title: 'First-contact assistant',
        text: 'An assistant that answers common questions, collects the details of a quote request and schedules the site visit.',
      },
    ],
    features: [
      'Project gallery by type of work',
      'Detailed quote request form',
      'Schedule and phases per job',
      'Purchasing and materials tracking',
      'Photo reports for clients',
      'Mobile access for field crews',
    ],
    note: {
      title: 'A real portfolio',
      text: 'The gallery should show only your own projects, with client permission when images show an identifiable property.',
    },
    faq: [
      {
        question: 'Can the website accept quote requests with photos?',
        answer:
          'Yes. The form can ask for photos, measurements and location. Receiving files needs a form service or your own API, which we define as part of the project.',
      },
      {
        question: 'Do you build job-management software?',
        answer:
          'Yes. It is designed around how your company works: phases, schedule, purchasing, crew and cost per job, with mobile access.',
      },
      {
        question: 'Can clients follow their project?',
        answer: 'Yes. With a client portal or automatic reports, clients get phase progress and job photos without having to ask.',
      },
    ],
    whatsappMessage: 'Hello! I run a construction or remodeling company and would like to talk about a technology project.',
  },
};
