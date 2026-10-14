import type { ServiceContent } from '../types';
import type { ServiceId } from '@/lib/i18n/routes';

export const services: Record<ServiceId, ServiceContent> = {
  web: {
    title: 'Websites',
    metaTitle: 'Website Development for Small and Mid-Sized Businesses',
    metaDescription:
      'Custom business websites, landing pages and multilingual sites that load fast, work on every phone and are built for Google. Website development and maintenance.',
    heading: 'Website development for growing businesses',
    summary: 'Business websites, landing pages and premium sites that load fast, rank well on Google and turn visitors into leads.',
    intro:
      'Your website is often the first conversation a customer has with your business. We build custom websites — no off-the-shelf themes — designed to load fast, work great on phones and turn visits into inquiries.',
    problems: [
      { title: 'A slow or outdated website', text: 'Pages that take too long to load or break on mobile make visitors leave before they ever reach out.' },
      { title: 'Hard to find on Google', text: 'Without a solid technical SEO foundation, your site does not show up when customers search for what you offer.' },
      { title: 'Traffic that never becomes leads', text: 'Without clear calls to action, a simple form and quick ways to reach you, interest fades away.' },
    ],
    capabilities: [
      'Business websites',
      'Campaign landing pages',
      'Websites for small and mid-sized businesses',
      'Premium sites with animation',
      'Fully responsive layouts',
      'Multilingual websites',
      'Technical SEO built for Google',
      'Google Analytics and Search Console',
      'Contact forms and WhatsApp integration',
      'Online booking and scheduling',
      'Ongoing website maintenance',
    ],
    approach: [
      { title: 'Original design', text: 'A layout created for your brand and your audience, not a generic theme with your logo on it.' },
      { title: 'Performance', text: 'Lean code, optimized images and on-demand loading for top Lighthouse scores.' },
      { title: 'Built to grow', text: 'Content structured so new pages, languages and integrations are easy to add.' },
    ],
    faq: [
      {
        question: 'Do you build websites for small businesses?',
        answer:
          'Yes. We build everything from focused landing pages and compact business sites to larger websites with many pages and integrations, always scoped to your goals and budget.',
      },
      {
        question: 'Can my website be in more than one language?',
        answer:
          'Yes. We build multilingual sites with a dedicated URL for each language, hreflang markup for search engines and content adapted to each market — the same setup this website uses.',
      },
      {
        question: 'Do you maintain the website after launch?',
        answer:
          'Yes. Beyond development, we handle maintenance: content updates, new pages, performance tuning and monitoring in Google Search Console.',
      },
    ],
  },
  software: {
    title: 'Custom Software',
    metaTitle: 'Custom Software Development Services and CRM',
    metaDescription:
      'Custom web applications, CRMs, dashboards and business management systems, with integrations between your tools, role-based access and secure data.',
    heading: 'Custom software built around your operations',
    summary: 'Custom web apps, CRMs, dashboards and portals that organize your operations and replace spreadsheets.',
    intro:
      'When spreadsheets can no longer keep up, it is time for real software. We build custom web applications around the way your business actually works — from data entry to reporting — with access control, secure data and an interface your team will pick up quickly.',
    problems: [
      { title: 'Operations stuck in spreadsheets', text: 'Information scattered across spreadsheets and chat threads leads to rework, mistakes and no clear picture of what is going on.' },
      { title: 'Tools that do not talk to each other', text: 'The same data typed twice into different tools, with no connection between sales, finance and customer service.' },
      { title: 'Off-the-shelf software that does not fit', text: 'Generic tools force you to change your process to fit the software, instead of the other way around.' },
    ],
    capabilities: [
      'Custom web applications',
      'Custom CRM',
      'Dashboards and reporting',
      'Admin panels',
      'Business management systems',
      'Customer and partner portals',
      'REST APIs',
      'System integrations',
      'Data modeling and databases',
      'Role-based access control',
    ],
    approach: [
      { title: 'Process before code', text: 'We map how your operation works today before defining screens and rules.' },
      { title: 'Solid architecture', text: 'Business rules separated from the interface, automated tests and documented code.' },
      { title: 'Incremental delivery', text: 'You review and approve the software in stages, not just at the end.' },
    ],
    faq: [
      {
        question: 'Custom software or an off-the-shelf product?',
        answer:
          'Off-the-shelf tools cover the average process in a market; custom software is built for yours. When an existing product does the job, we will tell you — and if needed, we integrate the new system with it.',
      },
      {
        question: 'Do you build custom CRMs?',
        answer:
          'Yes. We build CRMs with sales pipelines, customer history, tasks and integrations with WhatsApp, email and your website, shaped around how your sales team works.',
      },
      {
        question: 'Can it integrate with the tools we already use?',
        answer:
          'In most cases, yes — as long as your current tools offer an API or data export. We assess possible integrations during the discovery phase.',
      },
    ],
  },
  saas: {
    title: 'SaaS Platforms',
    metaTitle: 'SaaS Development: From MVP to Scalable Platform',
    metaDescription:
      'Multi-tenant SaaS development with subscriptions, recurring billing, permissions and an architecture ready to scale — from MVP to production.',
    heading: 'SaaS platform development',
    summary: 'Multi-tenant SaaS platforms with subscriptions, recurring billing and an architecture ready to scale.',
    intro:
      'Turning an idea into a software product takes more than screens: you need accounts, plans, recurring billing, permissions and a foundation that holds up as you grow. We build complete SaaS platforms, from MVP to day-to-day operation.',
    problems: [
      { title: 'An idea without a validated product', text: 'Spending months on features before testing with real customers raises the risk of the whole project.' },
      { title: 'A codebase that will not scale', text: 'A rushed MVP becomes a roadblock once new customers, plans and integrations arrive.' },
      { title: 'Manual billing and access', text: 'Tracking subscriptions, failed payments and permissions by hand eats time and invites errors.' },
    ],
    capabilities: [
      'Multi-tenant architecture',
      'Plans, subscriptions and recurring billing',
      'Payments with Stripe',
      'Customer and admin dashboards',
      'Role-based permissions (RBAC)',
      'Email and WhatsApp notifications',
      'Internationalization',
      'Onboarding and public pages',
    ],
    approach: [
      { title: 'A focused MVP', text: 'We start with what validates the product, on a technical foundation that can keep evolving.' },
      { title: 'Data isolation', text: 'Each customer only sees its own data — by design, not as an afterthought.' },
      { title: 'Built for production', text: 'Queues, scheduled jobs, webhooks and logging planned for real-world operation.' },
    ],
    faq: [
      {
        question: 'Can you build the MVP for our SaaS?',
        answer:
          'Yes. We start with the smallest feature set that validates the product, on a foundation ready for plans, recurring billing and new customers without a rewrite.',
      },
      {
        question: 'How is each customer’s data kept separate?',
        answer:
          'We use a multi-tenant architecture where each company only sees its own data, with isolation enforced in the code and, when the project calls for it, at the database level too.',
      },
    ],
  },
  ai: {
    title: 'AI Chatbots & Agents',
    metaTitle: 'AI Chatbot Development for Businesses',
    metaDescription:
      'We build AI chatbots and virtual assistants for your website and WhatsApp, connected to your business systems, with a human handoff whenever it is needed.',
    heading: 'AI chatbots and virtual assistants for your business',
    summary: 'AI chatbots, agents and automated customer service on your website and WhatsApp, connected to your data and systems.',
    intro:
      'Useful AI is AI connected to your business. We build assistants and agents that answer customers, look up information, book appointments and complete tasks — with clear limits on what they can do and a handoff to a person when needed.',
    problems: [
      { title: 'A team buried in repeat questions', text: 'Questions about hours, pricing and availability keep your staff busy and leave customers waiting.' },
      { title: 'Leads lost after hours', text: 'Messages that arrive at night or on weekends go unanswered, and the customer moves on to a competitor.' },
      { title: 'Rigid, button-only chatbots', text: 'Scripted flows that cannot understand what customers type frustrate more than they help.' },
    ],
    capabilities: [
      'Chatbots for websites and WhatsApp',
      'AI virtual assistants',
      'Customer service automation',
      'AI agents with tools',
      'AI inside your existing software',
      'Document classification and extraction',
      'AI-powered process automation',
    ],
    approach: [
      { title: 'Controlled scope', text: 'The agent only reaches what it needs, and every action is logged.' },
      { title: 'Human in the loop', text: 'When the AI should not answer, the conversation goes to your team.' },
      { title: 'Leading models', text: 'We work with the APIs of the leading large language model providers.' },
    ],
    faq: [
      {
        question: 'Can the chatbot work on WhatsApp?',
        answer:
          'Yes. We integrate through the official WhatsApp Business Platform and follow Meta’s rules: customers must opt in, and messages outside the customer service window use approved templates.',
      },
      {
        question: 'Can the AI give a wrong answer?',
        answer:
          'Language models can make mistakes. That is why we limit the assistant to the information and actions you define, log conversations and route sensitive or uncertain cases to a person on your team.',
      },
      {
        question: 'Which AI models do you use?',
        answer:
          'We work with APIs from providers such as Anthropic (Claude) and OpenAI. The choice depends on the use case, cost and the privacy requirements of the project.',
      },
    ],
  },
  automation: {
    title: 'Business Automation',
    metaTitle: 'Business Process Automation and Integrations',
    metaDescription:
      'Business process automation and system integrations: reminders, WhatsApp and email messages, automated reports and workflows that remove manual work.',
    heading: 'Business process automation',
    summary: 'Automated workflows that connect your tools, send messages and put an end to repetitive manual tasks.',
    intro:
      'A big share of your team’s week goes to copying data, sending reminders and checking spreadsheets. We automate those routines by connecting the tools you already use — with monitoring and failure handling built in.',
    problems: [
      { title: 'Repetitive manual work', text: 'Copying data between systems, sending reminders and building reports takes hours every week.' },
      { title: 'Errors and forgotten steps', text: 'Processes that depend on someone remembering tend to fail on your busiest days.' },
      { title: 'Disconnected tools', text: 'Forms, spreadsheets, CRM and accounting with no integration leave your team bridging the gaps by hand.' },
    ],
    capabilities: [
      'System and API integrations',
      'Automated reminders and notifications',
      'WhatsApp and email messaging',
      'Scheduled jobs',
      'Spreadsheet and file processing',
      'Webhooks',
      'Automated reports',
    ],
    approach: [
      { title: 'Find the bottleneck', text: 'We identify the tasks that take the most time and carry the most risk of error.' },
      { title: 'Reliable automation', text: 'Queues, automatic retries and alerts when something fails.' },
      { title: 'Measure the gain', text: 'Every automation has a clear, verifiable goal.' },
    ],
    faq: [
      {
        question: 'What kind of processes can be automated?',
        answer:
          'Repetitive tasks with clear rules: reminders and payment follow-ups, capturing leads from your website, generating reports, syncing data between systems and processing spreadsheets and files.',
      },
      {
        question: 'What happens if an automation fails?',
        answer: 'Automations include automatic retries, a log of every run and alerts when something goes wrong, so no failure goes unnoticed.',
      },
    ],
  },
  ecommerce: {
    title: 'E-commerce',
    metaTitle: 'E-commerce Website Development',
    metaDescription:
      'Online stores built on Shopify or fully custom, with payments, inventory, ERP and marketplace integrations and a mobile-first checkout.',
    heading: 'E-commerce development',
    summary: 'Online stores with payments, integrations and a shopping experience designed for mobile.',
    intro:
      'Selling online takes a store that is fast, reliable and easy to manage. We set up stores on proven platforms like Shopify, or build custom solutions when your business needs its own rules.',
    problems: [
      { title: 'Sales that depend on marketplaces', text: 'Selling only through marketplaces means high fees and little control over your customer relationships.' },
      { title: 'A checkout that drives buyers away', text: 'Too many steps, slow pages and a poor mobile experience increase cart abandonment.' },
      { title: 'Inventory out of sync', text: 'Orders, stock and payments without integration lead to selling products you no longer have.' },
    ],
    capabilities: [
      'Online stores',
      'Shopify',
      'Custom e-commerce solutions',
      'Payment gateway integration',
      'Inventory management',
      'ERP and marketplace integrations',
      'Mobile-optimized checkout',
    ],
    approach: [
      { title: 'The right platform', text: 'We recommend Shopify when it fits, and custom development when it is truly needed.' },
      { title: 'Conversion', text: 'Product pages and checkout designed to reduce abandonment.' },
      { title: 'Connected operations', text: 'Inventory, orders and payments working together.' },
    ],
    faq: [
      {
        question: 'Shopify or a custom store?',
        answer:
          'When your operation follows standard retail patterns, a platform like Shopify is usually faster and more cost-effective. We build custom when your business has its own pricing, catalog or integration rules.',
      },
      {
        question: 'Can the store sell internationally?',
        answer:
          'Yes, the store can be multilingual and support more than one currency. Payment methods, taxes and international shipping are assessed case by case, depending on the platform.',
      },
    ],
  },
  cloud: {
    title: 'Cloud & Infrastructure',
    metaTitle: 'Cloud Infrastructure on Microsoft Azure and AWS',
    metaDescription:
      'Deployments, servers, managed databases, containers and CI/CD pipelines on Microsoft Azure and AWS for web applications, with a focus on cost and security.',
    heading: 'Cloud infrastructure for web applications',
    summary: 'Deployments, servers, databases and infrastructure on Microsoft Azure and AWS for web applications.',
    intro:
      'Good software needs a solid home. We set up cloud infrastructure for your applications — containers, managed databases, queues, storage and deployment pipelines — with close attention to cost, security and uptime.',
    problems: [
      { title: 'Manual, risky deployments', text: 'Shipping new versions by hand increases the risk of mistakes and downtime.' },
      { title: 'Cloud costs out of control', text: 'Oversized or forgotten resources lead to bills far larger than the project needs.' },
      { title: 'Exposed credentials', text: 'Passwords and API keys stored in code or chat messages are a serious security risk.' },
    ],
    capabilities: [
      'Microsoft Azure',
      'AWS',
      'Continuous deployment (CI/CD)',
      'Docker containers',
      'Managed databases',
      'Server and domain setup',
      'Secrets and credentials management',
      'Monitoring and logging',
    ],
    approach: [
      { title: 'Infrastructure as code', text: 'Reproducible, documented and version-controlled environments.' },
      { title: 'Costs under control', text: 'Resources sized for where the project is today.' },
      { title: 'Security', text: 'Credentials in vaults, least-privilege access and HTTPS everywhere.' },
    ],
    faq: [
      {
        question: 'Do you work with Azure and AWS?',
        answer: 'Yes. We deploy applications on Microsoft Azure and AWS with containers, managed databases, storage and automated deployment pipelines.',
      },
      {
        question: 'Can you take over our existing infrastructure?',
        answer:
          'Yes. We start by reviewing your current environment — costs, security and points of failure — and propose improvements in stages, without disrupting operations.',
      },
    ],
  },
};
