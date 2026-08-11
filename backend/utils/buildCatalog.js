// Builds backend/data/products.json from catalogSpecs.json + image-manifest.json
// Usage: node backend/utils/buildCatalog.js
const fs = require('fs');
const path = require('path');

const SPECS = require('../data/catalogSpecs.json');
const MANIFEST = require('../data/image-manifest.json');

const REVIEWER = [
  { user: '507f1f77bcf86cd799439011', userName: 'Rahul Sharma' },
  { user: '507f191e810c19729de860ea', userName: 'Priya Patel' },
  { user: '5f6a7b8c9d0e1f2a3b4c5d6e', userName: 'Amit Verma' },
  { user: '6123a4b5c6d7e8f901234567', userName: 'Sneha Iyer' },
  { user: '6234b5c6d7e8f90123456789', userName: 'Vikram Singh' },
  { user: '6345c6d7e8f9012345678901', userName: 'Ananya Rao' },
];

// Per-product realistic commerce data (INR pricing).
// Images are picked from image-manifest.json, not authored here.
const DETAILS = {
  'samsung-galaxy-s24-ultra': {
    brand: 'Samsung', seller: 'Samsung Official Store',
    price: 124999, mrp: 134999, stock: 45, ratings: 4.6, numOfReviews: 4,
    warranty: '1 Year Manufacturer Warranty for Device & 6 Months for Accessories',
    description: 'The Samsung Galaxy S24 Ultra brings Galaxy AI, a titanium frame and an all-new 200MP camera system together in one powerhouse. The flat 6.8-inch QHD+ AMOLED panel with adaptive 120Hz refresh makes every swipe feel instant, while S Pen support keeps you productive on the move.',
    specifications: [
      { label: 'Display', value: '6.8-inch QHD+ Dynamic AMOLED 2X, 120Hz, 2600 nits peak' },
      { label: 'Processor', value: 'Qualcomm Snapdragon 8 Gen 3 (4nm)' },
      { label: 'RAM', value: '12GB LPDDR5X' },
      { label: 'Storage', value: '256GB, expandable via microSD' },
      { label: 'Rear Camera', value: '200MP main + 50MP 5x tele + 10MP 3x tele + 12MP ultra-wide' },
      { label: 'Front Camera', value: '12MP with autofocus' },
      { label: 'Battery', value: '5000mAh with 45W fast charging' },
      { label: 'Operating System', value: 'Android 14 with One UI 6.1 (Galaxy AI)' },
      { label: 'Build', value: 'Titanium frame with Gorilla Armor glass' },
      { label: 'Connectivity', value: '5G, Wi-Fi 7, Bluetooth 5.3, UWB' }
    ],
    features: [
      'Galaxy AI: Circle to Search, Live Translate and photo editing tools',
      '200MP main camera with 8K video recording',
      'Built-in S Pen for note-taking and precision input',
      'Titanium frame for a lighter, stronger build',
      '5000mAh battery with 45W wired and 15W wireless charging',
      'IP68 water and dust resistance'
    ],
    highlights: [
      '6.8-inch QHD+ AMOLED 2X display with 120Hz refresh',
      'Snapdragon 8 Gen 3 processor',
      '200MP quad rear camera with 100x Space Zoom',
      'S Pen support included in the box',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 5, title: 'Best Android flagship', comment: 'The camera zoom is unreal and the flat display is great for S Pen use. Battery easily lasts a day and a half.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Premium but heavy', comment: 'Superb build and display. Slightly heavy to hold but you get used to it. Fast charging is quick.' }
    ]
  },
  'apple-iphone-16-pro': {
    brand: 'Apple', seller: 'Apple Store Online',
    price: 119900, mrp: 129900, stock: 30, ratings: 4.7, numOfReviews: 4,
    warranty: '1 Year Apple Limited Warranty',
    description: 'The iPhone 16 Pro is built with aerospace-grade titanium and powered by the A18 Pro chip. The new Camera Control button gives quick access to a 48MP main camera and 4K 120fps video, while Apple Intelligence helps with writing, notifications and image cleanup.',
    specifications: [
      { label: 'Display', value: '6.3-inch Super Retina XDR with ProMotion 120Hz' },
      { label: 'Processor', value: 'A18 Pro chip with 16-core Neural Engine' },
      { label: 'RAM', value: '8GB' },
      { label: 'Storage', value: '256GB NVMe' },
      { label: 'Rear Camera', value: '48MP Fusion + 48MP ultra-wide + 12MP 5x telephoto' },
      { label: 'Front Camera', value: '12MP TrueDepth' },
      { label: 'Battery', value: '3582mAh with 25W fast charging' },
      { label: 'Operating System', value: 'iOS 18 with Apple Intelligence' },
      { label: 'Build', value: 'Grade 5 titanium frame, Ceramic Shield front' },
      { label: 'Connectivity', value: '5G, Wi-Fi 7, Bluetooth 5.3, USB-C' }
    ],
    features: [
      'Titanium design that is lighter and stronger',
      'Camera Control button for one-handed shooting',
      'Apple Intelligence for writing and image tools',
      '4K 120fps Dolby Vision video recording',
      'USB-C with USB 3 data speeds',
      'IP68 water resistance and always-on display'
    ],
    highlights: [
      '6.3-inch ProMotion 120Hz display',
      'A18 Pro chip with Apple Intelligence',
      '48MP triple camera with 5x zoom',
      'Camera Control button',
      '1 Year Apple Limited Warranty'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Camera is a game changer', comment: 'The Camera Control button is intuitive and photos look incredible in low light. Titanium feels premium.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Worth the upgrade', comment: 'Fluid, fast and the battery lasts all day. Battery life is noticeably better than my older Pro.' }
    ]
  },
  'apple-iphone-15-pro': {
    brand: 'Apple', seller: 'Apple Store Online',
    price: 109999, mrp: 119900, stock: 38, ratings: 4.6, numOfReviews: 3,
    warranty: '1 Year Apple Limited Warranty',
    description: 'The iPhone 15 Pro swaps to a titanium frame and the A17 Pro chip, unlocking console-grade gaming and pro camera workflows. The 48MP main camera shoots detailed photos, and the new Action button puts your favourite shortcuts one press away.',
    specifications: [
      { label: 'Display', value: '6.1-inch Super Retina XDR with ProMotion 120Hz' },
      { label: 'Processor', value: 'A17 Pro with 6-core GPU' },
      { label: 'RAM', value: '8GB' },
      { label: 'Storage', value: '256GB NVMe' },
      { label: 'Rear Camera', value: '48MP main + 12MP ultra-wide + 12MP 3x telephoto' },
      { label: 'Front Camera', value: '12MP TrueDepth' },
      { label: 'Battery', value: '3274mAh with 20W fast charging' },
      { label: 'Operating System', value: 'iOS 17' },
      { label: 'Build', value: 'Titanium frame with Ceramic Shield' },
      { label: 'Connectivity', value: '5G, Wi-Fi 6E, Bluetooth 5.3, USB-C' }
    ],
    features: [
      'Aerospace-grade titanium build',
      'Action button for custom shortcuts',
      'A17 Pro chip for console-grade gaming',
      '48MP Pro camera with next-gen portraits',
      'USB-C with USB 3 speeds',
      'Always-on display with StandBy mode'
    ],
    highlights: [
      '6.1-inch ProMotion 120Hz display',
      'A17 Pro chip with 6-core GPU',
      '48MP pro camera system',
      'Titanium design',
      '1 Year Apple Limited Warranty'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 5, title: 'Lighter and faster', comment: 'The titanium makes a real difference in hand. Gaming is smooth and the Action button is handy.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 4, title: 'Great phone, slow charging', comment: 'Camera and display are fantastic. Charging is still capped at 20W which feels slow compared to rivals.' }
    ]
  },
  'google-pixel-8-pro': {
    brand: 'Google', seller: 'Google Store India',
    price: 79999, mrp: 89999, stock: 52, ratings: 4.5, numOfReviews: 3,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Pixel 8 Pro combines Google Tensor G3 with the power of on-device AI. Magic Editor, Best Take and Audio Magic Eraser help you perfect shots in seconds, while a bright 120Hz LTPO display and 7 years of software updates make this a long-term keeper.',
    specifications: [
      { label: 'Display', value: '6.7-inch QHD+ LTPO OLED, 120Hz, 2400 nits' },
      { label: 'Processor', value: 'Google Tensor G3 with Titan M2 security' },
      { label: 'RAM', value: '12GB LPDDR5X' },
      { label: 'Storage', value: '256GB UFS 3.1' },
      { label: 'Rear Camera', value: '50MP main + 48MP ultra-wide + 48MP 5x telephoto' },
      { label: 'Front Camera', value: '10.5MP with autofocus' },
      { label: 'Battery', value: '5050mAh with 30W fast charging' },
      { label: 'Operating System', value: 'Android 14 with 7 years of updates' },
      { label: 'Build', value: 'Matte glass back with polished aluminium frame' },
      { label: 'Connectivity', value: '5G, Wi-Fi 7, Bluetooth 5.3, UWB' }
    ],
    features: [
      'Magic Editor and Best Take AI photo tools',
      'Google Tensor G3 with on-device AI',
      '7 years of OS and security updates',
      'Super Res Zoom up to 30x',
      'Pro controls and RAW capture',
      'Temperature sensor for quick readings'
    ],
    highlights: [
      '6.7-inch QHD+ LTPO OLED with 120Hz',
      'Google Tensor G3 processor',
      '50MP triple camera with 30x zoom',
      '7 years of software updates',
      'IP68 water resistance'
    ],
    reviews: [
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 5, title: 'Best camera for photos', comment: 'Magic Editor is genuinely useful and point-and-shoot photos beat everything else I tried.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 4, title: 'Clean Android experience', comment: 'Stock Android with fast updates. Battery is good but not class leading.' }
    ]
  },
  'apple-macbook-air-m2': {
    brand: 'Apple', seller: 'Apple Store Online',
    price: 99990, mrp: 109990, stock: 25, ratings: 4.7, numOfReviews: 4,
    warranty: '1 Year Apple Limited Warranty',
    description: 'The MacBook Air 13-inch with the M2 chip is utterly silent and surprisingly fast. The all-new wedge-free design is just 1.13kg, and the 13.6-inch Liquid Retina display with a notch makes it a pleasure to work on all day.',
    specifications: [
      { label: 'Display', value: '13.6-inch Liquid Retina, 2560x1664, 500 nits' },
      { label: 'Processor', value: 'Apple M2 (8-core CPU, 8-core GPU)' },
      { label: 'RAM', value: '16GB unified memory' },
      { label: 'Storage', value: '512GB SSD' },
      { label: 'Battery', value: 'Up to 18 hours video playback' },
      { label: 'Ports', value: '2x Thunderbolt/USB 4, MagSafe 3, 3.5mm jack' },
      { label: 'Keyboard', value: 'Backlit Magic Keyboard with Touch ID' },
      { label: 'Operating System', value: 'macOS Sonoma' },
      { label: 'Weight', value: '1.24 kg' },
      { label: 'Connectivity', value: 'Wi-Fi 6, Bluetooth 5.3' }
    ],
    features: [
      'Fanless M2 design with all-day battery',
      '18 hours of battery life on one charge',
      '1080p FaceTime HD camera',
      'MagSafe charging with fast charge support',
      'Touch ID for instant unlock and payments',
      'Space-saving 13.6-inch Liquid Retina display'
    ],
    highlights: [
      '13.6-inch Liquid Retina display',
      'Apple M2 chip',
      '16GB unified memory, 512GB SSD',
      'Up to 18 hours battery life',
      '1 Year Apple Limited Warranty'
    ],
    reviews: [
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'Silent workhorse', comment: 'Dead silent even under load and battery life is incredible. The design feels premium.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Perfect everyday laptop', comment: 'Light enough to carry everywhere. Display is vivid and Touch ID is super convenient.' }
    ]
  },
  'dell-xps-13': {
    brand: 'Dell', seller: 'Dell Official Store',
    price: 109990, mrp: 124990, stock: 22, ratings: 4.4, numOfReviews: 3,
    warranty: '1 Year On-Site Warranty',
    description: 'The Dell XPS 13 squeezes an edge-to-edge 13.4-inch display into a body the size of an 11-inch laptop. With a 12th Gen Intel Core processor and CNC-machined aluminium chassis, it is the premium ultrabook for professionals who value portability.',
    specifications: [
      { label: 'Display', value: '13.4-inch FHD+ InfinityEdge, 1920x1200' },
      { label: 'Processor', value: '12th Gen Intel Core i7-1250U' },
      { label: 'RAM', value: '16GB LPDDR5' },
      { label: 'Storage', value: '512GB NVMe SSD' },
      { label: 'Graphics', value: 'Intel Iris Xe' },
      { label: 'Battery', value: '51Wh with 45W USB-C fast charge' },
      { label: 'Ports', value: '2x Thunderbolt 4, microSD, 3.5mm jack' },
      { label: 'Keyboard', value: 'Backlit keyboard with fingerprint reader' },
      { label: 'Operating System', value: 'Windows 11 Home' },
      { label: 'Weight', value: '1.17 kg' }
    ],
    features: [
      'InfinityEdge bezels for a huge screen in a tiny body',
      'CNC-machined aluminium with carbon-fibre palm rest',
      'FHD+ display with excellent colour accuracy',
      'Thunderbolt 4 for docks and fast transfers',
      'Windows 11 with fingerprint login',
      'Just 1.17 kg, perfect for travel'
    ],
    highlights: [
      '13.4-inch FHD+ InfinityEdge display',
      '12th Gen Intel Core i7',
      '16GB RAM, 512GB SSD',
      '1.17 kg lightweight design',
      '1 Year On-Site Warranty'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Beautiful and portable', comment: 'The screen looks stunning with minimal bezels. Battery life is good but could be better.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Premium ultrabook', comment: 'Build quality is excellent. Fans stay quiet for daily tasks and it is genuinely light.' }
    ]
  },
  'lenovo-thinkpad-x1-carbon': {
    brand: 'Lenovo', seller: 'Lenovo Official Store',
    price: 129990, mrp: 142990, stock: 18, ratings: 4.5, numOfReviews: 3,
    warranty: '3 Years On-Site Warranty with Depot Repair',
    description: 'The ThinkPad X1 Carbon is the classic business ultrabook with an all-day 57Wh battery and military-grade durability. The 14-inch 2.8K display and legendary spill-resistant keyboard make it the choice for professionals who need reliability.',
    specifications: [
      { label: 'Display', value: '14-inch 2.8K IPS, 2880x1800, 400 nits' },
      { label: 'Processor', value: '13th Gen Intel Core i7-1365U' },
      { label: 'RAM', value: '32GB LPDDR5' },
      { label: 'Storage', value: '1TB NVMe SSD' },
      { label: 'Graphics', value: 'Intel Iris Xe' },
      { label: 'Battery', value: '57Wh with Rapid Charge' },
      { label: 'Ports', value: '2x Thunderbolt 4, 2x USB-A, HDMI 2.1' },
      { label: 'Keyboard', value: 'Spill-resistant backlit keyboard with TrackPoint' },
      { label: 'Operating System', value: 'Windows 11 Pro' },
      { label: 'Weight', value: '1.12 kg' }
    ],
    features: [
      'Military-grade MIL-STD-810H durability',
      'Legendary spill-resistant ThinkPad keyboard',
      '14-inch 2.8K display with Dolby Vision',
      'Rapid Charge: 0 to 80% in one hour',
      'FHD IR camera with privacy shutter',
      '3 years on-site warranty included'
    ],
    highlights: [
      '14-inch 2.8K IPS display',
      '13th Gen Intel Core i7, 32GB RAM, 1TB SSD',
      '1.12 kg carbon-fibre body',
      'MIL-STD-810H tested durability',
      '3 Years On-Site Warranty'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 5, title: 'Built for work', comment: 'Keyboard is the best I have typed on. It survives daily commutes without a scratch.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 4, title: 'Solid business laptop', comment: 'Reliable, fast and light. The display is bright enough for outdoor use.' }
    ]
  },
  'samsung-curved-uhd-55': {
    brand: 'Samsung', seller: 'Samsung Official Store',
    price: 69999, mrp: 79999, stock: 15, ratings: 4.3, numOfReviews: 3,
    warranty: '1 Year Comprehensive Warranty on Panel and Parts',
    description: 'Wrap your viewing space in the immersive curve of this Samsung 55-inch curved UHD TV. Crystal Processor 4K upscales all content to sharp near-4K clarity, while HDR and the curved panel pull you into every scene and game.',
    specifications: [
      { label: 'Display', value: '55-inch curved UHD (3840x2160) LED' },
      { label: 'Processor', value: 'Crystal Processor 4K' },
      { label: 'HDR', value: 'HDR10+ with PurColor' },
      { label: 'Sound', value: '20W 2ch speakers with Q-Symphony' },
      { label: 'Smart Features', value: 'Tizen OS with Samsung Smart Hub' },
      { label: 'Connectivity', value: '3x HDMI, 1x USB, Wi-Fi, Bluetooth' },
      { label: 'Refresh Rate', value: '60Hz with Motion Rate 120' },
      { label: 'Voice Assistant', value: 'Bixby + Alexa built-in' },
      { label: 'Wall Mount', value: 'VESA 200x200' },
      { label: 'Weight', value: '17.2 kg with stand' }
    ],
    features: [
      'Curved screen for immersive viewing',
      'Crystal Processor 4K upscaling',
      'HDR10+ for vivid contrast and colour',
      'Q-Symphony to sync with a Samsung soundbar',
      'Smart Hub with all streaming apps',
      'Ultra Slim design with clean cable routing'
    ],
    highlights: [
      '55-inch curved UHD panel',
      'HDR10+ support',
      'Tizen Smart Hub with streaming apps',
      'Q-Symphony sound sync',
      '1 Year Comprehensive Warranty'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Great curve, good value', comment: 'Movies look immersive and the upscaling of HD channels is impressive for the price.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 4, title: 'Nice in the living room', comment: 'Looks premium and viewing angles are good. Sound is okay, better with a soundbar.' }
    ]
  },
  'tcl-h9700-55': {
    brand: 'TCL', seller: 'TCL India Official Store',
    price: 54999, mrp: 64999, stock: 20, ratings: 4.2, numOfReviews: 3,
    warranty: '1 Year Comprehensive + 1 Year Panel Warranty',
    description: 'The TCL 55-inch H9700 uses Quantum Dot technology to reproduce a billion colours with stunning accuracy. Combined with 4K HDR, this QLED TV delivers cinema-quality pictures for movies, sports and gaming in your living room.',
    specifications: [
      { label: 'Display', value: '55-inch Quantum Dot QLED, 4K UHD (3840x2160)' },
      { label: 'Colour Volume', value: '100% DCI-P3 with Quantum Dot' },
      { label: 'HDR', value: 'HDR10+ and Dolby Vision' },
      { label: 'Sound', value: '30W 2.1ch with Dolby Atmos' },
      { label: 'Smart Features', value: 'Google TV with Google Assistant' },
      { label: 'Connectivity', value: '3x HDMI, 2x USB, Wi-Fi, Bluetooth' },
      { label: 'Refresh Rate', value: '60Hz with MEMC motion smoothing' },
      { label: 'Gaming', value: 'Game Master with low input lag' },
      { label: 'Wall Mount', value: 'VESA 300x200' },
      { label: 'Weight', value: '18.4 kg with stand' }
    ],
    features: [
      'Quantum Dot QLED for 1 billion colours',
      'Dolby Vision and HDR10+ support',
      'Dolby Atmos 30W 2.1ch sound',
      'Google TV with hands-free assistant',
      'Game Master mode for smooth gaming',
      'Slim bezel-less design'
    ],
    highlights: [
      '55-inch 4K QLED with Quantum Dot',
      'Dolby Vision + Dolby Atmos',
      'Google TV with built-in assistant',
      'MEMC motion enhancement',
      '2 Year Panel Warranty'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Colours pop', comment: 'Quantum Dot colours are vivid and Google TV makes finding apps easy. Great value QLED.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Excellent for movies', comment: 'Dolby Vision content looks superb. Soundbar recommended but onboard audio is decent.' }
    ]
  },
  'sennheiser-hd800s': {
    brand: 'Sennheiser', seller: 'Sennheiser India Store',
    price: 149990, mrp: 162990, stock: 6, ratings: 4.8, numOfReviews: 3,
    warranty: '2 Years International Warranty',
    description: 'The Sennheiser HD 800 S is a benchmark open-back reference headphone for the most demanding audiophiles. Its 56mm ring-radiator transducer delivers an exceptionally wide soundstage, while the open design lets every instrument breathe.',
    specifications: [
      { label: 'Type', value: 'Open-back, dynamic, circumaural' },
      { label: 'Driver', value: '56mm ring-radiator dynamic transducer' },
      { label: 'Frequency Response', value: '4 Hz - 51 kHz' },
      { label: 'Impedance', value: '300 ohm' },
      { label: 'Sensitivity', value: '102 dB (1 kHz, 1 Vrms)' },
      { label: 'Cable', value: 'Detachable 3m OFC cable with 6.35mm jack' },
      { label: 'Weight', value: '330 g' },
      { label: 'Accessories', value: 'Storage case, 4.4mm balanced cable' },
      { label: 'Sound Signature', value: 'Neutral with extended treble, wide soundstage' },
      { label: 'Warranty', value: '2 Years' }
    ],
    features: [
      'Reference-class open-back soundstage',
      '56mm ring-radiator drivers',
      'Damped, ultra-light steel headband',
      'Handcrafted in Germany',
      'Comfortable microfibre ear cushions',
      'Includes balanced 4.4mm cable'
    ],
    highlights: [
      'Open-back reference headphone',
      '56mm ring-radiator transducer',
      '4 Hz to 51 kHz frequency response',
      '300 ohm for dedicated amps',
      '2 Years International Warranty'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 5, title: 'Endgame headphones', comment: 'The soundstage is enormous. You need a good amp to drive them but the reward is worth it.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Audio nirvana', comment: 'Crystal clear, airy and detailed. Open back means you hear the room, which suits home listening.' }
    ]
  },
  'beyerdynamic-dt770-pro': {
    brand: 'Beyerdynamic', seller: 'Beyerdynamic India Store',
    price: 24999, mrp: 27999, stock: 40, ratings: 4.6, numOfReviews: 3,
    warranty: '2 Years Manufacturer Warranty',
    description: 'The Beyerdynamic DT 770 PRO 80 ohm is the studio classic trusted by engineers worldwide. Its closed-back design and accurate, detailed sound make it perfect for tracking, monitoring and long listening sessions.',
    specifications: [
      { label: 'Type', value: 'Closed-back, dynamic, circumaural' },
      { label: 'Driver', value: '45mm Tesla driver' },
      { label: 'Frequency Response', value: '5 Hz - 35 kHz' },
      { label: 'Impedance', value: '80 ohm' },
      { label: 'Sensitivity', value: '96 dB' },
      { label: 'Cable', value: '3m straight, coiled variant, 3.5mm jack' },
      { label: 'Weight', value: '270 g' },
      { label: 'Ear Pads', value: 'Replaceable velour' },
      { label: 'Sound Signature', value: 'Balanced with prominent bass' },
      { label: 'Warranty', value: '2 Years' }
    ],
    features: [
      'Professional studio reference sound',
      'Closed-back design for isolation',
      'Robust steel spring headband',
      'Replaceable velour ear pads',
      'Single-sided cable for easy storage',
      'Made in Germany'
    ],
    highlights: [
      'Studio-grade closed-back monitoring',
      '45mm dynamic drivers',
      '80 ohm - easy to drive from interfaces',
      'Replaceable parts for longevity',
      '2 Years Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Studio workhorse', comment: 'Flat and detailed, comfortable for hours. The closed back blocks out enough noise to track vocals.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Great for mixing', comment: 'Accurate lows and clear mids. A bit tight on the ears at first but they loosen up.' }
    ]
  },
  'bose-qc-ultra-earbuds': {
    brand: 'Bose', seller: 'Bose India Store',
    price: 26999, mrp: 29999, stock: 55, ratings: 4.6, numOfReviews: 3,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Bose QuietComfort Ultra earbuds deliver the strongest noise cancelling Bose has ever put in an earbud. With Bose Immersive Audio, CustomTune calibration and 6 hours per charge, they are built for flights, commutes and focus.',
    specifications: [
      { label: 'Type', value: 'True wireless in-ear with ear tips' },
      { label: 'Noise Cancelling', value: 'World-class ANC with Aware mode' },
      { label: 'Audio', value: 'Bose Immersive Audio with CustomTune' },
      { label: 'Driver', value: 'Custom tuned dynamic drivers' },
      { label: 'Battery', value: '6h earbuds, 30h total with case' },
      { label: 'Charging', value: 'USB-C + Qi wireless' },
      { label: 'Bluetooth', value: 'Bluetooth 5.3, multipoint' },
      { label: 'Water Resistance', value: 'IPX4 sweat and weather resistant' },
      { label: 'Controls', value: 'Touch controls with wear detection' },
      { label: 'App', value: 'Bose Music app with EQ' }
    ],
    features: [
      'Class-leading noise cancelling',
      'Bose Immersive Audio spatial sound',
      'CustomTune auto-calibrates sound to your ears',
      '30 hours total battery with case',
      'Multipoint Bluetooth 5.3',
      'IPX4 rated for workouts'
    ],
    highlights: [
      'Bose Immersive Audio',
      'CustomTune ear calibration',
      '6h + 24h case battery',
      'IPX4 water resistance',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'ANC is unreal', comment: 'Blocks out the entire office. Immersive audio is a fun addition and they stay put during workouts.' },
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Great sound, chunky case', comment: 'Sound and noise cancelling are superb. The case is bigger than rivals but battery makes up for it.' }
    ]
  },
  'apple-airpods-pro-2': {
    brand: 'Apple', seller: 'Apple Store Online',
    price: 24999, mrp: 26900, stock: 60, ratings: 4.7, numOfReviews: 4,
    warranty: '1 Year Apple Limited Warranty',
    description: 'AirPods Pro (2nd generation) double down on what made the original great. The H2 chip delivers richer sound and up to 2x more noise cancelling, while Adaptive Audio blends transparency and ANC automatically based on your surroundings.',
    specifications: [
      { label: 'Type', value: 'True wireless in-ear with silicone tips' },
      { label: 'Chip', value: 'Apple H2 with 4x more noise cancelling' },
      { label: 'Audio', value: 'Adaptive Audio, Personalized Spatial Audio' },
      { label: 'Battery', value: '6h ANC on, 30h with USB-C case' },
      { label: 'Charging', value: 'USB-C, MagSafe and Qi wireless' },
      { label: 'Bluetooth', value: 'Bluetooth 5.3' },
      { label: 'Water Resistance', value: 'IPX4 on earbuds and case' },
      { label: 'Controls', value: 'Force sensors + touch volume swipe' },
      { label: 'Case', value: 'MagSafe case with lanyard loop' },
      { label: 'Find My', value: 'Built-in speaker for precision finding' }
    ],
    features: [
      'Adaptive Audio mixes ANC and transparency',
      'Personalized Spatial Audio with dynamic head tracking',
      'H2 chip for cleaner bass and crisp highs',
      'Touch volume control on the stem',
      '30 hours total battery life',
      'Precision Finding via case speaker'
    ],
    highlights: [
      'Apple H2 chip',
      '2x more active noise cancelling',
      '6h + 24h case battery',
      'USB-C charging with MagSafe',
      '1 Year Apple Limited Warranty'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Perfect with iPhone', comment: 'Seamless pairing, superb ANC and the case battery is a huge improvement. Volume swipe works great.' },
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 5, title: 'Best earbuds for Apple users', comment: 'Noise cancelling is noticeably better than gen 1. Sound is warmer with more detail.' }
    ]
  },
  'samsung-galaxy-buds2-pro': {
    brand: 'Samsung', seller: 'Samsung Official Store',
    price: 14999, mrp: 16999, stock: 70, ratings: 4.5, numOfReviews: 3,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Galaxy Buds2 Pro combine a comfortable in-ear fit with 24-bit Hi-Fi audio and intelligent ANC. Seamless switching between Galaxy devices and a compact charging case make them the perfect companion for your Samsung ecosystem.',
    specifications: [
      { label: 'Type', value: 'True wireless in-ear' },
      { label: 'Audio', value: '24-bit Hi-Fi, Intelligent ANC with voice detect' },
      { label: 'Driver', value: '2-way: 10mm tweeter + 5.3mm woofer' },
      { label: 'Battery', value: '5h ANC on, 18h total with case' },
      { label: 'Charging', value: 'USB-C + Qi wireless' },
      { label: 'Bluetooth', value: 'Bluetooth 5.3 with auto switch' },
      { label: 'Water Resistance', value: 'IPX7 water resistant' },
      { label: 'Codecs', value: 'SSC (Hi-Fi), AAC, SBC' },
      { label: 'Microphone', value: '3 mics with wind shield' },
      { label: 'App', value: 'Samsung Wearable app' }
    ],
    features: [
      '24-bit Hi-Fi audio for clear highs and rich bass',
      'Intelligent ANC reduces wind noise',
      'Voice Detect pauses music when you talk',
      'Seamless auto-switch across Galaxy devices',
      'IPX7 water resistance for workouts',
      'Compact ergonomic design'
    ],
    highlights: [
      '24-bit Hi-Fi audio',
      'Intelligent active noise cancelling',
      'IPX7 water resistance',
      '5h + 13h case battery',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Great with Galaxy phone', comment: 'Sound is balanced and the auto switch between phone and tablet is seamless. Fit is comfy.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Impressive ANC for the price', comment: 'Noise cancelling punches above its weight. Voice detect is a neat touch.' }
    ]
  },
  'nothing-ear-2': {
    brand: 'Nothing', seller: 'Nothing Store India',
    price: 11999, mrp: 13999, stock: 65, ratings: 4.3, numOfReviews: 3,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Nothing Ear (2) blend transparent design with serious engineering. Hi-Res certified LHDC 5.0 support, adaptive ANC and a 40dB noise-cancelling profile sit inside a recognisably Nothing aesthetic.',
    specifications: [
      { label: 'Type', value: 'True wireless in-ear with transparent design' },
      { label: 'Driver', value: '11.6mm dynamic driver' },
      { label: 'Audio', value: 'Hi-Res certified, LHDC 5.0, 24-bit/192kHz' },
      { label: 'ANC', value: 'Adaptive ANC up to 40dB with transparency' },
      { label: 'Battery', value: '6h ANC on, 36h total with case' },
      { label: 'Charging', value: 'USB-C + Qi wireless' },
      { label: 'Bluetooth', value: 'Bluetooth 5.3, dual connection' },
      { label: 'Water Resistance', value: 'IP54 splash resistant' },
      { label: 'Controls', value: 'Touch + pinch gestures with custom mapping' },
      { label: 'App', value: 'Nothing X with personalised EQ' }
    ],
    features: [
      'Transparent design with LED accent',
      'Hi-Res audio with LHDC 5.0 support',
      'Adaptive ANC up to 40dB',
      'Dual-device connection',
      '36 hours total battery',
      'Low-lag gaming mode'
    ],
    highlights: [
      'Transparent Nothing design',
      'Adaptive ANC 40dB',
      'Hi-Res certified audio',
      '36h total battery with case',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Design-forward earbuds', comment: 'They look like nothing else and sound great. ANC is solid for the price point.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 4, title: 'Good value', comment: 'Balanced sound with punchy bass. The case is a bit bulky but wireless charging is handy.' }
    ]
  },
  'apple-watch-ultra': {
    brand: 'Apple', seller: 'Apple Store Online',
    price: 81900, mrp: 89900, stock: 28, ratings: 4.7, numOfReviews: 4,
    warranty: '1 Year Apple Limited Warranty',
    description: 'The Apple Watch Ultra 2 is built for the extremes. Its 49mm titanium case, 3000-nit display and dual-frequency GPS are ready for trail runs and dives up to 40m, while the S9 chip powers on-device Siri and double-tap gestures.',
    specifications: [
      { label: 'Display', value: '49mm sapphire glass, 3000 nits OLED' },
      { label: 'Chip', value: 'Apple S9 with 4-core Neural Engine' },
      { label: 'GPS', value: 'Dual-frequency (L1 + L5) precision GPS' },
      { label: 'Water Resistance', value: '100m + EN13319 dive rating' },
      { label: 'Battery', value: 'Up to 36h, 72h low power' },
      { label: 'Sensors', value: 'HR, ECG, blood oxygen, temperature, depth' },
      { label: 'Case', value: '49mm titanium' },
      { label: 'Connectivity', value: 'LTE, Wi-Fi, Bluetooth, UWB' },
      { label: 'Gesture', value: 'Double Tap with digital crown' },
      { label: 'WatchOS', value: 'watchOS 10 with Siri on-device' }
    ],
    features: [
      '3000-nit display, brightest ever',
      'Dual-frequency GPS for precise tracking',
      '40m dive-rated with depth gauge',
      'Double Tap gesture control',
      'On-device Siri with Apple Intelligence',
      'Up to 72 hours in low power mode'
    ],
    highlights: [
      '49mm titanium case',
      '3000-nit always-on display',
      'Dual-frequency precision GPS',
      '100m water resistance',
      'Up to 36h battery life'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Built like a tank', comment: 'Battery lasts a full weekend of hikes. The flat sapphire screen takes abuse without a scratch.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Runner favourite', comment: 'GPS locks fast and the route tracking is flawless. Action button is great for quick laps.' }
    ]
  },
  'samsung-galaxy-watch-6': {
    brand: 'Samsung', seller: 'Samsung Official Store',
    price: 31999, mrp: 36999, stock: 44, ratings: 4.4, numOfReviews: 3,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Galaxy Watch 6 Classic brings back the beloved rotating bezel with a larger, brighter Super AMOLED display. Advanced sleep coaching, BP and ECG monitoring, and a 4nm processor make it a serious health companion.',
    specifications: [
      { label: 'Display', value: '1.47-inch Super AMOLED, 470x470' },
      { label: 'Processor', value: 'Exynos W930 5nm dual-core' },
      { label: 'Case', value: 'Stainless steel with rotating bezel' },
      { label: 'Sensors', value: 'HR, ECG, BIA, SpO2, temperature, gyro' },
      { label: 'Battery', value: '425mAh, 40h typical' },
      { label: 'GPS', value: 'GPS + GLONASS + Galileo + Beidou' },
      { label: 'Water Resistance', value: '5ATM + IP68' },
      { label: 'Connectivity', value: 'Bluetooth 5.3, NFC, Wi-Fi' },
      { label: 'Operating System', value: 'Wear OS 4 with One UI Watch 5' },
      { label: 'Weight', value: '59 g' }
    ],
    features: [
      'Legendary rotating bezel for easy navigation',
      'Advanced sleep coaching with sleep score',
      'ECG and blood pressure monitoring',
      'BIA body composition analysis',
      'Wear OS with full Google apps',
      'Sapphire crystal protected display'
    ],
    highlights: [
      '1.47-inch Super AMOLED display',
      'Rotating bezel navigation',
      'ECG, BP and sleep tracking',
      '5ATM + IP68 rated',
      'Up to 40h battery life'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 4, title: 'Classic look, modern tech', comment: 'The bezel is satisfying to use and the health tracking is thorough. Battery lasts around a day and a half.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Great Galaxy companion', comment: 'Pairs effortlessly with my phone and the rotating bezel makes notifications fun to scroll.' }
    ]
  },
  'canon-eos-r50': {
    brand: 'Canon', seller: 'Canon India Store',
    price: 54999, mrp: 61999, stock: 33, ratings: 4.5, numOfReviews: 3,
    warranty: '1 Year Canon Warranty',
    description: 'The Canon EOS R50 is a compact mirrorless camera that pairs a 24.2MP APS-C sensor with Canon\'s Dual Pixel CMOS AF II. With 4K 30p video, a flip-out touchscreen and smartphone-style auto subjects, it is ideal for vlogging and travel.',
    specifications: [
      { label: 'Sensor', value: '24.2MP APS-C CMOS' },
      { label: 'Processor', value: 'DIGIC X' },
      { label: 'Autofocus', value: 'Dual Pixel CMOS AF II, 651 points, subject tracking' },
      { label: 'Video', value: '4K 30p, FHD 120p slow motion' },
      { label: 'Screen', value: '3-inch vari-angle touchscreen' },
      { label: 'Viewfinder', value: 'OLED EVF 2.36M dots' },
      { label: 'Continuous', value: '15fps electronic shutter' },
      { label: 'Mount', value: 'RF-S / RF mount' },
      { label: 'Battery', value: 'LP-E17, 440 shots per charge' },
      { label: 'Weight', value: '375 g body only' }
    ],
    features: [
      '24.2MP APS-C with DIGIC X',
      'Advanced subject detection for people and pets',
      '4K 30p video with vertical recording',
      'Vari-angle touchscreen for vlogging',
      'Smartphone-style auto mode',
      'Compact 375g body'
    ],
    highlights: [
      '24.2MP APS-C sensor',
      '4K 30p video',
      'Vari-angle touch LCD',
      'Advanced subject tracking',
      '1 Year Canon Warranty'
    ],
    reviews: [
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'Great first mirrorless', comment: 'Auto focus locks onto faces instantly and the flip screen makes vlogging easy. Super portable.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Perfect travel camera', comment: 'Light and produces sharp photos straight out of camera. Battery life is the only compromise.' }
    ]
  },
  'sony-alpha-7r-iv': {
    brand: 'Sony', seller: 'Sony Center India',
    price: 234990, mrp: 249990, stock: 8, ratings: 4.7, numOfReviews: 3,
    warranty: '1 Year Sony India Warranty',
    description: 'The Sony Alpha 7R IV resolves detail like almost nothing else on the market. A 61MP full-frame back-illuminated sensor, real-time Eye AF and 10fps shooting make it the choice for landscape, portrait and studio photographers.',
    specifications: [
      { label: 'Sensor', value: '61MP full-frame BSI CMOS' },
      { label: 'Processor', value: 'BIONZ XR' },
      { label: 'Autofocus', value: '567-point phase detect, Real-time Eye AF (human/animal)' },
      { label: 'Video', value: '4K 30p oversampled from 6.2K' },
      { label: 'Screen', value: '3-inch 1.44M-dot vari-angle touchscreen' },
      { label: 'Viewfinder', value: '5.76M-dot OLED, 0.78x' },
      { label: 'Continuous', value: '10fps with full AF/AE tracking' },
      { label: 'ISO', value: '100-32000 (exp. 50-102400)' },
      { label: 'Mount', value: 'E-mount' },
      { label: 'Body', value: 'Weather-sealed magnesium alloy' }
    ],
    features: [
      '61MP full-frame sensor with 15-stop dynamic range',
      'Real-time Eye AF for humans and animals',
      '10fps burst with full autofocus',
      'Pixel Shift Multi Shooting to 240MP',
      '4K video oversampled from 6.2K',
      'Rugged weather-sealed body'
    ],
    highlights: [
      '61MP full-frame BSI CMOS sensor',
      '567-point phase detection AF',
      '10fps continuous shooting',
      '4K 30p video recording',
      '1 Year Sony India Warranty'
    ],
    reviews: [
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 5, title: 'Incredible resolution', comment: 'Crops that look like separate shots. Files are huge but the detail is breathtaking.' },
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 5, title: 'Studio workhorse', comment: 'Eye AF never misses and the EVF is stunning. Pair with good glass and it shines.' }
    ]
  },
  'fujifilm-x-t5': {
    brand: 'Fujifilm', seller: 'Fujifilm India Store',
    price: 139999, mrp: 154999, stock: 12, ratings: 4.6, numOfReviews: 3,
    warranty: '1 Year Fujifilm India Warranty',
    description: 'The Fujifilm X-T5 pairs a 40.2MP X-Trans CMOS 5 HR sensor with the tactile joy of manual dials. Classic film simulations like Velvia and Classic Chrome ship in-camera, alongside 6.2K video and 7-stop IBIS.',
    specifications: [
      { label: 'Sensor', value: '40.2MP X-Trans CMOS 5 HR APS-C' },
      { label: 'Processor', value: 'X-Processor 5' },
      { label: 'Image Stabilization', value: '5-axis IBIS, up to 7 stops' },
      { label: 'Video', value: '6.2K 30p, 4K 60p' },
      { label: 'Film Simulations', value: '19 including Velvia, Classic Chrome' },
      { label: 'Screen', value: '3-inch 3-way tilting touchscreen' },
      { label: 'Viewfinder', value: '3.69M-dot OLED EVF' },
      { label: 'Continuous', value: '15fps (e-shutter), 8fps (mechanical)' },
      { label: 'Mount', value: 'X-mount' },
      { label: 'Weight', value: '557 g' }
    ],
    features: [
      '40.2MP X-Trans CMOS 5 HR sensor',
      '19 film simulation modes',
      '7-stop in-body image stabilization',
      '6.2K/30p and 4K/60p video',
      'Dual card slots (SD + SD)',
      'Classic manual dials'
    ],
    highlights: [
      '40.2MP APS-C sensor',
      '19 film simulations in-camera',
      '5-axis IBIS up to 7 stops',
      '6.2K video recording',
      '1 Year Fujifilm India Warranty'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 5, title: 'Photography joy', comment: 'The dials make shooting feel intentional and the film simulations are addictive. Images are gorgeous.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 4, title: 'Beautiful stills', comment: 'Outstanding image quality with a vintage feel. Video is good but not its main strength.' }
    ]
  },
  'apple-ipad-pro-11': {
    brand: 'Apple', seller: 'Apple Store Online',
    price: 89900, mrp: 99900, stock: 35, ratings: 4.7, numOfReviews: 3,
    warranty: '1 Year Apple Limited Warranty',
    description: 'The 11-inch iPad Pro is impossibly thin and seriously powerful. The M2 chip makes it faster than most laptops for creative apps, while the ProMotion display, Face ID and Apple Pencil 2 support make it the ultimate portable canvas.',
    specifications: [
      { label: 'Display', value: '11-inch Liquid Retina, 2388x1668, ProMotion 120Hz' },
      { label: 'Processor', value: 'Apple M2 (8-core CPU, 10-core GPU)' },
      { label: 'RAM', value: '8GB' },
      { label: 'Storage', value: '256GB' },
      { label: 'Camera', value: '12MP wide + 10MP ultra-wide, LiDAR' },
      { label: 'Front Camera', value: '12MP Ultra Wide with Center Stage' },
      { label: 'Battery', value: 'Up to 10 hours' },
      { label: 'Connectivity', value: 'Wi-Fi 6E, Bluetooth 5.3, Thunderbolt/USB 4' },
      { label: 'Audio', value: '4-speaker audio' },
      { label: 'Weight', value: '466 g' }
    ],
    features: [
      'M2 chip with laptop-class performance',
      'ProMotion 120Hz Liquid Retina display',
      'Apple Pencil 2 hover support',
      'Thunderbolt 4 for pro workflows',
      'Face ID in portrait or landscape',
      'Center Stage video calls'
    ],
    highlights: [
      '11-inch ProMotion 120Hz display',
      'Apple M2 chip',
      '256GB storage',
      'Thunderbolt 4 connectivity',
      '1 Year Apple Limited Warranty'
    ],
    reviews: [
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'Pro create tool', comment: 'Procreate and Lightroom run flawlessly. The 120Hz display makes drawing feel natural.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 5, title: 'Laptop replacement', comment: 'With the Magic Keyboard it replaces my laptop for 90% of work. Speedy and stunning.' }
    ]
  },
  'samsung-galaxy-tab-a-10-1': {
    brand: 'Samsung', seller: 'Samsung Official Store',
    price: 14999, mrp: 17999, stock: 80, ratings: 4.2, numOfReviews: 3,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Galaxy Tab A 10.1 is a dependable everyday tablet for streaming, browsing and family sharing. Its crisp 10.1-inch display, long battery life and expandable storage keep the whole family entertained.',
    specifications: [
      { label: 'Display', value: '10.1-inch WUXGA TFT, 1920x1200' },
      { label: 'Processor', value: 'Octa-core 1.6GHz' },
      { label: 'RAM', value: '3GB' },
      { label: 'Storage', value: '32GB, expandable to 512GB' },
      { label: 'Camera', value: '8MP rear + 5MP front' },
      { label: 'Battery', value: '6150mAh, up to 13h video' },
      { label: 'Operating System', value: 'Android with One UI' },
      { label: 'Audio', value: 'Dolby Atmos dual speakers' },
      { label: 'Connectivity', value: 'Wi-Fi, Bluetooth 5.0' },
      { label: 'Weight', value: '469 g' }
    ],
    features: [
      '10.1-inch WUXGA display for streaming',
      'Dolby Atmos dual speakers',
      'Up to 13 hours of video playback',
      'Expandable storage to 512GB',
      'Kids-friendly One UI modes',
      'Metal body, slim profile'
    ],
    highlights: [
      '10.1-inch 1920x1200 display',
      'Dolby Atmos sound',
      '6150mAh battery',
      'Expandable storage',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Great family tablet', comment: 'Snappy enough for YouTube and apps. Speakers sound surprisingly good for the price.' },
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Good value', comment: 'Bright screen and solid battery. A little slow with heavy games but fine for daily use.' }
    ]
  },
  'logitech-mx-anywhere-3': {
    brand: 'Logitech', seller: 'Logitech Store India',
    price: 6499, mrp: 7495, stock: 90, ratings: 4.6, numOfReviews: 3,
    warranty: '1 Year Limited Hardware Warranty',
    description: 'The MX Anywhere 3 is a compact performance mouse built for travel. Its MagSpeed electromagnetic wheel, Darkfield 4000 DPI tracking on any surface and multi-device Flow support let you work anywhere without a mouse pad.',
    specifications: [
      { label: 'Sensor', value: 'Darkfield 4000 DPI, works on any surface' },
      { label: 'Wheel', value: 'MagSpeed electromagnetic ratchet' },
      { label: 'Buttons', value: '6 programmable buttons' },
      { label: 'Battery', value: '500mAh, up to 70 days, USB-C fast charge' },
      { label: 'Connectivity', value: 'Bluetooth + 2.4GHz USB receiver' },
      { label: 'Flow Support', value: 'Multi-device, cross-computer file transfer' },
      { label: 'Charging', value: 'USB-C, 1-min charge for 3h' },
      { label: 'Weight', value: '99 g' },
      { label: 'Compatibility', value: 'Windows, macOS, iPadOS, ChromeOS' },
      { label: 'Design', value: 'Compact, sculpted for right hand' }
    ],
    features: [
      'Darkfield tracking on glass and any surface',
      'MagSpeed wheel with one-second scroll of 1000 lines',
      'Flow for controlling up to 3 computers',
      '70 days battery, USB-C fast charging',
      '6 programmable buttons via Logi Options+',
      'Compact travel-friendly design'
    ],
    highlights: [
      'Darkfield 4000 DPI sensor',
      'MagSpeed electromagnetic wheel',
      'Bluetooth + USB receiver',
      '70-day battery life',
      '1 Year Limited Warranty'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 5, title: 'Perfect travel mouse', comment: 'Works on my glass desk without a pad. The wheel is addictive and battery lasts for weeks.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Premium and quiet', comment: 'Silent clicks and great tracking. A little small for big hands but ideal for travel.' }
    ]
  },
  'logitech-g502-hero': {
    brand: 'Logitech', seller: 'Logitech Store India',
    price: 4999, mrp: 5999, stock: 95, ratings: 4.5, numOfReviews: 3,
    warranty: '2 Year Limited Hardware Warranty',
    description: 'The Logitech G502 HERO is the iconic gaming mouse, now with the HERO 25K sensor for sub-micron tracking precision. Eleven programmable buttons, adjustable weights and LIGHTSYNC RGB make it a favourite for FPS and MMO players alike.',
    specifications: [
      { label: 'Sensor', value: 'HERO 25K, up to 25,600 DPI' },
      { label: 'Buttons', value: '11 programmable buttons' },
      { label: 'Weight', value: '121 g with 5x 3.6g adjustable weights' },
      { label: 'Polling Rate', value: '1000Hz' },
      { label: 'Onboard Memory', value: '5 profiles via G HUB' },
      { label: 'RGB', value: 'LIGHTSYNC RGB with 16.8M colours' },
      { label: 'Switch', value: '20M click rated mechanical' },
      { label: 'Connectivity', value: 'Wired USB-A' },
      { label: 'Scroll', value: 'Hyper-fast dual-mode scroll wheel' },
      { label: 'Warranty', value: '2 Years' }
    ],
    features: [
      'HERO 25K sensor for extreme precision',
      '11 programmable buttons with macros',
      'Adjustable 5x3.6g weight system',
      'Dual-mode hyper-fast scroll wheel',
      'LIGHTSYNC RGB lighting',
      'Onboard profile memory'
    ],
    highlights: [
      'HERO 25K gaming sensor',
      '11 programmable buttons',
      'Adjustable weight system',
      'LIGHTSYNC RGB',
      '2 Year Limited Warranty'
    ],
    reviews: [
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'FPS favourite', comment: 'Tracks perfectly and the extra buttons are great for macros. Weight tuning makes a real difference.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Solid and heavy', comment: 'It is a heavy mouse but that helps stability for low-sensitivity players. Great build quality.' }
    ]
  },
  'keychron-k8': {
    brand: 'Keychron', seller: 'Keychron India Store',
    price: 8499, mrp: 9999, stock: 50, ratings: 4.6, numOfReviews: 3,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Keychron K8 is a tenkeyless wireless mechanical keyboard with hot-swappable switches, reliable Bluetooth 5.1 and a machined aluminium frame. Its RGB backlight and Mac/Windows compatibility make it a versatile everyday driver.',
    specifications: [
      { label: 'Layout', value: 'Tenkeyless (87 keys), ANSI' },
      { label: 'Switches', value: 'Hot-swappable Gateron mechanical' },
      { label: 'Connectivity', value: 'Bluetooth 5.1 + USB-C wired' },
      { label: 'Devices', value: '3 Bluetooth + 1 wired, up to 4 devices' },
      { label: 'Battery', value: '4000mAh, up to 240h' },
      { label: 'Backlight', value: 'Per-key RGB, 22 modes' },
      { label: 'Frame', value: 'Machined aluminium top frame' },
      { label: 'Compatibility', value: 'macOS, Windows, Linux, iOS, Android' },
      { label: 'Keycaps', value: 'Dye-subbed PBT, shine-through' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      'Hot-swappable Gateron switches',
      'Seamless Mac and Windows switching',
      'Up to 4 paired devices via Bluetooth',
      '4000mAh battery with RGB off for 240h',
      'Per-key RGB backlight with 22 modes',
      'Aluminium frame with PBT keycaps'
    ],
    highlights: [
      'Wireless Bluetooth 5.1',
      'Hot-swappable switches',
      'Per-key RGB backlight',
      '4000mAh battery',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'Great value keyboard', comment: 'Feels premium with the aluminium top. Hot-swap switches let me customise the feel to my liking.' },
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Typing pleasure', comment: 'Solid and satisfying to type on. Switching between Mac and PC is instant.' }
    ]
  },
  'samsung-odyssey-g7-monitor': {
    brand: 'Samsung', seller: 'Samsung Official Store',
    price: 54999, mrp: 61999, stock: 16, ratings: 4.4, numOfReviews: 3,
    warranty: '1 Year Comprehensive Warranty',
    description: 'The Samsung Odyssey Neo G7 is a 32-inch 4K curved gaming monitor with Quantum Mini LED backlighting. With a 165Hz refresh rate, 1ms response and HDR2000, it delivers a jaw-dropping picture for AAA games and desktop use.',
    specifications: [
      { label: 'Display', value: '32-inch VA curved (1000R), 4K UHD' },
      { label: 'Backlight', value: 'Quantum Mini LED with local dimming' },
      { label: 'HDR', value: 'HDR2000 with 1000 nits peak' },
      { label: 'Refresh Rate', value: '165Hz' },
      { label: 'Response Time', value: '1ms (GTG)' },
      { label: 'Colour', value: '95% DCI-P3' },
      { label: 'Ports', value: '1x DisplayPort 1.4, 2x HDMI 2.1, USB hub' },
      { label: 'Stand', value: 'Height/tilt/swivel adjustable' },
      { label: 'Sync', value: 'FreeSync Premium Pro + G-Sync compatible' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      '1000R curved panel for immersion',
      'Quantum Mini LED local dimming',
      '165Hz with 1ms response',
      'HDR2000 peak brightness',
      'FreeSync Premium Pro',
      'Adjustable ergonomic stand'
    ],
    highlights: [
      '32-inch 4K 1000R curved panel',
      '165Hz refresh rate',
      'Quantum Mini LED with HDR2000',
      '1ms response time',
      '1 Year Comprehensive Warranty'
    ],
    reviews: [
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Stunning in games', comment: 'HDR in supported games is spectacular and the curve wraps around you. Needs a good GPU for 4K 165Hz.' },
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 4, title: 'Bright and smooth', comment: 'Colours are vivid and the local dimming makes dark scenes pop. Stand is a bit wobbly at full height.' }
    ]
  },
  'usb-c-hub': {
    brand: 'TUNEWEAR', seller: 'TUNEWEAR India Store',
    price: 2999, mrp: 3999, stock: 120, ratings: 4.2, numOfReviews: 3,
    warranty: '18 Months Manufacturer Warranty',
    description: 'This 7-in-1 USB-C hub turns one port into a full workstation. Connect an HDMI 4K display, Gigabit Ethernet, USB-A and USB-C devices and fast memory cards simultaneously with a plug-and-play aluminium body.',
    specifications: [
      { label: 'Ports', value: 'HDMI 4K 30Hz, GbE, 3x USB-A 3.0, SD+microSD, USB-C PD 100W' },
      { label: 'Video Output', value: 'HDMI up to 4K@30Hz' },
      { label: 'Ethernet', value: 'Gigabit (1000 Mbps)' },
      { label: 'Data Speed', value: 'USB 3.0 up to 5Gbps' },
      { label: 'Card Reader', value: 'SD 3.0 + microSD, UHS-I' },
      { label: 'Power Delivery', value: 'Up to 100W pass-through' },
      { label: 'Compatibility', value: 'MacBook, Windows, ChromeOS, iPad, Android' },
      { label: 'Body', value: 'Aluminium alloy with braided cable' },
      { label: 'Plug & Play', value: 'No drivers required' },
      { label: 'Warranty', value: '18 Months' }
    ],
    features: [
      '7-in-1 expansion from a single USB-C port',
      '4K HDMI video output',
      '100W power delivery pass-through',
      'Gigabit Ethernet for stable wired networking',
      'Fast SD and microSD card reader',
      'Aluminium body with braided cable'
    ],
    highlights: [
      'HDMI 4K + GbE + 3x USB-A',
      '100W PD pass-through',
      'SD/microSD UHS-I reader',
      'Aluminium plug-and-play design',
      '18 Months Warranty'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Does it all', comment: 'Handles my monitor, ethernet and card reader from one cable. Gets warm under load but never hot.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Solid for laptops', comment: '4K output is crisp and the card reader is fast. Build quality feels sturdy.' }
    ]
  },
  'xbox-series-x': {
    brand: 'Microsoft', seller: 'Microsoft Store India',
    price: 54990, mrp: 59990, stock: 25, ratings: 4.6, numOfReviews: 4,
    warranty: '1 Year Microsoft Warranty',
    description: 'The Xbox Series X is the most powerful Xbox ever, delivering 12 teraflops of GPU power for native 4K gaming at up to 120fps. With the Xbox Velocity Architecture, near-instant loading and Smart Delivery, your games look and play their best.',
    specifications: [
      { label: 'CPU', value: 'Custom 8-core AMD Zen 2 @ 3.8GHz' },
      { label: 'GPU', value: 'AMD RDNA 2, 12 TFLOPS, 52 CU' },
      { label: 'Memory', value: '16GB GDDR6' },
      { label: 'Storage', value: '1TB custom NVMe SSD' },
      { label: 'Resolution', value: 'Up to 8K HDR, native 4K gaming' },
      { label: 'Frame Rate', value: 'Up to 120fps' },
      { label: 'Ray Tracing', value: 'Hardware accelerated DXR' },
      { label: 'Media', value: '4K UHD Blu-ray drive' },
      { label: 'Connectivity', value: 'Wi-Fi 6, 802.11ac, Gigabit Ethernet' },
      { label: 'Backward Compatibility', value: 'Play 4 generations of games' }
    ],
    features: [
      '12 teraflops of RDNA 2 power',
      'Native 4K gaming at up to 120fps',
      'Xbox Velocity Architecture for fast loading',
      'Quick Resume across multiple games',
      'Smart Delivery for best version automatically',
      '4 generations of backward compatibility'
    ],
    highlights: [
      'Native 4K at 120fps',
      '1TB custom SSD',
      '4K UHD Blu-ray drive',
      'Hardware ray tracing',
      '1 Year Microsoft Warranty'
    ],
    reviews: [
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Beast of a console', comment: 'Everything loads in seconds and games look incredible in 4K. Game Pass makes it unbeatable value.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 4, title: 'Fast and quiet', comment: 'Near silent under load. The bulk is worth it for the raw performance.' }
    ]
  },
  'nintendo-switch-oled': {
    brand: 'Nintendo', seller: 'Nintendo Store India',
    price: 27999, mrp: 29999, stock: 40, ratings: 4.5, numOfReviews: 4,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Nintendo Switch OLED model upgrades the beloved hybrid console with a vibrant 7-inch OLED screen, a wider adjustable stand, enhanced audio and 64GB of storage. Perfect for handheld play at home or on the go.',
    specifications: [
      { label: 'Screen', value: '7-inch OLED, 1280x720' },
      { label: 'Storage', value: '64GB internal + microSD slot' },
      { label: 'Stand', value: 'Wide adjustable stand' },
      { label: 'Audio', value: 'Enhanced speakers in handheld mode' },
      { label: 'Dock', value: 'Dock with wired LAN port' },
      { label: 'Battery', value: '4310mAh, 4.5-9 hours' },
      { label: 'Play Modes', value: 'TV, tabletop and handheld' },
      { label: 'Connectivity', value: 'Wi-Fi, Bluetooth 5.1, USB-C' },
      { label: 'Joy-Con', value: 'Detachable with HD rumble' },
      { label: 'Weight', value: '320 g with Joy-Cons' }
    ],
    features: [
      'Vibrant 7-inch OLED display',
      'Wide adjustable kickstand for tabletop mode',
      'Dock with built-in LAN port',
      'Enhanced handheld audio',
      '64GB storage with microSD expansion',
      'Play at home or on the go'
    ],
    highlights: [
      '7-inch OLED screen',
      '64GB storage',
      'LAN-capable dock',
      '4.5-9 hours battery',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'OLED makes the difference', comment: 'Games look far richer in handheld mode. The wider stand is much more stable on tables.' },
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 4, title: 'Great upgrade', comment: 'Screen and audio are noticeably better. The console itself is the same hardware though.' }
    ]
  },
  'dji-mini-3-pro': {
    brand: 'DJI', seller: 'DJI Store India',
    price: 79999, mrp: 86999, stock: 18, ratings: 4.7, numOfReviews: 3,
    warranty: '1 Year DJI Warranty',
    description: 'The DJI Mini 3 Pro weighs under 249g yet packs a 1/1.3-inch sensor, tri-directional obstacle sensing and 4K/60fps video. With up to 47 minutes of flight time and true vertical shooting, it is the most capable sub-250g drone.',
    specifications: [
      { label: 'Weight', value: 'Under 249 g' },
      { label: 'Camera', value: '1/1.3-inch CMOS, 48MP, f/1.7' },
      { label: 'Video', value: '4K/60fps, HDR, 10-bit D-Log M' },
      { label: 'Gimbal', value: '3-axis stabilized, 90-degree vertical' },
      { label: 'Obstacle Sensing', value: 'Forward, backward, downward' },
      { label: 'Flight Time', value: 'Up to 47 minutes (34min standard)' },
      { label: 'Range', value: 'DJI O3, up to 12km transmission' },
      { label: 'Wind Resistance', value: 'Level 5 (10.7 m/s)' },
      { label: 'Intelligent Modes', value: 'FocusTrack, MasterShots, Hyperlapse' },
      { label: 'Controller', value: 'DJI RC with 5.5-inch screen (included)' }
    ],
    features: [
      'Under 249g - no registration in most regions',
      '4K/60fps with 48MP photos',
      'Tri-directional obstacle sensing',
      'True vertical shooting for social media',
      'Up to 47 minutes flight time',
      'DJI O3 transmission up to 12km'
    ],
    highlights: [
      'Sub-250g camera drone',
      '4K/60fps video, 48MP stills',
      'Tri-directional obstacle sensing',
      '47 minutes max flight time',
      '1 Year DJI Warranty'
    ],
    reviews: [
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 5, title: 'Pocket cinema', comment: 'Footage is stunning and the vertical mode is perfect for reels. Obstacle sensing gives confidence.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'Best beginner drone', comment: 'Easy to fly, great battery and the controller screen makes composition effortless.' }
    ]
  },
  'instant-pot-duo': {
    brand: 'Instant Pot', seller: 'Instant Pot India Store',
    price: 7499, mrp: 9999, stock: 75, ratings: 4.5, numOfReviews: 4,
    warranty: '1 Year Replacement Warranty',
    description: 'The Instant Pot Duo 6QT is a 7-in-1 multi-cooker that replaces a pressure cooker, slow cooker, rice cooker, steamer, saute pan, yogurt maker and warmer. One-touch smart programs take the guesswork out of weeknight cooking.',
    specifications: [
      { label: 'Capacity', value: '6 quarts (5.7L), serves 6+ people' },
      { label: 'Functions', value: 'Pressure cook, slow cook, rice, steam, saute, yogurt, warm' },
      { label: 'Programs', value: '14 smart programs' },
      { label: 'Power', value: '1000W' },
      { label: 'Material', value: 'Stainless steel inner pot' },
      { label: 'Safety', value: '10+ built-in safety mechanisms' },
      { label: 'Control', value: 'Digital timer with keep-warm' },
      { label: 'Inclusions', value: 'Steam rack, ladle, measuring cup, recipe book' },
      { label: 'Cleaning', value: 'Dishwasher-safe inner pot' },
      { label: 'Warranty', value: '1 Year Replacement' }
    ],
    features: [
      '7-in-1 appliance replaces multiple gadgets',
      '14 one-touch smart programs',
      'Stainless steel inner pot',
      '10+ safety mechanisms',
      'Keep-warm function for ready meals',
      'Cooks pressure meals up to 70% faster'
    ],
    highlights: [
      '7-in-1 multi-cooker',
      '6QT capacity for families',
      '14 smart cooking programs',
      'Stainless steel inner pot',
      '1 Year Replacement Warranty'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 5, title: 'Kitchen essential', comment: 'Dal, rice and curries come out perfect every time. Saves so much time on weeknights.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Very versatile', comment: 'Yogurt mode is brilliant. Only complaint is the instruction manual is overwhelming.' }
    ]
  },
  'nespresso-vertuo': {
    brand: 'Nespresso', seller: 'Nespresso Boutique',
    price: 12999, mrp: 15999, stock: 60, ratings: 4.4, numOfReviews: 3,
    warranty: '2 Years Nespresso Warranty',
    description: 'The Nespresso Vertuo machine brews everything from a 40ml Espresso to a 414ml Alto coffee with a rich, thick crema. Centrifusion technology reads each capsule\'s barcode and adapts temperature, speed and time for a perfect cup every time.',
    specifications: [
      { label: 'Brewing', value: 'Centrifusion technology, 5 cup sizes' },
      { label: 'Cup Sizes', value: 'Espresso 40ml to Alto 414ml' },
      { label: 'Water Tank', value: '1.8L removable' },
      { label: 'Capsules', value: 'Vertuo capsules with barcode' },
      { label: 'Used Capsules', value: 'Automatic capsule ejection, 10 capacity' },
      { label: 'Heating', value: 'Ready in 25 seconds' },
      { label: 'Auto Off', value: 'Turns off after 9 minutes' },
      { label: 'Energy', value: '1500W' },
      { label: 'Weight', value: '4 kg' },
      { label: 'Warranty', value: '2 Years' }
    ],
    features: [
      'Centrifusion for creamy espresso and large cups',
      'Automatic barcode reading per capsule',
      '5 cup sizes from Espresso to Alto',
      '25-second heat-up time',
      'Automatic capsule ejection',
      '1.8L water tank'
    ],
    highlights: [
      '5 cup sizes including Alto',
      'Rich crema with every brew',
      '25-second heat-up',
      '1.8L water tank',
      '2 Years Nespresso Warranty'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Cafe at home', comment: 'The crema is thicker than anything I have had from a machine. Capsules are convenient.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 4, title: 'Great espresso', comment: 'Consistent, quick and tasty. Water tank is easy to fill and the machine looks sleek.' }
    ]
  },
  'fabric-3-seater-sofa': {
    brand: 'UrbanCasa', seller: 'UrbanCasa Living Store',
    price: 22999, mrp: 29999, stock: 20, ratings: 4.3, numOfReviews: 3,
    warranty: '2 Year Frame Warranty',
    description: 'This 3-seater fabric sofa brings hotel-grade comfort to your living room. A kiln-dried hardwood frame, high-density foam cushions and a soft neutral fabric make it the centrepiece your family will gather around.',
    specifications: [
      { label: 'Seats', value: '3-seater (200cm wide)' },
      { label: 'Frame', value: 'Kiln-dried hardwood' },
      { label: 'Cushion Fill', value: 'High-density foam + fibre' },
      { label: 'Fabric', value: 'Stain-resistant polyester blend' },
      { label: 'Seat Depth', value: '56cm with high-back support' },
      { label: 'Weight Capacity', value: 'Up to 300kg' },
      { label: 'Assembly', value: 'Free professional assembly' },
      { label: 'Inclusions', value: '4 throw pillows' },
      { label: 'Care', value: 'Removable, machine-washable covers' },
      { label: 'Warranty', value: '2 Years on frame' }
    ],
    features: [
      'High-density foam for lasting comfort',
      'Kiln-dried hardwood frame',
      'Stain-resistant, washable fabric',
      'Generous 56cm seat depth',
      'Includes 4 throw pillows',
      'Free professional assembly'
    ],
    highlights: [
      '3-seater 200cm sofa',
      'High-density foam cushions',
      'Hardwood frame with 2-year warranty',
      'Removable washable covers',
      'Free assembly'
    ],
    reviews: [
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Very comfy', comment: 'Firm but comfortable cushions. Fabric feels premium and the pillows are a nice bonus.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 4, title: 'Great for the price', comment: 'Looks much more expensive than it is. Delivery and assembly were on time.' }
    ]
  },
  'wooden-coffee-table': {
    brand: 'UrbanCasa', seller: 'UrbanCasa Living Store',
    price: 9999, mrp: 12999, stock: 30, ratings: 4.4, numOfReviews: 3,
    warranty: '1 Year Manufacturer Warranty',
    description: 'A modern coffee table crafted from solid wood with a smooth matte finish. Its clean lines, open shelf and warm natural grain make it a stylish anchor for any living room.',
    specifications: [
      { label: 'Material', value: 'Solid Sheesham wood' },
      { label: 'Finish', value: 'Natural matte lacquer' },
      { label: 'Dimensions', value: '110 x 60 x 45 cm (LxWxH)' },
      { label: 'Shelf', value: 'Open lower shelf' },
      { label: 'Surface', value: 'Heat and water resistant top' },
      { label: 'Assembly', value: 'Minimal assembly required' },
      { label: 'Weight', value: '18 kg' },
      { label: 'Style', value: 'Contemporary minimalist' },
      { label: 'Care', value: 'Wipe with dry cloth' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      'Solid Sheesham hardwood construction',
      'Smooth matte lacquer finish',
      'Open shelf for books and decor',
      'Heat and water resistant top',
      'Contemporary minimalist design',
      'Easy 15-minute assembly'
    ],
    highlights: [
      'Solid Sheesham wood',
      '110cm contemporary design',
      'Open storage shelf',
      'Matte natural finish',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Beautiful wood', comment: 'The grain is gorgeous and it is very solid. Took 10 minutes to put together.' },
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Great value', comment: 'Looks premium in the living room. Arrived well packed with no damage.' }
    ]
  },
  'ergonomic-office-chair': {
    brand: 'Sihoo', seller: 'Sihoo India Store',
    price: 12999, mrp: 16999, stock: 35, ratings: 4.4, numOfReviews: 3,
    warranty: '2 Year Warranty',
    description: 'The Sihoo M57 ergonomic chair supports you through long workdays. Its adaptive S-shaped backrest, adjustable lumbar support, 4D armrests and breathable mesh keep your posture in check without making you sweat.',
    specifications: [
      { label: 'Backrest', value: 'S-shaped, breathable elastic mesh' },
      { label: 'Lumbar Support', value: 'Independent adjustable' },
      { label: 'Armrests', value: '3D adjustable (height, width, angle)' },
      { label: 'Headrest', value: 'Height and angle adjustable' },
      { label: 'Seat', value: 'High-density mesh, waterfall edge' },
      { label: 'Tilt', value: 'Up to 135 degree recline with lock' },
      { label: 'Weight Capacity', value: 'Up to 136kg' },
      { label: 'Base', value: 'Heavy-duty nylon with PU castors' },
      { label: 'Certification', value: 'BIFMA tested' },
      { label: 'Warranty', value: '2 Years' }
    ],
    features: [
      'Breathable mesh keeps you cool all day',
      'Adaptive S-shaped backrest',
      'Adjustable lumbar support and headrest',
      '3D adjustable armrests',
      '135-degree recline with lock',
      'Supports up to 136kg'
    ],
    highlights: [
      'Breathable mesh design',
      'Adjustable lumbar support',
      '135-degree recline',
      '3D armrests',
      '2 Year Warranty'
    ],
    reviews: [
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Back pain gone', comment: 'After a month of daily 8-hour sits my back feels great. Lumbar support adjustment is excellent.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Great for the price', comment: 'Comfortable and well built. Armrests could be stiffer but adjustment range is good.' }
    ]
  },
  'converse-chuck-taylor': {
    brand: 'Converse', seller: 'Converse Store India',
    price: 3999, mrp: 4999, stock: 60, ratings: 4.5, numOfReviews: 3,
    warranty: '30-Day Return Policy',
    description: 'The Converse Chuck Taylor All Star needs no introduction. This canvas high-top with the iconic toe cap and ankle patch pairs with everything, from jeans to summer dresses.',
    specifications: [
      { label: 'Material', value: 'Canvas upper with rubber outsole' },
      { label: 'Height', value: 'High-top' },
      { label: 'Closure', value: 'Classic lace-up' },
      { label: 'Toe Cap', value: 'Signature rubber toe cap' },
      { label: 'Insole', value: 'Comfort-cushioned' },
      { label: 'Colour', value: 'Classic black canvas' },
      { label: 'Care', value: 'Spot clean' },
      { label: 'Sizes', value: 'UK 6-11 (EU 39-45)' },
      { label: 'Fit', value: 'True to size' },
      { label: 'Origin', value: 'Iconic design since 1917' }
    ],
    features: [
      'Iconic high-top silhouette',
      'Breathable canvas upper',
      'Comfort-cushioned insole',
      'Rubber toe cap and outsole',
      'Padded collar for ankle support',
      'Timeless look for any outfit'
    ],
    highlights: [
      'Classic Converse Chuck Taylor',
      'Canvas high-top design',
      'Comfort insole',
      'Durable rubber outsole',
      '30-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 5, title: 'Timeless', comment: 'Comfortable after breaking in and goes with everything. Quality canvas.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Classic shoes', comment: 'Exactly as expected. A bit stiff initially but they soften up nicely.' }
    ]
  },
  'denim-skinny-jeans': {
    brand: 'Wrangler', seller: 'Wrangler India Store',
    price: 1999, mrp: 2999, stock: 80, ratings: 4.3, numOfReviews: 3,
    warranty: '30-Day Return Policy',
    description: 'Classic blue skinny jeans made from premium stretch denim. The 4-way stretch fabric moves with you, while the mid-rise cut and clean finish keep it versatile for casual and smart-casual looks.',
    specifications: [
      { label: 'Fit', value: 'Skinny, mid-rise' },
      { label: 'Fabric', value: '92% cotton, 6% polyester, 2% elastane' },
      { label: 'Denim Weight', value: '12oz stretch denim' },
      { label: 'Closure', value: 'Zip fly with button' },
      { label: 'Pockets', value: '5-pocket styling' },
      { label: 'Colour', value: 'Medium indigo wash' },
      { label: 'Care', value: 'Machine wash cold' },
      { label: 'Sizes', value: 'W28-W38' },
      { label: 'Stretch', value: '4-way comfort stretch' },
      { label: 'Origin', value: 'Premium denim brand' }
    ],
    features: [
      '4-way stretch for all-day comfort',
      'Classic medium indigo wash',
      'Slim through the leg and ankle',
      '5-pocket styling with zip fly',
      'Colour-fast premium denim',
      'Machine washable'
    ],
    highlights: [
      'Premium stretch denim',
      'Skinny fit with mid-rise',
      'W28-W38 sizes',
      'Classic indigo wash',
      '30-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Great fit', comment: 'Stretch makes them comfy all day and the colour stays put after washes.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 4, title: 'Good everyday jeans', comment: 'Solid quality denim at a good price. Fits true to size.' }
    ]
  },
  'mens-formal-shirt': {
    brand: 'Classic Threads', seller: 'Classic Threads Store',
    price: 1499, mrp: 2199, stock: 90, ratings: 4.2, numOfReviews: 3,
    warranty: '30-Day Return Policy',
    description: 'A crisp slim-fit formal shirt in wrinkle-resistant fabric. Tailored with a classic point collar, single-button cuffs and a clean chest pocket, it is the building block of every work wardrobe.',
    specifications: [
      { label: 'Fit', value: 'Slim fit' },
      { label: 'Fabric', value: '60% cotton, 40% polyester wrinkle-resistant' },
      { label: 'Collar', value: 'Classic point collar' },
      { label: 'Cuffs', value: 'Single-button adjustable' },
      { label: 'Pocket', value: 'Left chest pocket' },
      { label: 'Closure', value: 'Front button placket' },
      { label: 'Colour', value: 'Light blue' },
      { label: 'Care', value: 'Machine wash, minimal ironing' },
      { label: 'Sizes', value: 'S to XXL' },
      { label: 'Occasion', value: 'Office, meetings, formal events' }
    ],
    features: [
      'Wrinkle-resistant fabric for office days',
      'Slim, tailored silhouette',
      'Breathable cotton blend',
      'Adjustable single-button cuffs',
      'Classic point collar',
      'Easy-care, low ironing'
    ],
    highlights: [
      'Slim-fit tailored design',
      'Wrinkle-resistant blend',
      'Classic point collar',
      'S to XXL sizes',
      '30-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Good office shirt', comment: 'Needs almost no ironing and fits well. Slightly thin fabric but fine for work.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 4, title: 'Clean and crisp', comment: 'Great for everyday office wear. Runs slightly slim so size up if between sizes.' }
    ]
  },
  'womens-floral-dress': {
    brand: 'Bloom & Co', seller: 'Bloom & Co Store',
    price: 2499, mrp: 3499, stock: 55, ratings: 4.4, numOfReviews: 3,
    warranty: '30-Day Return Policy',
    description: 'This floral midi dress brings effortless femininity to any occasion. A flattering wrap-style bodice, flowy skirt and breathable viscose fabric make it a warm-weather favourite for brunches and garden parties.',
    specifications: [
      { label: 'Silhouette', value: 'Midi length with wrap bodice' },
      { label: 'Fabric', value: '100% viscose, breathable' },
      { label: 'Pattern', value: 'All-over floral print' },
      { label: 'Sleeves', value: 'Short flutter sleeves' },
      { label: 'Closure', value: 'Wrap tie at waist' },
      { label: 'Length', value: 'Midi, below knee' },
      { label: 'Care', value: 'Gentle machine wash' },
      { label: 'Sizes', value: 'XS to XL' },
      { label: 'Lining', value: 'Fully lined bodice' },
      { label: 'Occasion', value: 'Casual, party, day out' }
    ],
    features: [
      'Flattering wrap bodice with tie waist',
      'Flowy midi skirt that moves with you',
      'Breathable 100% viscose',
      'Vivid all-over floral print',
      'Fully lined bodice',
      'Flutter sleeves for a soft finish'
    ],
    highlights: [
      'Floral midi dress',
      'Wrap-style fit',
      'Breathable viscose fabric',
      'XS to XL sizes',
      '30-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 5, title: 'Love this dress', comment: 'Fit is flattering and the fabric breathes beautifully in summer. Got compliments all day.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 4, title: 'Pretty and comfy', comment: 'The wrap design is forgiving and the print is lovely. Runs true to size.' }
    ]
  },
  'urban-laptop-backpack': {
    brand: 'Trailmate', seller: 'Trailmate Store',
    price: 1799, mrp: 2499, stock: 100, ratings: 4.3, numOfReviews: 3,
    warranty: '1 Year Manufacturer Warranty',
    description: 'A 28-litre urban backpack built around your tech. A padded 15.6-inch laptop sleeve, organised compartments and a water-repellent shell keep your gear safe through commutes, campus days and weekend trips.',
    specifications: [
      { label: 'Capacity', value: '28 litres' },
      { label: 'Laptop Compartment', value: 'Padded, fits up to 15.6-inch' },
      { label: 'Material', value: 'Water-repellent recycled polyester' },
      { label: 'Compartments', value: 'Main + padded laptop + front organiser' },
      { label: 'Pockets', value: 'Side bottle pocket + hidden anti-theft rear' },
      { label: 'Back Panel', value: 'Breathable mesh with airflow channels' },
      { label: 'Straps', value: 'Padded shoulder straps + chest clip' },
      { label: 'USB Port', value: 'External USB charging pass-through' },
      { label: 'Dimensions', value: '46 x 30 x 15 cm' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      'Padded 15.6-inch laptop sleeve',
      'Water-repellent recycled fabric',
      'Anti-theft hidden pocket',
      'External USB charging port',
      'Breathable airflow back panel',
      'Suitcase pass-through strap'
    ],
    highlights: [
      '28L capacity',
      '15.6-inch laptop protection',
      'Water-repellent material',
      'USB charging port',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 4, title: 'Great daily pack', comment: 'Fits my laptop, charger and lunch comfortably. Back panel keeps me from sweating on commutes.' },
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Well organised', comment: 'The organisers and hidden pocket are great. Material shrugs off light rain.' }
    ]
  },
  'leather-bifold-wallet': {
    brand: 'LeatherCraft', seller: 'LeatherCraft Store',
    price: 999, mrp: 1499, stock: 110, ratings: 4.4, numOfReviews: 3,
    warranty: '6 Month Warranty',
    description: 'Handmade from genuine full-grain leather, this bifold wallet ages beautifully. It holds 12 cards, includes a full-length cash pocket and a coin compartment, wrapped in a slim profile that slips easily into any pocket.',
    specifications: [
      { label: 'Material', value: 'Genuine full-grain leather' },
      { label: 'Card Slots', value: '6 card slots + 2 hidden (12 total)' },
      { label: 'Compartments', value: 'Full-length cash pocket + coin pocket' },
      { label: 'Stitching', value: 'Reinforced waxed thread' },
      { label: 'Colour', value: 'Tan brown' },
      { label: 'Dimensions', value: '11.5 x 9 cm' },
      { label: 'Profile', value: 'Slim bifold' },
      { label: 'ID Window', value: 'Clear ID slot' },
      { label: 'Care', value: 'Condition with leather balm' },
      { label: 'Warranty', value: '6 Months' }
    ],
    features: [
      'Genuine full-grain leather',
      '12 card slots including ID window',
      'Full-length cash pocket',
      'RFID-blocking lining',
      'Ages into a unique patina',
      'Slim 11.5 x 9 cm profile'
    ],
    highlights: [
      'Full-grain leather construction',
      'Holds up to 12 cards',
      'RFID-blocking lining',
      'Coin and cash compartments',
      '6 Month Warranty'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Smells and feels premium', comment: 'Genuine leather that softens with use. Plenty of room for cards and cash without being bulky.' },
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 4, title: 'Great daily wallet', comment: 'Looks classy and the stitching is solid. RFID lining is a nice bonus.' }
    ]
  },
  'anker-20000mah-powerbank': {
    brand: 'Anker', seller: 'Anker India Store',
    price: 2999, mrp: 3999, stock: 150, ratings: 4.5, numOfReviews: 3,
    warranty: '18 Month Warranty',
    description: 'This Anker 20000mAh power bank delivers fast 22.5W charging to phones, tablets and even USB-C laptops. Dual USB-A and USB-C ports with PowerIQ 3.0 charge two devices at once, with enough capacity for multiple phone recharges.',
    specifications: [
      { label: 'Capacity', value: '20000mAh' },
      { label: 'Output', value: '22.5W max, USB-C PD 20W + USB-A' },
      { label: 'Ports', value: '1x USB-C + 2x USB-A' },
      { label: 'Input', value: 'USB-C, recharge in ~5.5 hours' },
      { label: 'Recharges', value: 'iPhone 15: ~4x, Galaxy S24: ~3x' },
      { label: 'Tech', value: 'PowerIQ 3.0, MultiProtect safety' },
      { label: 'LED', value: 'Digital percentage display' },
      { label: 'Compatibility', value: 'Phones, tablets, earbuds, USB-C laptops' },
      { label: 'Weight', value: '356 g' },
      { label: 'Warranty', value: '18 Months' }
    ],
    features: [
      '22.5W fast charging output',
      '20000mAh for multiple full recharges',
      'Charge 2 devices simultaneously',
      'Digital percentage display',
      'MultiProtect safety system',
      'USB-C PD for laptops and tablets'
    ],
    highlights: [
      '20000mAh capacity',
      '22.5W fast charging',
      'Dual USB-A + USB-C',
      'Digital power display',
      '18 Month Warranty'
    ],
    reviews: [
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Traveller essential', comment: 'Charged my phone four times on a long trip. The percentage display is genuinely useful.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Fast and reliable', comment: 'Charges quickly and the build feels solid. A bit heavy but that comes with 20000mAh.' }
    ]
  },
  'aviator-sunglasses': {
    brand: 'American Optical', seller: 'Classic Eyewear Store',
    price: 1999, mrp: 2999, stock: 70, ratings: 4.5, numOfReviews: 3,
    warranty: '30-Day Return Policy',
    description: 'Timeless aviator sunglasses with a classic teardrop lens, slim metal frame and UV400 protection. The adjustable nose bridge gives a custom fit, making them the definitive summer classic.',
    specifications: [
      { label: 'Frame', value: 'Lightweight metal alloy' },
      { label: 'Lens', value: 'UV400 polycarbonate with 100% UVA/UVB protection' },
      { label: 'Lens Width', value: '58mm' },
      { label: 'Bridge', value: 'Adjustable nose bridge' },
      { label: 'Temples', value: 'Slim metal with acetate tips' },
      { label: 'Colour', value: 'Gold frame, smoke grey lens' },
      { label: 'Case', value: 'Hard case + cleaning cloth' },
      { label: 'Weight', value: '28 g' },
      { label: 'Style', value: 'Classic aviator' },
      { label: 'Origin', value: 'Iconic American design' }
    ],
    features: [
      'Classic aviator teardrop silhouette',
      'UV400 protection for full sun safety',
      'Lightweight metal frame',
      'Adjustable nose bridge for fit',
      'Polarised option adds glare reduction',
      'Includes hard case and cloth'
    ],
    highlights: [
      'Classic aviator design',
      'UV400 lens protection',
      '58mm lightweight frame',
      'Hard case included',
      '30-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'Summer essential', comment: 'Look sharp and fit comfortably. The adjustable bridge makes them sit perfectly.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Classic look', comment: 'Great sunglasses for the price. Solid build and the case is sturdy.' }
    ]
  },
  'wireless-charging-pad': {
    brand: 'VoltCharge', seller: 'VoltCharge Store',
    price: 1499, mrp: 2299, stock: 130, ratings: 4.3, numOfReviews: 3,
    warranty: '1 Year Manufacturer Warranty',
    description: 'This 15W Qi wireless charging pad tops up phones, earbuds and smartwatches without cables. A non-slip silicone surface and LED charge indicator keep things tidy on your desk or nightstand.',
    specifications: [
      { label: 'Output', value: '15W Qi wireless (5W/7.5W/10W/15W)' },
      { label: 'Input', value: 'USB-C with 18W adapter' },
      { label: 'Compatibility', value: 'Qi-certified phones, earbuds, wearables' },
      { label: 'Surface', value: 'Non-slip silicone ring' },
      { label: 'Indicator', value: 'Blue LED charge indicator' },
      { label: 'Protection', value: 'Foreign object detection, over-heat, over-charge' },
      { label: 'Thickness', value: '8mm slim design' },
      { label: 'Cable', value: '1m USB-C to USB-C included' },
      { label: 'Colour', value: 'Sleek matte black' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      '15W fast wireless charging',
      'Compatible with Qi devices and cases',
      'Non-slip silicone surface',
      'Foreign object detection',
      'Slim 8mm profile',
      'LED charge status indicator'
    ],
    highlights: [
      '15W Qi fast charging',
      'USB-C powered',
      'Non-slip slim design',
      'Safety protections',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Tidy charging', comment: 'Charges fast and my phone sits steady on it. LED goes off when full which is nice at night.' },
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 4, title: 'Works great', comment: 'No more cable fumbling. Case-friendly and the cable included is good quality.' }
    ]
  },
  'alice-wonderland-book': {
    brand: 'Penguin Classics', seller: 'ReadNest Book Store',
    price: 399, mrp: 599, stock: 120, ratings: 4.6, numOfReviews: 4,
    warranty: '7-Day Return Policy',
    description: 'Lewis Carroll\'s beloved tale of curiosity and nonsense, featuring the original John Tenniel illustrations. This Penguin Classics hardcover includes the full text of Alice\'s Adventures in Wonderland with an introduction that places the story in its Victorian context.',
    specifications: [
      { label: 'Author', value: 'Lewis Carroll' },
      { label: 'Publisher', value: 'Penguin Classics' },
      { label: 'Format', value: 'Hardcover' },
      { label: 'Language', value: 'English' },
      { label: 'Pages', value: '192' },
      { label: 'Illustrations', value: 'Original John Tenniel artwork' },
      { label: 'ISBN', value: '9780141192468' },
      { label: 'Dimensions', value: '13.6 x 2.3 x 20.3 cm' },
      { label: 'Reading Level', value: '8+ years' },
      { label: 'Genre', value: 'Classic literature, fantasy' }
    ],
    features: [
      'Classic tale of Wonderland, unabridged',
      'Original John Tenniel illustrations',
      'Premium hardcover binding',
      'Penguin Classics authoritative text',
      'Introduction with historical context',
      'Gift-ready dust jacket'
    ],
    highlights: [
      'Original Tenniel illustrations',
      'Hardcover edition',
      'Penguin Classics series',
      'Full unabridged text',
      '7-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 5, title: 'Beautiful edition', comment: 'Lovely hardcover with crisp illustrations. A must-have for any bookshelf.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Classic read', comment: 'Great quality print and the original artwork really brings it to life.' }
    ]
  },
  'harry-potter-book': {
    brand: 'Bloomsbury', seller: 'ReadNest Book Store',
    price: 499, mrp: 799, stock: 100, ratings: 4.8, numOfReviews: 4,
    warranty: '7-Day Return Policy',
    description: 'The book that started it all. Harry Potter and the Philosopher\'s Stone introduces the boy who lived, his first year at Hogwarts and the beginning of the most famous wizarding adventure ever written.',
    specifications: [
      { label: 'Author', value: 'J.K. Rowling' },
      { label: 'Publisher', value: 'Bloomsbury' },
      { label: 'Format', value: 'Paperback' },
      { label: 'Language', value: 'English' },
      { label: 'Pages', value: '223' },
      { label: 'ISBN', value: '9781408855652' },
      { label: 'Series', value: 'Harry Potter, Book 1' },
      { label: 'Dimensions', value: '13.4 x 2.4 x 20.5 cm' },
      { label: 'Age Range', value: '9-12 years' },
      { label: 'Genre', value: 'Fantasy, young adult' }
    ],
    features: [
      'First book in the Harry Potter series',
      'Complete unabridged text',
      'High-quality Bloomsbury paperback',
      'Perfect reading level for ages 9+',
      'Collectible cover artwork',
      'Beloved by readers of all ages'
    ],
    highlights: [
      'Best-selling fantasy series',
      'Complete Book 1 text',
      'Bloomsbury edition',
      'Great for gifting',
      '7-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Magical', comment: 'Still as enchanting today as when I first read it. Print quality is excellent.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'A gift everyone loves', comment: 'Bought for my nephew and he could not put it down. Great price too.' }
    ]
  },
  'nivea-creme': {
    brand: 'Nivea', seller: 'Nivea Official Store',
    price: 399, mrp: 499, stock: 200, ratings: 4.5, numOfReviews: 4,
    warranty: '7-Day Return Policy',
    description: 'The iconic blue tin that has nourished skin for over 100 years. Nivea Crème\'s rich formula with Eucerit locks in moisture and protects against dryness for hands, face and body — now in a value 150g pack.',
    specifications: [
      { label: 'Type', value: 'Multi-purpose moisturising crème' },
      { label: 'Size', value: '150g' },
      { label: 'Key Ingredient', value: 'Eucerit, glycerin, panthenol' },
      { label: 'Skin Type', value: 'All skin types, especially dry' },
      { label: 'Use', value: 'Face, hands and body' },
      { label: 'Finish', value: 'Rich, non-greasy after absorption' },
      { label: 'Fragrance', value: 'Classic Nivea scent' },
      { label: 'Packaging', value: 'Iconic blue tin' },
      { label: 'Origin', value: 'Made in Germany' },
      { label: 'Dermatologist', value: 'Dermatologically approved' }
    ],
    features: [
      'Deep hydration for very dry skin',
      'Iconic Eucerit formula since 1911',
      'Suitable for face, hands and body',
      'Long-lasting moisture barrier',
      'Dermatologically approved',
      'Classic blue tin, 150g'
    ],
    highlights: [
      '150g value pack',
      'Multi-purpose formula',
      'Suitable for all skin types',
      'Dermatologically approved',
      '7-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 5, title: 'The original and best', comment: 'Winter dryness sorted in days. A little goes a long way.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Classic that works', comment: 'Rich but absorbs well. Perfect for elbows and knees.' }
    ]
  },
  'oral-b-electric-toothbrush': {
    brand: 'Oral-B', seller: 'Oral-B India Store',
    price: 2799, mrp: 3999, stock: 90, ratings: 4.4, numOfReviews: 4,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Oral-B Pro 2 delivers a dentist-inspired clean at home. Its 2D oscillating-rotating head removes up to 100% more plaque than a manual brush, while the 2-minute timer with 30-second pacer encourages the right brushing habit.',
    specifications: [
      { label: 'Mode', value: 'Daily Clean + Sensitive' },
      { label: 'Motion', value: '2D oscillating-rotating (7600/min)' },
      { label: 'Timer', value: '2-minute with 30-second quadrant pacer' },
      { label: 'Battery', value: 'Rechargeable, ~7 days on 2h charge' },
      { label: 'Pressure Sensor', value: 'Lights up when brushing too hard' },
      { label: 'Head Type', value: 'CrossAction, fits all Oral-B heads' },
      { label: 'Water Resistance', value: 'Waterproof (IPX7)' },
      { label: 'Compatibility', value: 'Compatible with Oral-B app (optional)' },
      { label: 'Colour', value: 'White with blue accents' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      'Oscillating-rotating technology removes up to 100% more plaque',
      '2 modes: Daily Clean and Sensitive',
      'Built-in 2-minute timer with quadrant pacer',
      'Pressure sensor protects gums',
      'Rechargeable with 7-day battery life',
      'Waterproof for worry-free use'
    ],
    highlights: [
      '2D oscillating-rotating head',
      '2-minute smart timer',
      'Pressure sensor',
      'Rechargeable battery',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 5, title: 'Dentist clean feel', comment: 'My teeth feel noticeably cleaner and the timer keeps me brushing long enough.' },
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Solid upgrade', comment: 'Great brush for the price. Battery lasts a full week as advertised.' }
    ]
  },
  'twinings-tea': {
    brand: 'Twinings', seller: 'Twinings India Store',
    price: 399, mrp: 549, stock: 180, ratings: 4.6, numOfReviews: 4,
    warranty: '7-Day Return Policy',
    description: 'Twinings English Breakfast is a rich, full-bodied blend of Assam, Kenyan and Ceylon teas — perfect with milk or a slice of lemon. This 100-teabag pack delivers the classic British morning cuppa, first blended by Twinings over 150 years ago.',
    specifications: [
      { label: 'Type', value: 'Black tea, 100 teabags' },
      { label: 'Blend', value: 'Assam, Kenyan and Ceylon' },
      { label: 'Brew Time', value: '3-5 minutes in boiling water' },
      { label: 'Serve', value: 'With or without milk' },
      { label: 'Packaging', value: 'Resealable box of 100 envelopes' },
      { label: 'Caffeine', value: 'Medium (40-50mg per cup)' },
      { label: 'Flavour', value: 'Rich, malty and full-bodied' },
      { label: 'Origin', value: 'Blended and packed in UK' },
      { label: 'Brewer', value: 'Twinings, established 1706' },
      { label: 'Storage', value: 'Keep in a cool, dry place' }
    ],
    features: [
      'Rich, malty English Breakfast blend',
      '100 individually wrapped teabags',
      'Perfect with milk or lemon',
      'Consistent strength every cup',
      'Classic Twinings recipe since 1800s',
      'Resealable pack keeps tea fresh'
    ],
    highlights: [
      '100 teabag value pack',
      'Classic full-bodied blend',
      'Fresh-sealed envelopes',
      'Premium Twinings quality',
      '7-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Proper cuppa', comment: 'Strong, malty and consistent. Better than anything else in this price range.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 4, title: 'Great daily tea', comment: 'Brews a hearty cup that takes milk well. Pack keeps teabags fresh.' }
    ]
  },
  'nescafe-classic-coffee': {
    brand: 'Nestlé', seller: 'Nestlé India Store',
    price: 599, mrp: 749, stock: 160, ratings: 4.5, numOfReviews: 4,
    warranty: '7-Day Return Policy',
    description: 'Nescafé Classic is India\'s favourite instant coffee, made from a blend of premium Robusta and Arabica beans. This 200g jar delivers a smooth, rich cup in seconds — just add hot water, milk and sugar to taste.',
    specifications: [
      { label: 'Type', value: 'Instant coffee' },
      { label: 'Size', value: '200g glass jar' },
      { label: 'Bean Blend', value: 'Robusta and Arabica' },
      { label: 'Caffeine', value: 'Medium-high (~65mg per 2g serving)' },
      { label: 'Preparation', value: '1 heaped tsp + hot water/milk' },
      { label: 'Taste', value: 'Smooth, rich with slight bitterness' },
      { label: 'Serving Size', value: '2g per cup (~100 cups per jar)' },
      { label: 'Aroma', value: 'Freshly roasted' },
      { label: 'Packaging', value: 'Resealable glass jar' },
      { label: 'Origin', value: 'Roasted and packed in India' }
    ],
    features: [
      'Smooth, full-bodied instant coffee',
      'Blend of Robusta and Arabica beans',
      '200g jar makes up to 100 cups',
      'Dissolves instantly in hot or cold milk',
      'Resealable glass jar',
      'A favourite for decades'
    ],
    highlights: [
      '200g value jar',
      'Robusta-Arabica blend',
      'Makes up to 100 cups',
      'Instant preparation',
      '7-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'Morning ritual', comment: 'Rich, quick and reliable. The jar lasts my family over a month.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Classic instant', comment: 'Smooth and never bitter when brewed right. Great value for the size.' }
    ]
  },
  'irobot-roomba-vacuum': {
    brand: 'iRobot', seller: 'iRobot India Store',
    price: 34999, mrp: 45999, stock: 35, ratings: 4.3, numOfReviews: 4,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The iRobot Roomba 694 keeps floors clean on autopilot. Smart navigation with iRobot OS learns your routine, 3-stage cleaning lifts dirt into the bin, and the app lets you schedule cleans and control it from anywhere.',
    specifications: [
      { label: 'Model', value: 'Roomba 694' },
      { label: 'Cleaning System', value: '3-Stage with edge-sweeping brush' },
      { label: 'Navigation', value: 'Dirt Detect + sensor-based navigation' },
      { label: 'Suction Power', value: '5x the air power of Roomba 600 series' },
      { label: 'Battery', value: 'Li-ion, ~90 min runtime' },
      { label: 'Bin', value: '600ml dustbin' },
      { label: 'Connectivity', value: 'Wi-Fi with Alexa and Google Assistant' },
      { label: 'App', value: 'iRobot Home app for scheduling' },
      { label: 'Surfaces', value: 'Hardwood, tile, carpet' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      'Smart navigation learns your home layout',
      '3-stage cleaning with edge brush',
      'Works on hardwood, tile and carpet',
      'Wi-Fi control via iRobot Home app',
      'Voice control with Alexa and Google Assistant',
      '90-minute battery runtime'
    ],
    highlights: [
      'Smart app scheduling',
      '3-stage cleaning system',
      '90-minute runtime',
      'Voice assistant support',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 4, title: 'Daily floors without effort', comment: 'Schedule it at 9am and come home to clean floors. Does a solid job on tiles.' },
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Great helper', comment: 'Handles pet hair well. App setup took a few minutes but works smoothly now.' }
    ]
  },
  'electric-kettle': {
    brand: 'Xiaomi', seller: 'Xiaomi India Store',
    price: 1999, mrp: 2999, stock: 140, ratings: 4.4, numOfReviews: 4,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Xiaomi Smart Kettle Pro boils 1.7 litres of water in minutes with a 1800W element. A stainless-steel 304 interior, auto shut-off and boil-dry protection make it safe, while the precise pouring spout keeps your countertop dry.',
    specifications: [
      { label: 'Capacity', value: '1.7 litres' },
      { label: 'Power', value: '1800W, boils in ~6 minutes' },
      { label: 'Material', value: 'Food-grade 304 stainless steel interior' },
      { label: 'Lid', value: 'One-touch open, 30° hold' },
      { label: 'Safety', value: 'Auto shut-off, boil-dry protection' },
      { label: 'Spout', value: 'Precision no-drip pour' },
      { label: 'Base', value: '360° rotatable power base' },
      { label: 'Cord Storage', value: 'Integrated base wrap' },
      { label: 'Colour', value: 'Matte white' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      '1800W rapid boiling for tea and coffee',
      'Food-grade 304 stainless steel interior',
      'Auto shut-off and boil-dry protection',
      'One-touch lid with 30° hold',
      '360° rotatable base for easy use',
      'Sleek matte white design'
    ],
    highlights: [
      '1.7L capacity',
      'Rapid 1800W boiling',
      '304 stainless steel interior',
      'Auto shut-off safety',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Fast and safe', comment: 'Boils quickly and the auto shut-off is reassuring. Great look on the counter.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 4, title: 'Daily essential', comment: 'Solid build, precise pour and easy to clean. Slight whistle when boiling.' }
    ]
  },
  'cricket-bat': {
    brand: 'MRF', seller: 'ProSports Store',
    price: 3499, mrp: 4999, stock: 60, ratings: 4.5, numOfReviews: 4,
    warranty: '30-Day Return Policy',
    description: 'The MRF Genius Grand is an English willow bat handcrafted for power hitters. Its large sweet spot, low-middle profile and cushioned handle deliver punchy drives and clean pick-up, with the toe guard protecting the blade.',
    specifications: [
      { label: 'Grade', value: 'Grade 5 English willow' },
      { label: 'Weight', value: '2.9-3.0 lbs (1.31-1.36 kg)' },
      { label: 'Profile', value: 'Low-middle, large sweet spot' },
      { label: 'Blade Length', value: '33 inches (full size)' },
      { label: 'Handle', value: 'Cushioned with soft grip' },
      { label: 'Edges', value: 'Thick, reinforced' },
      { label: 'Toe Guard', value: 'Pre-fitted, protects against cracking' },
      { label: 'Knocking In', value: 'Recommended 2-4 hours before first use' },
      { label: 'Suitable For', value: 'Hardball cricket, 18+' },
      { label: 'Conditioning', value: 'Oiled and ready to knock in' }
    ],
    features: [
      'Grade 5 English willow for performance',
      'Large sweet spot for powerful shots',
      'Cushioned handle with premium grip',
      'Low-middle profile ideal for drives',
      'Pre-fitted toe guard',
      'Full 33-inch regulation size'
    ],
    highlights: [
      'English willow blade',
      'Large sweet spot',
      'Cushioned grip',
      'Toe guard fitted',
      '30-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Powerhouse', comment: 'After proper knocking in it feels incredible off the middle. Great value willow.' },
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Great match bat', comment: 'Nice balance and pickup. Needs knocking in as expected for English willow.' }
    ]
  },
  'nike-running-shoes': {
    brand: 'Nike', seller: 'Nike India Store',
    price: 6999, mrp: 9999, stock: 75, ratings: 4.6, numOfReviews: 4,
    warranty: '30-Day Return Policy',
    description: 'The Nike Revolution 6 delivers a soft, smooth ride for everyday miles. A full-length foam midsole and breathable mesh upper keep every run comfortable, while the rubber outsole provides durable traction on road and track.',
    specifications: [
      { label: 'Model', value: 'Nike Revolution 6' },
      { label: 'Cushioning', value: 'Full-length foam midsole' },
      { label: 'Upper', value: 'Breathable engineered mesh' },
      { label: 'Outsole', value: 'Durable rubber with flex grooves' },
      { label: 'Heel Drop', value: '10mm' },
      { label: 'Weight', value: '~270g (men\'s UK 8)' },
      { label: 'Closure', value: 'Traditional lace-up' },
      { label: 'Support', value: 'Neutral' },
      { label: 'Sizes', value: 'UK 6-12' },
      { label: 'Best For', value: 'Daily runs, gym, casual wear' }
    ],
    features: [
      'Soft full-length foam cushioning',
      'Breathable mesh keeps feet cool',
      'Neutral support for most runners',
      'Durable rubber outsole with flex grooves',
      'Lightweight everyday design',
      'Sleek Nike styling for off-run wear'
    ],
    highlights: [
      'Full-length foam cushioning',
      'Breathable upper',
      'Neutral support',
      'UK 6-12 sizes',
      '30-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'Comfy daily runner', comment: 'Plush underfoot and true to size. My go-to for 5k morning runs.' },
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 4, title: 'Great value', comment: 'Comfortable from day one with zero break-in. Traction is good on wet pavement.' }
    ]
  },
  'camping-dome-tent': {
    brand: 'Coleman', seller: 'Trailhead Outdoor Store',
    price: 4999, mrp: 7499, stock: 40, ratings: 4.2, numOfReviews: 4,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Coleman Dome Tent for 2 people is quick to pitch and ready for the elements. A watertight flysheet with taped seams, breathable mesh windows and a full-coverage rainfly keep you dry and cool on weekend trips.',
    specifications: [
      { label: 'Capacity', value: '2-person' },
      { label: 'Setup', value: 'Fibreglass pole dome, ~10 min pitch' },
      { label: 'Flysheet', value: 'Waterproof, taped seams' },
      { label: 'Inner', value: 'Breathable mesh with zip door' },
      { label: 'Waterproof Rating', value: '2000mm' },
      { label: 'Ventilation', value: 'Front and rear mesh windows' },
      { label: 'Storage', value: 'Interior pockets + gear loft' },
      { label: 'Dimensions', value: '210 x 150 x 110 cm' },
      { label: 'Packed Weight', value: '2.8 kg' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      '2-person dome design pitches fast',
      'Waterproof flysheet with taped seams',
      'Breathable mesh for airflow and views',
      'Interior storage pockets and gear loft',
      'Fits two sleeping mats comfortably',
      'Compact carry bag for transport'
    ],
    highlights: [
      'Quick-pitch dome',
      'Waterproof construction',
      'Mesh ventilation',
      '2-person capacity',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 4, title: 'Solid weekend tent', comment: 'Easy to pitch solo and stayed dry through light rain. Good value for the size.' },
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 4, title: 'Roomy for two', comment: 'Fits a double air mattress nicely. Packs down small enough for the boot.' }
    ]
  },
  'insulated-water-bottle': {
    brand: 'Hydro Flask', seller: 'Hydro Flask India',
    price: 2499, mrp: 3499, stock: 120, ratings: 4.7, numOfReviews: 4,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The Hydro Flask Standard Mouth bottle keeps drinks ice-cold for 24 hours or hot for 12. Double-wall vacuum insulation, a splash-resistant lid and a powder-coated finish that resists condensation make it the perfect daily companion.',
    specifications: [
      { label: 'Capacity', value: '750ml (25oz)' },
      { label: 'Insulation', value: 'Double-wall vacuum, 24h cold / 12h hot' },
      { label: 'Material', value: '18/8 pro-grade stainless steel' },
      { label: 'Finish', value: 'Powder coat, sweat-free exterior' },
      { label: 'Lid', value: 'Splash-resistant standard mouth' },
      { label: 'BPA Free', value: 'Yes' },
      { label: 'Dishwasher', value: 'Top-rack safe' },
      { label: 'Colour', value: 'Matte fog grey' },
      { label: 'Diameter', value: '6.6cm opening, cup-holder friendly' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      'Ice-cold for 24 hours, hot for 12',
      '18/8 pro-grade stainless steel',
      'Powder coat stays dry without a sleeve',
      'Splash-resistant lid',
      'Fits standard car cup holders',
      'BPA-free and dishwasher safe'
    ],
    highlights: [
      '24h cold / 12h hot insulation',
      '750ml capacity',
      'Sweat-free powder coat',
      'BPA-free stainless steel',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 5, title: 'Ice all day', comment: 'Ice cubes still clinking at 6pm. Condensation-free and feels premium.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Worth every rupee', comment: 'Takes the gym, office and car with me. Cleaning is effortless.' }
    ]
  },
  'jbl-flip-speaker': {
    brand: 'JBL', seller: 'JBL India Store',
    price: 7499, mrp: 9999, stock: 80, ratings: 4.6, numOfReviews: 4,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The JBL Flip 6 is a rugged, portable speaker with bold JBL Pro Sound. One 20W racetrack woofer and a separate tweeter deliver crisp highs and deep bass, while IP67 waterproofing makes it perfect for poolside and beach.',
    specifications: [
      { label: 'Model', value: 'JBL Flip 6' },
      { label: 'Output', value: '20W (racetrack woofer + tweeter)' },
      { label: 'Battery', value: 'Up to 12 hours playback' },
      { label: 'Charging', value: 'USB-C, 2.5h full charge' },
      { label: 'Waterproof', value: 'IP67 dust and water proof' },
      { label: 'Connectivity', value: 'Bluetooth 5.1, PartyBoost pairing' },
      { label: 'Frequency', value: '63Hz - 20kHz' },
      { label: 'Weight', value: '550g' },
      { label: 'Dimensions', value: '17.8 x 6.8 x 7.2 cm' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      'Bold JBL Pro Sound with 20W output',
      'IP67 waterproof and dustproof',
      'Up to 12 hours of playtime',
      'USB-C fast charging',
      'PartyBoost links multiple JBL speakers',
      'Pocket-friendly portable design'
    ],
    highlights: [
      '20W powerful sound',
      '12-hour battery',
      'IP67 waterproof',
      'Bluetooth 5.1 + PartyBoost',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[2].user, userName: REVIEWER[2].userName, rating: 5, title: 'Big sound, small box', comment: 'Surprisingly punchy bass for its size and the battery genuinely lasts a day.' },
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 4, title: 'Perfect travel speaker', comment: 'Waterproof rating gives peace of mind at the pool. Loud and clear outdoors.' }
    ]
  },
  'playstation-5-console': {
    brand: 'Sony', seller: 'Sony India Store',
    price: 44999, mrp: 54999, stock: 30, ratings: 4.8, numOfReviews: 4,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The PlayStation 5 Console redefines gaming with lightning-fast loading, haptic feedback and adaptive triggers. A custom SSD and 4K 120Hz output make every game feel responsive, backed by the immersive DualSense wireless controller.',
    specifications: [
      { label: 'Model', value: 'PlayStation 5 (Disc edition)' },
      { label: 'Storage', value: '825GB custom NVMe SSD (667GB usable)' },
      { label: 'CPU', value: 'AMD Zen 2, 8-core @ 3.5GHz' },
      { label: 'GPU', value: '10.28 TFLOPS RDNA 2, 4K/120Hz' },
      { label: 'RAM', value: '16GB GDDR6' },
      { label: 'Controller', value: 'DualSense with haptics and adaptive triggers' },
      { label: 'Connectivity', value: 'Wi-Fi 6, Bluetooth 5.1, 2x USB-A, USB-C' },
      { label: 'Disc Drive', value: 'Ultra HD Blu-ray' },
      { label: 'Output', value: 'HDMI 2.1, 8K ready' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      'Custom SSD for near-instant load times',
      '4K gaming at up to 120fps',
      'DualSense haptic feedback and adaptive triggers',
      'Ultra HD Blu-ray disc drive',
      '3D Audio via Tempest engine',
      'Backwards compatible with PS4 games'
    ],
    highlights: [
      '825GB custom SSD',
      '4K/120Hz support',
      'DualSense controller',
      'Disc edition',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[4].user, userName: REVIEWER[4].userName, rating: 5, title: 'Next-gen is here', comment: 'Loads in seconds and the haptics are a game changer. My PS4 games run better too.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Fantastic console', comment: 'Smooth 120fps on my OLED and whisper quiet compared to my old console.' }
    ]
  },
  'asus-proart-monitor': {
    brand: 'ASUS', seller: 'ASUS India Store',
    price: 29999, mrp: 37999, stock: 40, ratings: 4.4, numOfReviews: 4,
    warranty: '1 Year Manufacturer Warranty',
    description: 'The ASUS ProArt PA246Q delivers factory-calibrated colour for creative pros. A 24-inch 1920x1200 IPS panel covers 99% Adobe RGB, while the USB 3.0 hub, card reader and height-adjustable stand round out a workstation-ready display.',
    specifications: [
      { label: 'Panel', value: '24-inch 1920x1200 IPS (16:10)' },
      { label: 'Colour Gamut', value: '99% Adobe RGB' },
      { label: 'Calibration', value: 'Factory-calibrated to ΔE < 5' },
      { label: 'Brightness', value: '300 cd/m²' },
      { label: 'Contrast', value: '1000:1 (50M:1 ASUS Smart Contrast)' },
      { label: 'Refresh Rate', value: '60Hz' },
      { label: 'Ports', value: 'DVI-D, DisplayPort 1.2, HDMI 1.4' },
      { label: 'USB Hub', value: 'USB 3.0, 2 up / 4 down' },
      { label: 'Stand', value: 'Tilt, swivel, pivot, 130mm height' },
      { label: 'Warranty', value: '1 Year' }
    ],
    features: [
      '24-inch 16:10 IPS panel',
      '99% Adobe RGB colour accuracy',
      'Factory pre-calibrated out of the box',
      'Built-in USB 3.0 hub and card reader',
      'Fully adjustable ergonomic stand',
      'VESA mount compatible'
    ],
    highlights: [
      '99% Adobe RGB',
      'Factory calibration',
      'USB 3.0 hub',
      'Ergonomic stand',
      '1 Year Manufacturer Warranty'
    ],
    reviews: [
      { user: REVIEWER[0].user, userName: REVIEWER[0].userName, rating: 4, title: 'Colour accurate', comment: 'My prints now match the screen. The extra 16:10 height is a plus for editing.' },
      { user: REVIEWER[3].user, userName: REVIEWER[3].userName, rating: 5, title: 'Photographer dream', comment: 'The USB hub and card reader make my workflow so much cleaner. Excellent panel.' }
    ]
  },
  'nike-air-force-1': {
    brand: 'Nike', seller: 'Nike India Store',
    price: 7499, mrp: 9995, stock: 85, ratings: 4.7, numOfReviews: 4,
    warranty: '30-Day Return Policy',
    description: 'The Nike Air Force 1 is an icon that transcends generations. A leather upper, Air-Sole cushioning and the instantly recognisable silhouette make these sneakers as comfortable for all-day wear as they are stylish.',
    specifications: [
      { label: 'Model', value: 'Nike Air Force 1 \'07' },
      { label: 'Upper', value: 'Full-grain leather' },
      { label: 'Cushioning', value: 'Nike Air-Sole unit' },
      { label: 'Outsole', value: 'Pivot-point rubber, classic pattern' },
      { label: 'Closure', value: 'Lace-up with perforated toe box' },
      { label: 'Weight', value: '~390g (UK 8)' },
      { label: 'Sizes', value: 'UK 6-12' },
      { label: 'Colourway', value: 'Triple white' },
      { label: 'Style', value: 'Streetwear, casual' },
      { label: 'Since', value: 'First released 1982' }
    ],
    features: [
      'Iconic 1982 streetwear silhouette',
      'Durable full-grain leather upper',
      'Nike Air-Sole for all-day comfort',
      'Pivot-point traction outsole',
      'Classic triple-white colourway',
      'Pairs with everything'
    ],
    highlights: [
      'Iconic AF-1 silhouette',
      'Full-grain leather',
      'Air-Sole cushioning',
      'UK 6-12 sizes',
      '30-Day Return Policy'
    ],
    reviews: [
      { user: REVIEWER[5].user, userName: REVIEWER[5].userName, rating: 5, title: 'Timeless', comment: 'Comfortable out of the box and look clean with any outfit. A wardrobe staple.' },
      { user: REVIEWER[1].user, userName: REVIEWER[1].userName, rating: 5, title: 'Classic pick-up', comment: 'Quality leather and the Air cushioning is noticeably comfy. Worth the price.' }
    ]
  }
};

function build() {
  const products = [];
  const problems = [];

  for (const [index, spec] of SPECS.entries()) {
    const detail = DETAILS[spec.slug];
    if (!detail) {
      problems.push(`No DETAILS entry for "${spec.slug}"`);
      continue;
    }
    const manifest = MANIFEST[spec.slug];
    if (!manifest || !Array.isArray(manifest.images) || manifest.images.length !== 5) {
      problems.push(`Manifest images != 5 for "${spec.slug}"`);
      continue;
    }
    const discount = Math.round(((detail.mrp - detail.price) / detail.mrp) * 100);
    if (discount < 0 || discount > 95) {
      problems.push(`Bad discount ${discount} for "${spec.slug}"`);
      continue;
    }
    const reviews = detail.reviews.map((r) => ({
      user: r.user,
      userName: r.userName,
      rating: r.rating,
      title: r.title,
      comment: r.comment
    }));
    // Stagger createdAt so "New Arrivals" (createdAt desc) surfaces the most
    // recently added specs first instead of a tie on insert time.
    const createdAt = new Date(Date.now() - (SPECS.length - 1 - index) * 12 * 60 * 60 * 1000).toISOString();
    products.push({
      createdAt,
      name: spec.name,
      brand: detail.brand,
      seller: detail.seller,
      category: spec.category,
      price: detail.price,
      mrp: detail.mrp,
      discount,
      stock: detail.stock,
      ratings: detail.ratings,
      numOfReviews: detail.numOfReviews,
      description: detail.description,
      specifications: detail.specifications,
      features: detail.features,
      highlights: detail.highlights,
      warranty: detail.warranty,
      images: manifest.images.map((img) => ({ image: img.local })),
      reviews
    });
  }

  if (problems.length) {
    console.error('buildCatalog problems:');
    problems.forEach((p) => console.error('  - ' + p));
    process.exit(1);
  }

  const outPath = path.join(__dirname, '..', 'data', 'products.json');
  fs.writeFileSync(outPath, JSON.stringify(products, null, 2) + '\n');
  console.log(`Wrote ${products.length} products to ${outPath}`);
  console.table(products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {}));
}

build();
