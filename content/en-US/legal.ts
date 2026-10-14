import type { LegalDocument } from '../types';

export const privacy: LegalDocument = {
  metaTitle: 'Privacy Policy',
  metaDescription: 'How HR Tech Sistemas collects, uses and protects the data sent through this website.',
  title: 'Privacy Policy',
  updated: 'Last updated: October 2026.',
  intro: [
    'This policy explains how {company} ({site}) handles the information you send through the contact form and the information collected while you browse this website.',
  ],
  sections: [
    {
      title: '1. Who is responsible',
      paragraphs: [
        'The data controller is {company}, Brazilian company ID (CNPJ) {cnpj}, based in Suzano (São Paulo), Brazil. For privacy questions and requests, write to {email}.',
      ],
    },
    {
      title: '2. What we collect',
      paragraphs: [
        'We only collect what you enter in the contact form: your name, company (optional), country, email, WhatsApp or phone number (optional), type of service, estimated budget (optional, when offered), preferred language and a description of your project.',
      ],
    },
    {
      title: '3. How we use it',
      paragraphs: [
        'We use this information only to reply to your inquiry and, if there is mutual interest, to prepare a commercial proposal. We do not sell, rent or share your data with third parties for marketing.',
      ],
    },
    {
      title: '4. Sending by WhatsApp and email',
      paragraphs: [
        'Depending on how the form is configured when you contact us, your details may be sent directly to HR Tech’s WhatsApp or email, opened on your own device. In that case, delivery is subject to the privacy policies of WhatsApp (Meta) and your email provider.',
      ],
    },
    {
      title: '5. Cookies and browser storage',
      paragraphs: [
        'This website does not set its own tracking cookies. It stores in your browser (local storage) only the language you chose and your decision about analytics cookies; this is functional data, not tracking.',
        'We use Google Analytics to measure audience, but only if you accept, in every country. Until you accept, the Google Analytics script is not loaded and no analytics cookie is stored. If you decline, it is not loaded and we remove the analytics cookies the site can control (_ga, _ga_*, _gid and _gat*). You can accept, decline or change your decision at any time with the “Cookie preferences” link in the footer. If you accept, Google Analytics stores analytics cookies and processes usage data under Google’s privacy policy; we do not turn on advertising or personalization features. Data already sent to Google before you decline is covered by Google’s policy; to ask for deletion, write to {email}.',
      ],
    },
    {
      title: '6. Service providers and international transfers',
      paragraphs: [
        'To run the website and respond to you, the following may process data on our behalf or on their own account: Google (Google Analytics), Meta (WhatsApp) and the email provider used by HR Tech. These providers may process data outside your country, including in the United States. Because HR Tech is based in Brazil, the data you send us is processed in Brazil.',
      ],
    },
    {
      title: '7. How long we keep it',
      paragraphs: [
        'We keep the data you send through the form for as long as needed to reply to you, handle any proposal and meet legal obligations. You can ask us to delete it sooner, as described below.',
      ],
    },
    {
      title: '8. Your rights',
      paragraphs: [
        'You may ask at any time to confirm whether we process your data, and to access, correct, delete or restrict the data you sent us, as provided by Brazil’s LGPD. Depending on where you live, laws such as the EU/UK GDPR or US state privacy laws also give you specific rights. Write to {email}. You may also complain to the data protection authority in your country (in Brazil, the ANPD; in Spain, the AEPD).',
      ],
    },
    {
      title: '9. Contact',
      paragraphs: ['Questions about this policy can be sent to {email}.'],
    },
  ],
};

export const terms: LegalDocument = {
  metaTitle: 'Terms of Use',
  metaDescription: 'Terms for using the HR Tech Sistemas website.',
  title: 'Terms of Use',
  updated: 'Last updated: October 2026.',
  intro: ['These terms govern use of the {company} website ({site}). By browsing this site, you agree to the conditions below.'],
  sections: [
    {
      title: '1. About the content',
      paragraphs: ['The text, images, visual identity and code of this website belong to HR Tech Sistemas or are used under an appropriate license.'],
    },
    {
      title: '2. Permitted use',
      paragraphs: ['The content of this website may be accessed freely for informational purposes. Copying, reproducing or redistributing it without prior permission is not allowed.'],
    },
    {
      title: '3. Quotes and proposals',
      paragraphs: [
        'Information sent through the contact form is used only to prepare a reply or commercial proposal. Submitting the form does not create a service agreement — any engagement is formalized in a separate contract.',
      ],
    },
    {
      title: '4. Availability',
      paragraphs: ['We aim to keep the site available at all times, but we do not guarantee it will be free of interruptions for maintenance or for reasons beyond our control.'],
    },
    {
      title: '5. Languages',
      paragraphs: ['This website is available in Portuguese, English and Spanish. If the versions of these terms differ, the Portuguese version prevails.'],
    },
    {
      title: '6. Changes',
      paragraphs: ['These terms may be updated from time to time. The version in force is always the one published on this page.'],
    },
    {
      title: '7. Contact',
      paragraphs: ['Questions about these terms can be sent to {email}.'],
    },
  ],
};
