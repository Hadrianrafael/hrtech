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
      title: '1. What we collect',
      paragraphs: [
        'We only collect what you enter in the contact form: your name, company (optional), country, email, WhatsApp or phone number (optional), type of service, estimated budget (optional, when offered), preferred language and a description of your project.',
      ],
    },
    {
      title: '2. How we use it',
      paragraphs: [
        'We use this information only to reply to your inquiry and, if there is mutual interest, to prepare a commercial proposal. We do not sell, rent or share your data with third parties for marketing.',
      ],
    },
    {
      title: '3. Sending by WhatsApp and email',
      paragraphs: [
        'Depending on how the form is configured when you contact us, your details may be sent directly to HR Tech’s WhatsApp or email, opened on your own device. In that case, delivery is subject to the privacy policies of WhatsApp and your email provider.',
      ],
    },
    {
      title: '4. Cookies and browser storage',
      paragraphs: [
        'This website does not use first-party tracking cookies. It stores in your browser (local storage) only the language you chose and, where applicable, your decision about analytics cookies.',
        'We use Google Analytics to measure audience in aggregate. For visitors in the European Economic Area, the United Kingdom and Switzerland, analytics cookies are only enabled after consent; without it, Google Analytics runs without storing cookies. Google’s privacy policy applies to that processing.',
      ],
    },
    {
      title: '5. Your rights',
      paragraphs: [
        'You may ask at any time to access, correct or delete the data you sent us. Depending on where you live, laws such as Brazil’s LGPD, the EU/UK GDPR or US state privacy laws give you specific rights. Write to {email}.',
      ],
    },
    {
      title: '6. Contact',
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
