export interface WordData {
  word: string;
  impostorClue: string;
}

export interface Category {
  name: string;
  words: WordData[];
}

export const categories: Category[] = [
  {
    name: "Animals",
    words: [
      { word: "Dog", impostorClue: "Common pet" },
      { word: "Cat", impostorClue: "Feline" },
      { word: "Elephant", impostorClue: "Large mammal" },
      { word: "Lion", impostorClue: "Big cat" },
      { word: "Dolphin", impostorClue: "Marine mammal" },
      { word: "Eagle", impostorClue: "Bird of prey" },
      { word: "Penguin", impostorClue: "Flightless bird" },
    ],
  },
  {
    name: "Countries",
    words: [
      { word: "Japan", impostorClue: "East Asian nation" },
      { word: "Brazil", impostorClue: "South American" },
      { word: "France", impostorClue: "Western European" },
      { word: "Australia", impostorClue: "Oceanic continent" },
      { word: "Egypt", impostorClue: "North African" },
      { word: "Canada", impostorClue: "North American" },
      { word: "India", impostorClue: "South Asian" },
    ],
  },
  {
    name: "Food",
    words: [
      { word: "Pizza", impostorClue: "Italian dish" },
      { word: "Sushi", impostorClue: "Japanese cuisine" },
      { word: "Tacos", impostorClue: "Mexican food" },
      { word: "Burger", impostorClue: "Fast food" },
      { word: "Pasta", impostorClue: "Italian carbs" },
      { word: "Curry", impostorClue: "Spiced dish" },
      { word: "Ramen", impostorClue: "Noodle soup" },
    ],
  },
  {
    name: "Sports",
    words: [
      { word: "Soccer", impostorClue: "Team ball sport" },
      { word: "Basketball", impostorClue: "Indoor court game" },
      { word: "Tennis", impostorClue: "Racket sport" },
      { word: "Swimming", impostorClue: "Water activity" },
      { word: "Boxing", impostorClue: "Combat sport" },
      { word: "Golf", impostorClue: "Club and ball" },
      { word: "Baseball", impostorClue: "Bat sport" },
    ],
  },
  {
    name: "Professions",
    words: [
      { word: "Doctor", impostorClue: "Healthcare" },
      { word: "Teacher", impostorClue: "Education" },
      { word: "Engineer", impostorClue: "Technical field" },
      { word: "Chef", impostorClue: "Culinary expert" },
      { word: "Pilot", impostorClue: "Aviation" },
      { word: "Lawyer", impostorClue: "Legal professional" },
      { word: "Artist", impostorClue: "Creative work" },
    ],
  },
  {
    name: "Colors",
    words: [
      { word: "Red", impostorClue: "Primary color" },
      { word: "Blue", impostorClue: "Cool tone" },
      { word: "Yellow", impostorClue: "Bright primary" },
      { word: "Green", impostorClue: "Nature color" },
      { word: "Purple", impostorClue: "Mixed color" },
      { word: "Orange", impostorClue: "Warm secondary" },
      { word: "Pink", impostorClue: "Light shade" },
    ],
  },
  {
    name: "Movie Genres",
    words: [
      { word: "Action", impostorClue: "Exciting films" },
      { word: "Comedy", impostorClue: "Funny movies" },
      { word: "Horror", impostorClue: "Scary films" },
      { word: "Romance", impostorClue: "Love stories" },
      { word: "Thriller", impostorClue: "Suspenseful" },
      { word: "Drama", impostorClue: "Serious films" },
      { word: "Sci-Fi", impostorClue: "Future/space" },
    ],
  },
  {
    name: "Technology",
    words: [
      { word: "Smartphone", impostorClue: "Mobile device" },
      { word: "Laptop", impostorClue: "Portable computer" },
      { word: "Tablet", impostorClue: "Touch screen" },
      { word: "Smartwatch", impostorClue: "Wearable tech" },
      { word: "Camera", impostorClue: "Photo device" },
      { word: "Headphones", impostorClue: "Audio gear" },
      { word: "Drone", impostorClue: "Flying device" },
    ],
  },
  {
    name: "Music Genres",
    words: [
      { word: "Rock", impostorClue: "Guitar-heavy" },
      { word: "Jazz", impostorClue: "Improvised music" },
      { word: "Pop", impostorClue: "Mainstream hits" },
      { word: "Classical", impostorClue: "Orchestra music" },
      { word: "Hip Hop", impostorClue: "Rap music" },
      { word: "Country", impostorClue: "American folk" },
      { word: "Electronic", impostorClue: "Synthesized" },
    ],
  },
  {
    name: "Vehicles",
    words: [
      { word: "Car", impostorClue: "Four-wheeled" },
      { word: "Bicycle", impostorClue: "Two-wheeled pedal" },
      { word: "Airplane", impostorClue: "Flying transport" },
      { word: "Boat", impostorClue: "Water vessel" },
      { word: "Train", impostorClue: "Rail transport" },
      { word: "Motorcycle", impostorClue: "Two-wheeled motor" },
      { word: "Helicopter", impostorClue: "Rotorcraft" },
    ],
  },
];

export function getRandomCategory(): Category {
  return categories[Math.floor(Math.random() * categories.length)];
}

export function getRandomWord(category: Category): WordData {
  return category.words[Math.floor(Math.random() * category.words.length)];
}
