import { TobaccoProductItem, TobaccoCessationPlan } from '../types';

export interface TobaccoProductCategory {
  id: string;
  name: string;
  hindiName: string;
  category: 'smokeless' | 'smoked' | 'areca_only' | 'other';
  description: string;
  commonUnits: string[];
  oralHealthImpact: string;
}

export const COMMON_TOBACCO_PRODUCTS: TobaccoProductCategory[] = [
  {
    id: 'gutka',
    name: 'Gutka',
    hindiName: 'गुटखा',
    category: 'smokeless',
    description: 'Crushed areca nut, tobacco, slaked lime, and flavoring agents. High risk for submucous fibrosis (OSMF) and mucosal alterations.',
    commonUnits: ['pouches / packets per day', 'times per day'],
    oralHealthImpact: 'Direct mucosal trauma, mucosal blanching, loss of elasticity in cheek lining.',
  },
  {
    id: 'khaini',
    name: 'Khaini',
    hindiName: 'खैनी',
    category: 'smokeless',
    description: 'Sun-dried tobacco flakes blended with slaked lime (chuna), typically placed in the lower labial or buccal sulcus.',
    commonUnits: ['pinches / times per day'],
    oralHealthImpact: 'Localized epithelial thickening (snuff dipper keratosis), gingival recession, and mucosal dysplasia.',
  },
  {
    id: 'zarda',
    name: 'Zarda',
    hindiName: 'ज़र्दा',
    category: 'smokeless',
    description: 'Flavored, boiled, and spiced tobacco flakes commonly consumed independently or folded into paan (betel quid).',
    commonUnits: ['pinches per day', 'paan folds per day'],
    oralHealthImpact: 'Chronic chemical mucosal irritation and accelerated stain formation.',
  },
  {
    id: 'supari',
    name: 'Supari / Areca Nut',
    hindiName: 'सुपारी / कच्ची सुपारी',
    category: 'areca_only',
    description: 'Dried or roasted seed of the Areca catechu palm, containing the alkaloid arecoline, even when consumed without tobacco.',
    commonUnits: ['pieces / packets per day'],
    oralHealthImpact: 'Arecoline triggers collagen cross-linking, causing oral submucous fibrosis (OSMF) and restricted mouth opening.',
  },
  {
    id: 'paan',
    name: 'Paan (Betel Quid)',
    hindiName: 'पान (तंबाकू / सादा)',
    category: 'smokeless',
    description: 'Betel leaf wrapped around areca nut, slaked lime, katha, with or without tobacco paste/zarda.',
    commonUnits: ['paan per day'],
    oralHealthImpact: 'Chemical synergy between lime and arecoline increases permeability of oral mucosa to carcinogens.',
  },
  {
    id: 'cigarettes',
    name: 'Cigarettes',
    hindiName: 'सिगरेट',
    category: 'smoked',
    description: 'Combustible tobacco stick producing carbon monoxide, polycyclic aromatic hydrocarbons, and nitrosamines.',
    commonUnits: ['sticks per day', 'packs per day'],
    oralHealthImpact: 'Thermal irritation, systemic nicotine exposure, leukoplakia, and delayed oral wound healing.',
  },
  {
    id: 'beedis',
    name: 'Beedis / Bidis',
    hindiName: 'बीड़ी',
    category: 'smoked',
    description: 'Unprocessed tobacco flakes hand-rolled in a tendu leaf, delivering high tar and nicotine levels per puff.',
    commonUnits: ['beedis per day', 'bundles per day'],
    oralHealthImpact: 'High heat delivery to anterior oral cavity; strongly associated with palate and tongue mucosal changes.',
  },
  {
    id: 'other',
    name: 'Other Tobacco / Hookah',
    hindiName: 'अन्य तंबाकू / हुक्का',
    category: 'other',
    description: 'Waterpipe tobacco (hookah/shisha), electronic nicotine delivery systems, or traditional regional mixtures.',
    commonUnits: ['sessions / times per day'],
    oralHealthImpact: 'Mucosal drying, chemical exposure, and elevated carbon monoxide absorption.',
  },
];

export interface CessationBenefitMilestone {
  timeframe: string;
  timeframeHi: string;
  headline: string;
  headlineHi: string;
  detail: string;
  detailHi: string;
  icon: string;
}

export const CESSATION_TIMELINE_BENEFITS: CessationBenefitMilestone[] = [
  {
    timeframe: '20 Minutes',
    timeframeHi: '२० मिनट',
    headline: 'Heart Rate & Blood Pressure Stabilize',
    headlineHi: 'हृदय गति और रक्तचाप सामान्य होने लगता है',
    detail: 'Blood circulation begins returning to normal baseline after stopping tobacco intake.',
    detailHi: 'तंबाकू रोकने के कुछ ही मिनटों में रक्त परिसंचरण में सुधार शुरू हो जाता है।',
    icon: 'Activity',
  },
  {
    timeframe: '8 to 24 Hours',
    timeframeHi: '८ से २४ घंटे',
    headline: 'Carbon Monoxide Levels Drop',
    headlineHi: 'कार्बन मोनोऑक्साइड का स्तर कम होता है',
    detail: 'Blood oxygen levels return to normal, enhancing cellular tissue repair across oral mucosa.',
    detailHi: 'रक्त में ऑक्सीजन का स्तर सुधरता है, जिससे मुँह की कोशिकाओं को ताज़ा पोषण मिलता है।',
    icon: 'Wind',
  },
  {
    timeframe: '48 to 72 Hours',
    timeframeHi: '२ से ३ दिन',
    headline: 'Taste & Smell Rejuvenate',
    headlineHi: 'स्वाद और गंध की क्षमता लौटती है',
    detail: 'Nerve endings in the tongue and palate begin regenerating. Breath freshness significantly improves.',
    detailHi: 'जीभ और तालू की तंत्रिकाएं ठीक होने लगती हैं। मुँह का स्वाद और सांसों की ताज़गी लौटती है।',
    icon: 'Sparkles',
  },
  {
    timeframe: '2 Weeks to 3 Months',
    timeframeHi: '२ सप्ताह से ३ महीने',
    headline: 'Oral Mucosa Begins Healing',
    headlineHi: 'मुँह की अंदरूनी परत ठीक होने लगती है',
    detail: 'Mucosal redness, irritation, and dryness decrease. Chewing and spicy food tolerance may gradually normalize.',
    detailHi: 'मुँह के अंदर की जलन, लालिमा और सूखापन कम होता है। म्यूकोसा की मरम्मत तेज़ होती है।',
    icon: 'ShieldCheck',
  },
  {
    timeframe: '1 to 5 Years',
    timeframeHi: '१ से ५ वर्ष',
    headline: 'Long-term Risk Drastically Declines',
    headlineHi: 'दीर्घकालिक मौखिक जोखिमों में भारी गिरावट',
    detail: 'The likelihood of developing serious precancerous oral lesions and cardiovascular complications falls significantly towards non-user levels.',
    detailHi: 'मुँह में गंभीर घावों व अन्य स्वास्थ्य जोखिमों की संभावना में निरंतर बड़ी कमी आती है।',
    icon: 'HeartHandshake',
  },
];

export interface CravingTip {
  title: string;
  titleHi: string;
  category: 'the_4_ds' | 'substitute' | 'mindset' | 'environment';
  description: string;
  descriptionHi: string;
  badge: string;
}

export const CRAVING_MANAGEMENT_TIPS: CravingTip[] = [
  {
    title: 'Delay for 5 to 10 Minutes',
    titleHi: '५-१० मिनट की देरी करें (Delay)',
    category: 'the_4_ds',
    description: 'Most cravings peak and begin to subside within 3–5 minutes. Acknowledge the urge and tell yourself: "I will wait 10 minutes before deciding."',
    descriptionHi: 'अधिकांश तलब (craving) ३ से ५ मिनट में चरम पर पहुँचकर शांत होने लगती है। मन को कहें कि "मैं १० मिनट रुकूँगा।"',
    badge: "The 4 D's Strategy",
  },
  {
    title: 'Deep Breathing (Pranayama)',
    titleHi: 'गहरी सांस लें (Deep Breathing)',
    category: 'the_4_ds',
    description: 'Inhale slowly through your nose for 4 seconds, hold for 4 seconds, and exhale smoothly through your mouth. Calms nicotine stress receptors.',
    descriptionHi: 'नाक से ४ सेकंड तक गहरी सांस लें और मुँह से धीरे-धीरे छोड़ें। इससे तनाव कम होता है।',
    badge: "The 4 D's Strategy",
  },
  {
    title: 'Drink Cold Water / Sip Slowly',
    titleHi: 'घूंट-घूंट ठंडा पानी पिएं (Drink Water)',
    category: 'the_4_ds',
    description: 'Sipping water refreshes the oral cavity, satisfies oral fixation, and helps flush metabolic waste products.',
    descriptionHi: 'धीरे-धीरे ठंडा पानी पीने से मुँह ताज़ा रहता है और हाथ-मुँह की आदत (oral fixation) को शांत करने में मदद मिलती है।',
    badge: "The 4 D's Strategy",
  },
  {
    title: 'Distract Your Mind & Hands',
    titleHi: 'ध्यान दूसरी जगह लगाएं (Distract)',
    category: 'the_4_ds',
    description: 'Engage in a 5-minute activity: wash your face, take a short brisk walk, do stretching, or call a family member.',
    descriptionHi: 'थोड़ी देर टहलें, मुँह धोएं, कोई काम शुरू करें या किसी मित्र से बात करें ताकि ध्यान भटके।',
    badge: "The 4 D's Strategy",
  },
  {
    title: 'Roasted Saunf (Fennel) & Ajwain',
    titleHi: 'भुनी हुई सौंफ व इलायची',
    category: 'substitute',
    description: 'Chewing roasted fennel seeds with a small pinch of green cardamom or clove provides oral stimulation and freshening without chemical harm.',
    descriptionHi: 'भुनी सौंफ, हरी इलायची या लौंग चबाने से मुँह में गुटखे/सुपारी जैसा चबाने का अहसास मिलता है बिना किसी हानिकारक रसायन के।',
    badge: 'Healthy Oral Substitute',
  },
  {
    title: 'Cloves (Laung) or Cinnamon Bark',
    titleHi: 'लौंग या दालचीनी का टुकड़ा',
    category: 'substitute',
    description: 'Holding a single clove or small cinnamon stick in the cheek pocket provides a mild tingling sensation that mimics the oral habit safely.',
    descriptionHi: 'गाल के पास एक लौंग या दालचीनी का टुकड़ा रखने से हल्का स्वाद मिलता है और आदत शांत होती है।',
    badge: 'Healthy Oral Substitute',
  },
  {
    title: 'Relapse-Friendly Perspective',
    titleHi: 'फिसलन असफलता नहीं है (Relapse-Friendly)',
    category: 'mindset',
    description: 'If you slip and use once, do not treat it as a failure. Every unchewed pouch or unsmoked stick is permanent progress for your oral mucosa.',
    descriptionHi: 'यदि कभी एक बार नियंत्रण छूट जाए, तो खुद को दोषी न समझें। आपकी अब तक की मेहनत बेकार नहीं हुई है। तुरंत फिर से शुरुआत करें।',
    badge: 'Compassionate Mindset',
  },
];

export const CESSATION_SAFETY_DISCLAIMER =
  'Quitting tobacco or areca nut can be difficult. Professional support can improve your chances of success. OralGuard AI provides habit-reduction support for awareness and motivation, not guaranteed outcomes or medical prescription.';

export const CESSATION_SAFETY_DISCLAIMER_HI =
  'तंबाकू या सुपारी छोड़ना एक चुनौतीपूर्ण यात्रा हो सकती है। पेशेवर चिकित्सकीय व दंत सलाह से आपकी सफलता की संभावना बढ़ सकती है। यह टूल केवल जागरूकता और प्रोत्साहन के लिए है।';
