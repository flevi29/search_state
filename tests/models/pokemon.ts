import type { MeiliSearch } from "meilisearch";
import { createDocuments } from "./util.ts";

const POKEMON: {
  id: number;
  name: string;
  type: string[];
  sprite: string;
}[] = [
  {
    "id": 1,
    "name": "Bulbasaur",
    "type": ["Grass", "Poison"],
    "sprite":
      "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/sprites/001.png",
  },
  {
    "id": 2,
    "name": "Ivysaur",
    "type": ["Grass", "Poison"],
    "sprite":
      "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/sprites/002.png",
  },
  {
    "id": 3,
    "name": "Venusaur",
    "type": ["Grass", "Poison"],
    "sprite":
      "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/sprites/003.png",
  },
];

export async function createPokemon(
  client: MeiliSearch,
  indexUid: string,
): Promise<AsyncDisposable> {
  return {
    [Symbol.asyncDispose]: await createDocuments(client, indexUid, POKEMON),
  };
}
