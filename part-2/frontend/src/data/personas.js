/**
 * Pre-defined tech personas for debate
 */

export const TECH_PERSONAS = {
  creative_solver: {
    name: 'Creative Problem Solver',
    job_title: 'Creative Problem Solver',
    traits: ['creative', 'empathetic', 'innovative'],
    values: ['user experience', 'collaboration', 'innovation'],
    communication_style: 'engaging and thought-provoking'
  },
  technical_architect: {
    name: 'Technical Architect',
    job_title: 'Technical Architect',
    traits: ['analytical', 'pragmatic', 'systematic'],
    values: ['efficiency', 'best practices', 'scalability'],
    communication_style: 'logical and structured'
  },
  devops_engineer: {
    name: 'DevOps Engineer',
    job_title: 'DevOps Engineer',
    traits: ['proactive', 'detail-oriented', 'collaborative'],
    values: ['automation', 'reliability', 'continuous improvement'],
    communication_style: 'direct and solution-focused'
  },
  product_manager: {
    name: 'Product Manager',
    job_title: 'Product Manager',
    traits: ['strategic', 'customer-focused', 'decisive'],
    values: ['business value', 'user needs', 'data-driven decisions'],
    communication_style: 'persuasive and goal-oriented'
  },
  security_specialist: {
    name: 'Security Specialist',
    job_title: 'Security Specialist',
    traits: ['vigilant', 'methodical', 'risk-aware'],
    values: ['security', 'compliance', 'data protection'],
    communication_style: 'cautious and thorough'
  }
};

// Convert to array for easy dropdown rendering
export const PERSONA_OPTIONS = Object.entries(TECH_PERSONAS).map(([key, persona]) => ({
  value: key,
  label: persona.name,
  persona: persona
}));

