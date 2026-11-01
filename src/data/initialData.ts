import { SchoolInfo, StaffMember, BoardMember, NewsPost, GalleryAlbum, DriveSettings, PostCategory, MediaItem, VideoItem, PublicDocumentItem } from '../types';

export const initialSchoolInfo: SchoolInfo = {
  schoolName: 'โรงเรียนบ้านนารี',
  schoolNameEn: 'Ban Naree School',
  schoolIdCode: '1040180234',
  affiliation: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษา ชัยภูมิ เขต 1',
  motto: 'สุวิชาโน ภวํ โหติ (ผู้รู้ดี เป็นผู้เจริญ)',
  philosophy: 'ปัญญา นำพาชีวิต มีคุณธรรม นำความรู้ สู่สังคมสันติสุข',
  vision: 'มุ่งพัฒนาผู้เรียนให้มีความรู้คู่คุณธรรม มีทักษะการเรียนรู้ในศตวรรษที่ 21 ก้าวทันเทคโนโลยีดิจิทัล น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียง สู่มาตรฐานสากล บนพื้นฐานความเป็นไทย',
  mission: [
    'พัฒนาหลักสูตรและการจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ บูรณาการเทคโนโลยีดิจิทัล',
    'ปลูกฝังคุณธรรม จริยธรรม ค่านิยมที่พึงประสงค์ และวิถีประชาธิปไตย',
    'ส่งเสริมและพัฒนาครูและบุคลากรทางการศึกษาให้มีความเชี่ยวชาญตามมาตรฐานวิชาชีพ',
    'พัฒนาระบบบริหารจัดการด้วยระบบดิจิทัลและการมีส่วนร่วมของชุมชนและภาคีเครือข่าย',
    'น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียงมาประยุกต์ใช้ในการจัดกระบวนการเรียนรู้และการดำเนินชีวิต'
  ],
  goals: [
    'ผู้เรียนมีผลสัมฤทธิ์ทางการเรียนสูงขึ้น มีทักษะการคิดวิเคราะห์ และทักษะชีวิต',
    'โรงเรียนมีระบบดูแลช่วยเหลือนักเรียนที่มีประสิทธิภาพและปลอดภัย',
    'บุคลากรสามารถใช้เทคโนโลยีและนวัตกรรมในการจัดการเรียนการสอนได้อย่างมีประสิทธิภาพ'
  ],
  identity: 'ยิ้มง่าย ไหว้สวย รวยน้ำใจ ใฝ่เรียนรู้',
  uniqueness: 'โรงเรียนวิถีพุทธ สภาพแวดล้อมร่มรื่น น้อมนำพอเพียง',
  colors: 'น้ำเงิน - ทอง (น้ำเงินหมายถึง ความสุขุมรอบคอบและมั่นคง, ทองหมายถึง ความรุ่งเรืองและปัญญา)',
  tree: 'ต้นราชพฤกษ์ (คูน)',
  history: 'โรงเรียนบ้านนารี ก่อตั้งขึ้นเมื่อวันที่ 1 พฤษภาคม พ.ศ. 2518 บนที่ดินสาธารณประโยชน์ที่ประชาชนในชุมชนบ้านนารีร่วมกันบริจาค โดยเริ่มแรกเปิดทำการสอนตั้งแต่ชั้นประถมศึกษาปีที่ 1 ถึงชั้นประถมศึกษาปีที่ 4 ต่อมาได้ขยายโอกาสทางการศึกษาเปิดสอนจนถึงชั้นมัธยมศึกษาตอนต้น ปัจจุบันเป็นโรงเรียนขยายโอกาสทางการศึกษาขนาดกลางที่มีการพัฒนาอย่างต่อเนื่องทั้งด้านอาคารสถานที่ สภาพแวดล้อม และคุณภาพการจัดการศึกษา',
  directorName: 'นายสมศักดิ์ ปัญญาวงศ์',
  directorPosition: 'ผู้อำนวยการโรงเรียนบ้านนารี',
  directorRank: 'วิทยฐานะ ชำนาญการพิเศษ',
  directorQuoteTitle: 'ร่วมแรงร่วมใจ สร้างวินัย ใฝ่หาความรู้ เพื่ออนาคตที่สดใสของเยาวชนบ้านนารี',
  directorMessage: 'โรงเรียนบ้านนารีมีความมุ่งมั่นที่จะพัฒนาคุณภาพการศึกษาให้ผู้เรียนทุกคนได้รับการพัฒนาอย่างเต็มศักยภาพ ทั้งด้านวิชาการ ทักษะชีวิต และคุณธรรมจริยธรรม ภายใต้การมีส่วนร่วมของคณะครู ผู้ปกครอง ชุมชน และคณะกรรมการสถานศึกษา ขอขอบคุณทุกภาคส่วนที่ร่วมแรงร่วมใจในการขับเคลื่อนการศึกษาเพื่อลูกหลานบ้านนารีของเรา',
  directorImageUrl: '/src/assets/images/school_director_portrait_1792082309465.jpg',
  heroImageUrl: '/src/assets/images/hero_school_campus_1792082308721.jpg',
  heroTagline: 'สถานศึกษาพอเพียงและปลอดภัย · สพป.ชัยภูมิ เขต 1',
  heroBadgeTitle: 'โรงเรียนวิถีพุทธ & คุณธรรม',
  heroBadgeSubtitle: 'บรรยากาศร่มรื่น น้อมนำศาสตร์พระราชา',
  safetyStatPercent: '100%',
  safetyStatLabel: 'สถานศึกษาปลอดภัยและสุขอนามัย',
  pillarsTitle: '4 เสาหลักการจัดการศึกษา โรงเรียนบ้านนารี',
  pillarsSubtitle: 'มุ่งเน้นการจัดการเรียนรู้เชิงรุก (Active Learning) บูรณาการคุณธรรม จริยธรรม และทักษะดิจิทัลแห่งศตวรรษที่ 21',
  educationalPillars: [
    {
      id: 'pillar-1',
      title: '1. ปฐมวัยคุณภาพ & BBL',
      desc: 'เสริมสร้างพัฒนาการรอบด้านทั้งร่างกาย อารมณ์ และสังคม ผ่านการเล่นสร้างสรรค์ และการเรียนรู้ตามหลักพัฒนาการสมอง (BBL & EF)',
      targetGrade: 'ระดับชั้นอนุบาล 2 - อนุบาล 3',
      icon: 'Compass'
    },
    {
      id: 'pillar-2',
      title: '2. ประถมศึกษา & สมรรถนะหลัก',
      desc: 'เน้นการอ่านออก เขียนได้ คิดคำนวณคล่อง สื่อสารได้ 2 ภาษา พร้อมปลูกฝังทักษะการคิดวิเคราะห์และการแก้ปัญหาอย่างเป็นระบบ',
      targetGrade: 'ระดับชั้น ป.1 - ป.6',
      icon: 'BookOpen'
    },
    {
      id: 'pillar-3',
      title: '3. นวัตกรรมดิจิทัล & STEM',
      desc: 'เรียนรู้ Coding, วิทยาการคำนวณ, และโครงงาน STEM นำเทคโนโลยีสารสนเทศมาเป็นเครื่องมือแสวงหาความรู้ตลอดชีวิต',
      targetGrade: 'ระดับประถม - มัธยมศึกษาตอนต้น',
      icon: 'Laptop'
    },
    {
      id: 'pillar-4',
      title: '4. วิถีพอเพียง & จิตอาสา',
      desc: 'น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียง แปลงเกษตรอินทรีย์โรงเรียน ปลูกฝังค่านิยมความซื่อสัตย์ มีวินัย และจิตสาธารณะ',
      targetGrade: 'ทุกระดับชั้น & สังคมชุมชน',
      icon: 'Sprout'
    }
  ],
  directorGreetingTitle: 'สารจากผู้บริหารสถานศึกษา',
  urgentTickerEnabled: true,
  urgentTickerLabel: 'ประกาศด่วน',
  urgentTickerText: 'ขอเชิญผู้ปกครองและนักเรียนร่วมกิจกรรมวันสำคัญและการประเมินสถานศึกษาพอเพียง ภาคเรียนที่ 1 ประจำปีการศึกษา 2568',
  urgentTickerLink: '',
  governanceTitle: 'พลังความร่วมมือระหว่าง ครู คณะกรรมการสถานศึกษา และเครือข่ายผู้ปกครอง',
  governanceSubtitle: 'โครงสร้างและการมีส่วนร่วม',
  governanceDesc: 'โรงเรียนบ้านนารีขับเคลื่อนการศึกษาด้วยหลักการมีส่วนร่วมของทุกภาคส่วนอย่างโปร่งใส ตรวจสอบได้ และยึดประโยชน์สูงสุดของผู้เรียนเป็นสำคัญ',
  governanceCards: [
    {
      id: 'gov-1',
      title: 'ครูและบุคลากรทางการศึกษา',
      desc: 'ทำเนียบคณะครูผู้สอนตาม 8 กลุ่มสาระการเรียนรู้ และฝ่ายบริหารสถานศึกษาที่เปี่ยมด้วยความเชี่ยวชาญ',
      buttonText: 'ดูทำเนียบบุคลากร',
      targetTab: 'staff',
      icon: 'Users'
    },
    {
      id: 'gov-2',
      title: 'คณะกรรมการสถานศึกษาขั้นพื้นฐาน',
      desc: 'ผู้แทนชุมชน ศาสนา ศิษย์เก่า องค์กรปกครองส่วนท้องถิ่น และผู้ทรงคุณวุฒิ ร่วมวางทิศทางพัฒนาโรงเรียน',
      buttonText: 'ดูรายชื่อคณะกรรมการ',
      targetTab: 'boards',
      icon: 'Award'
    },
    {
      id: 'gov-3',
      title: 'คณะกรรมการเครือข่ายผู้ปกครอง',
      desc: 'ตัวแทนผู้ปกครองนักเรียนทุกระดับชั้น ร่วมดูแลช่วยเหลือ พัฒนาลูกหลาน และสร้างสายสัมพันธ์อันอบอุ่น',
      buttonText: 'ดูรายชื่อเครือข่าย',
      targetTab: 'boards',
      icon: 'HeartHandshake'
    }
  ],
  quickLinksTitle: 'ระบบบริการอิเล็กทรอนิกส์ & ลิงก์ด่วนทางการศึกษา',
  quickLinksSubtitle: 'e-Services & Educational Portals',
  quickLinks: [
    {
      id: 'ql-1',
      title: 'ระบบวัดผล SGS',
      desc: 'ระบบประเมินผลการเรียนออนไลน์',
      url: 'https://sgs.bopp.go.th',
      icon: 'GraduationCap',
      badge: 'นักเรียน & ผู้ปกครอง',
      color: 'blue',
      isExternal: true
    },
    {
      id: 'ql-2',
      title: 'ระบบ DPA (PA)',
      desc: 'ระบบการประเมินวิทยฐานะดิจิทัล',
      url: 'https://dpa.otepc.go.th',
      icon: 'Award',
      badge: 'คุณครู & บุคลากร',
      color: 'amber',
      isExternal: true
    },
    {
      id: 'ql-3',
      title: 'ระบบสารสนเทศ EMIS',
      desc: 'ฐานข้อมูลนักเรียนและโรงเรียน สพฐ.',
      url: 'https://data.bopp-obec.info',
      icon: 'Database',
      badge: 'งานสารสนเทศ',
      color: 'emerald',
      isExternal: true
    },
    {
      id: 'ql-4',
      title: 'สพป.ชัยภูมิ เขต 1',
      desc: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษา',
      url: 'https://www.cpm1.go.th',
      icon: 'Building2',
      badge: 'หน่วยงานต้นสังกัด',
      color: 'indigo',
      isExternal: true
    },
    {
      id: 'ql-5',
      title: 'มูลนิธิการศึกษา DLTV',
      desc: 'ห้องเรียนออนไลน์และการเรียนรู้ทางไกล',
      url: 'https://www.dltv.ac.th',
      icon: 'Tv',
      badge: 'สื่อการเรียนรู้',
      color: 'rose',
      isExternal: true
    },
    {
      id: 'ql-6',
      title: 'ระบบ e-GP จัดซื้อจัดจ้าง',
      desc: 'ระบบการจัดซื้อจัดจ้างภาครัฐ กรมบัญชีกลาง',
      url: 'http://www.gprocurement.go.th',
      icon: 'FileText',
      badge: 'งานพัสดุและงบประมาณ',
      color: 'slate',
      isExternal: true
    }
  ],
  contactStripTitle: 'ติดต่อสอบถามข้อมูล หรือประสานงานราชการ',
  contactStripDesc: 'เปิดทำการวันจันทร์ - ศุกร์ เวลา 08.00 - 16.30 น. (เว้นวันหยุดราชการ)',
  contactStripButtonDrive: 'ดาวน์โหลดเอกสาร Drive',
  contactStripButtonMap: 'แผนที่และการเดินทาง',
  videoSectionTitle: 'วิดีโอกิจกรรมและผลงานสถานศึกษา',
  videoSectionSubtitle: 'ประมวลภาพเคลื่อนไหว การจัดการเรียนรู้ และกิจกรรมส่งเสริมศักยภาพผู้เรียน',
  videoSectionMaxItems: 4,
  sectionsVisibility: {
    heroStats: true,
    urgentTicker: true,
    directorWelcome: true,
    educationalPillars: true,
    recentNews: true,
    recentGallery: true,
    videoGallery: true,
    quickLinks: true,
    communityGovernance: true,
    contactStrip: true
  },
  address: 'หมู่ที่ 16 ตำบลหนองแวง อำเภอหนองบัวแดง จังหวัดชัยภูมิ 36210',
  phone: '043-221-589',
  email: 'office@bnr.ac.th',
  facebookUrl: 'https://facebook.com/bannareeschool',
  googleMapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d1611.3461006805749!2d101.66805158277649!3d16.102838213174568!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1z4LmC4Lij4LiH4LmA4Lij4Li14Lii4LiZ4Lia4LmJ4Liy4LiZ4LiZ4Liy4Lij4Li1IOC4q-C4oeC4ueC5iOC4l-C4teC5iCAxNiDguJXguLPguJrguKXguKvguJnguK3guIfguYHguKfguIcg4Lit4Liz4LmA4Lig4Lit4Lir4LiZ4Lit4LiH4Lia4Lix4Lin4LmB4LiU4LiHIOC4iOC4seC4h-C4q-C4p-C4seC4lOC4iuC4seC4ouC4oOC4ueC4oeC4tCAzNjIxMA!5e0!3m2!1sth!2sth!4v1793280292522!5m2!1sth!2sth',
  studentCount: 385,
  teacherCount: 22,
  classroomCount: 12,
  updatedAt: new Date().toISOString()
};

export const initialStaff: StaffMember[] = [
  {
    id: 'staff-01',
    prefix: 'นาย',
    name: 'สมศักดิ์ ปัญญาวงศ์',
    position: 'ผู้อำนวยการสถานศึกษา',
    academicRank: 'วิทยฐานะ ชำนาญการพิเศษ',
    department: 'ฝ่ายบริหารสถานศึกษา',
    roleCategory: 'executive',
    education: 'กศ.ม. การบริหารการศึกษา มหาวิทยาลัยขอนแก่น',
    email: 'somsak.p@bnr.ac.th',
    phone: '081-998-1234',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    order: 1
  },
  {
    id: 'staff-02',
    prefix: 'นางสาว',
    name: 'พิมพ์ชนก รัตนศิริ',
    position: 'รองผู้อำนวยการสถานศึกษา',
    academicRank: 'วิทยฐานะ ชำนาญการ',
    department: 'ฝ่ายบริหารสถานศึกษา',
    roleCategory: 'executive',
    education: 'ค.ม. การบริหารการศึกษา จุฬาลงกรณ์มหาวิทยาลัย',
    email: 'pimchanok.r@bnr.ac.th',
    phone: '082-345-6789',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    order: 2
  },
  {
    id: 'staff-03',
    prefix: 'นาง',
    name: 'กานดา วงศ์สุวรรณ',
    position: 'ครู หัวหน้ากลุ่มสาระฯ ภาษาไทย',
    academicRank: 'วิทยฐานะ ชำนาญการพิเศษ',
    department: 'กลุ่มสาระการเรียนรู้ภาษาไทย',
    roleCategory: 'teacher',
    education: 'ศศ.บ. ภาษาไทย มหาวิทยาลัยเชียงใหม่',
    email: 'kanda.w@bnr.ac.th',
    phone: '084-555-1122',
    imageUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&q=80&w=400',
    order: 3
  },
  {
    id: 'staff-04',
    prefix: 'นาย',
    name: 'ธีรภัทร เจริญสุข',
    position: 'ครู หัวหน้ากลุ่มสาระฯ คณิตศาสตร์',
    academicRank: 'วิทยฐานะ ชำนาญการ',
    department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    roleCategory: 'teacher',
    education: 'วท.บ. คณิตศาสตร์ มหาวิทยาลัยขอนแก่น',
    email: 'theeraphat.c@bnr.ac.th',
    phone: '089-123-4567',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    order: 4
  },
  {
    id: 'staff-05',
    prefix: 'นางสาว',
    name: 'ณิชานันท์ บุญชู',
    position: 'ครู หัวหน้ากลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี',
    academicRank: 'วิทยฐานะ ชำนาญการ',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    roleCategory: 'teacher',
    education: 'วท.ม. เทคโนโลยีสารสนเทศและการสื่อสาร',
    email: 'nichanan.b@bnr.ac.th',
    phone: '086-778-9900',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    order: 5
  },
  {
    id: 'staff-06',
    prefix: 'นาย',
    name: 'อภิสิทธิ์ ศรีสวัสดิ์',
    position: 'ครู หัวหน้ากลุ่มสาระฯ สังคมศึกษา ศาสนาและวัฒนธรรม',
    academicRank: 'วิทยฐานะ ชำนาญการ',
    department: 'กลุ่มสาระการเรียนรู้สังคมศึกษาฯ',
    roleCategory: 'teacher',
    education: 'ศศ.บ. ประวัติศาสตร์ มหาวิทยาลัยธรรมศาสตร์',
    email: 'aphisit.s@bnr.ac.th',
    phone: '083-441-2233',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    order: 6
  },
  {
    id: 'staff-07',
    prefix: 'นางสาว',
    name: 'วราภรณ์ มิตรภาพ',
    position: 'ครู หัวหน้ากลุ่มสาระฯ ภาษาต่างประเทศ',
    academicRank: 'วิทยฐานะ ครู คศ.1',
    department: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
    roleCategory: 'teacher',
    education: 'ศศ.บ. ภาษาอังกฤษ มหาวิทยาลัยบูรพา',
    email: 'waraporn.m@bnr.ac.th',
    phone: '087-991-3344',
    imageUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400',
    order: 7
  },
  {
    id: 'staff-08',
    prefix: 'นาย',
    name: 'อนุชา บุญทวี',
    position: 'เจ้าหน้าที่ธุรการและสารสนเทศ',
    academicRank: 'พนักงานราชการ',
    department: 'ฝ่ายสนับสนุนการศึกษาและธุรการ',
    roleCategory: 'support',
    education: 'บธ.บ. คอมพิวเตอร์ธุรกิจ',
    email: 'anucha.b@bnr.ac.th',
    phone: '085-222-3344',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    order: 8
  }
];

export const initialBoardMembers: BoardMember[] = [
  {
    id: 'board-01',
    name: 'นายชวลิต ธนพัฒน์สกุล',
    boardType: 'basic_education',
    roleInBoard: 'ประธานกรรมการสถานศึกษาขั้นพื้นฐาน',
    representation: 'ผู้ทรงคุณวุฒิด้านการศึกษา',
    occupation: 'อดีตศึกษานิเทศก์เชี่ยวชาญ',
    phone: '081-555-0199',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    order: 1
  },
  {
    id: 'board-02',
    name: 'นายวิเชียร สมบูรณ์ชัย',
    boardType: 'basic_education',
    roleInBoard: 'กรรมการ',
    representation: 'ผู้แทนองค์กรชุมชน',
    occupation: 'กำนันตำบลบ้านนารี',
    phone: '089-444-2211',
    imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400',
    order: 2
  },
  {
    id: 'board-03',
    name: 'พระครูสุวรรณปัญญากร',
    boardType: 'basic_education',
    roleInBoard: 'กรรมการ',
    representation: 'ผู้แทนพระภิกษุสงฆ์ / องค์กรศาสนา',
    occupation: 'เจ้าอาวาสวัดบ้านนารี',
    order: 3
  },
  {
    id: 'board-04',
    name: 'นางมาลี เกียรติไพบูลย์',
    boardType: 'basic_education',
    roleInBoard: 'กรรมการ',
    representation: 'ผู้แทนองค์กรปกครองส่วนท้องถิ่น',
    occupation: 'รองนายก อบต. บ้านนารี',
    phone: '084-332-1100',
    imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400',
    order: 4
  },
  {
    id: 'board-05',
    name: 'นายเกรียงไกร ชัยเจริญ',
    boardType: 'basic_education',
    roleInBoard: 'กรรมการ',
    representation: 'ผู้แทนศิษย์เก่า',
    occupation: 'วิศวกรและประธานชมรมศิษย์เก่า',
    phone: '086-112-9988',
    imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400',
    order: 5
  },
  {
    id: 'board-06',
    name: 'นายสมศักดิ์ ปัญญาวงศ์',
    boardType: 'basic_education',
    roleInBoard: 'กรรมการและเลขานุการ',
    representation: 'ผู้อำนวยการสถานศึกษา',
    occupation: 'ผู้อำนวยการโรงเรียนบ้านนารี',
    phone: '081-998-1234',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    order: 6
  },
  // Parents Network Committee
  {
    id: 'parent-01',
    name: 'นายบรรจง โคตรสมบัติ',
    boardType: 'parents_network',
    roleInBoard: 'ประธานคณะกรรมการเครือข่ายผู้ปกครอง',
    representation: 'ผู้ปกครองระดับชั้นประถมศึกษาปีที่ 6',
    occupation: 'ธุรกิจส่วนตัว',
    phone: '088-777-1234',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    order: 1
  },
  {
    id: 'parent-02',
    name: 'นางศิริพร บุญเสริม',
    boardType: 'parents_network',
    roleInBoard: 'รองประธานเครือข่ายผู้ปกครอง',
    representation: 'ผู้ปกครองระดับชั้นประถมศึกษาปีที่ 3',
    occupation: 'ข้าราชการบำนาญ',
    phone: '087-654-3210',
    imageUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400',
    order: 2
  },
  {
    id: 'parent-03',
    name: 'นายวรพจน์ มณีรัตน์',
    boardType: 'parents_network',
    roleInBoard: 'กรรมการและเหรัญญิก',
    representation: 'ผู้ปกครองระดับชั้นมัธยมศึกษาปีที่ 2',
    occupation: 'พนักงานรัฐวิสาหกิจ',
    phone: '083-999-8877',
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400',
    order: 3
  },
  {
    id: 'parent-04',
    name: 'นางวรรณา ประเสริฐสังข์',
    boardType: 'parents_network',
    roleInBoard: 'กรรมการและเลขานุการ',
    representation: 'ผู้ปกครองระดับชั้นอนุบาล 3',
    occupation: 'พยาบาลวิชาชีพ',
    phone: '082-111-4455',
    imageUrl: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80&w=400',
    order: 4
  }
];

export const initialNews: NewsPost[] = [
  {
    id: 'news-01',
    title: 'โรงเรียนบ้านนารี รับรางวัลสถานศึกษาปลอดภัย ระดับดีเด่น ประจำปีการศึกษา 2568',
    category: 'news',
    summary: 'โรงเรียนบ้านนารีได้รับโล่รางวัลเกียรติยศสถานศึกษาปลอดภัยและสุขอนามัยดีเด่น ระดับเขตพื้นที่การศึกษา',
    content: 'โรงเรียนบ้านนารี ภายใต้การนำของผู้อำนวยการสมศักดิ์ ปัญญาวงศ์ พร้อมด้วยคณะครู บุคลากร และคณะกรรมการสถานศึกษา ได้รับคัดเลือกให้รับรางวัลเกียรติยศ "สถานศึกษาปลอดภัยและสุขภาพอนามัยดีเด่น" ประจำปีการศึกษา 2568 จากสำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.) ซึ่งสะท้อนถึงความมุ่งมั่นในการดูแลความปลอดภัยของลูกหลานนักเรียนในทุกมิติ ทั้งด้านอุบัติเหตุ สุขอนามัย และสิ่งแวดล้อม',
    coverImage: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1000',
    authorName: 'ฝ่ายประชาสัมพันธ์ โรงเรียนบ้านนารี',
    authorId: 'system',
    driveFileId: 'demo-doc-01',
    driveFileName: 'เกียรติบัตรสถานศึกษาปลอดภัย_2568.pdf',
    driveFileUrl: 'https://drive.google.com',
    published: true,
    pinned: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    views: 342
  },
  {
    id: 'news-02',
    title: 'ประกาศรับสมัครบุคคลเพื่อเลือกสรรเป็นพนักงานจ้างเหมาบริการ ตำแหน่งเจ้าหน้าที่ธุรการ',
    category: 'announcement',
    summary: 'เปิดรับสมัครบุคคลทั่วไปเพื่อสอบคัดเลือกเป็นพนักงานจ้างเหมาบริการ ปฏิบัติหน้าที่งานธุรการและสารสนเทศ',
    content: 'ด้วยโรงเรียนบ้านนารี มีความประสงค์จะรับสมัครบุคคลเพื่อจัดจ้างเป็นพนักงานจ้างเหมาบริการ ตำแหน่งเจ้าหน้าที่ธุรการ จำนวน 1 อัตรา อัตราค่าจ้างเดือนละ 12,000 บาท ผู้สนใจสามารถยื่นใบสมัครด้วยตนเองได้ที่ห้องธุรการ โรงเรียนบ้านนารี ตั้งแต่วันที่ 1-15 พฤศจิกายน 2569 ในวันและเวลาราชการ หรือดาวน์โหลดระเบียบการและใบสมัครจากลิงก์ Google Drive ด้านล่างนี้',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000',
    authorName: 'ฝ่ายบริหารงานบุคคล',
    authorId: 'system',
    driveFileId: 'demo-doc-02',
    driveFileName: 'ประกาศรับสมัคร_ธุรการ_2569.pdf',
    driveFileUrl: 'https://drive.google.com',
    published: true,
    pinned: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    views: 215
  },
  {
    id: 'news-03',
    title: 'ประกาศผลการจัดซื้อจัดจ้าง โครงการปรับปรุงระบบห้องปฏิบัติการคอมพิวเตอร์และเครือข่าย',
    category: 'procurement',
    summary: 'ประกาศผู้ชนะการเสนอราคา จ้างปรับปรุงห้องปฏิบัติการคอมพิวเตอร์เพื่อการศึกษา',
    content: 'ตามที่โรงเรียนบ้านนารี ได้มีโครงการปรับปรุงระบบห้องปฏิบัติการคอมพิวเตอร์และระบบเครือข่ายอินเทอร์เน็ตความเร็วสูงเพื่อการเรียนรู้ ประจำปีงบประมาณ 2569 บัดนี้ คณะกรรมการได้ดำเนินการพิจารณาผลการเสนอราคาเป็นที่เรียบร้อย จึงขอประกาศผู้ได้รับการคัดเลือกตามเอกสารแนบ',
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000',
    authorName: 'งานพัสดุและสินทรัพย์',
    authorId: 'system',
    driveFileId: 'demo-doc-03',
    driveFileName: 'ประกาศผู้ชนะเสนอราคา_ปรับปรุงระบบคอม.pdf',
    driveFileUrl: 'https://drive.google.com',
    published: true,
    pinned: false,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    views: 128
  },
  {
    id: 'news-04',
    title: 'ขอเชิญผู้ปกครองเข้าร่วมการประชุมใหญ่เครือข่ายผู้ปกครอง ภาคเรียนที่ 2',
    category: 'academic',
    summary: 'ขอเชิญผู้ปกครองทุกระดับชั้นร่วมประชุมเพื่อรับฟังนโยบายการจัดการศึกษาและรับผลสัมฤทธิ์ทางการเรียน',
    content: 'คณะกรรมการเครือข่ายผู้ปกครองร่วมกับโรงเรียนบ้านนารี ขอเรียนเชิญผู้ปกครองนักเรียนทุกระดับชั้น (อนุบาล 2 ถึง มัธยมศึกษาปีที่ 3) เข้าร่วมการประชุมใหญ่เครือข่ายผู้ปกครอง ประจำภาคเรียนที่ 2 ณ หอประชุมเฉลิมพระเกียรติ เพื่อร่วมแลกเปลี่ยนความคิดเห็น และรับฟังแนวทางการส่งเสริมการเรียนรู้ของบุตรหลาน',
    coverImage: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=1000',
    authorName: 'เครือข่ายผู้ปกครอง',
    authorId: 'system',
    driveFileId: 'demo-doc-04',
    driveFileName: 'กำหนดการประชุมเครือข่ายผู้ปกครอง.pdf',
    driveFileUrl: 'https://drive.google.com',
    published: true,
    pinned: false,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    views: 180
  }
];

export const initialGallery: GalleryAlbum[] = [
  {
    id: 'gallery-01',
    title: 'กิจกรรมสัปดาห์วันวิทยาศาสตร์และนวัตกรรมเยาวชน ประจำปีการศึกษา 2568',
    description: 'นักเรียนทุกระดับชั้นร่วมจัดนิทรรศการโครงงานสะเต็ม (STEM) การแข่งขันตอบปัญหาวิทยาศาสตร์ และการประกวดสิ่งประดิษฐ์จากวัสดุรีไซเคิล',
    activityDate: '18 สิงหาคม 2568',
    coverImage: '/src/assets/images/school_stem_learning_1792082310522.jpg',
    images: [
      '/src/assets/images/school_stem_learning_1792082310522.jpg',
      'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800'
    ],
    authorId: 'system',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'gallery-02',
    title: 'พิธีไหว้ครู น้อมรำลึกพระคุณครู ประจำปีการศึกษา 2568',
    description: 'ตัวแทนนักเรียนนำพานไหว้ครูร่วมพิธีแสดงความกตัญญูกตเวทิตาต่อคุณครู ณ หอประชุมโรงเรียนบ้านนารี',
    activityDate: '12 มิถุนายน 2568',
    coverImage: '/src/assets/images/hero_school_campus_1792082308721.jpg',
    images: [
      '/src/assets/images/hero_school_campus_1792082308721.jpg',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800'
    ],
    authorId: 'system',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString()
  },
  {
    id: 'gallery-03',
    title: 'กิจกรรมส่งเสริมวิถีพอเพียง ปลูกผักสวนครัวและแปลงเกษตรอินทรีย์',
    description: 'ครูและนักเรียนร่วมกันดูแลแปลงเกษตรเพื่ออาหารกลางวัน ปลูกผักปลอดสารพิษเพื่อนำมาประกอบอาหารกลางวันสำหรับนักเรียนทุกคน',
    activityDate: '25 กรกฎาคม 2568',
    coverImage: '/src/assets/images/school_sufficiency_farm_1792082310023.jpg',
    images: [
      '/src/assets/images/school_sufficiency_farm_1792082310023.jpg',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800'
    ],
    authorId: 'system',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
  }
];

export const initialDriveSettings: DriveSettings = {
  id: 'main',
  centralFolderId: '',
  centralFolderName: 'โรงเรียนบ้านนารี - คลังเอกสารส่วนกลาง',
  centralFolderUrl: '',
  sharedDriveName: 'Ban Naree School Cloud Storage',
  allowPublicDownload: true,
  departmentFolders: [],
  updatedAt: new Date().toISOString()
};

export const initialCategories: PostCategory[] = [
  {
    id: 'cat-news',
    name: 'ข่าวประชาสัมพันธ์',
    slug: 'news',
    description: 'ข่าวสารทั่วไป กิจกรรมความเคลื่อนไหว และเรื่องราวดีๆ ภายในโรงเรียนบ้านนารี',
    color: 'blue',
    order: 1
  },
  {
    id: 'cat-announcement',
    name: 'ประกาศทางการ',
    slug: 'announcement',
    description: 'ประกาศ คำสั่งราชการ ระเบียบปฏิบัติต่างๆ ของสถานศึกษา',
    color: 'amber',
    order: 2
  },
  {
    id: 'cat-academic',
    name: 'งานวิชาการ & นวัตกรรม',
    slug: 'academic',
    description: 'ข่าวสารการเรียนรู้ โครงงาน STEM กิจกรรมแข่งขันทักษะ และผลงานทางวิชาการ',
    color: 'emerald',
    order: 3
  },
  {
    id: 'cat-procurement',
    name: 'จัดซื้อจัดจ้าง & พัสดุ',
    slug: 'procurement',
    description: 'ประกาศแผนจัดซื้อจัดจ้าง ผลการเสนอราคา และงานพัสดุตามระเบียบราชการ',
    color: 'purple',
    order: 4
  },
  {
    id: 'cat-activity',
    name: 'กิจกรรมพัฒนาผู้เรียน',
    slug: 'activity',
    description: 'ค่ายคุณธรรม ลูกเสือ เนตรนารี ทัศนศึกษา และกิจกรรมส่งเสริมวินัยนักเรียน',
    color: 'rose',
    order: 5
  },
  {
    id: 'cat-admission',
    name: 'รับสมัครนักเรียน & บุคลากร',
    slug: 'admission',
    description: 'ประกาศรับสมัครนักเรียนใหม่ทุกระดับชั้น และการสรรหาบุคลากรทางการศึกษา',
    color: 'indigo',
    order: 6
  }
];

export const initialMediaItems: MediaItem[] = [
  {
    id: 'media-01',
    name: 'บรรยากาศอาคารเรียนและสนามหญ้าโรงเรียนบ้านนารี',
    url: '/src/assets/images/hero_school_campus_1792082308721.jpg',
    thumbnailUrl: '/src/assets/images/hero_school_campus_1792082308721.jpg',
    mimeType: 'image/jpeg',
    size: '1.2 MB',
    uploadedAt: new Date().toISOString(),
    source: 'asset'
  },
  {
    id: 'media-02',
    name: 'ภาพผู้อำนวยการโรงเรียนบ้านนารี (นายสมศักดิ์ ปัญญาวงศ์)',
    url: '/src/assets/images/school_director_portrait_1792082309465.jpg',
    thumbnailUrl: '/src/assets/images/school_director_portrait_1792082309465.jpg',
    mimeType: 'image/jpeg',
    size: '850 KB',
    uploadedAt: new Date().toISOString(),
    source: 'asset'
  },
  {
    id: 'media-03',
    name: 'ภาพกิจกรรมสะเต็มศึกษา STEM และหุ่นยนต์ในห้องเรียน',
    url: '/src/assets/images/school_stem_learning_1792082310522.jpg',
    thumbnailUrl: '/src/assets/images/school_stem_learning_1792082310522.jpg',
    mimeType: 'image/jpeg',
    size: '980 KB',
    uploadedAt: new Date().toISOString(),
    source: 'asset'
  },
  {
    id: 'media-04',
    name: 'ภาพโครงการเศรษฐกิจพอเพียง แปลงเกษตรอินทรีย์โรงเรียน',
    url: '/src/assets/images/school_sufficiency_farm_1792082310023.jpg',
    thumbnailUrl: '/src/assets/images/school_sufficiency_farm_1792082310023.jpg',
    mimeType: 'image/jpeg',
    size: '1.1 MB',
    uploadedAt: new Date().toISOString(),
    source: 'asset'
  }
];

export const initialVideos: VideoItem[] = [
  {
    id: 'video-01',
    title: 'วีดิทัศน์แนะนำสถานศึกษา โรงเรียนบ้านนารี สพป.ชัยภูมิ เขต 1',
    description: 'ประมวลภาพการจัดการเรียนการสอน ภูมิทัศน์อาคารสถานที่ และการพัฒนาศักยภาพผู้เรียนรอบด้าน สู่โรงเรียนคุณภาพประจำตำบล',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800',
    youtubeId: 'dQw4w9WgXcQ',
    duration: '06:45 นาที',
    category: 'วิดีโอประชาสัมพันธ์',
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: 'system'
  },
  {
    id: 'video-02',
    title: 'กิจกรรมส่งเสริมการเรียนรู้ STEM Coding & Robotics ห้องเรียนเทคโนโลยี',
    description: 'นักเรียนโรงเรียนบ้านนารีลงมือปฏิบัติการเขียนโค้ดและทดสอบหุ่นยนต์เพื่อแก้ปัญหาตามโจทย์สะเต็มศึกษา',
    videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    thumbnailUrl: '/src/assets/images/school_stem_learning_1792082310522.jpg',
    youtubeId: 'kJQP7kiw5Fk',
    duration: '04:18 นาที',
    category: 'วิชาการและเทคโนโลยี',
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: 'system'
  },
  {
    id: 'video-03',
    title: 'การแสดงนาฏศิลป์พื้นบ้านอีสาน วงโปงลางโรงเรียนบ้านนารี งานเปิดโลกวิชาการ',
    description: 'การอนุรักษ์ศิลปวัฒนธรรมท้องถิ่นและการแสดงศักยภาพทางดนตรีพื้นบ้านของนักเรียนโรงเรียนบ้านนารี',
    videoUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    thumbnailUrl: '/src/assets/images/hero_school_campus_1792082308721.jpg',
    youtubeId: 'fJ9rUzIMcZQ',
    duration: '05:32 นาที',
    category: 'กิจกรรมโรงเรียน',
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: 'system'
  }
];

export const initialPublicDocuments: PublicDocumentItem[] = [
  {
    id: 'doc-sar-2568',
    title: 'รายงานการประเมินตนเองของสถานศึกษา (SAR) ประจำปีการศึกษา 2568',
    category: 'sar',
    academicYearBE: 2568,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfFileName: 'SAR_โรงเรียนบ้านนารี_ปีการศึกษา_2568.pdf',
    fileSize: '4.8 MB',
    source: 'drive',
    driveFileId: 'demo-sar-2568',
    published: true,
    downloads: 142,
    authorId: 'system',
    authorName: 'ฝ่ายบริหารงานวิชาการและประกันคุณภาพ',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-sar-2567',
    title: 'รายงานการประเมินตนเองของสถานศึกษา (SAR) ประจำปีการศึกษา 2567',
    category: 'sar',
    academicYearBE: 2567,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfFileName: 'SAR_โรงเรียนบ้านนารี_ปีการศึกษา_2567.pdf',
    fileSize: '5.2 MB',
    source: 'drive',
    driveFileId: 'demo-sar-2567',
    published: true,
    downloads: 98,
    authorId: 'system',
    authorName: 'ฝ่ายบริหารงานวิชาการและประกันคุณภาพ',
    createdAt: new Date(Date.now() - 86400000 * 380).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-plan-2569',
    title: 'แผนปฏิบัติการประจำปีงบประมาณ พ.ศ. 2569 โรงเรียนบ้านนารี',
    category: 'budget',
    academicYearBE: 2569,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfFileName: 'แผนปฏิบัติการประจำปี_2569_รร.บ้านนารี.pdf',
    fileSize: '3.1 MB',
    source: 'upload',
    published: true,
    downloads: 76,
    authorId: 'system',
    authorName: 'ฝ่ายบริหารงบประมาณและแผนงาน',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-curriculum-2569',
    title: 'หลักสูตรสถานศึกษา โรงเรียนบ้านนารี (ฉบับปรับปรุง พ.ศ. 2569)',
    category: 'academic',
    academicYearBE: 2569,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfFileName: 'หลักสูตรสถานศึกษา_ฉบับปรับปรุง2569.pdf',
    fileSize: '6.4 MB',
    source: 'drive',
    published: true,
    downloads: 115,
    authorId: 'system',
    authorName: 'งานพัฒนาหลักสูตรและวิชาการ',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-personnel-2569',
    title: 'คู่มือการปฏิบัติงานครูและบุคลากรทางการศึกษา ประจำปีการศึกษา 2569',
    category: 'personnel',
    academicYearBE: 2569,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfFileName: 'คู่มือการปฏิบัติงานบุคลากร_2569.pdf',
    fileSize: '2.5 MB',
    source: 'upload',
    published: true,
    downloads: 64,
    authorId: 'system',
    authorName: 'ฝ่ายบริหารงานบุคคล',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-general-2569',
    title: 'ระเบียบโรงเรียนบ้านนารีว่าด้วยความปลอดภัยและการดูแลช่วยเหลือนักเรียน',
    category: 'general',
    academicYearBE: 2569,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfFileName: 'ระเบียบความปลอดภัยและดูแลช่วยเหลือนักเรียน.pdf',
    fileSize: '1.9 MB',
    source: 'drive',
    published: true,
    downloads: 82,
    authorId: 'system',
    authorName: 'ฝ่ายบริหารทั่วไปและกิจการนักเรียน',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

