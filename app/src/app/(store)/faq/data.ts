// Centralised FAQ content so the JSON-LD on the server and the rendered
// accordion on the client read from the same source. Group/order here drives
// the on-page order; numeric `group_order` keeps groups stable when adding
// new questions later.

export interface Faq {
  group_en: string
  group_ar: string
  group_order: number
  q_en: string
  q_ar: string
  a_en: string
  a_ar: string
}

export const FAQS: Faq[] = [
  // ─── Delivery ────────────────────────────────────────────────────
  {
    group_en: 'Delivery', group_ar: 'التوصيل', group_order: 1,
    q_en: 'Which emirates do you deliver to?',
    q_ar: 'ما هي الإمارات التي توصلون إليها؟',
    a_en: 'We deliver to all 7 emirates: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.',
    a_ar: 'نوصل إلى جميع الإمارات السبع: دبي، أبوظبي، الشارقة، عجمان، رأس الخيمة، الفجيرة، وأم القيوين.',
  },
  {
    group_en: 'Delivery', group_ar: 'التوصيل', group_order: 1,
    q_en: 'How fast is delivery?',
    q_ar: 'ما هي سرعة التوصيل؟',
    a_en: 'You can pick same-day, next-day, or day-after delivery at checkout. Order before 4 PM for next-morning slots; later orders go to afternoon or evening windows.',
    a_ar: 'يمكنك اختيار التوصيل في نفس اليوم أو اليوم التالي أو بعد يومين عند الدفع. اطلب قبل الرابعة عصراً لخدمة صباح اليوم التالي.',
  },
  {
    group_en: 'Delivery', group_ar: 'التوصيل', group_order: 1,
    q_en: 'Is there a minimum order or delivery fee?',
    q_ar: 'هل هناك حد أدنى للطلب أو رسوم توصيل؟',
    a_en: 'Delivery is free on orders over AED 100. Smaller orders carry a flat AED 15 delivery fee.',
    a_ar: 'التوصيل مجاني للطلبات التي تزيد عن 100 درهم. الطلبات الأصغر عليها رسوم ثابتة 15 درهم.',
  },
  {
    group_en: 'Delivery', group_ar: 'التوصيل', group_order: 1,
    q_en: 'Can I change my delivery time after ordering?',
    q_ar: 'هل يمكنني تغيير موعد التوصيل بعد الطلب؟',
    a_en: 'Yes — reach us on WhatsApp before the driver is dispatched and we can move the slot for you.',
    a_ar: 'نعم — تواصل معنا على واتساب قبل خروج السائق ويمكننا تغيير الموعد لك.',
  },
  // ─── Orders ──────────────────────────────────────────────────────
  {
    group_en: 'Orders', group_ar: 'الطلبات', group_order: 2,
    q_en: 'How do I track my order?',
    q_ar: 'كيف أتتبع طلبي؟',
    a_en: 'Visit /track and enter your order number and email — you\'ll see live status updates and your delivery slot. Signed-in customers also see full history at /account.',
    a_ar: 'زر صفحة /track وأدخل رقم الطلب والبريد الإلكتروني — ستظهر حالة التحديثات والموعد. العملاء المسجلون يجدون السجل الكامل في /account.',
  },
  {
    group_en: 'Orders', group_ar: 'الطلبات', group_order: 2,
    q_en: 'Can I cancel an order?',
    q_ar: 'هل يمكنني إلغاء طلب؟',
    a_en: 'Yes, while the order is still Pending or Confirmed you can cancel from /account/orders. Once it\'s with the driver it can no longer be cancelled.',
    a_ar: 'نعم، طالما كان الطلب قيد الانتظار أو مؤكداً يمكنك الإلغاء من /account/orders. بمجرد خروجه مع السائق لا يمكن إلغاؤه.',
  },
  {
    group_en: 'Orders', group_ar: 'الطلبات', group_order: 2,
    q_en: 'Do I need an account to order?',
    q_ar: 'هل أحتاج إلى حساب لأطلب؟',
    a_en: 'No — guest checkout is supported. Creating an account just lets you save addresses, track orders, and earn loyalty points.',
    a_ar: 'لا — الدفع كضيف متاح. إنشاء حساب يتيح لك حفظ العناوين، تتبع الطلبات، وكسب نقاط الولاء.',
  },
  // ─── Payment ─────────────────────────────────────────────────────
  {
    group_en: 'Payment', group_ar: 'الدفع', group_order: 3,
    q_en: 'What payment methods do you accept?',
    q_ar: 'ما هي طرق الدفع المقبولة؟',
    a_en: 'Cash on delivery, and online card payment (Visa, Mastercard, Apple Pay, Google Pay) via Stripe Checkout. Card payments are processed on Stripe\'s secure infrastructure — we never store card numbers.',
    a_ar: 'الدفع نقداً عند الاستلام، أو بالبطاقة عبر الإنترنت (فيزا، ماستركارد، آبل باي، جوجل باي) عبر Stripe Checkout. مدفوعات البطاقات تتم على بنية Stripe الآمنة — لا نحفظ أرقام البطاقات.',
  },
  {
    group_en: 'Payment', group_ar: 'الدفع', group_order: 3,
    q_en: 'Is online payment secure?',
    q_ar: 'هل الدفع عبر الإنترنت آمن؟',
    a_en: 'Yes. All card payments go through Stripe, a PCI-DSS Level 1 certified payment processor. Your card details never touch our servers.',
    a_ar: 'نعم. تتم جميع مدفوعات البطاقات عبر Stripe، وهي معالج دفع معتمد PCI-DSS من المستوى الأول. تفاصيل بطاقتك لا تمر عبر خوادمنا.',
  },
  // ─── Freshness & quality ─────────────────────────────────────────
  {
    group_en: 'Freshness', group_ar: 'الجودة', group_order: 4,
    q_en: 'How do you keep produce fresh?',
    q_ar: 'كيف تحافظون على نضارة المنتجات؟',
    a_en: 'We source daily from local farms and trusted regional importers and hold inventory in a temperature-controlled facility. Your order is packed only after it\'s placed and goes straight to your door.',
    a_ar: 'نحصل على المنتجات يومياً من المزارع المحلية والمستوردين الموثوقين، ونحتفظ بالمخزون في منشأة مكيفة. يتم تعبئة طلبك فقط بعد تأكيده ويصل مباشرة إلى بابك.',
  },
  {
    group_en: 'Freshness', group_ar: 'الجودة', group_order: 4,
    q_en: 'What if an item is damaged or below quality?',
    q_ar: 'ماذا لو كان أحد المنتجات تالفاً أو دون المستوى؟',
    a_en: 'Message us on WhatsApp with a photo within 24 hours of delivery and we\'ll refund or replace it — no questions asked.',
    a_ar: 'تواصل معنا على واتساب مع صورة خلال 24 ساعة من التوصيل وسنقوم بالاسترداد أو الاستبدال — دون أسئلة.',
  },
  {
    group_en: 'Freshness', group_ar: 'الجودة', group_order: 4,
    q_en: 'Are your products organic?',
    q_ar: 'هل منتجاتكم عضوية؟',
    a_en: 'Some are — organic items carry a green Organic badge on the product card and you can filter the shop to organic only. Non-organic items still meet our quality standards.',
    a_ar: 'بعضها كذلك — المنتجات العضوية تحمل شارة خضراء "عضوي" على بطاقة المنتج ويمكنك تصفية المتجر للعضوي فقط. المنتجات غير العضوية تستوفي معايير جودتنا.',
  },
  // ─── Loyalty ─────────────────────────────────────────────────────
  {
    group_en: 'Loyalty', group_ar: 'الولاء', group_order: 5,
    q_en: 'How do loyalty points work?',
    q_ar: 'كيف تعمل نقاط الولاء؟',
    a_en: 'You earn 1 point for every AED you spend (excluding delivery and VAT). Points are credited when your order is delivered. 20 points = AED 1 — redeem at checkout once you have 100 or more.',
    a_ar: 'تكسب نقطة واحدة عن كل درهم تنفقه (باستثناء التوصيل والضريبة). تُضاف النقاط عند تسليم طلبك. 20 نقطة = درهم واحد — يمكن الاستبدال عند الدفع بمجرد امتلاكك 100 أو أكثر.',
  },
  {
    group_en: 'Loyalty', group_ar: 'الولاء', group_order: 5,
    q_en: 'Do points expire?',
    q_ar: 'هل تنتهي صلاحية النقاط؟',
    a_en: 'Points expire 12 months after they are earned. Redeeming them anytime before that keeps them.',
    a_ar: 'تنتهي صلاحية النقاط بعد 12 شهراً من اكتسابها. استبدالها في أي وقت قبل ذلك يحافظ عليها.',
  },
  // ─── Account ─────────────────────────────────────────────────────
  {
    group_en: 'Account', group_ar: 'الحساب', group_order: 6,
    q_en: 'I forgot my password — what now?',
    q_ar: 'نسيت كلمة المرور — ماذا أفعل؟',
    a_en: 'Click "Forgot password?" on the sign-in page and we\'ll email you a reset link. The link is valid for one hour.',
    a_ar: 'انقر على "نسيت كلمة المرور؟" في صفحة الدخول وسنرسل لك رابط إعادة تعيين عبر البريد. الرابط صالح لمدة ساعة واحدة.',
  },
  {
    group_en: 'Account', group_ar: 'الحساب', group_order: 6,
    q_en: 'How do I update my delivery address?',
    q_ar: 'كيف أحدّث عنوان التوصيل؟',
    a_en: 'Signed-in customers can manage addresses at /account/addresses. Set one as default to have it pre-filled at checkout.',
    a_ar: 'يمكن للعملاء المسجلين إدارة العناوين في /account/addresses. اضبط أحدها كافتراضي ليُعبأ تلقائياً عند الدفع.',
  },
]
