export interface WordData {
  word: string;
  wordEs: string;
  impostorClue: string;
  impostorClueEs: string;
}

export interface Category {
  name: string;
  words: WordData[];
}

export const categories: Category[] = [
  {
    name: "Animals",
    words: [
      { word: "Dog", wordEs: "Perro", impostorClue: "Common pet", impostorClueEs: "Mascota común" },
      { word: "Cat", wordEs: "Gato", impostorClue: "Feline", impostorClueEs: "Felino" },
      { word: "Elephant", wordEs: "Elefante", impostorClue: "Large mammal", impostorClueEs: "Mamífero grande" },
      { word: "Lion", wordEs: "León", impostorClue: "Big cat", impostorClueEs: "Felino grande" },
      { word: "Dolphin", wordEs: "Delfín", impostorClue: "Marine mammal", impostorClueEs: "Mamífero marino" },
      { word: "Eagle", wordEs: "Águila", impostorClue: "Bird of prey", impostorClueEs: "Ave rapaz" },
      { word: "Penguin", wordEs: "Pingüino", impostorClue: "Flightless bird", impostorClueEs: "Ave no voladora" },
    ],
  },
  {
    name: "Countries",
    words: [
      { word: "Japan", wordEs: "Japón", impostorClue: "East Asian nation", impostorClueEs: "Nación del este asiático" },
      { word: "Brazil", wordEs: "Brasil", impostorClue: "South American", impostorClueEs: "Sudamericano" },
      { word: "France", wordEs: "Francia", impostorClue: "Western European", impostorClueEs: "Europa occidental" },
      { word: "Australia", wordEs: "Australia", impostorClue: "Oceanic continent", impostorClueEs: "Continente oceánico" },
      { word: "Egypt", wordEs: "Egipto", impostorClue: "North African", impostorClueEs: "Norte africano" },
      { word: "Canada", wordEs: "Canadá", impostorClue: "North American", impostorClueEs: "Norteamericano" },
      { word: "India", wordEs: "India", impostorClue: "South Asian", impostorClueEs: "Sur asiático" },
    ],
  },
  {
    name: "Food",
    words: [
      { word: "Pizza", wordEs: "Pizza", impostorClue: "Italian dish", impostorClueEs: "Plato italiano" },
      { word: "Sushi", wordEs: "Sushi", impostorClue: "Japanese cuisine", impostorClueEs: "Cocina japonesa" },
      { word: "Tacos", wordEs: "Tacos", impostorClue: "Mexican food", impostorClueEs: "Comida mexicana" },
      { word: "Burger", wordEs: "Hamburguesa", impostorClue: "Fast food", impostorClueEs: "Comida rápida" },
      { word: "Pasta", wordEs: "Pasta", impostorClue: "Italian carbs", impostorClueEs: "Carbohidratos italianos" },
      { word: "Curry", wordEs: "Curry", impostorClue: "Spiced dish", impostorClueEs: "Plato especiado" },
      { word: "Ramen", wordEs: "Ramen", impostorClue: "Noodle soup", impostorClueEs: "Sopa de fideos" },
    ],
  },
  {
    name: "Sports",
    words: [
      { word: "Soccer", wordEs: "Fútbol", impostorClue: "Team ball sport", impostorClueEs: "Deporte de pelota en equipo" },
      { word: "Basketball", wordEs: "Baloncesto", impostorClue: "Indoor court game", impostorClueEs: "Juego de cancha interior" },
      { word: "Tennis", wordEs: "Tenis", impostorClue: "Racket sport", impostorClueEs: "Deporte de raqueta" },
      { word: "Swimming", wordEs: "Natación", impostorClue: "Water activity", impostorClueEs: "Actividad acuática" },
      { word: "Boxing", wordEs: "Boxeo", impostorClue: "Combat sport", impostorClueEs: "Deporte de combate" },
      { word: "Golf", wordEs: "Golf", impostorClue: "Club and ball", impostorClueEs: "Palo y pelota" },
      { word: "Baseball", wordEs: "Béisbol", impostorClue: "Bat sport", impostorClueEs: "Deporte de bate" },
    ],
  },
  {
    name: "Professions",
    words: [
      { word: "Doctor", wordEs: "Doctor", impostorClue: "Healthcare", impostorClueEs: "Salud" },
      { word: "Teacher", wordEs: "Maestro", impostorClue: "Education", impostorClueEs: "Educación" },
      { word: "Engineer", wordEs: "Ingeniero", impostorClue: "Technical field", impostorClueEs: "Campo técnico" },
      { word: "Chef", wordEs: "Chef", impostorClue: "Culinary expert", impostorClueEs: "Experto culinario" },
      { word: "Pilot", wordEs: "Piloto", impostorClue: "Aviation", impostorClueEs: "Aviación" },
      { word: "Lawyer", wordEs: "Abogado", impostorClue: "Legal professional", impostorClueEs: "Profesional legal" },
      { word: "Artist", wordEs: "Artista", impostorClue: "Creative work", impostorClueEs: "Trabajo creativo" },
    ],
  },
  {
    name: "Colors",
    words: [
      { word: "Red", wordEs: "Rojo", impostorClue: "Primary color", impostorClueEs: "Color primario" },
      { word: "Blue", wordEs: "Azul", impostorClue: "Cool tone", impostorClueEs: "Tono frío" },
      { word: "Yellow", wordEs: "Amarillo", impostorClue: "Bright primary", impostorClueEs: "Primario brillante" },
      { word: "Green", wordEs: "Verde", impostorClue: "Nature color", impostorClueEs: "Color de naturaleza" },
      { word: "Purple", wordEs: "Morado", impostorClue: "Mixed color", impostorClueEs: "Color mezclado" },
      { word: "Orange", wordEs: "Naranja", impostorClue: "Warm secondary", impostorClueEs: "Secundario cálido" },
      { word: "Pink", wordEs: "Rosa", impostorClue: "Light shade", impostorClueEs: "Tono claro" },
    ],
  },
  {
    name: "Movie Genres",
    words: [
      { word: "Action", wordEs: "Acción", impostorClue: "Exciting films", impostorClueEs: "Películas emocionantes" },
      { word: "Comedy", wordEs: "Comedia", impostorClue: "Funny movies", impostorClueEs: "Películas graciosas" },
      { word: "Horror", wordEs: "Terror", impostorClue: "Scary films", impostorClueEs: "Películas de miedo" },
      { word: "Romance", wordEs: "Romance", impostorClue: "Love stories", impostorClueEs: "Historias de amor" },
      { word: "Thriller", wordEs: "Suspenso", impostorClue: "Suspenseful", impostorClueEs: "Suspenso" },
      { word: "Drama", wordEs: "Drama", impostorClue: "Serious films", impostorClueEs: "Películas serias" },
      { word: "Sci-Fi", wordEs: "Ciencia Ficción", impostorClue: "Future/space", impostorClueEs: "Futuro/espacio" },
    ],
  },
  {
    name: "Technology",
    words: [
      { word: "Smartphone", wordEs: "Teléfono Inteligente", impostorClue: "Mobile device", impostorClueEs: "Dispositivo móvil" },
      { word: "Laptop", wordEs: "Portátil", impostorClue: "Portable computer", impostorClueEs: "Computadora portátil" },
      { word: "Tablet", wordEs: "Tableta", impostorClue: "Touch screen", impostorClueEs: "Pantalla táctil" },
      { word: "Smartwatch", wordEs: "Reloj Inteligente", impostorClue: "Wearable tech", impostorClueEs: "Tecnología vestible" },
      { word: "Camera", wordEs: "Cámara", impostorClue: "Photo device", impostorClueEs: "Dispositivo fotográfico" },
      { word: "Headphones", wordEs: "Auriculares", impostorClue: "Audio gear", impostorClueEs: "Equipo de audio" },
      { word: "Drone", wordEs: "Dron", impostorClue: "Flying device", impostorClueEs: "Dispositivo volador" },
    ],
  },
  {
    name: "Music Genres",
    words: [
      { word: "Rock", wordEs: "Rock", impostorClue: "Guitar-heavy", impostorClueEs: "Con mucha guitarra" },
      { word: "Jazz", wordEs: "Jazz", impostorClue: "Improvised music", impostorClueEs: "Música improvisada" },
      { word: "Pop", wordEs: "Pop", impostorClue: "Mainstream hits", impostorClueEs: "Éxitos populares" },
      { word: "Classical", wordEs: "Clásica", impostorClue: "Orchestra music", impostorClueEs: "Música de orquesta" },
      { word: "Hip Hop", wordEs: "Hip Hop", impostorClue: "Rap music", impostorClueEs: "Música rap" },
      { word: "Country", wordEs: "Country", impostorClue: "American folk", impostorClueEs: "Folk americano" },
      { word: "Electronic", wordEs: "Electrónica", impostorClue: "Synthesized", impostorClueEs: "Sintetizada" },
    ],
  },
  {
    name: "Vehicles",
    words: [
      { word: "Car", wordEs: "Auto", impostorClue: "Four-wheeled", impostorClueEs: "Cuatro ruedas" },
      { word: "Bicycle", wordEs: "Bicicleta", impostorClue: "Two-wheeled pedal", impostorClueEs: "Pedal de dos ruedas" },
      { word: "Airplane", wordEs: "Avión", impostorClue: "Flying transport", impostorClueEs: "Transporte volador" },
      { word: "Boat", wordEs: "Barco", impostorClue: "Water vessel", impostorClueEs: "Embarcación acuática" },
      { word: "Train", wordEs: "Tren", impostorClue: "Rail transport", impostorClueEs: "Transporte por rieles" },
      { word: "Motorcycle", wordEs: "Motocicleta", impostorClue: "Two-wheeled motor", impostorClueEs: "Motor de dos ruedas" },
      { word: "Helicopter", wordEs: "Helicóptero", impostorClue: "Rotorcraft", impostorClueEs: "Aeronave rotatoria" },
    ],
  },
];

export function getRandomCategory(): Category {
  return categories[Math.floor(Math.random() * categories.length)];
}

export function getRandomWord(category: Category): WordData {
  return category.words[Math.floor(Math.random() * category.words.length)];
}
