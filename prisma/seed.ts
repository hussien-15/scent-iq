import { PrismaClient } from '@prisma/client';
import { prepareSeed, printSeedReport, validateSeed } from './seed-system';

type NoteTier = 'TOP' | 'HEART' | 'BASE';
type Gender = 'MASCULINE' | 'FEMININE' | 'UNISEX';
type Rating = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

const prisma = new PrismaClient();

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// English note name -> [Arabic name, fragrance-family category]
const NOTE_LIBRARY: Record<string, [string, string]> = {
  'Bergamot': ['برغموت', 'citrus'],
  'Pink Pepper': ['فلفل وردي', 'spicy'],
  'Rose': ['ورد', 'floral'],
  'Saffron': ['زعفران', 'spicy'],
  'Amber': ['عنبر', 'amber'],
  'Vanilla': ['فانيليا', 'sweet'],
  'Sandalwood': ['خشب الصندل', 'woody'],
  'Fig Leaf': ['ورقة تين', 'green'],
  'Jasmine': ['ياسمين', 'floral'],
  'Orange Blossom': ['زهر البرتقال', 'floral'],
  'Cedar': ['أرز', 'woody'],
  'Musk': ['مسك', 'musky'],
  'Sea Salt': ['ملح البحر', 'aquatic'],
  'Citrus': ['حمضيات', 'citrus'],
  'White Tea': ['شاي أبيض', 'green'],
  'Iris': ['سوسن', 'powdery'],
  'Driftwood': ['خشب الطفو', 'woody'],
  'Black Pepper': ['فلفل أسود', 'spicy'],
  'Grapefruit': ['غريبفروت', 'citrus'],
  'Vetiver': ['فيتيفر', 'woody'],
  'Violet Leaf': ['ورقة البنفسج', 'green'],
  'Smoked Wood': ['خشب مدخن', 'woody'],
  'Tonka Bean': ['حبة تونكا', 'sweet'],
  'Cardamom': ['هيل', 'spicy'],
  'Oud': ['عود', 'woody'],
  'Agarwood': ['خشب العود', 'woody'],
  'Leather': ['جلد', 'leather'],
  'Raspberry': ['توت العليق', 'fruity'],
  'Patchouli': ['باتشولي', 'woody'],
  'Dark Chocolate': ['شوكولاتة داكنة', 'sweet'],
};

async function seedDemoBusinessActivity() {
  const products = await prisma.perfume.findMany({
    where: { sku: { in: ['MV-VA-001', 'MV-GF-002', 'NA-LH-003', 'NA-SV-004', 'AO-MO-005', 'AO-RN-006'] } },
    take: 3,
    orderBy: { sku: 'asc' },
    include: { brand: { select: { name: true } } },
  });
  if (products.length < 3) return;

  const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'] as const;
  for (const [index, status] of statuses.entries()) {
    const product = products[index % products.length];
    const phone = `+964770001${String(index).padStart(4, '0')}`;
    const customer = await prisma.customer.upsert({
      where: { phone },
      update: {},
      create: {
        name: `TEST Customer ${index + 1}`,
        phone,
        city: index % 2 === 0 ? 'Baghdad' : 'Basra',
        area: 'TEST AREA',
        address: 'TEST DATA — not a real address',
        notes: 'Development fixture. Never copy to production.',
      },
    });
    const subtotal = Number(product.price);
    const delivered = status === 'DELIVERED';
    await prisma.order.upsert({
      where: { orderNumber: `SIQ-DEMO-${String(index + 1).padStart(4, '0')}` },
      update: {},
      create: {
        orderNumber: `SIQ-DEMO-${String(index + 1).padStart(4, '0')}`,
        submissionId: `step23-demo-order-${index + 1}`,
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        customerNameSnapshot: customer.name,
        customerPhoneSnapshot: customer.phone,
        city: customer.city,
        area: customer.area,
        address: customer.address,
        internalNotes: 'TEST DATA — seeded development order',
        subtotal,
        deliveryFee: 5000,
        total: subtotal + 5000,
        currency: 'IQD',
        status,
        inventoryState: delivered || ['SHIPPED', 'RETURNED'].includes(status) ? 'DEDUCTED' : status === 'CANCELLED' ? 'RELEASED' : 'RESERVED',
        deliveredAt: delivered ? new Date() : null,
        cancelledAt: status === 'CANCELLED' ? new Date() : null,
        items: { create: {
          perfumeId: product.id,
          quantity: 1,
          price: product.price,
          subtotal: product.price,
          productNameSnapshot: product.nameEn,
          brandNameSnapshot: product.brand.name,
          skuSnapshot: product.sku,
        } },
        statusHistory: { create: { newStatus: status, note: 'TEST DATA — seeded status' } },
      },
    });
  }

  const demoCustomers = await prisma.customer.findMany({ where: { notes: { contains: 'Development fixture' } } });
  for (const customer of demoCustomers) {
    const orders = await prisma.order.findMany({ where: { customerId: customer.id } });
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        orderCount: orders.length,
        totalSpending: orders.filter((order) => order.status === 'DELIVERED').reduce((sum, order) => sum + Number(order.total), 0),
      },
    });
  }

  const searches = [
    ['Lattafa', 6], ['Khamrah', 3], ['عود', 4], ['فانيلا', 5], ['عطر شتوي', 3], ['عطر رجالي قوي', 0],
  ] as const;
  for (const [keyword, resultsCount] of searches) {
    const sessionId = `step23-demo-search-${keyword}`;
    const exists = await prisma.searchLog.findFirst({ where: { sessionId, keyword } });
    if (!exists) await prisma.searchLog.create({
      data: { keyword, normalizedKeyword: keyword.toLowerCase(), sessionId, language: /[\u0600-\u06ff]/.test(keyword) ? 'ar' : 'en', resultsCount },
    });
  }

  const events = ['PRODUCT_VIEW', 'BRAND_VIEW', 'COLLECTION_VIEW', 'ADD_TO_CART', 'CHECKOUT_STARTED', 'ORDER_CREATED', 'WISHLIST_ADD', 'RECOMMENDATION_CLICK'] as const;
  for (const [index, eventType] of events.entries()) {
    const sessionId = `step23-demo-analytics-${index}`;
    const exists = await prisma.analyticsEvent.findFirst({ where: { sessionId, eventType } });
    if (!exists) await prisma.analyticsEvent.create({
      data: { eventType, sessionId, perfumeId: products[index % products.length].id, pathname: '/en/product/demo', metadata: { testData: true } },
    });
  }

  const recommendation = await prisma.recommendationLog.findFirst({ where: { sessionId: 'step23-demo-recommendation' } });
  if (!recommendation) await prisma.recommendationLog.create({
    data: {
      sessionId: 'step23-demo-recommendation',
      sourceProductId: products[0].id,
      recommendedProductId: products[1].id,
      blockType: 'SIMILAR_FRAGRANCES',
      action: 'IMPRESSION',
    },
  });
}

async function main() {
  const seed = await prepareSeed(prisma);
  if (!seed.includeDemoCatalog) {
    printSeedReport(seed, await validateSeed(prisma, seed));
    return;
  }

  const verlaine = await prisma.brand.upsert({
    where: { slug: 'maison-verlaine' },
    update: {},
    create: {
      name: 'Maison Verlaine',
      nameAr: 'ميزون فيرلين',
      slug: 'maison-verlaine',
      originCountry: 'France',
      headquarters: 'Paris, France',
      industry: 'Niche Perfumery',
      foundedYear: 1998,
      isFeatured: true,
      characteristics: ['Luxury', 'French', 'Designer', 'Classic'],
      signatureStyleEn: 'Known for restrained, note-driven compositions built around a handful of ingredients.',
      signatureStyleAr: 'معروفة بتركيبات مقتصدة تتمحور حول عدد قليل من المكونات.',
      descriptionEn: 'A Parisian fragrance house specializing in restrained, note-driven perfumery.',
      descriptionAr: 'دار عطور باريسية متخصصة بعطور مقتصدة تتمحور حول النوتات.',
      story:
        'A Parisian house founded on the belief that a scent should read like a short poem — a handful of notes, nothing wasted.',
      storyAr:
        'دار عطور باريسية تأسست على قناعة إن العطر لازم يُقرأ متل قصيدة قصيرة — حفنة نوتات، بدون أي إهدار.',
    },
  });

  const nordAsh = await prisma.brand.upsert({
    where: { slug: 'nord-and-ash' },
    update: {},
    create: {
      name: 'Nord & Ash',
      nameAr: 'نورد آند آش',
      slug: 'nord-and-ash',
      originCountry: 'Sweden',
      headquarters: 'Stockholm, Sweden',
      industry: 'Niche Perfumery',
      foundedYear: 2015,
      isFeatured: false,
      characteristics: ['Niche', 'Modern', 'Minimalist', 'Fresh'],
      signatureStyleEn: 'Famous for cold, clean fresh fragrances built around air and water rather than florals.',
      signatureStyleAr: 'معروفة بعطورها الباردة والنظيفة المبنية على الهواء والماء بدل الزهور.',
      descriptionEn: 'Scandinavian-minimalist niche house built around restraint and cold, clean air.',
      descriptionAr: 'دار عطور إسكندنافية بأسلوب أقلّي، مبنية على التقشف وهواء بارد ونظيف.',
      story:
        'Scandinavian minimalism applied to fragrance: cold air, pale wood, and restraint used as a luxury in itself.',
      storyAr:
        'بساطة إسكندنافية مطبقة على عالم العطور: هواء بارد، خشب فاتح، وتقشف يُستخدم كنوع من الفخامة بحد ذاته.',
    },
  });

  const alhambra = await prisma.brand.upsert({
    where: { slug: 'alhambra-oud' },
    update: {},
    create: {
      name: 'Alhambra Oud',
      nameAr: 'عود الحمراء',
      slug: 'alhambra-oud',
      originCountry: 'United Arab Emirates',
      headquarters: 'Dubai, UAE',
      industry: 'Oud & Attar Perfumery',
      foundedYear: 2008,
      isFeatured: true,
      characteristics: ['Luxury', 'Arabic', 'Traditional', 'Premium'],
      signatureStyleEn: 'Creates luxurious, long-lasting oud compositions rooted in Gulf perfumery tradition.',
      signatureStyleAr: 'تصنع تركيبات عود فاخرة وطويلة الثبات متجذرة بتقاليد العطارة الخليجية.',
      descriptionEn: 'A house dedicated entirely to oud, sourced and blended in the Gulf tradition.',
      descriptionAr: 'دار عطور مكرّسة بالكامل للعود، تُستخرج وتُمزج على الطريقة الخليجية.',
      story:
        'A house dedicated to oud in its many moods — smoked, sweetened, or left raw — rooted in centuries of Middle Eastern perfumery.',
      storyAr:
        'دار عطور مكرّسة للعود بكل أطواره — مُدخّن، مُحلّى، أو ترك خام — متجذرة بقرون من عطارة الشرق الأوسط.',
    },
  });

  const categories = {
    luxury: await prisma.category.upsert({
      where: { slug: 'luxury' },
      update: {},
      create: { nameEn: 'Luxury', nameAr: 'فخامة', slug: 'luxury' },
    }),
    designer: await prisma.category.upsert({
      where: { slug: 'designer' },
      update: {},
      create: { nameEn: 'Designer', nameAr: 'تصميم راقي', slug: 'designer' },
    }),
    niche: await prisma.category.upsert({
      where: { slug: 'niche' },
      update: {},
      create: { nameEn: 'Niche', nameAr: 'نيش', slug: 'niche' },
    }),
  };

  const perfumesData = [
    {
      sku: 'MV-VA-001',
      nameEn: 'Velvet Amber',
      nameAr: 'عنبر مخملي',
      slug: 'velvet-amber',
      brandId: verlaine.id,
      brandLabel: 'Maison Verlaine',
      categoryId: categories.luxury.id,
      shortDescriptionEn: 'A warm amber built around saffron and vanilla.',
      shortDescriptionAr: 'عنبر دافئ محوره الزعفران والفانيليا.',
      storyEn:
        "There's a version of you that comes out after dark — unhurried, sure of itself, impossible to ignore without being loud about it. Velvet Amber is built for her. Wear it on the nights that matter, when a room should notice you arrived before you've said a word.",
      storyAr:
        'فيك نسخة تطلع بعد ما يغيب الضوء — واثقة، غير مستعجلة، تلفت الانتباه بدون ما تصرخ. عنبر مخملي مصمم لهذي النسخة. البسيه بالليالي اللي تستاهل، لما تريد الغرفة تحس بوصولك قبل لا تحچي كلمة.',
      descriptionEn:
        'A warm amber built around saffron and vanilla, softened with sandalwood for a scent that feels like candlelight.',
      descriptionAr:
        'عنبر دافئ يتمحور حول الزعفران والفانيليا، ملطّف بخشب الصندل ليمنحك إحساسًا يشبه ضوء الشموع.',
      costPrice: 75.0,
      price: 185.0,
      oldPrice: 210.0,
      discountPercent: 12,
      stock: 42,
      lowStockThreshold: 10,
      bottleSize: '50ml',
      releaseYear: 2023,
      countryOfOrigin: 'France',
      concentration: 'EDP',
      gender: 'UNISEX' as Gender,
      scentFamilies: ['oriental', 'amber'],
      notes: { top: ['Bergamot', 'Pink Pepper'], heart: ['Rose', 'Saffron'], base: ['Amber', 'Vanilla', 'Sandalwood'] },
      longevity: 'HIGH' as Rating,
      projection: 'MODERATE' as Rating,
      sillage: 'MODERATE' as Rating,
      season: ['autumn', 'winter'],
      occasion: ['date', 'formal', 'night'],
      style: ['elegant', 'luxury', 'dark'],
      mood: ['confident', 'romantic'],
      keywords: ['amber perfume', 'saffron fragrance', 'vanilla perfume'],
    },
    {
      sku: 'MV-GF-002',
      nameEn: 'Golden Fig',
      nameAr: 'تين ذهبي',
      slug: 'golden-fig',
      brandId: verlaine.id,
      brandLabel: 'Maison Verlaine',
      categoryId: categories.designer.id,
      shortDescriptionEn: 'Green fig leaf and orange blossom over quiet cedar.',
      shortDescriptionAr: 'تين أخضر وزهر برتقال فوق أرزة هادئة.',
      storyEn:
        "Golden Fig is a Tuesday morning done right — sunlight through the kitchen window, nothing to prove. It's the scent equivalent of a well-made cup of coffee: quietly good, every single day, never asking to be the main event.",
      storyAr:
        'تين ذهبي متل صباح يوم عادي بس مرتب زين — ضوء الشمس من شباك المطبخ، بدون أي شي تثبته. هو بمعنى العطر شبيه بفنجان قهوة محضّر زين: حلو بهدوء، كل يوم، وما يطلب يكون هو محور الاهتمام.',
      descriptionEn:
        'Green fig leaf and orange blossom over a quiet cedar base — a fresh floral for daylight hours.',
      descriptionAr:
        'أوراق تين خضراء وزهر برتقال فوق قاعدة أرز هادئة — عطر زهري منعش لساعات النهار.',
      costPrice: 62.0,
      price: 155.0,
      oldPrice: null,
      discountPercent: null,
      stock: 30,
      lowStockThreshold: 8,
      bottleSize: '50ml',
      releaseYear: 2022,
      countryOfOrigin: 'France',
      concentration: 'EDT',
      gender: 'FEMININE' as Gender,
      scentFamilies: ['fresh', 'floral'],
      notes: { top: ['Fig Leaf', 'Bergamot'], heart: ['Jasmine', 'Orange Blossom'], base: ['Cedar', 'Musk'] },
      longevity: 'MODERATE' as Rating,
      projection: 'MODERATE' as Rating,
      sillage: 'LOW' as Rating,
      season: ['spring', 'summer'],
      occasion: ['daily', 'office', 'casual'],
      style: ['fresh', 'elegant'],
      mood: ['calm'],
      keywords: ['fig perfume', 'fresh floral fragrance'],
    },
    {
      sku: 'NA-LH-003',
      nameEn: 'Linen Hour',
      nameAr: 'ساعة الكتان',
      slug: 'linen-hour',
      brandId: nordAsh.id,
      brandLabel: 'Nord & Ash',
      categoryId: categories.designer.id,
      shortDescriptionEn: 'Sea salt and citrus over white tea and driftwood.',
      shortDescriptionAr: 'ملح البحر والحمضيات فوق الشاي الأبيض وخشب الطفو.',
      storyEn:
        'Linen Hour smells like the twenty minutes after a swim — skin still cool, salt still on it, nothing urgent left to do. Wear it when the plan is to have no plan.',
      storyAr:
        'ساعة الكتان ريحتها متل العشرين دقيقة بعد السباحة — الجلد بارد وياه ملح البحر، وما اكو شي مستعجل تسويه. البسيه لما تكون الخطة إنك ما عندك خطة.',
      descriptionEn:
        'Sea salt and citrus over white tea and driftwood — the smell of a cold morning by the water.',
      descriptionAr:
        'ملح البحر والحمضيات فوق الشاي الأبيض وخشب الطفو — رائحة صباح بارد قرب الماء.',
      costPrice: 56.0,
      price: 140.0,
      oldPrice: null,
      discountPercent: null,
      stock: 55,
      lowStockThreshold: 12,
      bottleSize: '100ml',
      releaseYear: 2024,
      countryOfOrigin: 'Sweden',
      concentration: 'EDT',
      gender: 'UNISEX' as Gender,
      scentFamilies: ['fresh', 'aquatic'],
      notes: { top: ['Sea Salt', 'Citrus'], heart: ['White Tea', 'Iris'], base: ['Musk', 'Driftwood'] },
      longevity: 'LOW' as Rating,
      projection: 'LOW' as Rating,
      sillage: 'LOW' as Rating,
      season: ['spring', 'summer'],
      occasion: ['daily', 'travel', 'casual'],
      style: ['fresh', 'modern'],
      mood: ['calm'],
      keywords: ['aquatic perfume', 'fresh unisex fragrance'],
    },
    {
      sku: 'NA-SV-004',
      nameEn: 'Smoked Vetiver',
      nameAr: 'فيتيفر مدخن',
      slug: 'smoked-vetiver',
      brandId: nordAsh.id,
      brandLabel: 'Nord & Ash',
      categoryId: categories.niche.id,
      shortDescriptionEn: 'Peppery grapefruit over dry vetiver and smoked wood.',
      shortDescriptionAr: 'غريبفروت فلفلي فوق فيتيفر جاف وخشب مدخن.',
      storyEn:
        "Some scents ask permission. Smoked Vetiver doesn't. It's dry, a little defiant, built for the kind of evening where you'd rather be underestimated for five minutes than overexplained for one.",
      storyAr:
        'أكو عطور تطلب الإذن قبل لا تحچي. فيتيفر مدخن مو منها. جاف، فيه تحدي بسيط، مصمم لأمسية تفضّل فيها يستهون بيك خمس دقايق على إنك تشرح نفسك دقيقة وحدة.',
      descriptionEn:
        'Peppery grapefruit gives way to dry vetiver and smoked wood — built for cold evenings.',
      descriptionAr:
        'غريبفروت فلفلي يفسح المجال لفيتيفر جاف وخشب مدخن — مصمم لأمسيات الشتاء الباردة.',
      costPrice: 66.0,
      price: 165.0,
      oldPrice: null,
      discountPercent: null,
      stock: 8,
      lowStockThreshold: 10,
      bottleSize: '50ml',
      releaseYear: 2024,
      countryOfOrigin: 'Sweden',
      concentration: 'EDP',
      gender: 'MASCULINE' as Gender,
      scentFamilies: ['woody', 'smoky'],
      notes: { top: ['Black Pepper', 'Grapefruit'], heart: ['Vetiver', 'Violet Leaf'], base: ['Smoked Wood', 'Tonka Bean'] },
      longevity: 'HIGH' as Rating,
      projection: 'HIGH' as Rating,
      sillage: 'MODERATE' as Rating,
      season: ['autumn', 'winter'],
      occasion: ['office', 'formal', 'night'],
      style: ['dark', 'modern', 'elegant'],
      mood: ['confident', 'bold'],
      keywords: ['vetiver perfume', 'smoky woody fragrance'],
    },
    {
      sku: 'AO-MO-005',
      nameEn: 'Midnight Oud',
      nameAr: 'عود منتصف الليل',
      slug: 'midnight-oud',
      brandId: alhambra.id,
      brandLabel: 'Alhambra Oud',
      categoryId: categories.luxury.id,
      shortDescriptionEn: 'Dense oud wrapped in rose and leather.',
      shortDescriptionAr: 'عود كثيف ملفوف بالورد والجلد.',
      storyEn:
        "Midnight Oud doesn't rush. It's the fragrance equivalent of someone who takes their time answering a question — because the answer is worth getting right. Deep, resinous, built to be remembered after you've left the room.",
      storyAr:
        'عود منتصف الليل ما يستعجل. هو بمعنى العطر شبيه بشخص ياخذ وكته يجاوب على سؤال — لأن الجواب يستاهل يكون مضبوط. عميق وراتنجي، مصمم يبقى بالذاكرة حتى بعد ما تطلع من الغرفة.',
      descriptionEn:
        'A dense, resinous oud wrapped in rose and leather — traditional in spirit, deliberately unhurried.',
      descriptionAr:
        'عود كثيف وراتنجي ملفوف بالورد والجلد — تقليدي بروحه، متعمّد في تأنّيه.',
      costPrice: 110.0,
      price: 240.0,
      oldPrice: null,
      discountPercent: null,
      stock: 18,
      lowStockThreshold: 10,
      bottleSize: '75ml',
      releaseYear: 2021,
      countryOfOrigin: 'United Arab Emirates',
      concentration: 'Parfum',
      gender: 'UNISEX' as Gender,
      scentFamilies: ['woody', 'oud'],
      notes: { top: ['Cardamom', 'Bergamot'], heart: ['Rose', 'Oud'], base: ['Agarwood', 'Leather', 'Amber'] },
      longevity: 'VERY_HIGH' as Rating,
      projection: 'HIGH' as Rating,
      sillage: 'HIGH' as Rating,
      season: ['autumn', 'winter'],
      occasion: ['formal', 'night', 'wedding'],
      style: ['luxury', 'dark', 'classic'],
      mood: ['bold', 'confident'],
      keywords: ['oud perfume', 'luxury fragrance', 'arabic oud'],
    },
    {
      sku: 'AO-RN-006',
      nameEn: 'Rose Noire',
      nameAr: 'الوردة السوداء',
      slug: 'rose-noire',
      brandId: alhambra.id,
      brandLabel: 'Alhambra Oud',
      categoryId: categories.luxury.id,
      shortDescriptionEn: 'Dark rose and patchouli deepened with oud.',
      shortDescriptionAr: 'ورد داكن وباتشولي معمّقان بالعود.',
      storyEn:
        'Rose Noire is a rose that read too much poetry and got a little dangerous about it. Dark, a touch indulgent, worn best on nights when subtlety isn\u2019t really the assignment.',
      storyAr:
        'الوردة السوداء وردة قرت شعر وايد وصارت شوية خطيرة بعدها. داكنة، فيها دلع بسيط، أحلى وكت تلبسها بليالي ما تكون فيها الرصانة هي المطلوب.',
      descriptionEn:
        'Dark rose and patchouli deepened with oud and a trace of chocolate — rich enough for a single note to fill a room.',
      descriptionAr:
        'ورد داكن وباتشولي معمّقان بالعود ولمسة شوكولاتة داكنة — غني لدرجة تكفي فيها نفحة واحدة لملء الغرفة.',
      costPrice: 95.0,
      price: 220.0,
      oldPrice: 245.0,
      discountPercent: 10,
      stock: 21,
      lowStockThreshold: 10,
      bottleSize: '50ml',
      releaseYear: 2023,
      countryOfOrigin: 'United Arab Emirates',
      concentration: 'EDP',
      gender: 'FEMININE' as Gender,
      scentFamilies: ['oriental', 'floral'],
      notes: { top: ['Raspberry', 'Pink Pepper'], heart: ['Rose', 'Patchouli'], base: ['Oud', 'Dark Chocolate', 'Musk'] },
      longevity: 'HIGH' as Rating,
      projection: 'HIGH' as Rating,
      sillage: 'MODERATE' as Rating,
      season: ['autumn', 'winter'],
      occasion: ['date', 'night', 'formal'],
      style: ['luxury', 'dark', 'elegant'],
      mood: ['romantic', 'bold'],
      keywords: ['rose perfume', 'oud floral fragrance'],
    },
  ];

  // 1. Upsert every unique note once, bilingual, with its own family.
  const noteIdByName = new Map<string, string>();
  const allNoteNames = new Set<string>();
  for (const p of perfumesData) {
    [...p.notes.top, ...p.notes.heart, ...p.notes.base].forEach((n) => allNoteNames.add(n));
  }
  for (const nameEn of allNoteNames) {
    const [nameAr, category] = NOTE_LIBRARY[nameEn] ?? [nameEn, null];
    const slug = slugify(nameEn);
    const note = await prisma.note.upsert({
      where: { slug },
      update: {},
      create: { nameEn, nameAr, slug, category: category ?? undefined },
    });
    noteIdByName.set(nameEn, note.id);
  }

  // 2. Upsert each perfume with its full structured data, then link notes.
  for (const p of perfumesData) {
    const perfume = await prisma.perfume.upsert({
      where: { slug: p.slug },
      update: {
        searchAliases: [p.nameEn, p.nameAr, p.slug.replace(/-/g, ' '), ...p.keywords],
      },
      create: {
        sku: p.sku,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        slug: p.slug,
        brandId: p.brandId,
        categoryId: p.categoryId,
        shortDescriptionEn: p.shortDescriptionEn,
        shortDescriptionAr: p.shortDescriptionAr,
        descriptionEn: p.descriptionEn,
        descriptionAr: p.descriptionAr,
        storyEn: p.storyEn,
        storyAr: p.storyAr,
        costPrice: p.costPrice * 1000,
        price: p.price * 1000,
        oldPrice: p.oldPrice == null ? null : p.oldPrice * 1000,
        discountPercent: p.discountPercent,
        currency: 'IQD',
        stock: p.stock,
        availableStock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        availability: 'IN_STOCK',
        inventoryStatus: p.stock <= p.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK',
        bottleSize: p.bottleSize,
        releaseYear: p.releaseYear,
        countryOfOrigin: p.countryOfOrigin,
        concentration: p.concentration,
        gender: p.gender,
        scentFamilies: p.scentFamilies,
        longevity: p.longevity,
        projection: p.projection,
        sillage: p.sillage,
        season: p.season,
        occasion: p.occasion,
        style: p.style,
        mood: p.mood,
        metaTitleEn: `${p.nameEn} by ${p.brandLabel}`,
        metaTitleAr: p.nameAr,
        metaDescriptionEn: p.shortDescriptionEn,
        metaDescriptionAr: p.shortDescriptionAr,
        keywords: p.keywords,
        searchAliases: [p.nameEn, p.nameAr, p.slug.replace(/-/g, ' '), ...p.keywords],
        status: 'PUBLISHED',
      },
    });

    await prisma.media.upsert({
      where: { contentHash: `scentiq-demo-product-${p.slug}` },
      update: {},
      create: {
        name: `${p.nameEn} development placeholder`,
        fileName: `${p.sku}.svg`,
        originalName: `${p.sku}.svg`,
        url: '/placeholders/product.svg',
        altText: `${p.nameEn} development placeholder — replace before launch`,
        altTextAr: `صورة تجريبية لعطر ${p.nameAr} — تُستبدل قبل الإطلاق`,
        type: 'IMAGE',
        isPrimary: true,
        mimeType: 'image/svg+xml',
        folder: 'seed-placeholders',
        contentHash: `scentiq-demo-product-${p.slug}`,
        perfumeId: perfume.id,
      },
    });

    const tiers: { tier: NoteTier; names: string[] }[] = [
      { tier: 'TOP', names: p.notes.top },
      { tier: 'HEART', names: p.notes.heart },
      { tier: 'BASE', names: p.notes.base },
    ];

    for (const { tier, names } of tiers) {
      for (const name of names) {
        const noteId = noteIdByName.get(name)!;
        await prisma.productNote.upsert({
          where: { perfumeId_noteId_tier: { perfumeId: perfume.id, noteId, tier } },
          update: {},
          create: { perfumeId: perfume.id, noteId, tier },
        });
      }
    }
  }

  // 3. A couple of merchandising tags.
  const bestseller = await prisma.tag.upsert({
    where: { slug: 'bestseller' },
    update: {},
    create: { name: 'Bestseller', slug: 'bestseller' },
  });
  const newArrival = await prisma.tag.upsert({
    where: { slug: 'new-arrival' },
    update: {},
    create: { name: 'New Arrival', slug: 'new-arrival' },
  });

  const velvetAmber = await prisma.perfume.findUniqueOrThrow({ where: { slug: 'velvet-amber' } });
  const smokedVetiver = await prisma.perfume.findUniqueOrThrow({ where: { slug: 'smoked-vetiver' } });
  const midnightOud = await prisma.perfume.findUniqueOrThrow({ where: { slug: 'midnight-oud' } });
  const roseNoire = await prisma.perfume.findUniqueOrThrow({ where: { slug: 'rose-noire' } });

  await prisma.productTag.upsert({
    where: { perfumeId_tagId: { perfumeId: velvetAmber.id, tagId: bestseller.id } },
    update: {},
    create: { perfumeId: velvetAmber.id, tagId: bestseller.id },
  });
  await prisma.productTag.upsert({
    where: { perfumeId_tagId: { perfumeId: midnightOud.id, tagId: bestseller.id } },
    update: {},
    create: { perfumeId: midnightOud.id, tagId: bestseller.id },
  });
  await prisma.productTag.upsert({
    where: { perfumeId_tagId: { perfumeId: roseNoire.id, tagId: bestseller.id } },
    update: {},
    create: { perfumeId: roseNoire.id, tagId: bestseller.id },
  });
  await prisma.productTag.upsert({
    where: { perfumeId_tagId: { perfumeId: smokedVetiver.id, tagId: newArrival.id } },
    update: {},
    create: { perfumeId: smokedVetiver.id, tagId: newArrival.id },
  });

  const editorsPick = await prisma.tag.upsert({
    where: { slug: 'editors-pick' },
    update: {},
    create: { name: "Editor's Pick", slug: 'editors-pick' },
  });
  const goldenFig = await prisma.perfume.findUniqueOrThrow({ where: { slug: 'golden-fig' } });
  const linenHour = await prisma.perfume.findUniqueOrThrow({ where: { slug: 'linen-hour' } });

  for (const perfumeId of [goldenFig.id, linenHour.id, midnightOud.id]) {
    await prisma.productTag.upsert({
      where: { perfumeId_tagId: { perfumeId, tagId: editorsPick.id } },
      update: {},
      create: { perfumeId, tagId: editorsPick.id },
    });
  }

  // 4. One curated collection spanning multiple brands.
  const signature = await prisma.collection.upsert({
    where: { slug: 'signature-collection' },
    update: {
      status: 'PUBLISHED',
      featuredOnHomepage: true,
      homepageOrder: 1,
      nameAr: 'مجموعة التواقيع',
      shortDescription: 'House-defining fragrances selected for character, balance, and memorable presence.',
      shortDescriptionAr: 'عطور تمثل هوية دورها، مختارة للطابع المتوازن والحضور اللي ما ينسى.',
    },
    create: {
      name: 'Signature Collection',
      nameAr: 'مجموعة التواقيع',
      slug: 'signature-collection',
      description: 'The house-defining scent from each of our three brands.',
      descriptionAr: 'اختيارات تمثل هوية كل دار عطور وتقدم تجربة مميزة وواضحة.',
      shortDescription: 'House-defining fragrances selected for character, balance, and memorable presence.',
      shortDescriptionAr: 'عطور تمثل هوية دورها، مختارة للطابع المتوازن والحضور اللي ما ينسى.',
      buyingGuide: 'Choose this collection when you want a distinctive signature rather than a safe, forgettable scent. Start with the featured picks, then compare concentration and performance for your routine.',
      buyingGuideAr: 'اختار من هذي المجموعة إذا تريد عطر يعبّر عنك مو مجرد رائحة آمنة. ابدأ بالاختيارات المميزة، وبعدها قارن التركيز والأداء حسب استخدامك.',
      type: 'MANUAL',
      status: 'PUBLISHED',
      featuredOnHomepage: true,
      homepageOrder: 1,
      metaTitleEn: 'Signature Perfume Collection',
      metaTitleAr: 'أفضل عطور التوقيع المميزة',
      metaDescriptionEn: 'Discover distinctive signature perfumes selected for memorable character and reliable performance.',
      metaDescriptionAr: 'اكتشف عطور توقيع مميزة مختارة للحضور القوي والأداء الموثوق مع توصيل داخل العراق.',
      keywords: ['signature perfumes', 'عطور توقيع', 'distinctive fragrances'],
    },
  });

  for (const [position, slug] of ['velvet-amber', 'midnight-oud', 'linen-hour'].entries()) {
    const perfume = await prisma.perfume.findUniqueOrThrow({ where: { slug } });
    await prisma.collectionProduct.upsert({
      where: { perfumeId_collectionId: { perfumeId: perfume.id, collectionId: signature.id } },
      update: { position, pinned: position < 2 },
      create: {
        perfumeId: perfume.id,
        collectionId: signature.id,
        position,
        pinned: position < 2,
        featuredLabelEn: position === 0 ? 'Best Overall' : position === 1 ? 'Best Evening' : null,
        featuredLabelAr: position === 0 ? 'الأفضل بشكل عام' : position === 1 ? 'الأفضل للمساء' : null,
        featuredReasonEn: position === 0 ? 'The most balanced introduction to the collection.' : null,
        featuredReasonAr: position === 0 ? 'أكثر اختيار متوازن كبداية للمجموعة.' : null,
      },
    });
  }

  await prisma.collectionFaq.deleteMany({ where: { collectionId: signature.id } });
  await prisma.collectionFaq.createMany({
    data: [
      {
        collectionId: signature.id,
        position: 0,
        questionEn: 'How do I choose a signature perfume?',
        questionAr: 'شلون أختار عطر التوقيع المناسب إلي؟',
        answerEn: 'Start with the mood and occasions you wear most, then compare longevity, projection, and the notes you naturally enjoy.',
        answerAr: 'ابدأ بالمزاج والمناسبات اللي تستخدم بيها العطر أكثر شي، وبعدها قارن الثبات والانتشار والنوتات اللي تحبها.',
      },
      {
        collectionId: signature.id,
        position: 1,
        questionEn: 'Do you deliver across Iraq?',
        questionAr: 'هل التوصيل متوفر لكل العراق؟',
        answerEn: 'Yes. ScentIQ supports cash on delivery through available Iraqi delivery companies and cities.',
        answerAr: 'إي، ScentIQ يدعم الدفع عند الاستلام والتوصيل حسب الشركات والمدن العراقية المتوفرة.',
      },
    ],
  });

  const winterCollection = await prisma.collection.upsert({
    where: { slug: 'winter-perfumes' },
    update: { status: 'PUBLISHED', featuredOnHomepage: true, homepageOrder: 2 },
    create: {
      name: 'Winter Perfumes',
      nameAr: 'عطور الشتاء',
      slug: 'winter-perfumes',
      shortDescription: 'Warm, deep fragrances selected to perform beautifully in cold weather.',
      shortDescriptionAr: 'عطور دافئة وعميقة مختارة حتى تقدم أداء جميل بالأجواء الباردة.',
      description: 'Winter calls for warmth, depth, and lasting presence. This guide favors amber, oud, woods, spices, and rich sweetness that develop confidently in cooler air.',
      descriptionAr: 'الشتاء يحتاج دفء وعمق وحضور يدوم. هذا الدليل يركز على العنبر والعود والأخشاب والتوابل والحلاوة الغنية اللي تبرز بالأجواء الباردة.',
      buyingGuide: 'For evenings, prioritize high projection and darker notes. For daily winter wear, choose moderate projection with amber, vanilla, or smooth woods.',
      buyingGuideAr: 'للمساء اختار انتشار قوي ونوتات أغمق. وللاستخدام اليومي بالشتاء اختار انتشار متوسط مع العنبر أو الفانيلا أو الأخشاب الناعمة.',
      type: 'DYNAMIC',
      status: 'PUBLISHED',
      rules: { seasons: ['winter'], availability: ['IN_STOCK'] },
      featuredOnHomepage: true,
      homepageOrder: 2,
      metaTitleEn: 'Best Winter Perfumes',
      metaTitleAr: 'أفضل عطور شتوية في العراق',
      metaDescriptionEn: 'Shop warm, long-lasting winter perfumes selected for cold weather, evening wear, and strong performance.',
      metaDescriptionAr: 'تسوق أفضل العطور الشتوية الدافئة والثابتة المختارة للأجواء الباردة والمساء داخل العراق.',
      keywords: ['winter perfumes', 'long lasting perfumes', 'عطور شتوية', 'عطور ثابتة'],
    },
  });

  await prisma.collectionRelation.upsert({
    where: {
      collectionId_relatedCollectionId: {
        collectionId: signature.id,
        relatedCollectionId: winterCollection.id,
      },
    },
    update: { position: 0 },
    create: { collectionId: signature.id, relatedCollectionId: winterCollection.id, position: 0 },
  });
  await prisma.collectionRelation.upsert({
    where: {
      collectionId_relatedCollectionId: {
        collectionId: winterCollection.id,
        relatedCollectionId: signature.id,
      },
    },
    update: { position: 0 },
    create: { collectionId: winterCollection.id, relatedCollectionId: signature.id, position: 0 },
  });

  // Development-only moderation fixtures. They remain pending and visibly
  // marked as test data, so no fake social proof reaches the storefront.
  const reviewsData = [
    {
      email: 'layla.demo@example.com',
      name: 'Layla H.',
      perfumeSlug: 'velvet-amber',
      rating: 5,
      comment: 'Wears exactly like the description promises — warm without being heavy. Gets compliments every time.',
    },
    {
      email: 'ahmed.demo@example.com',
      name: 'Ahmed K.',
      perfumeSlug: 'midnight-oud',
      rating: 5,
      comment: 'Serious oud, not the sweetened kind. Lasted the entire day without reapplying.',
    },
    {
      email: 'noor.demo@example.com',
      name: 'Noor A.',
      perfumeSlug: 'rose-noire',
      rating: 4,
      comment: 'Rich and a little unexpected with the chocolate note. Perfect for winter evenings.',
    },
  ];

  for (const r of seed.includeDemoActivity ? reviewsData : []) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: { email: r.email, name: r.name, role: 'CUSTOMER' },
    });
    const perfume = await prisma.perfume.findUniqueOrThrow({ where: { slug: r.perfumeSlug } });

    const existing = await prisma.review.findFirst({
      where: { userId: user.id, perfumeId: perfume.id },
    });

    if (!existing) {
      await prisma.review.create({
        data: {
          userId: user.id,
          reviewerName: r.name,
          reviewerFingerprint: `demo-${user.id}`,
          perfumeId: perfume.id,
          rating: r.rating,
          longevityRating: r.rating,
          projectionRating: Math.max(3, r.rating - 1),
          sillageRating: Math.max(3, r.rating - 1),
          valueRating: r.rating,
          smellQualityRating: r.rating,
          comment: `[TEST DATA] ${r.comment}`,
          wouldRecommend: true,
          seasonUsed: r.perfumeSlug === 'rose-noire' ? 'winter' : null,
          verifiedPurchase: false,
          approvalStatus: 'PENDING',
        },
      });
    }
  }

  const admin = seed.admin;
  if (!admin) throw new Error('Demo data requires a configured development or staging admin.');

  // 7. Configurable brand-to-brand similarity (admin-editable in principle
  // once Perfume Studio exists; the data shape is ready now).
  const brandPairs: [string, string, number][] = [
    [verlaine.id, alhambra.id, 0.6], // both lean luxury/classic
    [alhambra.id, verlaine.id, 0.6],
    [verlaine.id, nordAsh.id, 0.3],
    [nordAsh.id, verlaine.id, 0.3],
    [nordAsh.id, alhambra.id, 0.2],
    [alhambra.id, nordAsh.id, 0.2],
  ];
  for (const [brandId, similarBrandId, weight] of brandPairs) {
    await prisma.brandSimilarity.upsert({
      where: { brandId_similarBrandId: { brandId, similarBrandId } },
      update: { weight },
      create: { brandId, similarBrandId, weight },
    });
  }

  // 9. Delivery companies with city-based fees (IQD), per the Iraq delivery spec.
  const swiftIraq = await prisma.deliveryCompany.upsert({
    where: { id: 'seed-swift-iraq' },
    update: { name: 'Swift Iraq Delivery — TEST', contactNumber: '+964 770 000 0000', estimatedDays: '2-4 days', status: 'ACTIVE' },
    create: {
      id: 'seed-swift-iraq',
      name: 'Swift Iraq Delivery',
      contactNumber: '+964 770 000 0000',
      estimatedDays: '2-4 days',
      status: 'ACTIVE',
    },
  });
  const goldenExpress = await prisma.deliveryCompany.upsert({
    where: { id: 'seed-golden-express' },
    update: { name: 'Golden Express — TEST', contactNumber: '+964 780 000 0000', estimatedDays: '1-3 days', status: 'ACTIVE' },
    create: {
      id: 'seed-golden-express',
      name: 'Golden Express',
      contactNumber: '+964 780 000 0000',
      estimatedDays: '1-3 days',
      status: 'ACTIVE',
    },
  });

  const deliveryFees: [string, string, number][] = [
    [swiftIraq.id, 'Baghdad', 5000],
    [swiftIraq.id, 'Basra', 7000],
    [swiftIraq.id, 'Erbil', 8000],
    [goldenExpress.id, 'Baghdad', 4500],
    [goldenExpress.id, 'Erbil', 7500],
  ];
  for (const [deliveryCompanyId, city, fee] of deliveryFees) {
    const existingFee = await prisma.deliveryFee.findFirst({
      where: { deliveryCompanyId, city, area: null },
      select: { id: true },
    });
    if (existingFee) {
      await prisma.deliveryFee.update({ where: { id: existingFee.id }, data: { fee } });
    } else {
      await prisma.deliveryFee.create({ data: { deliveryCompanyId, city, fee } });
    }
  }

  // Backfill the cached inventory snapshot after Step 16 without resetting
  // real physical quantities when seed is run against an existing database.
  const inventoryProducts = await prisma.perfume.findMany({
    select: { id: true, nameEn: true, stock: true, reservedStock: true, lowStockThreshold: true, availability: true, inventoryMovements: { take: 1, select: { id: true } } },
  });
  for (const product of inventoryProducts) {
    const availableStock = Math.max(0, product.stock - product.reservedStock);
    const inventoryStatus = product.availability === 'HIDDEN'
      ? 'HIDDEN'
      : product.availability === 'DISCONTINUED'
        ? 'DISCONTINUED'
        : availableStock === 0 && product.reservedStock > 0
          ? 'RESERVED'
          : availableStock === 0
            ? 'OUT_OF_STOCK'
            : availableStock <= product.lowStockThreshold
              ? 'LOW_STOCK'
              : 'IN_STOCK';
    await prisma.perfume.update({ where: { id: product.id }, data: { availableStock, inventoryStatus } });
    if (inventoryStatus === 'LOW_STOCK' || inventoryStatus === 'OUT_OF_STOCK' || inventoryStatus === 'RESERVED') {
      const type = inventoryStatus === 'LOW_STOCK' ? 'LOW_STOCK' : 'OUT_OF_STOCK';
      const existingAlert = await prisma.inventoryNotification.findFirst({ where: { perfumeId: product.id, type, resolvedAt: null } });
      if (!existingAlert) await prisma.inventoryNotification.create({ data: {
        perfumeId: product.id, type,
        title: inventoryStatus === 'LOW_STOCK' ? `${product.nameEn} is low in stock` : `${product.nameEn} is out of stock`,
        message: inventoryStatus === 'LOW_STOCK' ? `Only ${availableStock} units are available.` : `${product.reservedStock} units are reserved and none are currently available.`,
      } });
    }
    if (product.inventoryMovements.length === 0 && product.stock > 0) {
      await prisma.inventoryMovement.create({ data: {
        perfumeId: product.id, adminId: admin.id, previousStock: 0, newStock: product.stock,
        previousReserved: 0, newReserved: product.reservedStock, quantityChanged: product.stock,
        movementType: 'INITIAL_STOCK', reason: 'Initial stock snapshot created by Step 16 seed',
        adminNote: 'Automatic inventory migration record',
      } });
    }
  }

  if (seed.includeDemoActivity) {
    await seedDemoBusinessActivity();
    const activities = [
      { action: 'perfume.seeded', affectedType: 'Perfume', affectedId: velvetAmber.id, affectedName: 'Velvet Amber' },
      { action: 'brand.seeded', affectedType: 'Brand', affectedId: alhambra.id, affectedName: 'Alhambra Oud' },
    ];
    for (const activity of activities) {
      const existing = await prisma.activityLog.findFirst({ where: { action: activity.action, affectedId: activity.affectedId } });
      if (!existing) await prisma.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, ...activity } });
    }
  }

  printSeedReport(seed, await validateSeed(prisma, seed));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
