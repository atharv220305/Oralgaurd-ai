import { AwarenessArticle, AwarenessCategoryKey, PatientProfile } from '../types';

export const AWARENESS_CATEGORIES: { id: AwarenessCategoryKey; label: string; labelHi: string; icon: string; count?: number }[] = [
  { id: 'all', label: 'All Topics', labelHi: 'सभी विषय', icon: 'BookOpen' },
  { id: 'cancer_awareness', label: 'Cancer Awareness', labelHi: 'ओरल कैंसर जागरूकता', icon: 'ShieldAlert' },
  { id: 'warning_signs', label: 'Warning Signs', labelHi: 'चेतावनी संकेत व लक्षण', icon: 'AlertTriangle' },
  { id: 'oral_hygiene', label: 'Oral Hygiene', labelHi: 'दंत व मुख स्वच्छता', icon: 'Sparkles' },
  { id: 'tobacco_supari_risks', label: 'Tobacco & Supari', labelHi: 'तंबाकू व सुपारी जोखिम', icon: 'Flame' },
  { id: 'educational_videos', label: 'Step-by-Step Guides', labelHi: 'जाँच मार्गदर्शिका', icon: 'Video' },
  { id: 'trusted_organizations', label: 'Trusted Resources', labelHi: 'प्रामाणिक संस्थाएं', icon: 'Building2' },
];

export const AWARENESS_ARTICLES: AwarenessArticle[] = [
  // 1. Cancer Awareness
  {
    id: 'what-is-oral-cancer',
    category: 'cancer_awareness',
    title: 'Understanding Oral Cancer & Early Detection',
    titleHi: 'ओरल कैंसर क्या है और प्रारंभिक जाँच क्यों महत्वपूर्ण है?',
    titleHinglish: 'Oral Cancer kya hota hai aur early detection kyu zaroori hai?',
    subtitle: 'What happens in oral tissues and why early clinical evaluation saves lives.',
    subtitleHi: 'मुँह की कोशिकाओं में होने वाले बदलाव और समय पर डॉक्टर से जाँच का महत्व।',
    readTime: '3 min read',
    iconName: 'Stethoscope',
    badge: 'Core Awareness',
    summary:
      'Oral cancer refers to malignant cell growth that develops in any part of the oral cavity, including the tongue, gums, inner cheeks, roof of the mouth, or floor of the mouth beneath the tongue. When identified in its earliest stages, outcomes and treatment success rates are substantially higher.',
    keyPoints: [
      'Oral cancer most commonly begins in the flat, thin squamous cells lining the inside of the mouth and lips.',
      'Early mucosal alterations often cause little to no sharp pain initially, making visual vigilance essential.',
      'Regular checkups allow dentists and doctors to identify suspicious mucosal changes long before they spread.',
      'Early detection allows for minimally invasive, conservative treatments with excellent functional recovery.',
    ],
    clinicalSignificance:
      'The 5-year relative survival rate exceeds 85% when oral lesions are discovered and treated in localized, early stages compared to late regional stages.',
    whenToConsultDoctor:
      'Schedule a clinical visit with a dentist or doctor if any sore, lump, red/white patch, or unusual sensation lasts longer than 14 days without clear improvement.',
    practicalAction: 'Perform a monthly 2-minute visual mouth self-check in front of a well-lit mirror.',
    trustedSourceAttribution: 'World Health Organization (WHO) & National Cancer Institute (NCI)',
    relevantFindingTriggers: ['hasLesionOrUlcer', 'colorChanges', 'thickeningOrLump'],
  },
  {
    id: 'why-persistence-matters',
    category: 'cancer_awareness',
    title: 'The 2-Week Rule: Why Duration is Critical',
    titleHi: '२-सप्ताह का नियम: घाव की अवधि क्यों सबसे महत्वपूर्ण है?',
    titleHinglish: '2-Week Rule: Chhale ki duration kyu sabse important hoti hai?',
    subtitle: 'Understanding the biological difference between temporary aphthous ulcers and persistent lesions.',
    subtitleHi: 'सामान्य छाले और लगातार बने रहने वाले घावों में जैविक अंतर।',
    readTime: '2 min read',
    iconName: 'Clock',
    badge: 'Clinical Rule',
    summary:
      'Common benign mouth ulcers (such as accidental cheek bites or stress-related aphthous ulcers) almost always resolve on their own within 7 to 14 days. When any oral ulcer or discoloration persists beyond 14 days, the cellular turnover is abnormal and requires clinical evaluation.',
    keyPoints: [
      'Normal oral mucosa heals rapidly due to rich blood supply and salivary protective factors.',
      'Benign ulcers peak within 3-5 days and noticeably shrink or heal by day 10-14.',
      'Non-healing sores lasting >2 weeks may represent chronic trauma, infections, autoimmune conditions, or dysplastic mucosal changes.',
      'A persistent ulcer does NOT automatically mean cancer, but it DOES mean a doctor must examine it in person.',
    ],
    clinicalSignificance:
      'Chronic non-healing mucosal ulcers are among the most common early presentations of oral premalignant or malignant conditions.',
    whenToConsultDoctor:
      'Any sore in the mouth that has been present for 2 weeks or longer warrants an in-person dental or ENT consultation.',
    practicalAction: 'Mark the date on your calendar when you first notice a mouth sore to accurately track its duration.',
    trustedSourceAttribution: 'Indian Dental Association (IDA) Clinical Practice Guidelines',
    relevantFindingTriggers: ['durationOverTwoWeeks', 'duration'],
  },

  // 2. Warning Signs & Red Flags
  {
    id: 'warning-signs-overview',
    category: 'warning_signs',
    title: 'Recognizing Common Oral Warning Signs',
    titleHi: 'मुँह के मुख्य चेतावनी संकेतों की पहचान करें',
    titleHinglish: 'Mouth ke main warning signs aur red flags ko pehchanein',
    subtitle: 'A clear guide to what signs require professional dental or medical assessment.',
    subtitleHi: 'कौन से लक्षण दिखने पर डॉक्टर या डेंटिस्ट से तुरंत संपर्क करना चाहिए।',
    readTime: '4 min read',
    iconName: 'AlertTriangle',
    badge: 'Warning Signs',
    summary:
      'Being aware of changes inside your mouth empowers you to seek care early. While these signs can be caused by benign conditions like fungal infections, vitamin deficiencies, or sharp teeth, any persistent sign must be evaluated by a healthcare professional.',
    keyPoints: [
      'Persistent Mouth Ulcer: A sore that does not heal after 2 weeks, especially if painless or indurated.',
      'White or Red Patches: Leukoplakia (white patch that cannot be wiped away) or Erythroplakia (velvety red patch).',
      'Unexplained Lump or Thickening: A firm area in the cheek, tongue border, gum, or floor of mouth.',
      'Restricted Mouth Opening (Trismus): Inability to insert 3 fingers vertically between front teeth, often seen in areca/gutka chewers.',
      'Unexplained Bleeding or Numbness: Bleeding without obvious gum disease or loss of sensation in lip or tongue.',
      'Difficulty Chewing or Swallowing: Pain or persistent obstruction when eating or moving the tongue.',
    ],
    clinicalSignificance:
      'Erythroplakic (red) patches and non-healing indurated ulcers have the highest statistical association with epithelial dysplasia.',
    whenToConsultDoctor:
      'Safety Clarification: These signs do NOT automatically mean cancer. However, if any of these signs persist for over 2 weeks, consult a dentist, oral surgeon, or ENT specialist promptly.',
    practicalAction: 'Do not scrape, burn, or apply unverified chemicals or home remedies to suspicious oral patches.',
    trustedSourceAttribution: 'American Dental Association (ADA) & World Health Organization',
    relevantFindingTriggers: ['hasLesionOrUlcer', 'colorChanges', 'thickeningOrLump', 'reducedMouthOpening', 'difficultySwallowing'],
  },
  {
    id: 'leukoplakia-erythroplakia',
    category: 'warning_signs',
    title: 'Red & White Patches: What You Need to Know',
    titleHi: 'सफ़ेद और लाल पैच: ल्यूकोप्लाकिया व एरिथ्रोप्लाकिया की जानकारी',
    titleHinglish: 'Safed aur Laal patches: Leukoplakia aur Erythroplakia ki jankari',
    subtitle: 'Understanding mucosal discoloration, keratosis, and why rubbing them away is not recommended.',
    subtitleHi: 'मुँह के रंग में बदलाव और उनकी चिकित्सकीय जाँच की आवश्यकता।',
    readTime: '3 min read',
    iconName: 'Eye',
    badge: 'Clinical Pathology',
    summary:
      'Mucosal patches are among the most recognizable oral warning signs. A white patch that cannot be rubbed off is termed leukoplakia. A velvety red patch is termed erythroplakia. Both represent changes in the mucosal lining that require a professional biopsy or clinical exam.',
    keyPoints: [
      'White patches (Leukoplakia) are often caused by chronic chemical or mechanical irritation (such as khaini, gutka, or a sharp tooth).',
      'Red patches (Erythroplakia) are less common than white patches but have a significantly higher risk of dysplastic changes.',
      'Mixed red and white patches (Erythroleukoplakia) also warrant high clinical priority.',
      'Never attempt to scrape off a white patch with hard objects, as this damages mucosal integrity.',
    ],
    clinicalSignificance:
      'Early identification and lifestyle cessation (quitting tobacco/supari) can lead to regression of some early hyperkeratotic patches.',
    whenToConsultDoctor:
      'Have any white or red patch inspected by an oral specialist within 1-2 weeks of initial observation.',
    practicalAction: 'Take a clear photograph in good light to document the patch size and color for your doctor.',
    trustedSourceAttribution: 'Oral Oncology & World Health Organization Collaborative Center',
    relevantFindingTriggers: ['colorChanges'],
  },

  // 3. Oral Hygiene & Preventive Care
  {
    id: 'proper-brushing-hygiene',
    category: 'oral_hygiene',
    title: 'Daily Oral Hygiene & Mucosal Protection',
    titleHi: 'दैनिक मुख स्वच्छता और मसूड़ों की उचित देखभाल',
    titleHinglish: 'Daily Oral Hygiene: Sahi tarike se brush aur care kaise karein',
    subtitle: 'Effective brushing, interdental cleaning, and keeping the oral lining resilient.',
    subtitleHi: 'ब्रश करने का सही तरीका, फ्लॉसिंग और मसूड़ों को स्वस्थ रखने के नियम।',
    readTime: '3 min read',
    iconName: 'Sparkles',
    badge: 'Preventive Care',
    summary:
      'Maintaining excellent oral hygiene reduces chronic bacterial and fungal inflammation, protects mucosal integrity, and makes suspicious changes much easier to spot during daily routines.',
    keyPoints: [
      'Brush Twice Daily for 2 Minutes: Use a soft-bristled toothbrush with fluoride toothpaste at a 45-degree angle to the gumline.',
      'Gentle Tongue Cleaning: Clean your tongue gently from back to front using a soft tongue scraper or brush to remove debris.',
      'Interdental Cleaning: Clean between teeth daily with dental floss or interdental brushes where toothbrush bristles cannot reach.',
      'Avoid Harsh Abrasive Powders: Coarse tooth powders (dant manjan) can erode tooth enamel and scratch delicate buccal mucosa.',
      'Address Sharp Teeth & Ill-fitting Dentures: Chronic rubbing against the cheek or tongue is a known irritant.',
      'Regular Dental Visits: Visit a dentist every 6 months for professional scaling, polish, and routine mucosal screening.',
    ],
    clinicalSignificance:
      'Chronic poor oral hygiene and persistent mechanical trauma can exacerbate mucosal inflammation and impair natural tissue healing.',
    whenToConsultDoctor:
      'Consult a dentist if you have persistent bleeding gums, loose teeth, or a sharp tooth edge irritating your cheek.',
    practicalAction: 'Replace your toothbrush every 3 months or sooner if bristles become frayed and flared.',
    trustedSourceAttribution: 'Indian Dental Association & American Dental Association',
    relevantFindingTriggers: ['chronicIrritation', 'mouthPainOrBurning'],
  },

  // 4. Tobacco & Areca Nut Risks
  {
    id: 'tobacco-supari-oral-impact',
    category: 'tobacco_supari_risks',
    title: 'How Gutka, Khaini, Supari & Tobacco Affect the Mouth',
    titleHi: 'गुटखा, खैनी, सुपारी और तंबाकू का मुँह पर क्या असर होता है?',
    titleHinglish: 'Gutka, Khaini, Supari aur Tobacco muh ko kaise affect karte hain?',
    subtitle: 'The biochemical mechanics of carcinogens, arecoline, and Oral Submucous Fibrosis (OSMF).',
    subtitleHi: 'सुपारी के एरेकोलिन और तंबाकू के रसायनों से मुँह में होने वाले बदलाव।',
    readTime: '4 min read',
    iconName: 'Flame',
    badge: 'Habit Science',
    summary:
      'Both smokeless tobacco (Gutka, Khaini, Zarda) and areca nut (Supari) have direct biochemical impacts on the delicate lining of the mouth. Even "plain supari" contains arecoline, an alkaloid that causes irreversible stiffening of cheek tissues.',
    keyPoints: [
      'Areca Nut & OSMF: Arecoline in supari stimulates excessive collagen production and prevents its breakdown, leading to Oral Submucous Fibrosis (OSMF) with severe burning and loss of mouth opening.',
      'Tobacco Nitrosamines: Smokeless tobacco contains tobacco-specific nitrosamines (TSNAs) that cause direct DNA mutations in mucosal cells.',
      'Lime (Chuna) Permeability: Slaked lime creates micro-abrasions in the lining, accelerating the penetration of toxic substances into deeper tissue layers.',
      'Synergy with Alcohol: Combining tobacco with alcohol produces a multiplicative risk because alcohol dissolves protective salivary barriers and acts as a solvent for carcinogens.',
      'Combustible Tobacco: Bidis and cigarettes deliver high thermal heat and thousands of combustion products directly onto the palate and tongue.',
    ],
    clinicalSignificance:
      'Oral Submucous Fibrosis is a chronic, progressive condition classified by the WHO as an oral potentially malignant disorder (OPMD).',
    whenToConsultDoctor:
      'If you notice burning while eating spicy foods or your mouth opening is shrinking, consult an oral medicine specialist promptly.',
    practicalAction:
      'Reduce daily pouch counts and replace the habit with healthy alternatives like roasted fennel seeds (saunf) and cardamom (elaichi).',
    trustedSourceAttribution: 'World Health Organization (IARC Monographs on Areca Nut and Tobacco)',
    relevantFindingTriggers: ['tobaccoSmokeless', 'tobaccoSmoked', 'arecaOrBetelNut', 'reducedMouthOpening'],
  },

  // 5. Educational Guides & Self-Examination
  {
    id: 'step-by-step-self-exam',
    category: 'educational_videos',
    title: 'How to Do a 2-Minute Oral Self-Check at Home',
    titleHi: 'घर पर २-मिनट में मुँह की स्वयं-जाँच (Self-Check) कैसे करें?',
    titleHinglish: 'Ghar par 2-minute me Oral Self-Check kaise karein (Step-by-Step)',
    subtitle: 'A structured 5-step visual guide using a mirror and your phone flashlight.',
    subtitleHi: 'शीशे और रोशनी की मदद से मुँह के ५ मुख्य हिस्सों की आसान जाँच।',
    readTime: '3 min read',
    iconName: 'Search',
    badge: 'Self-Check Guide',
    summary:
      'A monthly oral self-examination takes only 2 minutes and helps you become familiar with the normal appearance and feel of your mouth, making any new ulcer, color change, or swelling easy to detect early.',
    keyPoints: [
      'Step 1 — Lips & Outer Gums: In front of a mirror, look at and gently pull down the lower lip and lift the upper lip to inspect the inner lining and gums.',
      'Step 2 — Cheeks (Buccal Mucosa): Gently pull your cheek outward. Look for white/red patches, rough spots, or dark pigmentation on both left and right inner cheeks.',
      'Step 3 — Tongue (Top, Sides & Underside): Stick your tongue straight out. Move it to the left and right to inspect the lateral borders (a common site for changes). Lift the tip of your tongue to the roof of your mouth to view the underside.',
      'Step 4 — Floor of the Mouth: With your tongue raised, inspect the soft floor of your mouth beneath the tongue for any lumps or persistent sores.',
      'Step 5 — Roof of the Mouth & Palate: Tilt your head back slightly and open wide to inspect the hard and soft palate for discoloration or lumps.',
    ],
    clinicalSignificance:
      'Over 80% of the oral cavity is directly visible to the naked eye with adequate lighting, making self-awareness exceptionally effective.',
    whenToConsultDoctor:
      'If you spot an asymmetry, a firm lump, or an area that looks different on one side and lasts over 2 weeks, have a dentist check it.',
    practicalAction: 'Use your smartphone flashlight in front of a bathroom mirror for clear, shadow-free illumination.',
    trustedSourceAttribution: 'Oral Cancer Foundation & Indian Dental Association Patient Education',
    relevantFindingTriggers: ['hasLesionOrUlcer', 'affectedRegions'],
  },

  // 6. Trusted Resources
  {
    id: 'trusted-health-resources',
    category: 'trusted_organizations',
    title: 'Recognized Health Organizations & Public Resources',
    titleHi: 'मान्यता प्राप्त राष्ट्रीय व वैश्विक स्वास्थ्य संस्थाएं',
    titleHinglish: 'Recognized Health Organizations & Trusted Resources',
    subtitle: 'Official public health bodies providing verified clinical guidelines and patient support.',
    subtitleHi: 'प्रामाणिक व विश्वसनीय स्वास्थ्य दिशानिर्देश और आधिकारिक जानकारी।',
    readTime: '2 min read',
    iconName: 'Building2',
    badge: 'Verified Sources',
    summary:
      'Always refer to established public health bodies, academic institutions, and national dental associations for verified medical guidance. Avoid unverified social media claims, home-remedy cures, or caustic topical chemicals.',
    keyPoints: [
      'World Health Organization (WHO): Global oral health programs, IARC monograph carcinogen classifications, and evidence-based screening protocols (who.int).',
      'Indian Dental Association (IDA): National oral cancer awareness, National Oral Health Program guidelines, and dentist directory services (ida.org.in).',
      'National Cancer Institute (NCI): Comprehensive patient education on head and neck screening, stages, and prevention guidelines (cancer.gov).',
      'Centers for Disease Control and Prevention (CDC): Public health resources for smoking and tobacco cessation support (cdc.gov/tobacco).',
      'American Dental Association (ADA): Clinical practice guidelines on oral cancer evaluation and preventive care (ada.org).',
    ],
    clinicalSignificance:
      'Relying on evidence-based public health guidance ensures safe, standardized, and timely medical intervention.',
    whenToConsultDoctor:
      'Consult a locally registered dentist, Maxillofacial specialist, or ENT physician for any personal health concerns.',
    practicalAction: 'Bookmark reputable official resources and avoid relying on unvetted internet forums for medical triage.',
    trustedSourceAttribution: 'World Health Organization, IDA, NCI, CDC, ADA',
  },
];

/**
 * Helper to compute personalized educational recommendations from screening profile
 */
export function getContextualAwarenessRecommendations(profile: PatientProfile): AwarenessArticle[] {
  const matchedArticles: AwarenessArticle[] = [];

  // Check tobacco / supari exposure
  const hasTobacco =
    (profile.tobaccoSmokeless && profile.tobaccoSmokeless !== 'none') ||
    (profile.tobaccoSmoked && profile.tobaccoSmoked !== 'none') ||
    (profile.arecaOrBetelNut && profile.arecaOrBetelNut !== 'none') ||
    (profile.tobaccoUse && profile.tobaccoUse.status === 'current');

  if (hasTobacco) {
    const article = AWARENESS_ARTICLES.find((a) => a.id === 'tobacco-supari-oral-impact');
    if (article) matchedArticles.push(article);
  }

  // Check persistent ulcer or duration
  if (profile.hasLesionOrUlcer || profile.durationOverTwoWeeks || profile.duration === 'two_to_four_weeks' || profile.duration === 'more_than_one_month') {
    const article = AWARENESS_ARTICLES.find((a) => a.id === 'why-persistence-matters');
    if (article && !matchedArticles.includes(article)) matchedArticles.push(article);
  }

  // Check warning signs / patches / trismus
  if (profile.colorChanges || profile.thickeningOrLump || profile.reducedMouthOpening || profile.unexplainedBleeding) {
    const article = AWARENESS_ARTICLES.find((a) => a.id === 'warning-signs-overview');
    if (article && !matchedArticles.includes(article)) matchedArticles.push(article);
  }

  // Always include Self-exam if fewer than 2 recommendations
  if (matchedArticles.length < 2) {
    const selfExam = AWARENESS_ARTICLES.find((a) => a.id === 'step-by-step-self-exam');
    if (selfExam && !matchedArticles.includes(selfExam)) matchedArticles.push(selfExam);
  }

  return matchedArticles;
}
