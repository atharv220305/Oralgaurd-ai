/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Lightweight Knowledge Retrieval Engine for OralGuard AI
 *
 * Efficiently indexes and extracts relevant clinical & educational knowledge nuggets
 * based on user message and conversation context to provide as a trusted reference to Gemini.
 */

import { AWARENESS_ARTICLES } from '../../data/awarenessKnowledge';
import { COMMON_TOBACCO_PRODUCTS } from '../../data/cessationKnowledge';
import { ORAL_REGIONS } from '../../data/oralAnatomy';
import { PatientProfile, AppLanguage } from '../../types';

export interface RetrievedKnowledgeItem {
  source: string;
  title: string;
  content: string;
  relevanceScore: number;
}

export function retrieveRelevantKnowledge(
  query: string,
  profile?: PatientProfile,
  lang: AppLanguage = 'en',
  maxItems: number = 3
): string {
  const queryLower = (query || '').toLowerCase();
  const scoredItems: RetrievedKnowledgeItem[] = [];

  // Keywords mapper
  const isBleeding = queryLower.includes('bleed') || queryLower.includes('gums') || queryLower.includes('khoon') || queryLower.includes('rakt') || queryLower.includes('मसूड़े') || queryLower.includes('हिरड्या');
  const isUlcer = queryLower.includes('ulcer') || queryLower.includes('sore') || queryLower.includes('chhale') || queryLower.includes('chala') || queryLower.includes('fod') || queryLower.includes('छाला') || queryLower.includes('फोड');
  const isDurationOrChronicity = queryLower.includes('week') || queryLower.includes('month') || queryLower.includes('long') || queryLower.includes('duration') || queryLower.includes('hafte') || queryLower.includes('आठवडे') || queryLower.includes('सप्ताह');
  const isPatchOrColor = queryLower.includes('patch') || queryLower.includes('white') || queryLower.includes('red') || queryLower.includes('safed') || queryLower.includes('lal') || queryLower.includes('पांढरा') || queryLower.includes('लाल') || queryLower.includes('सफेद');
  const isTobacco = queryLower.includes('gutka') || queryLower.includes('khaini') || queryLower.includes('zarda') || queryLower.includes('tobacco') || queryLower.includes('supari') || queryLower.includes('areca') || queryLower.includes('bidi') || queryLower.includes('cigarette') || queryLower.includes('smoke') || queryLower.includes('quit') || queryLower.includes('तंबाकू') || queryLower.includes('गुटखा');
  const isMouthOpening = queryLower.includes('open') || queryLower.includes('trismus') || queryLower.includes('fibrosis') || queryLower.includes('osmf') || queryLower.includes('stiff') || queryLower.includes('kam khul') || queryLower.includes('उघड');
  const isDentistOrDoctor = queryLower.includes('dentist') || queryLower.includes('doctor') || queryLower.includes('visit') || queryLower.includes('checkup') || queryLower.includes('specialist') || queryLower.includes('biopsy') || queryLower.includes('डॉक्टर') || queryLower.includes('दंत');
  const isCancer = queryLower.includes('cancer') || queryLower.includes('malignan') || queryLower.includes('tumor') || queryLower.includes('कैंसर') || queryLower.includes('कर्करोग');
  const isPainOrBurning = queryLower.includes('pain') || queryLower.includes('burn') || queryLower.includes('spicy') || queryLower.includes('dard') || queryLower.includes('jalan') || queryLower.includes('tikhat') || queryLower.includes('जळजळ') || queryLower.includes('दर्द');

  // 1. Search Awareness Articles
  for (const article of AWARENESS_ARTICLES) {
    let score = 0;
    const titleLower = article.title.toLowerCase();
    const summaryLower = article.summary.toLowerCase();

    if (isCancer && article.category === 'cancer_awareness') score += 5;
    if (isDurationOrChronicity && (article.id.includes('persistence') || article.id.includes('2-week'))) score += 6;
    if (isPatchOrColor && (article.id.includes('white') || article.id.includes('red') || article.id.includes('patch'))) score += 6;
    if (isMouthOpening && (article.id.includes('opening') || article.id.includes('osmf'))) score += 6;
    if (isTobacco && article.category === 'tobacco_supari_risks') score += 5;
    if (isBleeding && (titleLower.includes('gum') || summaryLower.includes('bleed') || article.id.includes('hygiene'))) score += 5;
    if (isPainOrBurning && summaryLower.includes('burn')) score += 3;
    if (isDentistOrDoctor && (summaryLower.includes('dentist') || summaryLower.includes('biopsy') || article.category === 'trusted_organizations')) score += 4;

    // Word intersection
    const keywords = ['ulcer', 'sore', 'patch', 'tobacco', 'bleeding', 'biopsy', 'prevention'];
    for (const kw of keywords) {
      if (queryLower.includes(kw) && (titleLower.includes(kw) || summaryLower.includes(kw))) {
        score += 2;
      }
    }

    if (score > 0) {
      scoredItems.push({
        source: `OralGuard Clinical Library (${article.trustedSourceAttribution || 'WHO / Dental Guidelines'})`,
        title: article.title,
        content: `${article.summary}\nKey points: ${article.keyPoints.slice(0, 3).join('; ')}\nWhen to see a doctor: ${article.whenToConsultDoctor}`,
        relevanceScore: score,
      });
    }
  }

  // 2. Search Tobacco & Cessation Knowledge
  if (isTobacco || isMouthOpening) {
    for (const prod of COMMON_TOBACCO_PRODUCTS) {
      if (queryLower.includes(prod.id) || queryLower.includes(prod.name.toLowerCase()) || isTobacco) {
        scoredItems.push({
          source: 'OralGuard Tobacco Cessation Protocol',
          title: `Product Impact: ${prod.name} (${prod.hindiName})`,
          content: `${prod.description} Oral Impact: ${prod.oralHealthImpact}`,
          relevanceScore: queryLower.includes(prod.id) ? 7 : 3,
        });
      }
    }
  }

  // 3. Search Oral Anatomy Knowledge
  for (const region of Object.values(ORAL_REGIONS)) {
    if (queryLower.includes(region.name.toLowerCase()) || queryLower.includes(region.id.replace(/_/g, ' '))) {
      scoredItems.push({
        source: 'OralGuard Anatomy & Risk Stratification',
        title: `Anatomical Region: ${region.name} (${region.riskLevel} site)`,
        content: `${region.clinicalSignificance} Common pathologies: ${region.commonPathologies.join(', ')}`,
        relevanceScore: 6,
      });
    }
  }

  // 4. Clinical Core Rules (Always inject 2-week rule if ulcer or duration is mentioned)
  if (isUlcer || isDurationOrChronicity || isPatchOrColor) {
    scoredItems.push({
      source: 'OralGuard Core Clinical Principle: The 2-Week Persistence Rule',
      title: 'Oral Mucosal Healing & Persistence Rule',
      content:
        'Benign traumatic or aphthous mouth ulcers typically heal naturally in 7-14 days. Any solitary ulcer, mucosal discoloration (white/red patch), lump, or lesion persisting for MORE than 2 to 3 weeks warrants direct in-person clinical visualization and palpation by a dental surgeon or specialist to rule out dysplasia.',
      relevanceScore: 8,
    });
  }

  if (isBleeding) {
    scoredItems.push({
      source: 'OralGuard Periodontal & Mucosal Guidance: Bleeding Gums',
      title: 'Gingival Bleeding Causes & Home Care',
      content:
        'Bleeding when brushing is most frequently caused by early gingivitis (plaque accumulation along the gumline), vigorous brushing with a hard toothbrush, or hormonal fluctuations. Less commonly, persistent spontaneous bleeding without brushing can signal localized trauma or systemic conditions. Gentle brushing with a soft-bristled brush, flossing, warm saline rinses, and a professional dental cleaning (scaling) are recommended.',
      relevanceScore: 8,
    });
  }

  // Sort by score descending and take top N
  scoredItems.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const selected = scoredItems.slice(0, maxItems);

  if (selected.length === 0) {
    return 'General oral health guidance: Provide evidence-informed, empathetic oral care information, emphasize gentle oral hygiene, healthy habits, and prompt in-person dental consultation for persistent symptoms (>14 days).';
  }

  return selected
    .map(
      (item, idx) =>
        `[REFERENCE ${idx + 1}: ${item.title}]\nSource: ${item.source}\n${item.content}`
    )
    .join('\n\n');
}
