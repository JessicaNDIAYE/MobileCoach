/**
 * Dictionnaire des ingrédients : reconnaît ce que les gens tapent dans leurs courses
 * (« blanc de poulet », « tomates cerises »…), le range dans une ou plusieurs familles
 * (pour les recettes « caméléons ») et donne un prix indicatif pour la quantité d'une recette.
 *
 * - words : mots reconnus (le plus long l'emporte : « lait de coco » avant « lait »).
 * - cats  : familles interchangeables utilisées par les recettes.
 * - price : prix moyen estimé en € pour la quantité d'une recette (supermarché, France).
 */

export const CATEGORIES = {
  volailles: 'une volaille',
  viandes: 'une viande',
  poissons_blancs: 'un poisson blanc',
  poissons_gras: 'un poisson gras',
  oeufs: 'des œufs',
  proteines_vegetales: 'une protéine végétale',
  legumineuses: 'des légumineuses',
  feculents: 'un féculent',
  legumes_verts: 'un légume vert',
  legumes_racines: 'un légume racine',
  legumes_fruits: 'un légume du soleil',
  champignons: 'des champignons',
  fromages: 'un fromage',
  laitages: 'un laitage',
  fruits: 'un fruit',
  fruits_secs: 'des fruits secs',
} as const;

export type Category = keyof typeof CATEGORIES;

export type Ingredient = { id: string; name: string; words: string[]; cats: Category[]; price: number };

export const INGREDIENTS: Ingredient[] = [
  // Volailles
  { id: 'poulet', name: 'poulet', words: ['poulet', 'blanc de poulet', 'escalope de poulet', 'cuisse de poulet', 'aiguillette'], cats: ['volailles'], price: 5.5 },
  { id: 'dinde', name: 'dinde', words: ['dinde', 'escalope de dinde'], cats: ['volailles'], price: 5 },
  // Viandes
  { id: 'boeuf_hache', name: 'bœuf haché', words: ['hache', 'boeuf hache', 'steak hache', 'viande hachee'], cats: ['viandes'], price: 5 },
  { id: 'boeuf', name: 'bœuf', words: ['boeuf', 'steak', 'bavette', 'entrecote', 'rumsteck'], cats: ['viandes'], price: 8 },
  { id: 'porc', name: 'porc', words: ['porc', 'filet mignon', 'echine', 'cote de porc'], cats: ['viandes'], price: 6 },
  { id: 'jambon', name: 'jambon', words: ['jambon', 'jambon blanc'], cats: ['viandes'], price: 3 },
  { id: 'lardons', name: 'lardons', words: ['lardon', 'bacon'], cats: ['viandes'], price: 2.5 },
  { id: 'saucisse', name: 'saucisses', words: ['saucisse', 'chipolata', 'merguez'], cats: ['viandes'], price: 4 },
  { id: 'chorizo', name: 'chorizo', words: ['chorizo'], cats: ['viandes'], price: 3 },
  // Poissons
  { id: 'cabillaud', name: 'cabillaud', words: ['cabillaud', 'colin', 'merlu', 'lieu', 'poisson blanc', 'dos de cabillaud'], cats: ['poissons_blancs'], price: 7 },
  { id: 'saumon', name: 'saumon', words: ['saumon', 'pave de saumon', 'truite'], cats: ['poissons_gras'], price: 8 },
  { id: 'thon', name: 'thon', words: ['thon', 'thon en boite'], cats: ['poissons_gras'], price: 2.5 },
  { id: 'maquereau', name: 'maquereau', words: ['maquereau', 'sardine'], cats: ['poissons_gras'], price: 2.5 },
  { id: 'crevettes', name: 'crevettes', words: ['crevette', 'gambas'], cats: ['poissons_blancs'], price: 6 },
  // Œufs, protéines végétales, légumineuses
  { id: 'oeuf', name: 'œufs', words: ['oeuf'], cats: ['oeufs'], price: 2 },
  { id: 'tofu', name: 'tofu', words: ['tofu', 'tempeh'], cats: ['proteines_vegetales'], price: 2.5 },
  { id: 'lentilles', name: 'lentilles', words: ['lentille', 'lentille corail', 'lentille verte'], cats: ['legumineuses'], price: 1.5 },
  { id: 'pois_chiches', name: 'pois chiches', words: ['pois chiche'], cats: ['legumineuses'], price: 1.2 },
  { id: 'haricots_rouges', name: 'haricots rouges', words: ['haricot rouge'], cats: ['legumineuses'], price: 1.2 },
  { id: 'haricots_blancs', name: 'haricots blancs', words: ['haricot blanc', 'flageolet', 'haricot coco'], cats: ['legumineuses'], price: 1.2 },
  // Féculents
  { id: 'pates', name: 'pâtes', words: ['pate', 'spaghetti', 'penne', 'fusilli', 'tagliatelle', 'linguine', 'macaroni', 'coquillette'], cats: ['feculents'], price: 1 },
  { id: 'riz', name: 'riz', words: ['riz', 'riz basmati', 'riz complet'], cats: ['feculents'], price: 1.2 },
  { id: 'semoule', name: 'semoule', words: ['semoule', 'couscous'], cats: ['feculents'], price: 1 },
  { id: 'quinoa', name: 'quinoa', words: ['quinoa', 'boulgour', 'ebly', 'ble'], cats: ['feculents'], price: 2 },
  { id: 'pomme_de_terre', name: 'pommes de terre', words: ['pomme de terre', 'patate', 'grenaille'], cats: ['feculents'], price: 1.5 },
  { id: 'patate_douce', name: 'patate douce', words: ['patate douce'], cats: ['feculents', 'legumes_racines'], price: 2 },
  { id: 'pain', name: 'pain', words: ['pain', 'baguette', 'pain complet', 'pain de mie'], cats: ['feculents'], price: 1.3 },
  { id: 'tortilla', name: 'tortillas', words: ['tortilla', 'wrap', 'galette de ble'], cats: ['feculents'], price: 2 },
  { id: 'nouilles', name: 'nouilles', words: ['nouille', 'nouille de riz', 'udon', 'soba'], cats: ['feculents'], price: 2 },
  { id: 'gnocchi', name: 'gnocchis', words: ['gnocchi'], cats: ['feculents'], price: 2 },
  { id: 'avoine', name: 'flocons d’avoine', words: ['avoine', 'flocon d avoine', 'muesli'], cats: ['feculents'], price: 1.5 },
  { id: 'pate_tarte', name: 'pâte à tarte', words: ['pate brisee', 'pate feuilletee', 'pate a tarte', 'pate a pizza'], cats: ['feculents'], price: 1.5 },
  // Légumes verts
  { id: 'courgette', name: 'courgettes', words: ['courgette'], cats: ['legumes_verts'], price: 1.8 },
  { id: 'brocoli', name: 'brocoli', words: ['brocoli', 'chou fleur', 'chou romanesco'], cats: ['legumes_verts'], price: 2 },
  { id: 'haricots_verts', name: 'haricots verts', words: ['haricot vert'], cats: ['legumes_verts'], price: 2 },
  { id: 'epinards', name: 'épinards', words: ['epinard', 'pousse d epinard', 'blette'], cats: ['legumes_verts'], price: 2 },
  { id: 'poireau', name: 'poireaux', words: ['poireau'], cats: ['legumes_verts'], price: 2 },
  { id: 'chou', name: 'chou', words: ['chou', 'chou vert', 'chou rouge', 'chou kale', 'kale'], cats: ['legumes_verts'], price: 2 },
  { id: 'petits_pois', name: 'petits pois', words: ['petit poi'], cats: ['legumes_verts'], price: 1.5 },
  { id: 'salade', name: 'salade', words: ['salade', 'laitue', 'mache', 'roquette', 'mesclun', 'batavia'], cats: ['legumes_verts'], price: 1.5 },
  { id: 'concombre', name: 'concombre', words: ['concombre'], cats: ['legumes_verts'], price: 1 },
  { id: 'avocat', name: 'avocat', words: ['avocat'], cats: ['legumes_verts'], price: 1.5 },
  // Légumes racines
  { id: 'carotte', name: 'carottes', words: ['carotte'], cats: ['legumes_racines'], price: 1 },
  { id: 'betterave', name: 'betterave', words: ['betterave'], cats: ['legumes_racines'], price: 1.2 },
  { id: 'courge', name: 'courge', words: ['courge', 'butternut', 'potiron', 'potimarron', 'citrouille'], cats: ['legumes_racines'], price: 2.5 },
  // Légumes du soleil
  { id: 'tomate', name: 'tomates', words: ['tomate', 'tomate cerise'], cats: ['legumes_fruits'], price: 2 },
  { id: 'tomates_conserve', name: 'tomates en conserve', words: ['coulis', 'tomate concassee', 'pulpe de tomate', 'sauce tomate', 'passata'], cats: ['legumes_fruits'], price: 1.2 },
  { id: 'poivron', name: 'poivrons', words: ['poivron'], cats: ['legumes_fruits'], price: 1.8 },
  { id: 'aubergine', name: 'aubergine', words: ['aubergine'], cats: ['legumes_fruits'], price: 1.8 },
  { id: 'mais', name: 'maïs', words: ['mai'], cats: ['legumes_fruits'], price: 1.2 },
  { id: 'champignons', name: 'champignons', words: ['champignon', 'champignon de paris', 'pleurote'], cats: ['champignons'], price: 2 },
  // Fromages et laitages
  { id: 'emmental', name: 'fromage râpé', words: ['emmental', 'gruyere', 'comte', 'fromage rape', 'raclette'], cats: ['fromages'], price: 2.5 },
  { id: 'mozzarella', name: 'mozzarella', words: ['mozzarella', 'burrata'], cats: ['fromages'], price: 1.5 },
  { id: 'feta', name: 'feta', words: ['feta'], cats: ['fromages'], price: 2.5 },
  { id: 'chevre', name: 'chèvre', words: ['chevre', 'buche de chevre'], cats: ['fromages'], price: 2.5 },
  { id: 'parmesan', name: 'parmesan', words: ['parmesan', 'grana padano'], cats: ['fromages'], price: 3 },
  { id: 'ricotta', name: 'ricotta', words: ['ricotta', 'fromage frais', 'saint moret', 'philadelphia', 'boursin'], cats: ['fromages', 'laitages'], price: 2 },
  { id: 'yaourt', name: 'yaourt', words: ['yaourt', 'yaourt grec', 'skyr'], cats: ['laitages'], price: 1.5 },
  { id: 'fromage_blanc', name: 'fromage blanc', words: ['fromage blanc', 'faisselle'], cats: ['laitages'], price: 1.5 },
  { id: 'creme', name: 'crème', words: ['creme', 'creme fraiche', 'creme liquide'], cats: ['laitages'], price: 1.5 },
  { id: 'lait', name: 'lait', words: ['lait', 'lait d avoine', 'lait d amande', 'boisson vegetale'], cats: ['laitages'], price: 1 },
  { id: 'lait_coco', name: 'lait de coco', words: ['lait de coco', 'creme de coco'], cats: [], price: 1.8 },
  // Fruits
  { id: 'pomme', name: 'pommes', words: ['pomme'], cats: ['fruits'], price: 1.5 },
  { id: 'banane', name: 'bananes', words: ['banane'], cats: ['fruits'], price: 1.2 },
  { id: 'poire', name: 'poires', words: ['poire'], cats: ['fruits'], price: 1.8 },
  { id: 'fruits_rouges', name: 'fruits rouges', words: ['fruit rouge', 'fraise', 'framboise', 'myrtille', 'cerise'], cats: ['fruits'], price: 3 },
  { id: 'orange', name: 'agrumes', words: ['orange', 'clementine', 'mandarine', 'pamplemousse'], cats: ['fruits'], price: 2 },
  { id: 'kiwi', name: 'kiwis', words: ['kiwi', 'mangue', 'ananas', 'peche', 'abricot'], cats: ['fruits'], price: 2 },
  { id: 'citron', name: 'citron', words: ['citron', 'citron vert'], cats: [], price: 0.6 },
  // Fruits secs, graines, divers
  { id: 'noix', name: 'noix ou amandes', words: ['noix', 'amande', 'noisette', 'cajou', 'pistache', 'graine de courge'], cats: ['fruits_secs'], price: 2.5 },
  { id: 'chia', name: 'graines de chia', words: ['chia', 'graine de lin'], cats: ['fruits_secs'], price: 2.5 },
  { id: 'herbes', name: 'herbes fraîches', words: ['persil', 'basilic', 'coriandre', 'ciboulette', 'menthe', 'aneth'], cats: [], price: 1 },
  { id: 'olives', name: 'olives', words: ['olive'], cats: [], price: 2 },
  { id: 'pesto', name: 'pesto', words: ['pesto'], cats: [], price: 2.5 },
  { id: 'chocolat', name: 'chocolat', words: ['chocolat', 'cacao'], cats: [], price: 2 },
  { id: 'miel', name: 'miel', words: ['miel', 'sirop d erable', 'sirop d agave'], cats: [], price: 3 },
  { id: 'gingembre', name: 'gingembre', words: ['gingembre'], cats: [], price: 1 },
];

/**
 * Basiques du placard : jamais exigés, jamais comptés comme « à acheter ».
 * Ils sont cités dans les recettes pour information.
 */
export const PANTRY = ['sel', 'poivre', 'huile', 'vinaigre', 'épices', 'ail', 'oignon', 'échalote', 'moutarde', 'sauce soja', 'bouillon', 'farine', 'beurre', 'sucre'];
