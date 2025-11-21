/**
 * Core Beliefs Inventory Questions
 * Based on "Prisoners of Belief" by Matthew McKay, Ph.D.
 *
 * 100 questions total - 10 per domain
 * Questions alternate: 5 positively worded (T), 5 negatively worded (F)
 */

export const coreBeliefsDomains = [
  {
    id: 'value_worthiness',
    name: 'Value & Worthiness',
    coreStatement: 'I am worthy',
    description: 'Self-worth, deserving of love and respect'
  },
  {
    id: 'security_safety',
    name: 'Security & Safety',
    coreStatement: 'I am safe',
    description: 'Sense of safety in the world'
  },
  {
    id: 'performance_competence',
    name: 'Performance & Competence',
    coreStatement: 'I am competent',
    description: 'Ability to perform tasks, trust in judgment'
  },
  {
    id: 'control_power',
    name: 'Control & Power',
    coreStatement: 'I am powerful',
    description: 'Sense of control over life'
  },
  {
    id: 'love_nurturance',
    name: 'Love & Nurturance',
    coreStatement: 'I am loved',
    description: 'Feeling cared for, supported, nurtured'
  },
  {
    id: 'autonomy_independence',
    name: 'Autonomy & Independence',
    coreStatement: 'I am autonomous',
    description: 'Independence, self-reliance, thinking for oneself'
  },
  {
    id: 'justice_fairness',
    name: 'Justice & Fairness',
    coreStatement: 'I am treated justly',
    description: 'Accepting life as fair and reasonable'
  },
  {
    id: 'belonging_connection',
    name: 'Belonging & Connection',
    coreStatement: 'I belong',
    description: 'Connection to family, community, humanity'
  },
  {
    id: 'others_trust',
    name: 'Trust in Others',
    coreStatement: 'People are good',
    description: 'Trust in others, expecting positive behavior'
  },
  {
    id: 'standards_compassion',
    name: 'Standards & Self-Compassion',
    coreStatement: 'My standards are reasonable',
    description: 'Reasonable expectations, self-forgiveness'
  }
];

export const coreBeliefQuestions = [
  // DOMAIN 1: Value & Worthiness (10 questions)
  { id: 1, domain: 'value_worthiness', text: 'I am a valuable and worthwhile person', positive: true },
  { id: 11, domain: 'value_worthiness', text: 'I am fundamentally flawed or defective', positive: false },
  { id: 21, domain: 'value_worthiness', text: 'I deserve love and respect', positive: true },
  { id: 31, domain: 'value_worthiness', text: 'I am not good enough', positive: false },
  { id: 41, domain: 'value_worthiness', text: 'I have inherent worth regardless of my achievements', positive: true },
  { id: 51, domain: 'value_worthiness', text: 'I need to prove my worth through accomplishments', positive: false },
  { id: 61, domain: 'value_worthiness', text: 'I am deserving of good things in life', positive: true },
  { id: 71, domain: 'value_worthiness', text: 'I am unworthy of happiness', positive: false },
  { id: 81, domain: 'value_worthiness', text: 'I accept myself as I am', positive: true },
  { id: 91, domain: 'value_worthiness', text: 'I am ashamed of who I am', positive: false },

  // DOMAIN 2: Security & Safety (10 questions)
  { id: 2, domain: 'security_safety', text: 'I feel safe in the world', positive: true },
  { id: 12, domain: 'security_safety', text: 'The world is a dangerous place', positive: false },
  { id: 22, domain: 'security_safety', text: 'I can handle challenges that come my way', positive: true },
  { id: 32, domain: 'security_safety', text: 'Disaster could strike at any moment', positive: false },
  { id: 42, domain: 'security_safety', text: 'I trust that things will generally work out', positive: true },
  { id: 52, domain: 'security_safety', text: 'I am constantly vulnerable to harm', positive: false },
  { id: 62, domain: 'security_safety', text: 'I feel protected and secure', positive: true },
  { id: 72, domain: 'security_safety', text: 'Something terrible is going to happen', positive: false },
  { id: 82, domain: 'security_safety', text: 'I can relax and let my guard down', positive: true },
  { id: 92, domain: 'security_safety', text: 'I must always be on alert for danger', positive: false },

  // DOMAIN 3: Performance & Competence (10 questions)
  { id: 3, domain: 'performance_competence', text: 'I am capable and competent', positive: true },
  { id: 13, domain: 'performance_competence', text: 'I will fail at important tasks', positive: false },
  { id: 23, domain: 'performance_competence', text: 'I trust my judgment and decisions', positive: true },
  { id: 33, domain: 'performance_competence', text: 'I cannot trust my own thinking', positive: false },
  { id: 43, domain: 'performance_competence', text: 'I can learn and master new skills', positive: true },
  { id: 53, domain: 'performance_competence', text: 'I am incompetent compared to others', positive: false },
  { id: 63, domain: 'performance_competence', text: 'I perform well under pressure', positive: true },
  { id: 73, domain: 'performance_competence', text: 'I fall apart when stressed', positive: false },
  { id: 83, domain: 'performance_competence', text: 'I have valuable skills and abilities', positive: true },
  { id: 93, domain: 'performance_competence', text: 'I lack the ability to succeed', positive: false },

  // DOMAIN 4: Control & Power (10 questions)
  { id: 4, domain: 'control_power', text: 'I have control over my life', positive: true },
  { id: 14, domain: 'control_power', text: 'I am powerless to change my circumstances', positive: false },
  { id: 24, domain: 'control_power', text: 'I can influence outcomes through my actions', positive: true },
  { id: 34, domain: 'control_power', text: 'I am at the mercy of events beyond my control', positive: false },
  { id: 44, domain: 'control_power', text: 'I have agency in my life', positive: true },
  { id: 54, domain: 'control_power', text: 'I am a victim of circumstances', positive: false },
  { id: 64, domain: 'control_power', text: 'I can make meaningful choices', positive: true },
  { id: 74, domain: 'control_power', text: 'My choices don\'t matter', positive: false },
  { id: 84, domain: 'control_power', text: 'I can shape my future', positive: true },
  { id: 94, domain: 'control_power', text: 'I am helpless to change anything', positive: false },

  // DOMAIN 5: Love & Nurturance (10 questions)
  { id: 5, domain: 'love_nurturance', text: 'I am loved and cared for', positive: true },
  { id: 15, domain: 'love_nurturance', text: 'I will be abandoned by those I love', positive: false },
  { id: 25, domain: 'love_nurturance', text: 'People genuinely care about me', positive: true },
  { id: 35, domain: 'love_nurturance', text: 'No one truly loves me', positive: false },
  { id: 45, domain: 'love_nurturance', text: 'I receive support when I need it', positive: true },
  { id: 55, domain: 'love_nurturance', text: 'I am ultimately alone and unsupported', positive: false },
  { id: 65, domain: 'love_nurturance', text: 'I am valued by the people in my life', positive: true },
  { id: 75, domain: 'love_nurturance', text: 'People would leave me if they knew the real me', positive: false },
  { id: 85, domain: 'love_nurturance', text: 'I feel emotionally safe with loved ones', positive: true },
  { id: 95, domain: 'love_nurturance', text: 'Love is conditional and temporary', positive: false },

  // DOMAIN 6: Autonomy & Independence (10 questions)
  { id: 6, domain: 'autonomy_independence', text: 'I can think for myself', positive: true },
  { id: 16, domain: 'autonomy_independence', text: 'I need others to make decisions for me', positive: false },
  { id: 26, domain: 'autonomy_independence', text: 'I am self-reliant and independent', positive: true },
  { id: 36, domain: 'autonomy_independence', text: 'I cannot function without others\' approval', positive: false },
  { id: 46, domain: 'autonomy_independence', text: 'I trust my own opinions and values', positive: true },
  { id: 56, domain: 'autonomy_independence', text: 'I must depend on others for guidance', positive: false },
  { id: 66, domain: 'autonomy_independence', text: 'I can stand on my own', positive: true },
  { id: 76, domain: 'autonomy_independence', text: 'I am too dependent on others', positive: false },
  { id: 86, domain: 'autonomy_independence', text: 'I make my own choices freely', positive: true },
  { id: 96, domain: 'autonomy_independence', text: 'I need constant reassurance from others', positive: false },

  // DOMAIN 7: Justice & Fairness (10 questions)
  { id: 7, domain: 'justice_fairness', text: 'Life is generally fair', positive: true },
  { id: 17, domain: 'justice_fairness', text: 'I am entitled to special treatment', positive: false },
  { id: 27, domain: 'justice_fairness', text: 'I can accept life\'s ups and downs', positive: true },
  { id: 37, domain: 'justice_fairness', text: 'The world owes me something', positive: false },
  { id: 47, domain: 'justice_fairness', text: 'I am treated reasonably by others', positive: true },
  { id: 57, domain: 'justice_fairness', text: 'I deserve more than I\'m getting', positive: false },
  { id: 67, domain: 'justice_fairness', text: 'I accept that life isn\'t always fair', positive: true },
  { id: 77, domain: 'justice_fairness', text: 'I am a victim of injustice', positive: false },
  { id: 87, domain: 'justice_fairness', text: 'I find meaning even in difficult experiences', positive: true },
  { id: 97, domain: 'justice_fairness', text: 'Life is fundamentally unfair to me', positive: false },

  // DOMAIN 8: Belonging & Connection (10 questions)
  { id: 8, domain: 'belonging_connection', text: 'I belong and fit in', positive: true },
  { id: 18, domain: 'belonging_connection', text: 'I am an outsider who doesn\'t fit anywhere', positive: false },
  { id: 28, domain: 'belonging_connection', text: 'I feel connected to my community', positive: true },
  { id: 38, domain: 'belonging_connection', text: 'I am fundamentally different and alone', positive: false },
  { id: 48, domain: 'belonging_connection', text: 'I am part of something larger than myself', positive: true },
  { id: 58, domain: 'belonging_connection', text: 'I am isolated and separate from others', positive: false },
  { id: 68, domain: 'belonging_connection', text: 'I share common humanity with others', positive: true },
  { id: 78, domain: 'belonging_connection', text: 'No one understands me', positive: false },
  { id: 88, domain: 'belonging_connection', text: 'I have a place in this world', positive: true },
  { id: 98, domain: 'belonging_connection', text: 'I don\'t belong anywhere', positive: false },

  // DOMAIN 9: Trust in Others (10 questions)
  { id: 9, domain: 'others_trust', text: 'People are generally good and trustworthy', positive: true },
  { id: 19, domain: 'others_trust', text: 'People will hurt or betray me', positive: false },
  { id: 29, domain: 'others_trust', text: 'I can rely on others', positive: true },
  { id: 39, domain: 'others_trust', text: 'Everyone has hidden negative motives', positive: false },
  { id: 49, domain: 'others_trust', text: 'Most people mean well', positive: true },
  { id: 59, domain: 'others_trust', text: 'I must be vigilant about others\' intentions', positive: false },
  { id: 69, domain: 'others_trust', text: 'I can be open with people', positive: true },
  { id: 79, domain: 'others_trust', text: 'People cannot be trusted', positive: false },
  { id: 89, domain: 'others_trust', text: 'I expect positive things from others', positive: true },
  { id: 99, domain: 'others_trust', text: 'People will take advantage of me', positive: false },

  // DOMAIN 10: Standards & Self-Compassion (10 questions)
  { id: 10, domain: 'standards_compassion', text: 'My expectations of myself are reasonable', positive: true },
  { id: 20, domain: 'standards_compassion', text: 'I must be perfect to be acceptable', positive: false },
  { id: 30, domain: 'standards_compassion', text: 'I forgive myself for mistakes', positive: true },
  { id: 40, domain: 'standards_compassion', text: 'I harshly judge myself', positive: false },
  { id: 50, domain: 'standards_compassion', text: 'I treat myself with kindness', positive: true },
  { id: 60, domain: 'standards_compassion', text: 'I am my own worst critic', positive: false },
  { id: 70, domain: 'standards_compassion', text: 'I accept my limitations', positive: true },
  { id: 80, domain: 'standards_compassion', text: 'I demand perfection from myself', positive: false },
  { id: 90, domain: 'standards_compassion', text: 'I am compassionate toward myself', positive: true },
  { id: 100, domain: 'standards_compassion', text: 'I never measure up to my standards', positive: false }
];

// Scoring:
// Positive questions: 0 (Strongly Disagree) to 10 (Strongly Agree)
// Negative questions: 10 (Strongly Disagree) to 0 (Strongly Agree) - reversed
