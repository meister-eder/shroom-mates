import seitlingCutout from '../assets/images/seitling_tasse_cutout.png';
import whitePearlCutout from '../assets/images/white_pearl_tasse_cutout.png';

export interface Recipe {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Mushroom {
  id: string;
  name: string;
  description: string;
  category: 'edible' | 'medicinal';
  imageSrc: string;
  cutoutImageSrc?: any;
  highlightColor: string;
  details: {
    scientificName: string;
    habitat: string;
    season: string[];
    characteristics: string[];
  };
  recipes?: Recipe[];
}

export const mushrooms: Mushroom[] = [
  {
    id: 'king-oyster',
    name: 'King Oyster Mushroom',
    description: 'A delicious and meaty mushroom with a thick stem and small cap.',
    category: 'edible',
    imageSrc: '/shroom-mates/images/seitling_tasse_cutout.png',
    cutoutImageSrc: seitlingCutout,
    highlightColor: '#E4F0FF', // Soft blue
    details: {
      scientificName: 'Pleurotus eryngii',
      habitat: 'Dead or dying hardwood trees',
      season: ['Spring', 'Fall'],
      characteristics: [
        'Large, thick stem',
        'Small, brown cap',
        'Firm, meaty texture',
        'Mild, savory flavor'
      ]
    },
    recipes: [
      {
        name: 'Grilled King Oyster "Scallops"',
        description: 'Sliced king oyster stems grilled to perfection, mimicking the texture of scallops.',
        ingredients: [
          '2 large king oyster mushrooms',
          '2 tbsp olive oil',
          '2 cloves garlic, minced',
          'Salt and pepper to taste',
          'Fresh herbs (thyme, parsley)'
        ],
        instructions: [
          'Slice mushroom stems into 1-inch thick rounds',
          'Score both sides in a crosshatch pattern',
          'Marinate with oil, garlic, and seasonings for 30 minutes',
          'Grill on high heat for 3-4 minutes per side',
          'Garnish with fresh herbs'
        ],
        prepTime: '40 minutes',
        cookTime: '10 minutes',
        difficulty: 'medium'
      }
    ]
  },
  {
    id: 'white-pearl',
    name: 'White Pearl Mushroom',
    description: 'A beautiful white mushroom with a delicate flavor and tender texture.',
    category: 'edible',
    imageSrc: '/shroom-mates/images/white_pearl_tasse_cutout.png',
    cutoutImageSrc: whitePearlCutout,
    highlightColor: '#FFE4E8', // Soft pink
    details: {
      scientificName: 'Pleurotus ostreatus var. florida',
      habitat: 'Hardwood trees and logs',
      season: ['Spring', 'Summer', 'Fall'],
      characteristics: [
        'Pure white color',
        'Shell-like shape',
        'Delicate, tender texture',
        'Mild, sweet flavor'
      ]
    },
    recipes: [
      {
        name: 'White Pearl Mushroom Stir-Fry',
        description: 'A light and flavorful stir-fry highlighting the delicate taste of white pearl mushrooms.',
        ingredients: [
          '300g white pearl mushrooms',
          '2 tbsp vegetable oil',
          '2 cloves garlic, sliced',
          '1 tbsp soy sauce',
          'Green onions for garnish'
        ],
        instructions: [
          'Tear mushrooms into bite-sized pieces',
          'Heat oil in a wok over high heat',
          'Add garlic and stir-fry for 30 seconds',
          'Add mushrooms and cook for 3-4 minutes',
          'Season with soy sauce and garnish with green onions'
        ],
        prepTime: '10 minutes',
        cookTime: '5 minutes',
        difficulty: 'easy'
      }
    ]
  },
  {
    id: 'oyster-mushroom',
    name: 'Oyster Mushroom',
    description: 'A delicious and easy-to-identify mushroom that grows on wood.',
    category: 'edible',
    imageSrc: '/shroom-mates/images/hero_oyster.png',
    cutoutImageSrc: seitlingCutout,
    highlightColor: '#C9E4CA', // Soft green
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
    },
    recipes: [
      {
        name: 'Crispy Oyster Mushroom "Wings"',
        description: 'A vegetarian take on chicken wings that\'s just as satisfying and delicious.',
        ingredients: [
          '500g oyster mushrooms',
          '2 cups all-purpose flour',
          '1 tsp garlic powder',
          '1 tsp paprika',
          '1/2 tsp salt',
          '1/4 tsp black pepper',
          'Vegetable oil for frying',
          'Your favorite wing sauce'
        ],
        instructions: [
          'Clean the oyster mushrooms and tear into large, wing-sized pieces',
          'Mix flour with garlic powder, paprika, salt, and pepper in a bowl',
          'Dredge mushroom pieces in the seasoned flour',
          'Heat oil in a large pan to 350°F (175°C)',
          'Fry mushrooms in batches until golden brown and crispy (about 3-4 minutes per side)',
          'Drain on paper towels',
          'Toss with your favorite wing sauce and serve hot'
        ],
        prepTime: '15 minutes',
        cookTime: '20 minutes',
        difficulty: 'easy'
      },
      {
        name: 'Garlic Butter Oyster Mushroom Pasta',
        description: 'A simple yet elegant pasta dish that highlights the delicate flavor of oyster mushrooms.',
        ingredients: [
          '300g oyster mushrooms',
          '400g spaghetti',
          '4 cloves garlic, minced',
          '60g butter',
          '2 tbsp olive oil',
          'Fresh parsley',
          'Salt and pepper to taste',
          'Parmesan cheese for serving'
        ],
        instructions: [
          'Cook pasta according to package instructions',
          'Clean and slice mushrooms into strips',
          'Heat butter and olive oil in a large pan',
          'Add garlic and sauté until fragrant',
          'Add mushrooms and cook until golden',
          'Toss with cooked pasta, season with salt and pepper',
          'Garnish with parsley and parmesan'
        ],
        prepTime: '10 minutes',
        cookTime: '15 minutes',
        difficulty: 'easy'
      }
    ]
  },
  {
    id: 'reishi',
    name: 'Reishi',
    description: 'Known as the mushroom of immortality in traditional Chinese medicine.',
    category: 'medicinal',
    imageSrc: '/shroom-mates/images/white_pearl_tasse_cutout.png',
    cutoutImageSrc: whitePearlCutout,
    highlightColor: '#FFC5C5', // Soft peach
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
    },
    recipes: [
      {
        name: 'Reishi Mushroom Tea',
        description: 'A traditional medicinal tea known for its potential immune-boosting properties.',
        ingredients: [
          '2-3 thin slices of dried reishi mushroom',
          '4 cups water',
          'Honey or lemon (optional)',
          'Ginger slice (optional)'
        ],
        instructions: [
          'Bring water to a boil in a pot',
          'Add reishi slices and ginger (if using)',
          'Reduce heat and simmer for 30-45 minutes',
          'Strain the tea',
          'Add honey or lemon to taste if desired',
          'Serve hot'
        ],
        prepTime: '5 minutes',
        cookTime: '45 minutes',
        difficulty: 'easy'
      }
    ]
  },
  {
    id: 'lions-mane',
    name: "Lion's Mane Mushroom",
    description: "A remarkable mushroom that resembles a lion's mane with cascading white tendrils. Known for both its delicate seafood-like taste and impressive cognitive health benefits.",
    category: 'medicinal',
    imageSrc: '/shroom-mates/images/lions_mane_cutout.png',
    cutoutImageSrc: whitePearlCutout, // Temporarily using whitePearl image until we have the proper image
    highlightColor: '#F0F0FF', // Soft lavender
    details: {
      scientificName: 'Hericium erinaceus',
      habitat: 'Hardwood trees, particularly oak and maple',
      season: ['Late Summer', 'Fall'],
      characteristics: [
        'White, cascading spines',
        'Snowball-like appearance',
        'Soft, tender texture',
        'Seafood-like flavor'
      ]
    },
    recipes: [
      {
        name: "Lion's Mane 'Crab Cakes'",
        description: 'A plant-based take on crab cakes that captures the seafood-like essence of Lion\'s Mane mushrooms.',
        ingredients: [
          '400g Lion\'s Mane mushroom, shredded',
          '1 cup breadcrumbs',
          '1/4 cup mayonnaise (vegan or regular)',
          '1 tbsp Dijon mustard',
          '1 tsp Old Bay seasoning',
          '1/4 cup finely chopped parsley',
          '1 small onion, finely diced',
          'Salt and pepper to taste',
          'Oil for frying'
        ],
        instructions: [
          'Shred the Lion\'s Mane mushroom into small, crab-like pieces',
          'Mix with breadcrumbs, mayonnaise, mustard, and seasonings',
          'Form into small patties',
          'Chill for 30 minutes',
          'Pan-fry until golden brown on both sides',
          'Serve with lemon wedges and remoulade sauce'
        ],
        prepTime: '45 minutes',
        cookTime: '10 minutes',
        difficulty: 'medium'
      },
      {
        name: 'Brain-Boosting Lion\'s Mane Tea',
        description: 'A nourishing medicinal tea that harnesses the cognitive benefits of Lion\'s Mane mushroom.',
        ingredients: [
          '2 tbsp dried Lion\'s Mane powder or pieces',
          '2 cups hot water',
          '1 tsp honey (optional)',
          '1/4 tsp cinnamon',
          'Splash of oat milk (optional)'
        ],
        instructions: [
          'Bring water to just below boiling (80°C/176°F)',
          'Add Lion\'s Mane powder or pieces',
          'Steep for 10-15 minutes',
          'Strain if using pieces',
          'Add honey, cinnamon, and oat milk if desired',
          'Stir well and enjoy'
        ],
        prepTime: '2 minutes',
        cookTime: '15 minutes',
        difficulty: 'easy'
      }
    ]
  }
];

console.log('Mushrooms array:', mushrooms);
