import type { BaseDocument } from "../scripts/create_documents.ts";

type Pokemon = BaseDocument & {
  name: string;
  type: string[];
  sprite: string;
};

export const POKEMON: Pokemon[] = [
  {
    id: 1,
    name: "Bulbasaur",
    type: ["Grass", "Poison"],
    sprite:
      "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/sprites/001.png",
  },
  {
    id: 2,
    name: "Ivysaur",
    type: ["Grass", "Poison"],
    sprite:
      "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/sprites/002.png",
  },
  {
    id: 3,
    name: "Venusaur",
    type: ["Grass", "Poison"],
    sprite:
      "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/sprites/003.png",
  },
];
