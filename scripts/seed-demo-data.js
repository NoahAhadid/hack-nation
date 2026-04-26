import postgres from 'postgres';
import { config, requireEnv } from './config.js';

requireEnv(['DATABASE_URL']);

const sql = postgres(config.databaseUrl, {
  max: 1,
  prepare: false,
  ssl: 'require'
});

const users = [
  {
    sessionKey: 'demo-amara-001',
    userIdentifier: 'Amara Osei',
    surveyData: {
      age: 27, sex: 'female', location: 'Accra, Ghana',
      languages: ['English', 'Twi'], work_authorization: 'Ghana citizen',
      educational_level: 'secondary', favorite_skill: 'customer service',
      years_experience_total: '5', skill_confidence: 'medium',
    },
    skills: [
      { uri: 'http://data.europa.eu/esco/skill/a017b40c-6b6e-4691-83be-c1b181096e42', label: 'customer service', userSkill: 'customer service', confidence: 'strong', similarity: 0.92 },
      { uri: 'http://data.europa.eu/esco/skill/S1.8.1', label: 'use a computer', userSkill: 'basic computer skills', confidence: 'strong', similarity: 0.85 },
      { uri: 'http://data.europa.eu/esco/skill/6a08b602-cf74-4677-abcf-c2e9753dbe44', label: 'work in teams', userSkill: 'teamwork', confidence: 'strong', similarity: 0.91 },
      { uri: 'http://data.europa.eu/esco/skill/S5.7.1', label: 'sell products', userSkill: 'sales', confidence: 'medium', similarity: 0.78 },
      { uri: 'http://data.europa.eu/esco/skill/42e69a8e-c tried-4d32-a46e-cd1c6a18d43e', label: 'handle financial transactions', userSkill: 'cash handling', confidence: 'medium', similarity: 0.76 },
      { uri: 'http://data.europa.eu/esco/skill/d23fc889-3025-4e17-81e4-c57657990e8f', label: 'communicate with customers', userSkill: 'talking to customers', confidence: 'strong', similarity: 0.94 },
    ],
    opportunities: [
      { id: 'opp-gh-001', title: 'Mobile Money Agent', sector: 'Financial Services', iscoGroup: '5', score: 78, demandLevel: 8, wageFloor: 4, growth: 7, automation: 2, training: 6 },
      { id: 'opp-gh-002', title: 'Market Vendor (Organized Retail)', sector: 'Retail Trade', iscoGroup: '5', score: 72, demandLevel: 9, wageFloor: 3, growth: 5, automation: 1, training: 8 },
      { id: 'opp-gh-003', title: 'Call Centre Agent', sector: 'Business Process Outsourcing', iscoGroup: '4', score: 65, demandLevel: 7, wageFloor: 5, growth: 6, automation: 5, training: 7 },
    ],
  },
  {
    sessionKey: 'demo-kofi-002',
    userIdentifier: 'Kofi Mensah',
    surveyData: {
      age: 34, sex: 'male', location: 'Kumasi, Ghana',
      languages: ['English', 'Twi', 'Hausa'], work_authorization: 'Ghana citizen',
      educational_level: 'vocational', favorite_skill: 'welding',
      years_experience_total: '10', skill_confidence: 'high',
    },
    skills: [
      { uri: 'http://data.europa.eu/esco/skill/S4.4.2', label: 'perform welding techniques', userSkill: 'welding', confidence: 'strong', similarity: 0.96 },
      { uri: 'http://data.europa.eu/esco/skill/S4.2.1', label: 'use metalworking tools', userSkill: 'metalwork', confidence: 'strong', similarity: 0.88 },
      { uri: 'http://data.europa.eu/esco/skill/9c1f2cb5-1453-4760-96c5-79da01a3fe60', label: 'read technical drawings', userSkill: 'blueprints', confidence: 'medium', similarity: 0.79 },
      { uri: 'http://data.europa.eu/esco/skill/6a08b602-cf74-4677-abcf-c2e9753dbe44', label: 'work in teams', userSkill: 'team work', confidence: 'strong', similarity: 0.90 },
      { uri: 'http://data.europa.eu/esco/skill/S4.1.0', label: 'operate hand tools', userSkill: 'hand tools', confidence: 'strong', similarity: 0.93 },
    ],
    opportunities: [
      { id: 'opp-gh-004', title: 'Construction Welder', sector: 'Construction', iscoGroup: '7', score: 85, demandLevel: 9, wageFloor: 6, growth: 7, automation: 2, training: 5 },
      { id: 'opp-gh-005', title: 'Auto Body Repair Technician', sector: 'Automotive', iscoGroup: '7', score: 74, demandLevel: 7, wageFloor: 5, growth: 5, automation: 3, training: 6 },
      { id: 'opp-gh-001', title: 'Mobile Money Agent', sector: 'Financial Services', iscoGroup: '5', score: 42, demandLevel: 8, wageFloor: 4, growth: 7, automation: 2, training: 6 },
    ],
  },
  {
    sessionKey: 'demo-fatima-003',
    userIdentifier: 'Fatima Diallo',
    surveyData: {
      age: 22, sex: 'female', location: 'Tamale, Ghana',
      languages: ['English', 'Dagbani'], work_authorization: 'Ghana citizen',
      educational_level: 'secondary', favorite_skill: 'sewing',
      years_experience_total: '3', skill_confidence: 'medium',
    },
    skills: [
      { uri: 'http://data.europa.eu/esco/skill/S4.6.1', label: 'sew pieces of fabric', userSkill: 'sewing', confidence: 'strong', similarity: 0.95 },
      { uri: 'http://data.europa.eu/esco/skill/d23fc889-3025-4e17-81e4-c57657990e8f', label: 'communicate with customers', userSkill: 'talking to customers', confidence: 'medium', similarity: 0.82 },
      { uri: 'http://data.europa.eu/esco/skill/S5.7.1', label: 'sell products', userSkill: 'selling my clothes', confidence: 'medium', similarity: 0.80 },
      { uri: 'http://data.europa.eu/esco/skill/a017b40c-6b6e-4691-83be-c1b181096e42', label: 'customer service', userSkill: 'helping customers', confidence: 'medium', similarity: 0.77 },
      { uri: 'http://data.europa.eu/esco/skill/S1.8.1', label: 'use a computer', userSkill: 'phone and WhatsApp', confidence: 'needs_review', similarity: 0.55 },
    ],
    opportunities: [
      { id: 'opp-gh-006', title: 'Garment Worker (Apparel Factory)', sector: 'Manufacturing', iscoGroup: '8', score: 80, demandLevel: 6, wageFloor: 3, growth: 5, automation: 4, training: 7 },
      { id: 'opp-gh-002', title: 'Market Vendor (Organized Retail)', sector: 'Retail Trade', iscoGroup: '5', score: 68, demandLevel: 9, wageFloor: 3, growth: 5, automation: 1, training: 8 },
      { id: 'opp-gh-007', title: 'Tailor / Dressmaker', sector: 'Personal Services', iscoGroup: '7', score: 88, demandLevel: 7, wageFloor: 4, growth: 4, automation: 1, training: 5 },
    ],
  },
  {
    sessionKey: 'demo-kwame-004',
    userIdentifier: 'Kwame Asante',
    surveyData: {
      age: 29, sex: 'male', location: 'Accra, Ghana',
      languages: ['English', 'Twi'], work_authorization: 'Ghana citizen',
      educational_level: 'bachelor', favorite_skill: 'data analysis',
      years_experience_total: '4', skill_confidence: 'high',
    },
    skills: [
      { uri: 'http://data.europa.eu/esco/skill/S1.8.1', label: 'use a computer', userSkill: 'advanced computer skills', confidence: 'strong', similarity: 0.90 },
      { uri: 'http://data.europa.eu/esco/skill/b3b9d1b3-3b18-4e08-80b8-6dd6d3a2e5f3', label: 'analyse data', userSkill: 'data analysis', confidence: 'strong', similarity: 0.95 },
      { uri: 'http://data.europa.eu/esco/skill/d23fc889-3025-4e17-81e4-c57657990e8f', label: 'communicate with customers', userSkill: 'client communication', confidence: 'strong', similarity: 0.88 },
      { uri: 'http://data.europa.eu/esco/skill/6a08b602-cf74-4677-abcf-c2e9753dbe44', label: 'work in teams', userSkill: 'collaboration', confidence: 'strong', similarity: 0.91 },
      { uri: 'http://data.europa.eu/esco/skill/a017b40c-6b6e-4691-83be-c1b181096e42', label: 'customer service', userSkill: 'stakeholder management', confidence: 'medium', similarity: 0.72 },
      { uri: 'http://data.europa.eu/esco/skill/5e2b7c0c-71e3-47d7-b4e0-87de8f6dc918', label: 'manage budgets', userSkill: 'budget tracking', confidence: 'medium', similarity: 0.74 },
    ],
    opportunities: [
      { id: 'opp-gh-008', title: 'Data Entry / Junior Analyst', sector: 'Business Process Outsourcing', iscoGroup: '4', score: 82, demandLevel: 7, wageFloor: 6, growth: 8, automation: 6, training: 7 },
      { id: 'opp-gh-003', title: 'Call Centre Agent', sector: 'Business Process Outsourcing', iscoGroup: '4', score: 60, demandLevel: 7, wageFloor: 5, growth: 6, automation: 5, training: 7 },
      { id: 'opp-gh-001', title: 'Mobile Money Agent', sector: 'Financial Services', iscoGroup: '5', score: 55, demandLevel: 8, wageFloor: 4, growth: 7, automation: 2, training: 6 },
    ],
  },
  {
    sessionKey: 'demo-abena-005',
    userIdentifier: 'Abena Kyei',
    surveyData: {
      age: 31, sex: 'female', location: 'Cape Coast, Ghana',
      languages: ['English', 'Fante'], work_authorization: 'Ghana citizen',
      educational_level: 'secondary', favorite_skill: 'cooking',
      years_experience_total: '8', skill_confidence: 'high',
    },
    skills: [
      { uri: 'http://data.europa.eu/esco/skill/S5.4.1', label: 'prepare meals', userSkill: 'cooking', confidence: 'strong', similarity: 0.97 },
      { uri: 'http://data.europa.eu/esco/skill/a017b40c-6b6e-4691-83be-c1b181096e42', label: 'customer service', userSkill: 'serving customers', confidence: 'strong', similarity: 0.89 },
      { uri: 'http://data.europa.eu/esco/skill/d23fc889-3025-4e17-81e4-c57657990e8f', label: 'communicate with customers', userSkill: 'talking to people', confidence: 'strong', similarity: 0.86 },
      { uri: 'http://data.europa.eu/esco/skill/S5.7.1', label: 'sell products', userSkill: 'selling food', confidence: 'strong', similarity: 0.84 },
      { uri: 'http://data.europa.eu/esco/skill/5e2b7c0c-71e3-47d7-b4e0-87de8f6dc918', label: 'manage budgets', userSkill: 'cost control', confidence: 'medium', similarity: 0.70 },
      { uri: 'http://data.europa.eu/esco/skill/6a08b602-cf74-4677-abcf-c2e9753dbe44', label: 'work in teams', userSkill: 'kitchen teamwork', confidence: 'strong', similarity: 0.88 },
    ],
    opportunities: [
      { id: 'opp-gh-009', title: 'Restaurant Cook', sector: 'Hospitality', iscoGroup: '5', score: 90, demandLevel: 8, wageFloor: 4, growth: 6, automation: 1, training: 7 },
      { id: 'opp-gh-010', title: 'Catering Business Owner', sector: 'Hospitality', iscoGroup: '5', score: 76, demandLevel: 6, wageFloor: 5, growth: 5, automation: 1, training: 4 },
      { id: 'opp-gh-002', title: 'Market Vendor (Organized Retail)', sector: 'Retail Trade', iscoGroup: '5', score: 62, demandLevel: 9, wageFloor: 3, growth: 5, automation: 1, training: 8 },
    ],
  },
];

try {
  console.log('Seeding example data...\n');

  for (const user of users) {
    // 1. Create session
    const [session] = await sql`
      INSERT INTO user_sessions (session_key, user_identifier, survey_data)
      VALUES (${user.sessionKey}, ${user.userIdentifier}, ${JSON.stringify(user.surveyData)})
      ON CONFLICT (session_key) DO UPDATE SET
        survey_data = EXCLUDED.survey_data,
        updated_at = now()
      RETURNING id
    `;
    console.log(`  Session: ${user.userIdentifier} (${session.id})`);

    // 2. Create skill profile
    const [profile] = await sql`
      INSERT INTO skill_profiles (session_id, person_summary, education, languages, identified_skills, occupation_paths)
      VALUES (
        ${session.id},
        ${`${user.userIdentifier} — ${user.surveyData.years_experience_total} years experience, based in ${user.surveyData.location}.`},
        ${user.surveyData.educational_level},
        ${user.surveyData.languages},
        ${JSON.stringify(user.skills.map(s => ({ concept_uri: s.uri, preferred_label: s.label, user_skill: s.userSkill, confidence: s.confidence, similarity: s.similarity })))},
        ${JSON.stringify(user.opportunities.map(o => ({ id: o.id, title: o.title, sector: o.sector })))}
      )
      RETURNING id
    `;
    console.log(`  Profile: ${profile.id}`);

    // 3. Insert identified skills
    for (const skill of user.skills) {
      await sql`
        INSERT INTO user_identified_skills (profile_id, session_id, concept_uri, preferred_label, user_skill, evidence_quote, confidence, similarity, decision)
        VALUES (
          ${profile.id},
          ${session.id},
          ${skill.uri},
          ${skill.label},
          ${skill.userSkill},
          ${`User mentioned "${skill.userSkill}" during the interview.`},
          ${skill.confidence},
          ${skill.similarity},
          ${skill.confidence === 'strong' ? 'accepted' : null}
        )
      `;
    }
    console.log(`  Skills: ${user.skills.length} inserted`);

    // 4. Insert opportunities
    for (const opp of user.opportunities) {
      await sql`
        INSERT INTO user_opportunities (session_id, profile_id, opportunity_id, title, sector, isco_group, match_score, demand_level, wage_floor_signal, growth_outlook, automation_exposure, training_access, score_parts)
        VALUES (
          ${session.id},
          ${profile.id},
          ${opp.id},
          ${opp.title},
          ${opp.sector},
          ${opp.iscoGroup},
          ${opp.score},
          ${opp.demandLevel},
          ${opp.wageFloor},
          ${opp.growth},
          ${opp.automation},
          ${opp.training},
          ${JSON.stringify({ skillFit: opp.score / 100, localDemand: opp.demandLevel / 10, wageFloor: opp.wageFloor / 10, growth: opp.growth / 10, automationResilience: (10 - opp.automation) / 10, trainingAccess: opp.training / 10 })}
        )
      `;
    }
    console.log(`  Opportunities: ${user.opportunities.length} inserted`);
    console.log('');
  }

  console.log('Done! Seeded 5 users with skills and opportunities.');
} catch (err) {
  console.error('Seed error:', err);
  process.exit(1);
} finally {
  await sql.end();
}
