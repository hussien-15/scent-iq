import { PrismaClient, type User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ADMIN_PERMISSIONS, ADMIN_ROLE_LABELS, ROLE_PERMISSIONS, type AdminRoleName } from '../src/lib/permissions';
import { LAUNCH_APPROVAL_AREAS, QA_CHECK_DEFINITIONS } from '../src/lib/qa-catalog';

export type SeedMode = 'core' | 'dev' | 'staging' | 'products' | 'demo' | 'production';

export type SeedContext = {
  mode: SeedMode;
  includeDemoCatalog: boolean;
  includeDemoActivity: boolean;
  admin: User | null;
  warnings: string[];
};

export type SeedValidation = {
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
};

const PRODUCTION_CONFIRMATION = 'SCENTIQ_PRODUCTION_SETUP';
const DEV_ADMIN = {
  name: 'ScentIQ Development Admin',
  email: 'admin@scentiq.example',
  password: 'ScentIQ-Dev-Only-2026!',
};

const ROLES: Record<AdminRoleName, string> = {
  SUPER_ADMIN: 'Full platform access. Reserved for the store owner and trusted technical administrator.',
  MANAGER: 'Runs daily store operations without destructive security or ownership controls.',
  CONTENT_EDITOR: 'Creates and publishes catalog, brand, collection, media, and SEO content.',
  ORDER_MANAGER: 'Manages orders, customers, delivery status, and operational exports.',
  INVENTORY_MANAGER: 'Maintains stock, variants, warehouse locations, imports, and exports.',
  CUSTOMER_SUPPORT: 'Assists customers, updates orders, and moderates support-related reviews.',
  SEO_EDITOR: 'Maintains searchable content, templates, metadata, redirects, and media.',
  VIEWER: 'Read-only access to operational dashboards and content.',
};

const CATEGORIES = [
  ['men-perfumes', 'Men Perfumes', 'عطور رجالية', 'عطور رجالية مختارة للاستخدام اليومي والمناسبات.'],
  ['women-perfumes', 'Women Perfumes', 'عطور نسائية', 'عطور نسائية بتشكيلات زهرية ودافئة ومنعشة.'],
  ['unisex-perfumes', 'Unisex Perfumes', 'عطور للجنسين', 'عطور متوازنة يمكن للجميع الاستمتاع بها.'],
  ['arabic-perfumes', 'Arabic Perfumes', 'عطور عربية', 'تركيبات عربية تتمحور حول العود والعنبر والتوابل.'],
  ['french-perfumes', 'French Perfumes', 'عطور فرنسية', 'اختيارات من مدارس العطور الفرنسية المعروفة.'],
  ['designer-perfumes', 'Designer Perfumes', 'عطور ديزاينر', 'عطور من دور الأزياء والتصميم العالمية.'],
  ['niche-perfumes', 'Niche Perfumes', 'عطور نيش', 'عطور ذات أفكار وتركيبات متخصصة ومميزة.'],
  ['luxury-perfumes', 'Luxury Perfumes', 'عطور فاخرة', 'اختيارات فاخرة بتركيبات وتقديم مميزين.'],
  ['budget-friendly', 'Budget Friendly', 'خيارات اقتصادية', 'عطور مختارة بقيمة مناسبة مقابل السعر.'],
  ['premium-picks', 'Premium Picks', 'اختيارات بريميوم', 'اختيارات مميزة بعد مراجعة التفاصيل والأداء.'],
  ['daily-wear', 'Daily Wear', 'عطور يومية', 'عطور عملية ومريحة للاستخدام اليومي.'],
  ['evening-perfumes', 'Evening Perfumes', 'عطور مسائية', 'عطور أعمق للمساء والمناسبات الخاصة.'],
] as const;

const BRANDS = [
  ['lattafa', 'Lattafa', 'لطافة', 'United Arab Emirates'],
  ['afnan', 'Afnan', 'أفنان', 'United Arab Emirates'],
  ['armaf', 'Armaf', 'أرماف', 'United Arab Emirates'],
  ['maison-alhambra', 'Maison Alhambra', 'ميزون الحمراء', 'United Arab Emirates'],
  ['rasasi', 'Rasasi', 'الرصاصي', 'United Arab Emirates'],
  ['ajmal', 'Ajmal', 'أجمل', 'United Arab Emirates'],
  ['al-haramain', 'Al Haramain', 'الحرمين', 'United Arab Emirates'],
  ['dior', 'Dior', 'ديور', 'France'],
  ['chanel', 'Chanel', 'شانيل', 'France'],
  ['tom-ford', 'Tom Ford', 'توم فورد', 'United States'],
  ['versace', 'Versace', 'فيرساتشي', 'Italy'],
  ['yves-saint-laurent', 'Yves Saint Laurent', 'إيف سان لوران', 'France'],
  ['jean-paul-gaultier', 'Jean Paul Gaultier', 'جان بول غوتييه', 'France'],
  ['carolina-herrera', 'Carolina Herrera', 'كارولينا هيريرا', 'United States'],
  ['paco-rabanne', 'Paco Rabanne', 'باكو رابان', 'France'],
] as const;

const NOTES = [
  ['oud', 'Oud', 'عود', 'woody'],
  ['vanilla', 'Vanilla', 'فانيليا', 'sweet'],
  ['amber', 'Amber', 'عنبر', 'oriental'],
  ['rose', 'Rose', 'ورد', 'floral'],
  ['musk', 'Musk', 'مسك', 'musky'],
  ['bergamot', 'Bergamot', 'برغموت', 'citrus'],
  ['lemon', 'Lemon', 'ليمون', 'citrus'],
  ['orange', 'Orange', 'برتقال', 'citrus'],
  ['apple', 'Apple', 'تفاح', 'fruity'],
  ['pineapple', 'Pineapple', 'أناناس', 'fruity'],
  ['lavender', 'Lavender', 'لافندر', 'floral'],
  ['jasmine', 'Jasmine', 'ياسمين', 'floral'],
  ['sandalwood', 'Sandalwood', 'خشب الصندل', 'woody'],
  ['cedarwood', 'Cedarwood', 'خشب الأرز', 'woody'],
  ['patchouli', 'Patchouli', 'باتشولي', 'woody'],
  ['leather', 'Leather', 'جلد', 'leather'],
  ['tobacco', 'Tobacco', 'تبغ', 'oriental'],
  ['cinnamon', 'Cinnamon', 'قرفة', 'spicy'],
  ['cardamom', 'Cardamom', 'هيل', 'spicy'],
  ['pepper', 'Pepper', 'فلفل', 'spicy'],
  ['saffron', 'Saffron', 'زعفران', 'spicy'],
  ['iris', 'Iris', 'سوسن', 'floral'],
  ['tonka-bean', 'Tonka Bean', 'حبة تونكا', 'gourmand'],
  ['caramel', 'Caramel', 'كراميل', 'gourmand'],
  ['coffee', 'Coffee', 'قهوة', 'gourmand'],
  ['coconut', 'Coconut', 'جوز الهند', 'fruity'],
  ['sea-notes', 'Sea Notes', 'نوتات بحرية', 'aquatic'],
  ['green-notes', 'Green Notes', 'نوتات خضراء', 'fresh'],
] as const;

const TAGS = [
  ['best-seller', 'Best Seller', 'الأكثر مبيعًا', 'Marketing'],
  ['trending', 'Trending', 'رائج', 'Marketing'],
  ['new-arrival', 'New Arrival', 'وصل حديثًا', 'Marketing'],
  ['long-lasting', 'Long Lasting', 'ثبات طويل', 'Performance'],
  ['strong-projection', 'Strong Projection', 'فوحان قوي', 'Performance'],
  ['office-friendly', 'Office Friendly', 'مناسب للمكتب', 'Occasion'],
  ['summer-pick', 'Summer Pick', 'اختيار صيفي', 'Season'],
  ['winter-favorite', 'Winter Favorite', 'مفضل شتوي', 'Season'],
  ['hidden-gem', 'Hidden Gem', 'جوهرة مخفية', 'Smart Recommendation'],
  ['luxury-choice', 'Luxury Choice', 'اختيار فاخر', 'Style'],
  ['budget-friendly', 'Budget Friendly', 'اقتصادي', 'Marketing'],
  ['most-complimented', 'Most Complimented', 'الأكثر تلقيًا للإطراء', 'Smart Recommendation'],
  ['daily-wear', 'Daily Wear', 'استخدام يومي', 'Occasion'],
  ['date-night', 'Date Night', 'موعد مسائي', 'Occasion'],
  ['elegant', 'Elegant', 'أنيق', 'Style'],
  ['fresh', 'Fresh', 'منعش', 'Style'],
  ['sweet', 'Sweet', 'حلو', 'Style'],
  ['dark', 'Dark', 'داكن', 'Style'],
  ['classic', 'Classic', 'كلاسيكي', 'Style'],
  ['modern', 'Modern', 'عصري', 'Style'],
] as const;

const COLLECTIONS = [
  ['best-sellers', 'Best Sellers', 'الأكثر مبيعًا', 'MANUAL'],
  ['new-arrivals', 'New Arrivals', 'وصل حديثًا', 'MANUAL'],
  ['winter-perfumes', 'Winter Perfumes', 'عطور الشتاء', 'DYNAMIC'],
  ['summer-perfumes', 'Summer Perfumes', 'عطور الصيف', 'DYNAMIC'],
  ['office-perfumes', 'Office Perfumes', 'عطور المكتب', 'DYNAMIC'],
  ['date-night-perfumes', 'Date Night Perfumes', 'عطور للمواعيد', 'HYBRID'],
  ['long-lasting-perfumes', 'Long Lasting Perfumes', 'عطور ثابتة', 'DYNAMIC'],
  ['most-complimented', 'Most Complimented', 'الأكثر تلقيًا للإطراء', 'MANUAL'],
  ['luxury-collection', 'Luxury Collection', 'المجموعة الفاخرة', 'HYBRID'],
  ['budget-friendly-picks', 'Budget Friendly Picks', 'اختيارات اقتصادية', 'DYNAMIC'],
  ['hidden-gems', 'Hidden Gems', 'جواهر مخفية', 'MANUAL'],
  ['editors-choice', "Editor's Choice", 'اختيار المحرر', 'MANUAL'],
  ['oud-perfumes', 'Oud Perfumes', 'عطور العود', 'DYNAMIC'],
  ['vanilla-perfumes', 'Vanilla Perfumes', 'عطور الفانيليا', 'DYNAMIC'],
  ['fresh-everyday-perfumes', 'Fresh Everyday Perfumes', 'عطور يومية منعشة', 'DYNAMIC'],
] as const;

const IRAQI_CITIES = [
  'Baghdad',
  'Basra',
  'Erbil',
  'Najaf',
  'Karbala',
  'Mosul',
  'Sulaymaniyah',
  'Kirkuk',
  'Duhok',
  'Diwaniyah',
  'Hillah',
  'Nasiriyah',
  'Amarah',
  'Kut',
  'Ramadi',
  'Fallujah',
  'Tikrit',
  'Samarra',
];

const HOMEPAGE_SECTIONS = [
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d01', 'HERO', 'اكتشف عطرك', 'Find your scent', 10],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d02', 'SMART_SEARCH', 'ابحث بذكاء', 'Smart search', 20],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d03', 'FEATURE_HIGHLIGHTS', 'تسوّق بثقة', 'Shop with confidence', 30],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d04', 'FEATURED_BRANDS', 'الماركات المميزة', 'Featured brands', 40],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d05', 'BEST_SELLERS', 'الأكثر طلبًا', 'Best sellers', 50],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d06', 'CATEGORIES', 'تسوّق حسب الفئة', 'Shop by category', 60],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d07', 'OCCASIONS', 'اختيارات حسب المناسبة', 'Shop by occasion', 70],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d08', 'FRAGRANCE_FAMILIES', 'العائلات العطرية', 'Fragrance families', 80],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d09', 'COLLECTIONS', 'مجموعات مختارة', 'Curated collections', 90],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d10', 'SMART_RECOMMENDATIONS', 'اقتراحات تناسبك', 'Smart recommendations', 100],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d11', 'REVIEWS', 'آراء العملاء', 'Customer reviews', 110],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d12', 'NEWSLETTER', 'ابقَ على اطلاع', 'Stay in the know', 120],
  ['f7fd0a36-137c-4d61-91ba-32aeb8ce4d13', 'FOOTER', 'ScentIQ', 'ScentIQ', 130],
] as const;

function option(name: string) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export function resolveSeedMode(): SeedMode {
  const requested = (
    option('mode') ??
    process.env.SCENTIQ_SEED_MODE ??
    (process.env.NODE_ENV === 'production' ? 'production' : 'dev')
  ).toLowerCase();
  if (!['core', 'dev', 'staging', 'products', 'demo', 'production'].includes(requested)) {
    throw new Error(`Unsupported seed mode “${requested}”. Use core, dev, staging, products, demo, or production.`);
  }
  return requested as SeedMode;
}

async function seedRoles(prisma: PrismaClient) {
  for (const permission of ADMIN_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission },
      update: {},
      create: { key: permission, description: `Allows ${permission.replaceAll('.', ' ')}` },
    });
  }
  const permissions = new Map(
    (await prisma.permission.findMany()).map((permission) => [permission.key, permission.id])
  );
  for (const roleKey of Object.keys(ROLES) as AdminRoleName[]) {
    const role = await prisma.adminRole.upsert({
      where: { key: roleKey },
      update: {},
      create: { key: roleKey, name: ADMIN_ROLE_LABELS[roleKey], description: ROLES[roleKey] },
    });
    await prisma.adminRolePermission.createMany({
      data: ROLE_PERMISSIONS[roleKey].map((permission) => ({
        adminRoleId: role.id,
        permissionId: permissions.get(permission)!,
      })),
      skipDuplicates: true,
    });
  }
}

async function seedAdmin(prisma: PrismaClient, mode: SeedMode, warnings: string[]) {
  const configured = {
    name: process.env.SEED_ADMIN_NAME?.trim(),
    email: process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase(),
    password: process.env.SEED_ADMIN_PASSWORD,
  };
  const anyConfigured = Boolean(configured.name || configured.email || configured.password);
  const fullyConfigured = Boolean(configured.name && configured.email && configured.password);

  if (anyConfigured && !fullyConfigured) {
    throw new Error('SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD must be provided together.');
  }

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN', adminRole: 'SUPER_ADMIN', adminStatus: 'ACTIVE' },
  });
  if (!fullyConfigured && mode === 'production') {
    if (existingSuperAdmin) {
      warnings.push('Existing active Super Admin preserved; no production admin credentials were changed.');
      return existingSuperAdmin;
    }
    throw new Error(
      'Production setup needs SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD to create the first Super Admin.'
    );
  }

  const credentials = fullyConfigured
    ? { name: configured.name!, email: configured.email!, password: configured.password! }
    : DEV_ADMIN;
  if (!fullyConfigured)
    warnings.push(
      'Development-only admin defaults are active. Set SEED_ADMIN_* and change the password before sharing this environment.'
    );
  if (credentials.password.length < 12) throw new Error('SEED_ADMIN_PASSWORD must contain at least 12 characters.');

  const existing = await prisma.user.findUnique({ where: { email: credentials.email } });
  if (existing && existing.role !== 'ADMIN') {
    throw new Error(`The configured admin email already belongs to a customer account: ${credentials.email}`);
  }

  let admin = existing;
  if (!admin) {
    const passwordHash = await bcrypt.hash(credentials.password, 12);
    admin = await prisma.user.create({
      data: {
        name: credentials.name,
        email: credentials.email,
        passwordHash,
        role: 'ADMIN',
        adminRole: 'SUPER_ADMIN',
        adminStatus: 'ACTIVE',
        passwordChangedAt: new Date(),
      },
    });
  } else {
    warnings.push('Existing admin account preserved; the seed did not replace its password or access status.');
  }

  const superAdminRole = await prisma.adminRole.findUniqueOrThrow({ where: { key: 'SUPER_ADMIN' } });
  await prisma.adminUserRole.upsert({
    where: { adminUserId_adminRoleId: { adminUserId: admin.id, adminRoleId: superAdminRole.id } },
    update: {},
    create: { adminUserId: admin.id, adminRoleId: superAdminRole.id },
  });
  return admin;
}

async function seedTaxonomy(prisma: PrismaClient) {
  for (const [slug, nameEn, nameAr, descriptionAr] of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        nameEn,
        nameAr,
        descriptionAr,
        sortOrder: CATEGORIES.findIndex((row) => row[0] === slug) + 1,
        status: 'PUBLISHED',
        metaTitleAr: `${nameAr} الأصلية في العراق | ScentIQ`,
        metaDescriptionAr: `${descriptionAr} اكتشف التفاصيل والأسعار وخيارات التوصيل داخل العراق.`,
      },
    });
  }
  for (const [slug, name, nameAr, originCountry] of BRANDS) {
    await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name,
        nameAr,
        originCountry,
        characteristics: [],
        searchAliases: [name, nameAr, ...(slug === 'lattafa' ? ['Latafa', 'لطافه'] : [])],
        status: 'PUBLISHED',
        descriptionAr: `صفحة ${nameAr} جاهزة لإضافة وصف موثّق وأصول إعلامية معتمدة من الإدارة.`,
        descriptionEn: `${name} catalog structure. Add verified business copy and approved media before launch.`,
        metaTitleAr: `عطور ${nameAr} الأصلية | ScentIQ العراق`,
        metaDescriptionAr: `استكشف عطور ${nameAr} بعد إضافة المنتجات والمعلومات الموثّقة من إدارة ScentIQ.`,
      },
    });
  }
  for (const [slug, nameEn, nameAr, category] of NOTES) {
    await prisma.note.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        nameEn,
        nameAr,
        category,
        descriptionAr: `نوتة ${nameAr} ضمن قاعدة نوتات ScentIQ للمقارنة والبحث الذكي.`,
        descriptionEn: `${nameEn} fragrance note for catalog filters and recommendations.`,
      },
    });
  }
  for (const [slug, name, nameAr, type] of TAGS) {
    await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name,
        nameEn: name,
        nameAr,
        type,
        descriptionAr: `وسم ${nameAr} للتنظيم والتوصيات؛ لا يُعرض دون بيانات حقيقية داعمة.`,
      },
    });
  }
  for (const [slug, name, nameAr, type] of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name,
        nameAr,
        type,
        status: 'DRAFT',
        sortOrder: COLLECTIONS.findIndex((row) => row[0] === slug) + 1,
        shortDescriptionAr: `مجموعة ${nameAr} جاهزة لإضافة منتجات حقيقية ومراجعتها قبل النشر.`,
        shortDescription: `${name} is ready for a verified product selection before publishing.`,
        metaTitleAr: `${nameAr} | أفضل الاختيارات من ScentIQ`,
        metaDescriptionAr: `استكشف ${nameAr} بعد مراجعة المنتجات والمعلومات من إدارة ScentIQ.`,
      },
    });
  }
}

async function seedDelivery(prisma: PrismaClient) {
  const companies = [
    ['seed-swift-iraq', 'Local Delivery Company 1', '2-4 days'],
    ['seed-golden-express', 'Local Delivery Company 2', '2-5 days'],
    ['seed-local-delivery-3', 'Local Delivery Company 3', '3-6 days'],
  ] as const;
  for (const [id, name, estimatedDays] of companies) {
    await prisma.deliveryCompany.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name,
        estimatedDays,
        supportedCities: IRAQI_CITIES,
        status: 'DISABLED',
        notes:
          'Configurable placeholder. Confirm the real provider, contract, service areas, and fees before activation.',
      },
    });
  }
}

async function seedSettings(prisma: PrismaClient) {
  const settings = [
    ['site.identity', 'site_identity', { name: 'ScentIQ', tagline: 'Your scent, powered by IQ.', market: 'Iraq' }],
    ['site.languages', 'languages', { primary: 'ar', secondary: 'en', enabled: ['ar', 'en'], rtl: true }],
    ['commerce.currency', 'commerce', { code: 'IQD', decimals: 0 }],
    ['theme.default', 'theme', { name: 'Luxury Dark', primary: '#0A0A09', accent: '#C89A3E' }],
    [
      'features.storefront',
      'features',
      { wishlist: true, reviews: true, smartRecommendations: true, collections: true, cashOnDelivery: true, isr: true },
    ],
    [
      'delivery.defaults',
      'delivery',
      { baghdadFee: 5000, otherGovernoratesFee: 7000, currency: 'IQD', placeholder: true },
    ],
    ['delivery.freeThreshold', 'delivery', 150000],
    ['store.launch', 'launch', { status: 'SETUP', indexable: false, publishedAt: null }],
    [
      'store.maintenance',
      'operations',
      {
        mode: 'OFF',
        messageAr: 'نجري تحديثات بسيطة على ScentIQ. نرجع قريبًا، وشكرًا لصبرك.',
        messageEn: 'ScentIQ is receiving a short update. We will be back soon. Thank you for your patience.',
        updatedAt: null,
      },
    ],
    [
      'setup.checklist',
      'setup',
      {
        logo: false,
        delivery: false,
        products: false,
        productMedia: false,
        homepage: false,
        seo: false,
        settings: false,
        checkout: false,
        inventory: false,
        publish: false,
      },
    ],
    [
      'seo.defaults',
      'seo',
      {
        locale: 'ar_IQ',
        indexPublicCatalog: false,
        ogTitle: 'ScentIQ — Your scent, powered by IQ.',
        ogImage: '/placeholders/open-graph.svg',
      },
    ],
    ['seo.home.titleAr', 'seo', 'متجر عطور أصلية في العراق | ScentIQ'],
    ['seo.home.titleEn', 'seo', 'Original Perfumes in Iraq | ScentIQ'],
    [
      'seo.home.descriptionAr',
      'seo',
      'ScentIQ منصة عطور ذكية تساعدك على اكتشاف وشراء العطر المناسب مع الدفع عند الاستلام والتوصيل داخل العراق.',
    ],
    [
      'seo.home.descriptionEn',
      'seo',
      'Discover carefully selected perfumes with smart recommendations, cash on delivery, and delivery across Iraq.',
    ],
    ['seo.home.keywords', 'seo', 'عطور أصلية, عطور في العراق, الدفع عند الاستلام, ScentIQ'],
    ['seo.home.ogImage', 'seo', '/placeholders/open-graph.svg'],
  ] as const;
  for (const [key, group, value] of settings) {
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, group, value } });
  }

  const templates = [
    [
      'PRODUCT',
      '{productName} الأصلي من {brandName} | السعر والشراء في العراق',
      'اشتري {productName} الأصلي من {brandName} عبر ScentIQ مع الدفع عند الاستلام والتوصيل داخل العراق. اكتشف النوتات، الثبات، الفوحان، والتقييمات.',
    ],
    [
      'BRAND',
      'عطور {brandName} الأصلية | تسوق أشهر الإصدارات في العراق',
      'استكشف عطور {brandName} المتوفرة عبر ScentIQ بعد التحقق من معلومات المنتج والتوفر.',
    ],
    [
      'COLLECTION',
      '{collectionName} | أفضل الاختيارات من ScentIQ',
      'استكشف {collectionName} واختَر عطرك حسب النوتات والأداء والمناسبة.',
    ],
    [
      'CATEGORY',
      '{categoryName} | تسوق العطور في العراق',
      'اكتشف {categoryName} مع معلومات واضحة وخيارات دفع وتوصيل داخل العراق.',
    ],
    [
      'NOTE',
      'عطور بنوتة {noteName} | ScentIQ',
      'اكتشف العطور التي تحتوي على نوتة {noteName} وقارن الثبات والفوحان والاستخدام المناسب.',
    ],
  ] as const;
  for (const [pageType, titleTemplateAr, descriptionTemplateAr] of templates) {
    await prisma.seoTemplate.upsert({
      where: { pageType },
      update: {},
      create: { pageType, titleTemplateAr, descriptionTemplateAr },
    });
  }

  for (const [id, type, titleAr, titleEn, sortOrder] of HOMEPAGE_SECTIONS) {
    await prisma.homepageSection.upsert({
      where: { id },
      update: {},
      create: {
        id,
        type,
        titleAr,
        titleEn,
        sortOrder,
        enabled: true,
        config:
          type === 'FEATURE_HIGHLIGHTS'
            ? {
                items: [
                  { titleAr: 'عطور أصلية', titleEn: 'Authentic perfumes' },
                  { titleAr: 'الدفع عند الاستلام', titleEn: 'Cash on delivery' },
                  { titleAr: 'توصيل داخل العراق', titleEn: 'Delivery across Iraq' },
                  { titleAr: 'توصيات ذكية', titleEn: 'Smart recommendations' },
                ],
              }
            : {},
      },
    });
  }
}

async function seedPlaceholderMedia(prisma: PrismaClient) {
  const placeholders = [
    [
      '89bd47cc-1a26-4c76-8c59-23f6867c6101',
      'Product placeholder',
      'product-placeholder.svg',
      '/placeholders/product.svg',
      'IMAGE',
    ],
    [
      '89bd47cc-1a26-4c76-8c59-23f6867c6102',
      'Brand logo placeholder',
      'brand-logo-placeholder.svg',
      '/placeholders/brand-logo.svg',
      'LOGO',
    ],
    [
      '89bd47cc-1a26-4c76-8c59-23f6867c6103',
      'Brand banner placeholder',
      'brand-banner-placeholder.svg',
      '/placeholders/brand-banner.svg',
      'BANNER',
    ],
    [
      '89bd47cc-1a26-4c76-8c59-23f6867c6104',
      'Collection placeholder',
      'collection-placeholder.svg',
      '/placeholders/collection.svg',
      'BANNER',
    ],
    [
      '89bd47cc-1a26-4c76-8c59-23f6867c6105',
      'Category placeholder',
      'category-placeholder.svg',
      '/placeholders/category.svg',
      'IMAGE',
    ],
    [
      '89bd47cc-1a26-4c76-8c59-23f6867c6106',
      'Open Graph placeholder',
      'open-graph-placeholder.svg',
      '/placeholders/open-graph.svg',
      'BANNER',
    ],
  ] as const;
  for (const [id, name, fileName, url, type] of placeholders) {
    await prisma.media.upsert({
      where: { contentHash: `scentiq-step23-${fileName}` },
      update: {},
      create: {
        id,
        name,
        fileName,
        originalName: fileName,
        url,
        type,
        mimeType: 'image/svg+xml',
        folder: 'seed-placeholders',
        contentHash: `scentiq-step23-${fileName}`,
        altText: `${name} — replace with approved media before launch`,
      },
    });
  }
}

async function seedQaFramework(prisma: PrismaClient) {
  for (const check of QA_CHECK_DEFINITIONS) {
    await prisma.qaCheck.upsert({
      where: { key: check.key },
      update: {
        category: check.category,
        title: check.title,
        description: check.description,
        critical: check.critical ?? false,
        weight: check.weight ?? 1,
      },
      create: {
        key: check.key,
        category: check.category,
        title: check.title,
        description: check.description,
        critical: check.critical ?? false,
        weight: check.weight ?? 1,
      },
    });
  }
  for (const area of LAUNCH_APPROVAL_AREAS) {
    await prisma.launchApproval.upsert({
      where: { area: area.key },
      update: {},
      create: { area: area.key },
    });
  }
}

export async function prepareSeed(prisma: PrismaClient): Promise<SeedContext> {
  const mode = resolveSeedMode();
  const environment = (process.env.SCENTIQ_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development').toLowerCase();
  if (environment === 'production' && mode !== 'production') {
    throw new Error(`Seed mode “${mode}” is blocked because SCENTIQ_ENVIRONMENT is production.`);
  }
  if (mode === 'production' && process.env.SEED_PRODUCTION_CONFIRM !== PRODUCTION_CONFIRMATION) {
    throw new Error(
      `Production seed blocked. Set SEED_PRODUCTION_CONFIRM=${PRODUCTION_CONFIRMATION} after verifying the target database and backup.`
    );
  }
  if (mode === 'production') {
    const configured = [
      process.env.SEED_ADMIN_NAME,
      process.env.SEED_ADMIN_EMAIL,
      process.env.SEED_ADMIN_PASSWORD,
    ].every((value) => Boolean(value?.trim()));
    if (!configured) {
      const existing = await prisma.user.count({
        where: { role: 'ADMIN', adminRole: 'SUPER_ADMIN', adminStatus: 'ACTIVE' },
      });
      if (!existing)
        throw new Error(
          'Production preflight failed: configure SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD for the first Super Admin.'
        );
    }
  }
  const warnings: string[] = [];
  await seedRoles(prisma);
  const admin = await seedAdmin(prisma, mode, warnings);
  await seedTaxonomy(prisma);
  await seedDelivery(prisma);
  await seedSettings(prisma);
  await seedPlaceholderMedia(prisma);
  await seedQaFramework(prisma);
  return {
    mode,
    includeDemoCatalog: ['dev', 'staging', 'demo', 'products'].includes(mode),
    includeDemoActivity: ['dev', 'staging', 'demo'].includes(mode),
    admin,
    warnings,
  };
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>();
  return [...new Set(values.filter((value) => seen.has(value) || !seen.add(value)))];
}

export async function validateSeed(prisma: PrismaClient, context: SeedContext): Promise<SeedValidation> {
  const [
    admins,
    roles,
    permissions,
    categories,
    brands,
    notes,
    tags,
    collections,
    products,
    settings,
    deliveryCompanies,
    homepageSections,
    seoTemplates,
    qaChecks,
    launchApprovals,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'ADMIN', adminRole: 'SUPER_ADMIN', adminStatus: 'ACTIVE' } }),
    prisma.adminRole.count(),
    prisma.permission.count(),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.note.count(),
    prisma.tag.count(),
    prisma.collection.count(),
    prisma.perfume.count(),
    prisma.siteSetting.count(),
    prisma.deliveryCompany.count(),
    prisma.homepageSection.count(),
    prisma.seoTemplate.count(),
    prisma.qaCheck.count(),
    prisma.launchApproval.count(),
  ]);
  const counts = {
    admins,
    roles,
    permissions,
    categories,
    brands,
    notes,
    tags,
    collections,
    products,
    settings,
    deliveryCompanies,
    homepageSections,
    seoTemplates,
    qaChecks,
    launchApprovals,
  };
  const errors: string[] = [];
  const warnings = [...context.warnings];
  if (!admins) errors.push('No active Super Admin exists.');
  if (roles < 8) errors.push(`Expected 8 roles; found ${roles}.`);
  if (permissions < ADMIN_PERMISSIONS.length)
    errors.push(`Expected ${ADMIN_PERMISSIONS.length} permissions; found ${permissions}.`);
  if (!categories || !notes || !tags || !settings || !homepageSections || !seoTemplates)
    errors.push('One or more required core datasets are empty.');
  if (qaChecks < QA_CHECK_DEFINITIONS.length)
    errors.push(`Expected ${QA_CHECK_DEFINITIONS.length} QA checks; found ${qaChecks}.`);
  if (launchApprovals !== LAUNCH_APPROVAL_AREAS.length)
    errors.push(`Expected ${LAUNCH_APPROVAL_AREAS.length} launch approval areas; found ${launchApprovals}.`);

  const [productKeys, categoryKeys, brandKeys] = await Promise.all([
    prisma.perfume.findMany({ select: { slug: true, sku: true, categoryId: true } }),
    prisma.category.findMany({ select: { slug: true } }),
    prisma.brand.findMany({ select: { slug: true } }),
  ]);
  const duplicateSlugs = [
    ...duplicateValues(productKeys.map((row) => row.slug)),
    ...duplicateValues(categoryKeys.map((row) => row.slug)),
    ...duplicateValues(brandKeys.map((row) => row.slug)),
  ];
  const duplicateSkus = duplicateValues(productKeys.map((row) => row.sku));
  if (duplicateSlugs.length) errors.push(`Duplicate slugs within a catalog entity: ${duplicateSlugs.join(', ')}`);
  if (duplicateSkus.length) errors.push(`Duplicate product SKUs: ${duplicateSkus.join(', ')}`);
  const uncategorized = productKeys.filter((product) => !product.categoryId).length;
  if (uncategorized) warnings.push(`${uncategorized} product(s) have no category.`);
  if (context.includeDemoCatalog && products === 0) errors.push('Demo catalog mode completed without products.');
  return { errors, warnings, counts };
}

export function printSeedReport(context: SeedContext, validation: SeedValidation) {
  const countRows = Object.entries(validation.counts).map(([label, value]) => `  ${label.padEnd(20)} ${value}`);
  console.log(`\nScentIQ seed report — ${context.mode.toUpperCase()}`);
  console.log('----------------------------------------');
  console.log(countRows.join('\n'));
  if (validation.warnings.length) {
    console.log('\nWarnings');
    for (const warning of validation.warnings) console.log(`  - ${warning}`);
  }
  if (validation.errors.length) {
    console.log('\nErrors');
    for (const error of validation.errors) console.log(`  - ${error}`);
  }
  console.log('\nNext steps');
  console.log('  - Sign in to Perfume Studio and complete /studio/setup.');
  console.log('  - Verify delivery fees, store identity, SEO, products, stock, and approved media.');
  console.log('  - Keep the store in SETUP or PREVIEW until real catalog data is approved.');
  if (validation.errors.length) throw new Error(`Seed validation failed with ${validation.errors.length} error(s).`);
}
