/* Site content. Every field is bilingual { ar, en }.
   Items marked PLACEHOLDER are sample text: replace them with your own.
   A missing language shows a "translation missing" tag instead of invented text. */
const CONTENT = {
  owner: {
    name: { ar: 'اليمان', en: 'Alyaman' },
    role: { ar: 'مطوّر ومصمّم', en: 'Developer & designer' },
    intro: { // PLACEHOLDER
      ar: 'أبني تجارب رقمية واضحة وسريعة، وأهتم بالتفاصيل التي تصنع الفرق.',
      en: 'I build clear, fast digital products and care about the details that make the difference.'
    },
    about: [ // PLACEHOLDER
      { ar: 'هذا نص تعريفي تجريبي. عدّله بمعلوماتك الشخصية والمهنية.',
        en: 'This is placeholder introduction text. Replace it with your own personal and professional information.' },
      { ar: 'أعمل على الويب والتطبيقات، وأؤمن بأن الكود النظيف والتصميم الواضح يكملان بعضهما.',
        en: 'I work on web and app projects, and I believe clean code and clear design belong together.' }
    ],
    email: 'hello@example.com'
  },

  skills: [
    { cat: { ar: 'لغات البرمجة', en: 'Languages' }, items: [
      { name: 'Java', code: 'JV', level: 80, desc: { ar: 'تطبيقات وخوادم', en: 'Applications and servers' } },
      { name: 'JavaScript', code: 'JS', level: 75, desc: { ar: 'واجهات تفاعلية', en: 'Interactive interfaces' } },
      { name: 'Python', code: 'PY', level: 65, desc: { ar: 'أتمتة وسكربتات', en: 'Automation and scripts' } }
    ]},
    { cat: { ar: 'الويب', en: 'Web' }, items: [
      { name: 'HTML & CSS', code: 'H5', level: 90, desc: { ar: 'تخطيط متجاوب', en: 'Responsive layouts' } },
      { name: 'React', code: 'RX', level: 60, desc: { ar: 'مكوّنات وحالة', en: 'Components and state' } }
    ]},
    { cat: { ar: 'قواعد البيانات والأدوات', en: 'Data & tools' }, items: [
      { name: 'MySQL', code: 'SQ', level: 70, desc: { ar: 'تصميم الجداول والاستعلامات', en: 'Schema design and queries' } },
      { name: 'Git', code: 'GT', level: 75, desc: { ar: 'إدارة النسخ والفروع', en: 'Version control and branching' } }
    ]}
  ],

  projects: [ // PLACEHOLDER projects
    { id: 'codefather-site', code: 'CF', status: 'published', featured: true, year: 2026,
      category: { ar: 'ويب', en: 'Web' },
      title: { ar: 'موقع THE CODEFATHER', en: 'THE CODEFATHER website' },
      short: { ar: 'موقع شخصي بثيمات متعددة ودعم كامل للعربية والإنجليزية.', en: 'A personal site with multiple themes and full Arabic and English support.' },
      full: { ar: 'واجهة عامة متجاوبة مع خلفية متحركة وتبديل ثيمات ولغات.', en: 'A responsive public site with an animated background, theme switching, and language switching.' },
      tech: ['HTML', 'CSS', 'JavaScript'], image: '', live: '', source: '' },
    { id: 'task-tracker', code: 'TT', status: 'published', featured: true, year: 2025,
      category: { ar: 'تطبيقات', en: 'Apps' },
      title: { ar: 'متتبّع المهام', en: 'Task tracker' },
      short: { ar: 'أداة بسيطة لإدارة المهام اليومية.', en: 'A simple tool for managing daily tasks.' },
      full: { ar: 'تطبيق يسجّل المهام ويعرض حالتها ويحفظها محلياً.', en: 'An app that records tasks, shows their status, and stores them locally.' },
      tech: ['JavaScript', 'MySQL'], image: '', live: '', source: '' },
    { id: 'java-inventory', code: 'JV', status: 'published', featured: false, year: 2024,
      category: { ar: 'تطبيقات', en: 'Apps' },
      title: { ar: 'نظام مخزون بجافا', en: 'Java inventory system' },
      short: { ar: 'نظام لإدارة المخزون وتتبع الحركات.', en: 'An inventory system that tracks stock movements.' },
      full: { ar: 'تطبيق سطح مكتب مع قاعدة بيانات MySQL.', en: 'A desktop application backed by a MySQL database.' },
      tech: ['Java', 'MySQL'], image: '', live: '', source: '' }
  ],

  education: [ // PLACEHOLDER events — only years with events appear on the timeline
    { id: 'e1', year: 2008, order: 1, status: 'published',
      title: { ar: 'حدث تجريبي', en: 'Sample event' },
      desc: { ar: 'وصف تجريبي لحدث تعليمي. استبدله بتفاصيلك.', en: 'Sample description of an education event. Replace it with your details.' }, image: '' },
    { id: 'e2', year: 2014, order: 1, status: 'published',
      title: { ar: 'بداية البرمجة', en: 'Starting to code' },
      desc: { ar: 'وصف تجريبي.', en: 'Placeholder description.' }, image: '' },
    { id: 'e3', year: 2014, order: 2, status: 'published',
      title: { ar: 'دورة في قواعد البيانات', en: 'Databases course' },
      desc: { ar: 'وصف تجريبي.', en: 'Placeholder description.' }, image: '' },
    { id: 'e4', year: 2023, order: 1, status: 'published',
      title: { ar: 'شهادة مهنية', en: 'Professional certificate' },
      desc: { ar: 'وصف تجريبي.', en: 'Placeholder description.' }, image: '' }
  ],

  contact: {
    subjectDefault: { ar: 'رسالة من الموقع', en: 'Message from the website' }
  }
};

const UI = {
  ar: {
    siteTitle: 'THE CODEFATHER', navHome: 'الرئيسية', navAbout: 'عني والمهارات', navProjects: 'المشاريع', navContact: 'تواصل',
    theme: 'الثيم', reset: 'إعادة الضبط', langBtn: 'English', menu: 'القائمة', close: 'إغلاق',
    tagline: 'THINK • CODE • CREATE', heroKicker: 'مرحباً، أنا', viewProjects: 'عرض المشاريع', contactMe: 'تواصل معي',
    aboutTitle: 'نبذة عني', skillsTitle: 'المهارات', skillsSub: 'أدوات ولغات أستخدمها يومياً.',
    featuredTitle: 'مشاريع مختارة', eduTitle: 'المسار الدراسي', eduSub: 'محطات من ٢٠٠٦ إلى ٢٠٢٦.',
    ctaTitle: 'لنبنِ شيئاً معاً', ctaText: 'هل لديك فكرة أو مشروع؟ أرسل لي رسالة.', ctaBtn: 'انتقل إلى صفحة التواصل',
    viewDetails: 'التفاصيل', allProjects: 'الكل', projectsTitle: 'المشاريع', projectsSub: 'كل ما بنيته، مرتّب حسب الفئة.',
    techTitle: 'التقنيات', linksTitle: 'روابط', liveLink: 'عرض المشروع', sourceLink: 'الكود المصدري',
    relatedTitle: 'مشاريع ذات صلة', back: 'العودة للمشاريع', prev: 'السابق', next: 'التالي', year: 'السنة', category: 'الفئة',
    contactTitle: 'تواصل', contactSub: 'اكتب رسالتك وسيفتح تطبيق البريد برسالة جاهزة.',
    fName: 'الاسم', fEmail: 'البريد الإلكتروني', fSubject: 'الموضوع', fMessage: 'الرسالة', send: 'إرسال',
    errRequired: 'هذا الحقل مطلوب', errEmail: 'أدخل بريداً إلكترونياً صحيحاً', errLen: 'الرسالة قصيرة جداً (١٠ أحرف على الأقل)',
    okMsg: 'تم تجهيز الرسالة. إذا لم يفتح تطبيق البريد، أرسل إلى ',
    notFoundTitle: 'الصفحة غير موجودة', notFoundText: 'الرابط غير صحيح أو أن الصفحة لم تعد متاحة.', backHome: 'العودة للرئيسية',
    rights: 'جميع الحقوق محفوظة', missingTr: 'الترجمة غير متوفرة', emptyEdu: 'لا توجد أحداث منشورة بعد.',
    emptyProj: 'لا توجد مشاريع في هذه الفئة.', all: 'الكل', email: 'البريد'
  },
  en: {
    siteTitle: 'THE CODEFATHER', navHome: 'Home', navAbout: 'About & Skills', navProjects: 'Projects', navContact: 'Contact',
    theme: 'Theme', reset: 'Reset', langBtn: 'العربية', menu: 'Menu', close: 'Close',
    tagline: 'THINK • CODE • CREATE', heroKicker: "Hi, I'm", viewProjects: 'View projects', contactMe: 'Contact me',
    aboutTitle: 'About me', skillsTitle: 'Skills', skillsSub: 'Languages and tools I use every day.',
    featuredTitle: 'Featured projects', eduTitle: 'Education timeline', eduSub: 'Milestones from 2006 to 2026.',
    ctaTitle: "Let's build something", ctaText: 'Have an idea or a project? Send me a message.', ctaBtn: 'Go to contact page',
    viewDetails: 'Details', allProjects: 'All', projectsTitle: 'Projects', projectsSub: 'Everything I have built, by category.',
    techTitle: 'Technologies', linksTitle: 'Links', liveLink: 'Live project', sourceLink: 'Source code',
    relatedTitle: 'Related projects', back: 'Back to projects', prev: 'Previous', next: 'Next', year: 'Year', category: 'Category',
    contactTitle: 'Contact', contactSub: 'Write your message and your email app will open with it ready to send.',
    fName: 'Name', fEmail: 'Email', fSubject: 'Subject', fMessage: 'Message', send: 'Send',
    errRequired: 'This field is required', errEmail: 'Enter a valid email address', errLen: 'Message is too short (10 characters minimum)',
    okMsg: 'Your message is ready. If your mail app did not open, write to ',
    notFoundTitle: 'Page not found', notFoundText: 'The link is wrong or the page is no longer available.', backHome: 'Back to home',
    rights: 'All rights reserved', missingTr: 'Translation missing', emptyEdu: 'No published events yet.',
    emptyProj: 'No projects in this category.', all: 'All', email: 'Email'
  }
};
