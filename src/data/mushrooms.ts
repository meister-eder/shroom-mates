export interface Mushroom {
  id: string;
  name: string;
  description: string;
  category: 'edible' | 'medicinal' | 'poisonous';
  imageSrc: string;
  details: {
    scientificName: string;
    habitat: string;
    season: string[];
    characteristics: string[];
  };
}

export const mushrooms: Mushroom[] = [
  {
    id: 'oyster-mushroom',
    name: 'Oyster Mushroom',
    description: 'A delicious and easy-to-identify mushroom that grows on wood.',
    category: 'edible',
    imageSrc: '/images/oyster-mushroom.jpg',
    details: {
      scientificName: 'Pleurotus ostreatus',
      habitat: 'Dead or dying hardwood trees',
      season: ['Spring', 'Fall'],
      characteristics: [
        'Fan-shaped caps',
        'White to light gray color',
        'Gills running down the stem',
        'Growing in shelf-like clusters'
      ]
    }
  },
  {
    id: 'reishi',
    name: 'Reishi',
    description: 'Known as the mushroom of immortality in traditional Chinese medicine.',
    category: 'medicinal',
    imageSrc: '/images/reishi.jpg',
    details: {
      scientificName: 'Ganoderma lucidum',
      habitat: 'Dead or dying hardwood trees, especially hemlock',
      season: ['Year-round'],
      characteristics: [
        'Kidney-shaped cap',
        'Reddish-brown color',
        'Shiny, varnished appearance',
        'Woody texture'
      ]
    }
  },
  {
    id: 'death-cap',
    name: 'Death Cap',
    description: 'One of the most poisonous mushrooms in the world.',
    category: 'poisonous',
    imageSrc: '/images/death-cap.jpg',
    details: {
      scientificName: 'Amanita phalloides',
      habitat: 'Oak and other hardwood forests',
      season: ['Summer', 'Fall'],
      characteristics: [
        'White to pale green cap',
        'White gills',
        'Base with distinctive volva',
        'Ring on stem'
      ]
    }
  }
];
