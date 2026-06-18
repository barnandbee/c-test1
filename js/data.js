/* ==========================================================================
   data.js — content banks: mascots, words, categories, analogies
   ========================================================================== */
(function (global) {
  'use strict';

  /* --- Mascot generator -------------------------------------------------- */
  // Obscure chemical elements & natural minerals, grouped by first letter.
  const ELEMENTS = {
    A: ['Antimony', 'Azurite', 'Apatite', 'Aragonite', 'Actinium'],
    B: ['Bismuth', 'Beryllium', 'Barite', 'Brucite', 'Boron'],
    C: ['Cerium', 'Cinnabar', 'Cobalt', 'Cuprite', 'Chromium'],
    D: ['Dysprosium', 'Dolomite', 'Diopside'],
    E: ['Erbium', 'Europium', 'Epidote'],
    F: ['Fluorite', 'Feldspar', 'Francium'],
    G: ['Gadolinium', 'Gallium', 'Germanium', 'Galena', 'Gypsum'],
    H: ['Hafnium', 'Holmium', 'Hematite', 'Halite'],
    I: ['Indium', 'Iridium', 'Ilmenite'],
    K: ['Kyanite', 'Kernite'],
    L: ['Lanthanum', 'Lutetium', 'Lepidolite', 'Limonite'],
    M: ['Molybdenum', 'Manganese', 'Malachite', 'Magnetite', 'Monazite'],
    N: ['Niobium', 'Neodymium', 'Nepheline'],
    O: ['Osmium', 'Olivine', 'Orpiment', 'Obsidian'],
    P: ['Praseodymium', 'Palladium', 'Pyrite', 'Promethium'],
    R: ['Rhodium', 'Rubidium', 'Rhenium', 'Rutile', 'Realgar'],
    S: ['Samarium', 'Scandium', 'Selenium', 'Strontium', 'Sphalerite'],
    T: ['Tellurium', 'Thulium', 'Tantalum', 'Terbium', 'Tourmaline'],
    V: ['Vanadium', 'Vermiculite', 'Vesuvianite'],
    W: ['Wulfenite', 'Wollastonite', 'Wolframite'],
    Y: ['Yttrium'],
    Z: ['Zirconium', 'Zircon', 'Zeolite']
  };

  // Emoji animals / items, grouped by first letter of their name.
  const CRITTERS = {
    A: [['🐜', 'Ant'], ['🐊', 'Alligator']],
    B: [['🐝', 'Bee'], ['🦇', 'Bat'], ['🐻', 'Bear'], ['🦫', 'Beaver'], ['🦬', 'Bison'], ['🦋', 'Butterfly']],
    C: [['🐱', 'Cat'], ['🐊', 'Crocodile'], ['🐄', 'Cow'], ['🦀', 'Crab'], ['🐪', 'Camel'], ['🐿️', 'Chipmunk']],
    D: [['🐶', 'Dog'], ['🦆', 'Duck'], ['🐬', 'Dolphin'], ['🦌', 'Deer'], ['🐉', 'Dragon'], ['🦤', 'Dodo']],
    E: [['🐘', 'Elephant'], ['🦅', 'Eagle'], ['🐍', 'Eel']],
    F: [['🦊', 'Fox'], ['🐸', 'Frog'], ['🐟', 'Fish'], ['🦩', 'Flamingo']],
    G: [['🦒', 'Giraffe'], ['🐐', 'Goat'], ['🦍', 'Gorilla'], ['🪿', 'Goose']],
    H: [['🐹', 'Hamster'], ['🦔', 'Hedgehog'], ['🦛', 'Hippo'], ['🐎', 'Horse'], ['🦅', 'Hawk']],
    I: [['🦎', 'Iguana']],
    K: [['🦘', 'Kangaroo'], ['🐨', 'Koala'], ['🥝', 'Kiwi']],
    L: [['🦁', 'Lion'], ['🦎', 'Lizard'], ['🦙', 'Llama'], ['🐆', 'Leopard'], ['🦞', 'Lobster'], ['🐞', 'Ladybird']],
    M: [['🐭', 'Mouse'], ['🐵', 'Monkey'], ['🦟', 'Mosquito'], ['🦌', 'Moose']],
    N: [['🦎', 'Newt'], ['🐦', 'Nightingale']],
    O: [['🐙', 'Octopus'], ['🦉', 'Owl'], ['🦦', 'Otter'], ['🐂', 'Ox'], ['🦧', 'Orangutan']],
    P: [['🐧', 'Penguin'], ['🐼', 'Panda'], ['🦜', 'Parrot'], ['🐷', 'Pig'], ['🦚', 'Peacock'], ['🐩', 'Poodle']],
    R: [['🐰', 'Rabbit'], ['🐀', 'Rat'], ['🦝', 'Raccoon'], ['🦏', 'Rhino'], ['🐓', 'Rooster']],
    S: [['🐍', 'Snake'], ['🦨', 'Skunk'], ['🐌', 'Snail'], ['🦭', 'Seal'], ['🐑', 'Sheep'], ['🕷️', 'Spider'], ['🦈', 'Shark'], ['🐿️', 'Squirrel'], ['🦢', 'Swan']],
    T: [['🐯', 'Tiger'], ['🐢', 'Tortoise'], ['🦃', 'Turkey']],
    V: [['🦅', 'Vulture'], ['🐍', 'Viper']],
    W: [['🐋', 'Whale'], ['🐺', 'Wolf'], ['🦭', 'Walrus'], ['🪱', 'Worm'], ['🐝', 'Wasp']],
    Y: [['🐂', 'Yak']],
    Z: [['🦓', 'Zebra']]
  };

  // Generate `count` alliterative mascot suggestions.
  function suggestMascots(count) {
    count = count || 6;
    const letters = Object.keys(CRITTERS).filter(L => ELEMENTS[L] && ELEMENTS[L].length);
    const out = [];
    const seen = new Set();
    let guard = 0;
    while (out.length < count && guard < 500) {
      guard++;
      const L = U.pick(letters);
      const critter = U.pick(CRITTERS[L]);
      const element = U.pick(ELEMENTS[L]);
      const name = `${element} ${critter[1]}`;
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({ emoji: critter[0], name });
    }
    return out;
  }

  /* --- Verbal banks ------------------------------------------------------ */
  // word + hint, used by Anagram and Word Completion
  const WORDS = [
    ['planet', 'A world orbiting a star'],
    ['garden', 'Place where flowers grow'],
    ['bottle', 'Holds a drink'],
    ['orange', 'A citrus fruit'],
    ['silver', 'A shiny grey metal'],
    ['forest', 'A large wood'],
    ['market', 'Where goods are sold'],
    ['pencil', 'You write with it'],
    ['window', 'You see through it'],
    ['animal', 'A living creature'],
    ['flower', 'A bloom on a plant'],
    ['bridge', 'Crosses a river'],
    ['castle', 'A royal fortress'],
    ['island', 'Land surrounded by sea'],
    ['jungle', 'Dense tropical forest'],
    ['magnet', 'Attracts iron'],
    ['candle', 'Gives light with a flame'],
    ['dolphin', 'A clever sea mammal'],
    ['guitar', 'A stringed instrument'],
    ['hammer', 'A tool for nails'],
    ['rocket', 'Flies into space'],
    ['puzzle', 'A brain teaser'],
    ['mirror', 'Shows your reflection'],
    ['kitchen', 'Room for cooking']
  ];

  const SYNONYMS = [
    ['happy', 'joyful'], ['big', 'large'], ['fast', 'quick'], ['smart', 'clever'],
    ['brave', 'bold'], ['quiet', 'silent'], ['begin', 'start'], ['tired', 'weary'],
    ['tiny', 'small'], ['angry', 'furious'], ['rich', 'wealthy'], ['cold', 'chilly'],
    ['strange', 'odd'], ['gather', 'collect'], ['repair', 'mend'], ['glad', 'pleased']
  ];

  const ANTONYMS = [
    ['hot', 'cold'], ['up', 'down'], ['happy', 'sad'], ['fast', 'slow'],
    ['big', 'small'], ['light', 'dark'], ['open', 'closed'], ['hard', 'soft'],
    ['empty', 'full'], ['near', 'far'], ['early', 'late'], ['wet', 'dry'],
    ['rich', 'poor'], ['brave', 'cowardly'], ['ancient', 'modern'], ['victory', 'defeat']
  ];

  const CATEGORIES = {
    Fruits: ['Apple', 'Banana', 'Cherry', 'Mango', 'Peach', 'Grape', 'Lemon'],
    Animals: ['Tiger', 'Otter', 'Camel', 'Panda', 'Eagle', 'Whale', 'Zebra'],
    Colours: ['Crimson', 'Indigo', 'Amber', 'Violet', 'Teal', 'Maroon'],
    Vehicles: ['Tractor', 'Frigate', 'Scooter', 'Glider', 'Trolley', 'Yacht'],
    Bodyparts: ['Elbow', 'Ankle', 'Wrist', 'Shoulder', 'Knuckle', 'Thumb'],
    Sports: ['Tennis', 'Hockey', 'Cricket', 'Rowing', 'Boxing', 'Fencing'],
    Furniture: ['Cabinet', 'Dresser', 'Stool', 'Wardrobe', 'Bench', 'Cradle'],
    Weather: ['Drizzle', 'Blizzard', 'Thunder', 'Breeze', 'Frost', 'Hail'],
    Instruments: ['Trumpet', 'Cello', 'Banjo', 'Flute', 'Harp', 'Oboe']
  };

  const ANALOGIES = [
    { a: 'Finger', b: 'Hand', c: 'Toe', answer: 'Foot', distractors: ['Leg', 'Knee', 'Arm'] },
    { a: 'Puppy', b: 'Dog', c: 'Kitten', answer: 'Cat', distractors: ['Mouse', 'Cub', 'Foal'] },
    { a: 'Day', b: 'Night', c: 'Light', answer: 'Dark', distractors: ['Sun', 'Lamp', 'Bright'] },
    { a: 'Hot', b: 'Cold', c: 'Tall', answer: 'Short', distractors: ['High', 'Big', 'Wide'] },
    { a: 'Bird', b: 'Sky', c: 'Fish', answer: 'Sea', distractors: ['Net', 'Scale', 'Boat'] },
    { a: 'Pen', b: 'Write', c: 'Knife', answer: 'Cut', distractors: ['Sharp', 'Spoon', 'Eat'] },
    { a: 'Author', b: 'Book', c: 'Painter', answer: 'Painting', distractors: ['Brush', 'Canvas', 'Colour'] },
    { a: 'Hour', b: 'Minute', c: 'Minute', answer: 'Second', distractors: ['Clock', 'Day', 'Watch'] },
    { a: 'King', b: 'Crown', c: 'Knight', answer: 'Armour', distractors: ['Horse', 'Sword', 'Castle'] },
    { a: 'Bee', b: 'Hive', c: 'Bird', answer: 'Nest', distractors: ['Wing', 'Egg', 'Tree'] }
  ];

  // Nonsense words for syllogisms
  const NONSENSE = ['Bloops', 'Razzies', 'Lazzies', 'Mips', 'Trells', 'Quabs', 'Fendles', 'Wuzzles', 'Plinks', 'Grobs'];

  global.DATA = {
    suggestMascots, WORDS, SYNONYMS, ANTONYMS, CATEGORIES, ANALOGIES, NONSENSE
  };
})(window);
