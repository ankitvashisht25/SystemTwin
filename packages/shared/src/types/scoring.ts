export interface ArchitectureScore {
  overall: string;
  overallNumeric: number;
  categories: {
    resilience: CategoryScore;
    costEfficiency: CategoryScore;
    scalability: CategoryScore;
    security: CategoryScore;
    complexity: CategoryScore;
  };
  findings: Finding[];
}

export interface CategoryScore {
  grade: string;
  score: number;
  details: string;
}

export interface Finding {
  severity: 'critical' | 'warning' | 'info' | 'good';
  category: string;
  message: string;
}
