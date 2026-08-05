// Predefined customization templates offered when building a product.
// selection: 'single' (pick one) or 'multiple' (pick several).
// Each option has a price delta added to the base product price.
export const CUSTOMIZATION_TEMPLATES = [
  {
    name: 'Size',
    selection: 'single',
    required: true,
    options: [
      { name: 'Small', price: 0 },
      { name: 'Medium', price: 2 },
      { name: 'Large', price: 4 },
      { name: 'Extra Large', price: 6 },
    ],
  },
  {
    name: 'Temperature',
    selection: 'single',
    required: false,
    options: [
      { name: 'Hot', price: 0 },
      { name: 'Cold', price: 0 },
      { name: 'Iced', price: 0.5 },
    ],
  },
  {
    name: 'Spice Level',
    selection: 'single',
    required: false,
    options: [
      { name: 'Mild', price: 0 },
      { name: 'Medium', price: 0 },
      { name: 'Hot', price: 0 },
      { name: 'Extra Hot', price: 0 },
    ],
  },
  {
    name: 'Sugar Level',
    selection: 'single',
    required: false,
    options: [
      { name: 'No Sugar', price: 0 },
      { name: '25%', price: 0 },
      { name: '50%', price: 0 },
      { name: '75%', price: 0 },
      { name: '100%', price: 0 },
    ],
  },
  {
    name: 'Milk',
    selection: 'single',
    required: false,
    options: [
      { name: 'Whole', price: 0 },
      { name: 'Skim', price: 0 },
      { name: 'Oat', price: 0.75 },
      { name: 'Almond', price: 0.75 },
      { name: 'Soy', price: 0.5 },
    ],
  },
  {
    name: 'Add-ons',
    selection: 'multiple',
    required: false,
    options: [
      { name: 'Extra Cheese', price: 1.5 },
      { name: 'Bacon', price: 2 },
      { name: 'Avocado', price: 2 },
      { name: 'Fried Egg', price: 1 },
    ],
  },
  {
    name: 'Sauce',
    selection: 'multiple',
    required: false,
    options: [
      { name: 'Ketchup', price: 0 },
      { name: 'Mustard', price: 0 },
      { name: 'Mayo', price: 0 },
      { name: 'BBQ', price: 0 },
      { name: 'Garlic', price: 0.5 },
    ],
  },
  {
    name: 'Style',
    selection: 'single',
    required: false,
    options: [
      { name: 'Moroccan', price: 0 },
      { name: 'Arabian', price: 8 },
    ],
  },
]
