export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  authorId: string;
  authorName: string;
  nodeCount: number;
  edgeCount: number;
  downloads: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateRating {
  id: string;
  templateId: string;
  userId: string;
  rating: number;
  review?: string;
  createdAt: string;
}
