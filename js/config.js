/* ============================================================
   config.js — Supabase init, i18n dictionary, shared helpers
   ============================================================ */

// ─── SUPABASE CONFIG ─────────────────────────────────────────
// ⚠️  Replace with your project's URL and anon key from:
//     https://supabase.com → Settings → API
const SUPABASE_URL  = 'https://yeuyhsbzbrjxrxdulaiq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlldXloc2J6YnJqeHJ4ZHVsYWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Nzk1MTksImV4cCI6MjA5NzM1NTUxOX0.kFMQXIw4BKqNyvNmnWChXQhYjBAnXTCl_VYw18Lgswc';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── I18N DICTIONARY ─────────────────────────────────────────
const i18n = {
  fa: {
    // Navigation
    home: 'خانه', marketplace: 'بازارچه', dashboard: 'داشبورد',
    about: 'درباره ما', blog: 'وبلاگ', faq: 'سوالات متداول',
    legal: 'قوانین', support: 'پشتیبانی', tracking: 'پیگیری سفارش',
    profile: 'پروفایل', adminPanel: 'پنل ادمین',
    designerDashboard: 'داشبورد طراح', printerDashboard: 'داشبورد چاپخانه',
    // Auth
    login: 'ورود', logout: 'خروج', register: 'ثبت‌نام',
    loginAsGuest: 'ورود به عنوان مهمان',
    forgotPassword: 'فراموشی رمز عبور',
    resetPassword: 'بازیابی رمز عبور', email: 'ایمیل',
    password: 'رمز عبور', confirmPassword: 'تکرار رمز عبور',
    fullName: 'نام کامل', phone: 'شماره تماس',
    loginToAccount: 'ورود به حساب', registerNew: 'ثبت‌نام',
    haveAccount: 'قبلاً ثبت‌نام کرده‌اید؟', sendResetLink: 'ارسال لینک بازیابی',
    selectRole: 'انتخاب نقش', alreadyRegistered: 'قبلاً ثبت‌نام کرده‌اید؟ ورود',
    // Roles
    admin: 'ادمین', designer: 'طراح', printer: 'چاپخانه', guest: 'مهمان',
    // Actions
    save: 'ذخیره', cancel: 'انصراف', delete: 'حذف', edit: 'ویرایش',
    upload: 'آپلود', download: 'دانلود', buy: 'خرید', search: 'جستجو',
    submit: 'ثبت', add: 'افزودن', view: 'مشاهده', approve: 'تأیید',
    reject: 'رد کردن', confirm: 'تأیید', back: 'بازگشت', close: 'بستن',
    addToCart: 'افزودن به سبد خرید', checkout: 'پرداخت', pay: 'پرداخت',
    print: 'چاپ', send: 'ارسال', loading: 'در حال بارگذاری...',
    selectFile: 'انتخاب فایل', selectCategory: 'انتخاب دسته‌بندی',
    selectOption: 'انتخاب کنید', noOption: 'بدون والد (دسته اصلی)',
    // Cart & Orders
    cart: 'سبد خرید', order: 'سفارش', tracking_code: 'کد پیگیری',
    total: 'جمع کل', discount: 'تخفیف', finalAmount: 'مبلغ نهایی',
    payment: 'پرداخت', address: 'آدرس', invoice: 'فاکتور',
    orderHistory: 'تاریخچه سفارش‌ها', emptyCart: 'سبد خرید خالی است',
    payAndOrder: 'پرداخت و ثبت سفارش', completeOrder: 'تکمیل سفارش',
    deliveryAddress: 'آدرس تحویل', paymentMethod: 'روش پرداخت',
    finalSubmit: 'ثبت نهایی سفارش', onlinePayment: 'پرداخت آنلاین',
    cardTransfer: 'کارت به کارت', cashPayment: 'پرداخت نقدی',
    receipt: 'رسید خرید', printReceipt: '🖨️ چاپ رسید',
    trackingCodeLabel: 'کد پیگیری', orderQty: 'تعداد سفارش',
    // Statuses
    pending: 'در انتظار تأیید', approved: 'تأیید شده',
    rejected: 'رد شده', processing: 'در حال انجام',
    shipped: 'ارسال شده', delivered: 'تحویل داده شده',
    cancelled: 'لغو شده', paid: 'پرداخت شده', unpaid: 'پرداخت نشده',
    // Order statuses (new request-based flow, separate from design pending/approved)
    pending_review: 'در انتظار بررسی ادمین',
    contacted: 'با شما تماس گرفته شد',
    orderRequestSent: 'درخواست شما برای بررسی ادمین ارسال شد',
    orderRequestSentDesc: 'پس از تأیید ادمین، از طریق پیام‌رسانی که انتخاب می‌کند با شما تماس گرفته خواهد شد تا فرآیند خرید نهایی شود.',
    requestOrder: 'ارسال درخواست سفارش',
    orderSummary: 'خلاصه سفارش',
    contactPlatform: 'پلتفرم تماس',
    contactPlatformDesc: 'پس از تأیید سفارش، از طریق این پلتفرم با مشتری تماس بگیرید',
    telegram: 'تلگرام', bale: 'بله', rubika: 'روبیکا',
    selectContactPlatform: 'انتخاب پلتفرم تماس',
    approveAndContact: 'تأیید و انتخاب پلتفرم تماس',
    contactNote: 'یادداشت تماس (اختیاری)',
    contactNotePlaceholder: 'مثال: شماره کارت ارسال شد، منتظر واریز',
    phoneRequired: 'شماره تماس الزامی است',
    phoneRequiredDesc: 'برای پیگیری سفارش از طریق پیام‌رسان، شماره تماس باید معتبر باشد',
    awaitingAdminReview: 'منتظر بررسی ادمین',
    contactedViaLabel: 'تماس گرفته شده از طریق',
    saveOrPrintReceipt: 'ذخیره یا چاپ این رسید را فراموش نکنید',
    // Design
    design: 'طرح', category: 'دسته‌بندی', price: 'قیمت',
    description: 'توضیحات', tags: 'تگ‌ها', rating: 'امتیاز',
    comment: 'نظر', comments: 'نظرات', sales: 'فروش رفته',
    stock: 'موجودی', thumbnail: 'پیش‌نمایش', file: 'فایل',
    wishlist: 'علاقه‌مندی‌ها', noTitle: 'بدون عنوان',
    designTitle: 'عنوان طرح', uploadNewDesign: 'آپلود طرح جدید',
    mainFile: 'فایل اصلی', previewImage: 'تصویر پیش‌نمایش',
    licenseType: 'نوع لایسنس', standardLicense: 'استاندارد',
    exclusiveLicense: 'اختصاصی', addToWishlist: '❤️ افزودن به علاقه‌مندی',
    removeFromWishlist: '💔 حذف از علاقه‌مندی', noDesignsFound: 'هیچ طرحی یافت نشد',
    noCommentsYet: 'هنوز نظری ثبت نشده', yourComment: 'نظر شما...',
    yourName: 'نام شما', submitComment: 'ثبت نظر', noDescription: 'توضیحاتی ثبت نشده',
    designerLabel: 'طراح', soldCount: 'فروش', allCategories: 'همه دسته‌ها',
    newest: 'جدیدترین', mostPopular: 'پرفروش‌ترین', cheapest: 'ارزان‌ترین',
    mostExpensive: 'گران‌ترین', searchInDesigns: 'جستجو در طرح‌ها...',
    // Currency
    toman: 'تومان',
    // Messages
    uploadGuestMsg: 'برای آپلود فایل، لطفاً ثبت‌نام کنید یا وارد شوید',
    guestPrinterBanner: 'برای ثبت سفارش و خرید پکیج، ابتدا ثبت‌نام کنید یا وارد شوید.',
    loginRegister: 'ورود / ثبت‌نام',
    guestBuyDesignMsg: 'برای خرید طرح، ابتدا ثبت‌نام کنید یا وارد شوید',
    loginSuccess: 'با موفقیت وارد شدید',
    logoutSuccess: 'با موفقیت خارج شدید',
    registerSuccess: 'ثبت‌نام با موفقیت انجام شد',
    saveSuccess: 'تغییرات با موفقیت ذخیره شد',
    deleteSuccess: 'با موفقیت حذف شد',
    orderSuccess: 'سفارش با موفقیت ثبت شد',
    uploadSuccess: 'فایل با موفقیت آپلود شد',
    error: 'خطا', networkError: 'خطا در اتصال به اینترنت',
    fileTooLarge: 'حجم فایل بیشتر از ۲۰ مگابایت است',
    thumbTooLarge: 'تصویر پیش‌نمایش نباید بیشتر از ۵ مگابایت باشد',
    passwordMismatch: 'رمز عبور با تکرار آن مطابقت ندارد',
    fillRequired: 'لطفاً تمام فیلدهای ضروری را پر کنید',
    resetEmailSent: 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد',
    notFound: 'یافت نشد', unauthorized: 'شما مجاز به انجام این عملیات نیستید',
    confirmDelete: 'آیا از حذف مطمئن هستید؟', noTicketsYet: 'تیکتی ثبت نشده',
    noOrdersYet: 'سفارشی یافت نشده', commentRatingRequired: 'لطفاً نظر و امتیاز را وارد کنید',
    pendingApproval: 'طرح با موفقیت آپلود شد و در انتظار تأیید است',
    // Hero defaults
    heroTitle: 'پلتفرم تخصصی طراحی و چاپ ایران',
    brandName: 'نش گرافیک',
    // Portfolio
    portfolioAndResume: 'پورتفولیو و رزومه من',
    portfolioDesc: 'رزومه و تا ۲۰ نمونه‌کار برای نمایش عمومی به مشتریان',
    viewPublicPage: 'مشاهده صفحه عمومی',
    managePortfolio: 'مدیریت پورتفولیو',
    resumeAndBio: 'رزومه و معرفی',
    resumePlaceholder: 'درباره خودتان، سوابق کاری، مهارت‌ها و تخصص‌هایتان بنویسید...',
    saveResume: 'ذخیره رزومه',
    myPortfolioItems: 'نمونه‌کارهای من',
    addPortfolioItem: 'افزودن نمونه‌کار',
    editPortfolioItem: 'ویرایش نمونه‌کار',
    portfolioCategory: 'دسته‌بندی',
    portfolioItemTitle: 'عنوان',
    portfolioItemTitlePlaceholder: 'مثال: لوگو رستوران زیتون',
    portfolioItemDescPlaceholder: 'توضیح کوتاهی درباره این کار...',
    portfolioImage: 'تصویر',
    noPortfolioItemsYet: 'هنوز نمونه‌کاری اضافه نکرده‌اید',
    portfolioLimitReached: 'حداکثر ۲۰ نمونه‌کار مجاز است',
    selectImageWarning: 'لطفاً یک تصویر انتخاب کنید',
    portfolioImageTooLarge: 'حجم تصویر نباید بیشتر از ۸ مگابایت باشد',
    portfolio: 'پورتفولیو',
    designsInMarketplace: 'طرح در بازارچه',
    noPortfolioYet: 'هنوز نمونه‌کاری ثبت نشده',
    sampleImage: 'نمونه عکس',
    sampleImagesFor: 'نمونه عکس برای',
    sampleImageDesc: 'برای هر تعداد رنگ، یک عکس نمونه آپلود کنید. این عکس در داشبورد چاپخانه بر اساس دسته و تعداد رنگ انتخابی نمایش داده می‌شود.',
    noImage: 'بدون عکس',
    heroSubtitle: 'طرح‌های حرفه‌ای، چاپ باکیفیت، تحویل سریع',
    // Home page
    statOrders: 'سفارش ثبت‌شده', statDesigners: 'طراح حرفه‌ای',
    statPrinters: 'چاپخانه عضو', statDesigns: 'طرح فعال',
    ourFeatures: 'ویژگی‌های ما',
    // Dashboard
    myDesigns: 'طرح‌های من', salesStats: 'آمار فروش', receivedOrders: 'سفارش‌های دریافتی',
    newDesignBtn: '+ طرح جدید', noDesignsUploaded: 'هنوز طرحی آپلود نکرده‌اید',
    noStatsYet: 'آماری موجود نیست', totalSalesLabel: 'کل فروش',
    totalRevenue: 'درآمد کل', activeDesigns: 'طرح فعال', avgRating: 'میانگین امتیاز',
    designDetails: 'جزئیات طرح‌ها', noOrdersReceived: 'سفارشی دریافت نشده',
    submitDesignOrder: 'ثبت سفارش طراحی', mainCategory: 'دسته اصلی',
    productType: 'نوع محصول', execMethod: 'نحوه اجرا', colorCount: 'تعداد رنگ',
    basePrice: 'قیمت پایه', bulkPackages: 'پکیج‌های عمده', myOrders: 'سفارش‌های من',
    purchaseHistory: 'تاریخچه خرید', oneColor: '۱ رنگ', twoColor: '۲ رنگ',
    threeColor: '۳ رنگ', fullColor: '۴ رنگ (فول کالر)', track: 'پیگیری',
    suitableSmall: 'مناسب برای چاپخانه‌های کوچک', suitableMedium: 'مناسب برای چاپخانه‌های متوسط',
    suitableLarge: 'مناسب برای چاپخانه‌های بزرگ', trialOrder: 'سفارش آزمایشی ویژه',
    bronzePkg: 'پکیج برنزی', silverPkg: 'پکیج نقره‌ای', goldPkg: 'پکیج طلایی', specialPkg: 'پکیج ویژه',
    noPurchasesYet: 'خریدی انجام نشده',
    // Profile
    editPersonalInfo: 'ویرایش اطلاعات', changePhoto: 'تغییر تصویر',
    newPasswordLabel: 'رمز عبور جدید', changePasswordBtn: 'تغییر رمز عبور',
    saveChanges: 'ذخیره تغییرات', noWishlistYet: 'علاقه‌مندی یافت نشد',
    passwordChanged: 'رمز عبور با موفقیت تغییر یافت',
    // About
    aboutTitle: 'درباره نش گرافیک', ourTeam: 'تیم ما', contactInfo: 'اطلاعات تماس',
    // Blog
    blogTitle: 'وبلاگ', noArticlesYet: 'مقاله‌ای منتشر نشده',
    // Support
    supportTitle: 'پشتیبانی', newTicketTitle: 'ثبت تیکت جدید',
    subject: 'موضوع', yourMessage: 'پیام شما...', sendTicketBtn: 'ارسال تیکت',
    myTicketsTitle: 'تیکت‌های من', faqQuestions: 'سوالات متداول',
    ticketSubmitted: 'تیکت با موفقیت ثبت شد', openStatus: 'باز', closedStatus: 'بسته',
    adminReply: 'پاسخ ادمین:',
    // Tracking
    trackingTitle: 'پیگیری سفارش', enterTrackingCode: 'کد پیگیری سفارش...',
    searchBtn: 'جستجو', orderNotFound: 'سفارشی با این کد یافت نشد',
    statusUpdated: 'وضعیت سفارش به', changed: 'تغییر یافت',
    nameLabel: 'نام:', registerDate: 'تاریخ ثبت:', amountLabel: 'مبلغ:',
    // Legal
    termsOfUse: 'شرایط استفاده', privacyPolicy: 'حریم خصوصی', returnPolicy: 'قوانین بازگشت کالا',
    // 404
    pageNotFound: 'صفحه یافت نشد', pageNotFoundDesc: 'صفحه مورد نظر شما وجود ندارد.',
    backToHome: 'بازگشت به خانه',
    // Admin
    statsTab: 'آمار', mediaTab: 'رسانه', usersTab: 'کاربران', designsTab: 'طرح‌ها',
    ordersTab: 'سفارش‌ها', categoriesTab: 'دسته‌بندی', menuTab: 'منوها',
    themeTab: 'تم سایت', contentTab: 'محتوا', blogTab: 'وبلاگ', faqTab: 'FAQ', ticketsTab: 'تیکت‌ها',
    overallStats: 'آمار کلی سایت', totalUsers: 'کل کاربران', totalOrdersLabel: 'کل سفارش‌ها',
    totalDesignsLabel: 'کل طرح‌ها', guestOrdersLabel: 'سفارش مهمان', roleBreakdown: 'تفکیک نقش کاربران',
    uploadLogoBanner: 'آپلود بنر و لوگو', siteLogo: 'لوگو سایت', homeBanner: 'بنر صفحه خانه',
    currentLogo: 'لوگو فعلی', currentBanner: 'بنر فعلی', uploadNewLogo: 'آپلود لوگو جدید',
    uploadNewBanner: 'آپلود بنر جدید', viewInHome: '👁️ مشاهده در صفحه خانه', removeBanner: '🗑️ حذف بنر',
    manageUsersTitle: 'مدیریت کاربران', manageDesignsTitle: 'مدیریت طرح‌ها',
    manageOrdersTitle: 'مدیریت سفارش‌ها', allFilter: 'همه', pendingFilter: 'در انتظار',
    approvedFilter: 'تأیید شده', rejectedFilter: 'رد شده',
    nameCol: 'نام', emailCol: 'ایمیل', roleCol: 'نقش', joinDateCol: 'تاریخ عضویت',
    statusCol: 'وضعیت', actionsCol: 'عملیات', activeStatus: 'فعال', inactiveStatus: 'غیرفعال',
    deactivateBtn: 'غیرفعال', activateBtn: 'فعال', imageCol: 'تصویر', titleCol: 'عنوان',
    designerCol: 'طراح', priceCol: 'قیمت', salesCol: 'فروش', trackingCol: 'کد پیگیری',
    phoneCol: 'تلفن', amountCol: 'مبلغ', typeCol: 'نوع', dateCol: 'تاریخ', memberType: 'عضو',
    guestType: 'مهمان', categoriesTitle: 'دسته‌بندی‌ها', addNewCategory: '+ افزودن دسته جدید',
    editCategoryTitle: 'ویرایش دسته‌بندی', categoryNameLabel: 'نام دسته‌بندی *',
    basePriceLabel: 'قیمت پایه (تومان)', parentCategoryLabel: 'دسته والد',
    optionalDesc: 'توضیحات (اختیاری)', shortDescPlaceholder: 'توضیح کوتاه',
    categoryNameRequired: 'نام دسته‌بندی الزامی است', categoryEditSuccess: 'دسته‌بندی با موفقیت ویرایش شد',
    categoryAddSuccess: 'دسته‌بندی جدید اضافه شد', categoryHasChildren: 'این دسته زیردسته دارد. ابتدا زیردسته‌ها را حذف کنید',
    categoryNameCol: 'نام دسته', parentCol: 'والد', subcatsCol: 'زیردسته‌ها', mainCategoryLabel: 'دسته اصلی',
    subcatLabel: 'زیردسته', menuManagement: 'مدیریت منو', newMenuItem: '+ آیتم جدید',
    titleFaLabel: 'عنوان فارسی', titleEnLabel: 'عنوان انگلیسی', pageLabel: 'صفحه (مثل: marketplace)',
    orderLabel: 'ترتیب', themeManagement: 'مدیریت تم سایت', currentTheme: 'تم فعلی:',
    darkTheme: 'تیره', lightTheme: 'روشن', orangeTheme: 'نارنجی-مشکی',
    modernDarkDesc: 'طراحی مدرن و تیره', minimalLightDesc: 'سبک روشن و مینیمال', orangeDesc: 'نارنجی اختصاصی',
    activeLabel: 'فعال', uploadCustomTheme: 'آپلود تم سفارشی (فایل CSS)', uploadAndApply: 'آپلود و اعمال',
    backToDefault: 'بازگشت به پیش‌فرض', editContent: 'ویرایش محتوای سایت', heroSection: 'بخش Hero (صفحه اصلی)',
    mainTitleFa: 'عنوان اصلی (فارسی)', mainTitleEn: 'عنوان اصلی (انگلیسی)',
    subtitleFa: 'زیرعنوان (فارسی)', subtitleEn: 'زیرعنوان (انگلیسی)', aboutUsContent: 'درباره ما',
    textFa: 'متن (فارسی)', textEn: 'متن (انگلیسی)', footerTextLabel: 'متن فوتر',
    footerFaPlaceholder: 'متن فارسی فوتر', footerEnPlaceholder: 'متن انگلیسی فوتر',
    blogManagement: 'مدیریت وبلاگ', newArticleBtn: '+ مقاله جدید', articleTitlePlaceholder: 'عنوان مقاله',
    articleContentPlaceholder: 'متن مقاله...', excerptPlaceholder: 'خلاصه (اختیاری)',
    faqManagement: 'مدیریت FAQ', newQuestionBtn: '+ سوال جدید', questionPlaceholder: 'سوال',
    answerPlaceholder: 'پاسخ', supportTickets: 'تیکت‌های پشتیبانی', replyPlaceholder: 'پاسخ ادمین...',
    closeTicketBtn: 'بستن تیکت', openTicketBtn: 'بازکردن', replySent: 'پاسخ ارسال شد',
    roleChanged: 'نقش با موفقیت تغییر یافت', orderStatusChanged: 'وضعیت سفارش تغییر یافت',
    logoUploadSuccess: 'لوگو با موفقیت آپلود و اعمال شد', bannerUploadSuccess: 'بنر با موفقیت آپلود و اعمال شد',
    bannerRemoved: 'بنر حذف شد', selectFileWarning: 'فایل انتخاب کنید', selectCssFile: 'فایل CSS انتخاب کنید',
    themeApplied: 'اعمال شد', defaultThemeRestored: 'تم به پیش‌فرض بازگشت', customThemeApplied: 'تم سفارشی اعمال شد',
    designApproved: 'طرح تأیید شد', designRejected: 'طرح رد شد', userDeleted: 'کاربر حذف شد',
    confirmCategoryDelete: 'حذف شود؟', noQuestionsYet: 'سوالی ثبت نشده',
    // Months (Jalali)
    months: ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'],
  },
  en: {
    home: 'Home', marketplace: 'Marketplace', dashboard: 'Dashboard',
    about: 'About', blog: 'Blog', faq: 'FAQ',
    legal: 'Legal', support: 'Support', tracking: 'Order Tracking',
    profile: 'Profile', adminPanel: 'Admin Panel',
    designerDashboard: 'Designer Dashboard', printerDashboard: 'Printer Dashboard',
    login: 'Login', logout: 'Logout', register: 'Register',
    loginAsGuest: 'Continue as Guest',
    forgotPassword: 'Forgot Password',
    resetPassword: 'Reset Password', email: 'Email',
    password: 'Password', confirmPassword: 'Confirm Password',
    fullName: 'Full Name', phone: 'Phone',
    loginToAccount: 'Login to Account', registerNew: 'Register',
    haveAccount: 'Already have an account?', sendResetLink: 'Send Reset Link',
    selectRole: 'Select Role', alreadyRegistered: 'Already registered? Login',
    admin: 'Admin', designer: 'Designer', printer: 'Printer', guest: 'Guest',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
    upload: 'Upload', download: 'Download', buy: 'Buy', search: 'Search',
    submit: 'Submit', add: 'Add', view: 'View', approve: 'Approve',
    reject: 'Reject', confirm: 'Confirm', back: 'Back', close: 'Close',
    addToCart: 'Add to Cart', checkout: 'Checkout', pay: 'Pay',
    print: 'Print', send: 'Send', loading: 'Loading...',
    selectFile: 'Select File', selectCategory: 'Select Category',
    selectOption: 'Select', noOption: 'No Parent (Main Category)',
    cart: 'Cart', order: 'Order', tracking_code: 'Tracking Code',
    total: 'Total', discount: 'Discount', finalAmount: 'Final Amount',
    payment: 'Payment', address: 'Address', invoice: 'Invoice',
    orderHistory: 'Order History', emptyCart: 'Your cart is empty',
    payAndOrder: 'Pay & Place Order', completeOrder: 'Complete Order',
    deliveryAddress: 'Delivery Address', paymentMethod: 'Payment Method',
    finalSubmit: 'Submit Final Order', onlinePayment: 'Online Payment',
    cardTransfer: 'Card Transfer', cashPayment: 'Cash Payment',
    receipt: 'Receipt', printReceipt: '🖨️ Print Receipt',
    trackingCodeLabel: 'Tracking Code', orderQty: 'Order Quantity',
    pending: 'Pending', approved: 'Approved',
    rejected: 'Rejected', processing: 'Processing',
    shipped: 'Shipped', delivered: 'Delivered',
    cancelled: 'Cancelled', paid: 'Paid', unpaid: 'Unpaid',
    pending_review: 'Awaiting Admin Review',
    contacted: 'You Have Been Contacted',
    orderRequestSent: 'Your request has been sent for admin review',
    orderRequestSentDesc: 'Once approved, the admin will contact you through the selected messaging platform to finalize your purchase.',
    requestOrder: 'Submit Order Request',
    orderSummary: 'Order Summary',
    contactPlatform: 'Contact Platform',
    contactPlatformDesc: 'After approving, contact the customer through this platform',
    telegram: 'Telegram', bale: 'Bale', rubika: 'Rubika',
    selectContactPlatform: 'Select Contact Platform',
    approveAndContact: 'Approve & Select Contact Platform',
    contactNote: 'Contact Note (optional)',
    contactNotePlaceholder: 'e.g. Card number sent, awaiting payment',
    phoneRequired: 'Phone number is required',
    phoneRequiredDesc: 'A valid phone number is required to follow up via messaging app',
    awaitingAdminReview: 'Awaiting admin review',
    contactedViaLabel: 'Contacted via',
    saveOrPrintReceipt: 'Don\'t forget to save or print this receipt',
    design: 'Design', category: 'Category', price: 'Price',
    description: 'Description', tags: 'Tags', rating: 'Rating',
    comment: 'Comment', comments: 'Comments', sales: 'Sales',
    stock: 'Stock', thumbnail: 'Thumbnail', file: 'File',
    wishlist: 'Wishlist', noTitle: 'Untitled',
    designTitle: 'Design Title', uploadNewDesign: 'Upload New Design',
    mainFile: 'Main File', previewImage: 'Preview Image',
    licenseType: 'License Type', standardLicense: 'Standard',
    exclusiveLicense: 'Exclusive', addToWishlist: '❤️ Add to Wishlist',
    removeFromWishlist: '💔 Remove from Wishlist', noDesignsFound: 'No designs found',
    noCommentsYet: 'No comments yet', yourComment: 'Your comment...',
    yourName: 'Your name', submitComment: 'Submit Comment', noDescription: 'No description provided',
    designerLabel: 'Designer', soldCount: 'sold', allCategories: 'All Categories',
    newest: 'Newest', mostPopular: 'Most Popular', cheapest: 'Cheapest',
    mostExpensive: 'Most Expensive', searchInDesigns: 'Search designs...',
    toman: 'Toman',
    uploadGuestMsg: 'Please register or login to upload files',
    guestPrinterBanner: 'Please register or login to place orders and purchase packages.',
    loginRegister: 'Login / Register',
    guestBuyDesignMsg: 'Please login or register to buy designs',
    loginSuccess: 'Successfully logged in',
    logoutSuccess: 'Successfully logged out',
    registerSuccess: 'Registration successful',
    saveSuccess: 'Changes saved successfully',
    deleteSuccess: 'Deleted successfully',
    orderSuccess: 'Order placed successfully',
    uploadSuccess: 'File uploaded successfully',
    error: 'Error', networkError: 'Network connection error',
    fileTooLarge: 'File size exceeds 20MB',
    thumbTooLarge: 'Preview image must not exceed 5MB',
    passwordMismatch: 'Passwords do not match',
    fillRequired: 'Please fill all required fields',
    resetEmailSent: 'Password reset link sent to your email',
    notFound: 'Not found', unauthorized: 'You are not authorized to perform this action',
    confirmDelete: 'Are you sure you want to delete?', noTicketsYet: 'No tickets submitted',
    noOrdersYet: 'No orders found', commentRatingRequired: 'Please enter a comment and rating',
    pendingApproval: 'Design uploaded successfully and is pending approval',
    heroTitle: 'Iran\'s Professional Design & Print Platform',
    heroSubtitle: 'Professional designs, quality printing, fast delivery',
    brandName: 'Nash Graphic',
    // Portfolio
    portfolioAndResume: 'My Portfolio & Resume',
    portfolioDesc: 'Resume and up to 20 portfolio items shown publicly to customers',
    viewPublicPage: 'View Public Page',
    managePortfolio: 'Manage Portfolio',
    resumeAndBio: 'Resume & Bio',
    resumePlaceholder: 'Write about yourself, your experience, skills and expertise...',
    saveResume: 'Save Resume',
    myPortfolioItems: 'My Portfolio Items',
    addPortfolioItem: 'Add Portfolio Item',
    editPortfolioItem: 'Edit Portfolio Item',
    portfolioCategory: 'Category',
    portfolioItemTitle: 'Title',
    portfolioItemTitlePlaceholder: 'e.g. Restaurant Logo Design',
    portfolioItemDescPlaceholder: 'A short description of this work...',
    portfolioImage: 'Image',
    noPortfolioItemsYet: 'No portfolio items added yet',
    portfolioLimitReached: 'Maximum 20 portfolio items allowed',
    selectImageWarning: 'Please select an image',
    portfolioImageTooLarge: 'Image must not exceed 8MB',
    portfolio: 'Portfolio',
    designsInMarketplace: 'designs in marketplace',
    noPortfolioYet: 'No portfolio items yet',
    sampleImage: 'Sample Image',
    sampleImagesFor: 'Sample images for',
    sampleImageDesc: 'Upload one sample image per color count. It will be shown in the printer dashboard based on the selected category and color count.',
    noImage: 'No image',
    statOrders: 'Orders Placed', statDesigners: 'Pro Designers',
    statPrinters: 'Print Shops', statDesigns: 'Active Designs',
    ourFeatures: 'Our Features',
    myDesigns: 'My Designs', salesStats: 'Sales Stats', receivedOrders: 'Received Orders',
    newDesignBtn: '+ New Design', noDesignsUploaded: 'You haven\'t uploaded any designs yet',
    noStatsYet: 'No stats available', totalSalesLabel: 'Total Sales',
    totalRevenue: 'Total Revenue', activeDesigns: 'Active Designs', avgRating: 'Average Rating',
    designDetails: 'Design Details', noOrdersReceived: 'No orders received',
    submitDesignOrder: 'Submit Design Order', mainCategory: 'Main Category',
    productType: 'Product Type', execMethod: 'Execution Method', colorCount: 'Color Count',
    basePrice: 'Base Price', bulkPackages: 'Bulk Packages', myOrders: 'My Orders',
    purchaseHistory: 'Purchase History', oneColor: '1 Color', twoColor: '2 Colors',
    threeColor: '3 Colors', fullColor: '4 Colors (Full Color)', track: 'Track',
    suitableSmall: 'Suitable for small print shops', suitableMedium: 'Suitable for medium print shops',
    suitableLarge: 'Suitable for large print shops', trialOrder: 'Special trial order',
    bronzePkg: 'Bronze Package', silverPkg: 'Silver Package', goldPkg: 'Gold Package', specialPkg: 'Special Package',
    noPurchasesYet: 'No purchases made',
    editPersonalInfo: 'Edit Info', changePhoto: 'Change Photo',
    newPasswordLabel: 'New Password', changePasswordBtn: 'Change Password',
    saveChanges: 'Save Changes', noWishlistYet: 'No wishlist items found',
    passwordChanged: 'Password changed successfully',
    aboutTitle: 'About Nash Graphic', ourTeam: 'Our Team', contactInfo: 'Contact Information',
    blogTitle: 'Blog', noArticlesYet: 'No articles published',
    supportTitle: 'Support', newTicketTitle: 'Submit New Ticket',
    subject: 'Subject', yourMessage: 'Your message...', sendTicketBtn: 'Send Ticket',
    myTicketsTitle: 'My Tickets', faqQuestions: 'Frequently Asked Questions',
    ticketSubmitted: 'Ticket submitted successfully', openStatus: 'Open', closedStatus: 'Closed',
    adminReply: 'Admin reply:',
    trackingTitle: 'Order Tracking', enterTrackingCode: 'Order tracking code...',
    searchBtn: 'Search', orderNotFound: 'No order found with this code',
    statusUpdated: 'Order status changed to', changed: '',
    nameLabel: 'Name:', registerDate: 'Order date:', amountLabel: 'Amount:',
    termsOfUse: 'Terms of Use', privacyPolicy: 'Privacy Policy', returnPolicy: 'Return Policy',
    pageNotFound: 'Page Not Found', pageNotFoundDesc: 'The page you are looking for does not exist.',
    backToHome: 'Back to Home',
    statsTab: 'Stats', mediaTab: 'Media', usersTab: 'Users', designsTab: 'Designs',
    ordersTab: 'Orders', categoriesTab: 'Categories', menuTab: 'Menu',
    themeTab: 'Theme', contentTab: 'Content', blogTab: 'Blog', faqTab: 'FAQ', ticketsTab: 'Tickets',
    overallStats: 'Site Overview', totalUsers: 'Total Users', totalOrdersLabel: 'Total Orders',
    totalDesignsLabel: 'Total Designs', guestOrdersLabel: 'Guest Orders', roleBreakdown: 'User Role Breakdown',
    uploadLogoBanner: 'Upload Banner & Logo', siteLogo: 'Site Logo', homeBanner: 'Home Page Banner',
    currentLogo: 'Current Logo', currentBanner: 'Current Banner', uploadNewLogo: 'Upload New Logo',
    uploadNewBanner: 'Upload New Banner', viewInHome: '👁️ View on Home Page', removeBanner: '🗑️ Remove Banner',
    manageUsersTitle: 'Manage Users', manageDesignsTitle: 'Manage Designs',
    manageOrdersTitle: 'Manage Orders', allFilter: 'All', pendingFilter: 'Pending',
    approvedFilter: 'Approved', rejectedFilter: 'Rejected',
    nameCol: 'Name', emailCol: 'Email', roleCol: 'Role', joinDateCol: 'Join Date',
    statusCol: 'Status', actionsCol: 'Actions', activeStatus: 'Active', inactiveStatus: 'Inactive',
    deactivateBtn: 'Deactivate', activateBtn: 'Activate', imageCol: 'Image', titleCol: 'Title',
    designerCol: 'Designer', priceCol: 'Price', salesCol: 'Sales', trackingCol: 'Tracking Code',
    phoneCol: 'Phone', amountCol: 'Amount', typeCol: 'Type', dateCol: 'Date', memberType: 'Member',
    guestType: 'Guest', categoriesTitle: 'Categories', addNewCategory: '+ Add New Category',
    editCategoryTitle: 'Edit Category', categoryNameLabel: 'Category Name *',
    basePriceLabel: 'Base Price (Toman)', parentCategoryLabel: 'Parent Category',
    optionalDesc: 'Description (Optional)', shortDescPlaceholder: 'Short description',
    categoryNameRequired: 'Category name is required', categoryEditSuccess: 'Category updated successfully',
    categoryAddSuccess: 'New category added', categoryHasChildren: 'This category has subcategories. Delete them first',
    categoryNameCol: 'Category Name', parentCol: 'Parent', subcatsCol: 'Subcategories', mainCategoryLabel: 'Main Category',
    subcatLabel: 'subcategories', menuManagement: 'Menu Management', newMenuItem: '+ New Item',
    titleFaLabel: 'Persian Title', titleEnLabel: 'English Title', pageLabel: 'Page (e.g. marketplace)',
    orderLabel: 'Order', themeManagement: 'Site Theme Management', currentTheme: 'Current theme:',
    darkTheme: 'Dark', lightTheme: 'Light', orangeTheme: 'Orange-Black',
    modernDarkDesc: 'Modern dark design', minimalLightDesc: 'Light minimal style', orangeDesc: 'Custom orange',
    activeLabel: 'Active', uploadCustomTheme: 'Upload Custom Theme (CSS file)', uploadAndApply: 'Upload & Apply',
    backToDefault: 'Reset to Default', editContent: 'Edit Site Content', heroSection: 'Hero Section (Home Page)',
    mainTitleFa: 'Main Title (Persian)', mainTitleEn: 'Main Title (English)',
    subtitleFa: 'Subtitle (Persian)', subtitleEn: 'Subtitle (English)', aboutUsContent: 'About Us',
    textFa: 'Text (Persian)', textEn: 'Text (English)', footerTextLabel: 'Footer Text',
    footerFaPlaceholder: 'Persian footer text', footerEnPlaceholder: 'English footer text',
    blogManagement: 'Blog Management', newArticleBtn: '+ New Article', articleTitlePlaceholder: 'Article Title',
    articleContentPlaceholder: 'Article content...', excerptPlaceholder: 'Excerpt (optional)',
    faqManagement: 'FAQ Management', newQuestionBtn: '+ New Question', questionPlaceholder: 'Question',
    answerPlaceholder: 'Answer', supportTickets: 'Support Tickets', replyPlaceholder: 'Admin reply...',
    closeTicketBtn: 'Close Ticket', openTicketBtn: 'Reopen', replySent: 'Reply sent',
    roleChanged: 'Role changed successfully', orderStatusChanged: 'Order status changed',
    logoUploadSuccess: 'Logo uploaded and applied successfully', bannerUploadSuccess: 'Banner uploaded and applied successfully',
    bannerRemoved: 'Banner removed', selectFileWarning: 'Please select a file', selectCssFile: 'Please select a CSS file',
    themeApplied: 'applied', defaultThemeRestored: 'Theme reset to default', customThemeApplied: 'Custom theme applied',
    designApproved: 'Design approved', designRejected: 'Design rejected', userDeleted: 'User deleted',
    confirmCategoryDelete: 'Delete this category?', noQuestionsYet: 'No questions added',
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  }
};

// ─── LANGUAGE & THEME STATE ──────────────────────────────────
const State = {
  lang: localStorage.getItem('nika_lang') || 'fa',
  theme: localStorage.getItem('nika_theme') || 'dark',
  user: null,       // { id, email, role, name, phone, avatar }
  isGuest: false,
  cart: [],
  wishlist: [],
  guestSessionId: localStorage.getItem('nika_guest_session') || (() => {
    const id = crypto.randomUUID();
    localStorage.setItem('nika_guest_session', id);
    return id;
  })(),
};

// ─── TRANSLATION HELPER ──────────────────────────────────────
function t(key) {
  return i18n[State.lang][key] || i18n['fa'][key] || key;
}

// ─── NUMBER HELPERS ──────────────────────────────────────────
function toFarsiNum(n) {
  const safe = (n === undefined || n === null || Number.isNaN(Number(n))) ? 0 : n;
  if (State.lang !== 'fa') return String(safe);
  return String(safe).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function formatPrice(n) {
  const safe = (n === undefined || n === null || Number.isNaN(Number(n))) ? 0 : Number(n);
  return State.lang === 'fa'
    ? `${toFarsiNum(safe.toLocaleString())} ${t('toman')}`
    : `${safe.toLocaleString()} ${t('toman')}`;
}

// ─── DATE HELPERS ────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (State.lang === 'en') {
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  }
  try {
    return d.toLocaleDateString('fa-IR', { year:'numeric', month:'long', day:'numeric' });
  } catch {
    return d.toLocaleDateString();
  }
}

// ─── TOAST ───────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, duration);
}

// ─── LOADING ─────────────────────────────────────────────────
function showLoading(show) {
  const el = document.getElementById('loading-overlay');
  if (show) { el.classList.remove('fade-out'); el.style.display = 'flex'; }
  else { el.classList.add('fade-out'); setTimeout(() => el.style.display = 'none', 500); }
}

// ─── MODAL ───────────────────────────────────────────────────
const Modal = {
  open(id) {
    document.getElementById(`modal-${id}`).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },
  close(id) {
    document.getElementById(`modal-${id}`).classList.add('hidden');
    document.body.style.overflow = '';
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    document.body.style.overflow = '';
  }
};

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) Modal.closeAll();
});

// ─── APPLY LANGUAGE ──────────────────────────────────────────
function applyLang(lang) {
  State.lang = lang;
  localStorage.setItem('nika_lang', lang);
  // ① html element — مرورگر، Google Translate و screen reader از این استفاده می‌کنند
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  // ② body
  document.body.setAttribute('data-lang', lang);
  document.body.dir = lang === 'fa' ? 'rtl' : 'ltr';
  // ③ همه المان‌های data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t(k);
    } else {
      el.textContent = t(k);
    }
  });
  // ④ placeholder های جداگانه
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  // ⑤ دکمه toggle
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.textContent = lang === 'fa' ? 'EN' : 'FA';
}

// ─── APPLY THEME ─────────────────────────────────────────────
function applyTheme(theme, customCssUrl = null) {
  // Remove old custom theme link
  const old = document.getElementById('custom-theme-link');
  if (old) old.remove();
  // Remove all theme classes
  document.body.classList.remove('theme-dark', 'theme-light', 'theme-orange');
  if (customCssUrl) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.id = 'custom-theme-link';
    link.href = customCssUrl;
    document.head.appendChild(link);
  } else {
    document.body.classList.add(`theme-${theme}`);
  }
  State.theme = theme;
  localStorage.setItem('nika_theme', theme);
}

// ─── ROUTER ──────────────────────────────────────────────────
const Router = {
  current: 'home',
  navigate(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
      p.classList.add('hidden');
    });
    // Show target
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
      Router.current = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Update active nav link
      document.querySelectorAll('.nav-list li [data-page]').forEach(a => {
        a.classList.toggle('active', a.getAttribute('data-page') === page);
      });
      // Load page data
      Router.loadPage(page);
    } else {
      // 404
      document.getElementById('page-404').classList.remove('hidden');
      document.getElementById('page-404').classList.add('active');
    }
  },
  async loadPage(page) {
    switch(page) {
      case 'home': await App.loadHome(); break;
      case 'marketplace': await Marketplace.load(); break;
      case 'designer-dashboard': await Dashboard.loadDesigner(); break;
      case 'printer-dashboard': await Dashboard.loadPrinter(); break;
      case 'admin': await Admin.load(); break;
      case 'profile': await Profile.load(); break;
      case 'about': await App.loadAbout(); break;
      case 'portfolio-edit': await Portfolio.loadEditPage(); break;
      case 'portfolio-view': await Portfolio.loadPublicView(); break;
      case 'blog': await App.loadBlog(); break;
      case 'faq': await App.loadFaq(); break;
      case 'legal': await App.loadLegal(); break;
      case 'support': await Support.load(); break;
      case 'tracking': break; // user-driven
    }
  }
};

// ─── UPLOAD GUARD ────────────────────────────────────────────
function checkUploadPermission() {
  if (!State.user && !State.isGuest) {
    toast(t('uploadGuestMsg'), 'warning');
    Modal.open('auth');
    return false;
  }
  if (State.isGuest) {
    toast(t('uploadGuestMsg'), 'warning');
    Modal.open('auth');
    return false;
  }
  if (State.user.role !== 'designer' && State.user.role !== 'admin') {
    toast('شما مجاز به آپلود طرح نیستید', 'error');
    return false;
  }
  return true;
}

// ─── ROLE GUARDS ─────────────────────────────────────────────
function requireRole(...roles) {
  const role = State.isGuest ? 'guest' : (State.user?.role || 'guest');
  return roles.includes(role);
}

// ─── SUPABASE DATA HELPERS ───────────────────────────────────
const DB = {
  async get(table, query = {}) {
    let q = supabase.from(table).select(query.select || '*');
    if (query.eq) Object.entries(query.eq).forEach(([k,v]) => q = q.eq(k,v));
    if (query.order) q = q.order(query.order, { ascending: query.asc ?? false });
    if (query.limit) q = q.limit(query.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  async insert(table, payload) {
    const { data, error } = await supabase.from(table).insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async update(table, id, payload) {
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  },
  async upsert(table, payload, onConflict) {
    const { data, error } = await supabase.from(table).upsert(payload, { onConflict }).select().single();
    if (error) throw error;
    return data;
  },
  // Upload file to Storage
  async uploadFile(bucket, path, file, onProgress) {
    // حذف فایل قبلی قبل از آپلود (برای جلوگیری از خطای upsert)
    await supabase.storage.from(bucket).remove([path]).catch(() => {});
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600', upsert: true
    });
    if (error) throw error;
    // اضافه کردن timestamp برای جلوگیری از cache مرورگر
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl + '?t=' + Date.now();
  },
  // Get public URL
  publicUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
};

// ─── TRACKING CODE GENERATOR ─────────────────────────────────
function generateTrackingCode() {
  return 'NK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,5).toUpperCase();
}

// ─── SCROLL TO TOP BUTTON ────────────────────────────────────
window.addEventListener('scroll', () => {
  const btn = document.getElementById('scroll-top');
  btn.classList.toggle('hidden', window.scrollY < 300);
});

// ─── CLOSE DROPDOWN ON OUTSIDE CLICK ────────────────────────
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    document.querySelector('.user-dropdown')?.remove();
  }
});

// ─── AUTO LOGOUT (30 min) ────────────────────────────────────
let _activityTimer;
function resetActivityTimer() {
  clearTimeout(_activityTimer);
  _activityTimer = setTimeout(async () => {
    if (State.user) {
      await supabase.auth.signOut();
      State.user = null;
      State.isGuest = false;
      toast('به دلیل عدم فعالیت، از سیستم خارج شدید', 'warning');
      App.updateHeader();
      Router.navigate('home');
    }
  }, 30 * 60 * 1000); // 30 minutes
}
['click','keydown','scroll','mousemove','touchstart'].forEach(e =>
  document.addEventListener(e, resetActivityTimer, { passive: true })
);
resetActivityTimer();

console.log('✅ config.js loaded');
