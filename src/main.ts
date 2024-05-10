import { Effect, pipe } from "effect";

import {
	getCharacter,
	getCharacters,
	getEpisode,
	getEpisodes,
	getLocation,
	getLocations,
	type ApiResponse,
	type Character,
	type CharacterFilter,
	type Episode,
	type EpisodeFilter,
	type Info,
	type LocationFilter,
	type Location,
} from "rickmortyapi";

export type EntityType =
	| "Character"
	| "Episode"
	| "Location"
	| "Characters"
	| "Episodes"
	| "Locations";

type Entities = Character | Episode | Location;

type EntityListGetters =
	| typeof getCharacters
	| typeof getEpisodes
	| typeof getLocations;

type EntityGetters =
	| typeof getCharacter
	| typeof getEpisode
	| typeof getLocation;

type EntityFilters = CharacterFilter | EpisodeFilter | LocationFilter;

type EntityApiResponse<T> = ApiResponse<Info<T[]>>;


function tooComplex() {
    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
            for (let z = 0; z < 10; z++) {
                if (x % 2 === 0) {
                    if (y % 2 === 0) {
                        console.log(x > y ? `${x} > ${y}` : `${y} > ${x}`);
                    }
                }
            }
        }
    }
}

tooComplex()

const getterListMap: Record<string, EntityListGetters> = {
	getCharacters: getCharacters,
	getEpisodes: getEpisodes,
	getLocations: getLocations,
};

const getterItemMap: Record<string, EntityGetters> = {
	getCharacter: getCharacter,
	getEpisode: getEpisode,
	getLocation: getLocation,
};

const entityListDispatcher = async (
	entityType: EntityType,
	filter: EntityFilters,
): Promise<EntityApiResponse<Entities>> => {
	const getter = getterListMap[`get${entityType}`];
	return await getter(filter);
};

const entityItemDispatcher = async (
	entityType: EntityType,
	ids: number[],
): Promise<
	| ApiResponse<number[] extends number ? Character : Character[]>
	| ApiResponse<number[] extends number ? Episode : Episode[]>
	| ApiResponse<number[] extends number ? Location : Location[]>
> => {
	const getter = getterItemMap[`get${entityType}`];
	return getter(ids);
};

const listResponseHandler = (response: EntityApiResponse<Entities>) => {
	if (response.status !== 200) {
		return {
			results: [],
			error: `Unknown Error: ${response.statusMessage}`,
		};
	}
	return {
		results: response.data.results,
		error: undefined,
	};
};

const getListByEffect = (entityType: EntityType) => (filter: EntityFilters) =>
	pipe(
		{ entityType, filter },
		({
			entityType,
			filter,
		}: {
			entityType: EntityType;
			filter: EntityFilters;
		}) => Effect.promise(() => entityListDispatcher(entityType, filter)),
		Effect.map(listResponseHandler),
	);

const itemResponseHandler = (
	response:
		| ApiResponse<Character[]>
		| ApiResponse<Episode[]>
		| ApiResponse<Location[]>,
) => {
	if (response.status !== 200) {
		return {
			results: [],
			error: `Unknown Error: ${response.statusMessage}`,
		};
	}
	return {
		results: Array.isArray(response.data) ? response.data : [response.data],
		error: undefined,
	};
};

const getItemByEffect = (entityType: EntityType) => (ids: number[]) =>
	pipe(
		{ entityType, ids },
		({ entityType, ids }) =>
			Effect.tryPromise(() => entityItemDispatcher(entityType, ids)),
		Effect.map(itemResponseHandler),
	);

const getCharactersEffect = getListByEffect("Characters");
const getCharacterEffect = getItemByEffect("Character");
const getEpisodeEffect = getItemByEffect("Episode");

(async () => {
	const { results: ricks, error: ricksError } = await Effect.runPromise(
		getCharactersEffect({ name: "rick" }),
	);
	const { results: mortys, error: mortsError } = await Effect.runPromise(
		getCharactersEffect({ name: "morty" }),
	);
	const { results: beths, error: bethsError } = await Effect.runPromise(
		getCharactersEffect({ name: "beth" }),
	);
	const { results: jerrys, error: jerrysError } = await Effect.runPromise(
		getCharactersEffect({ name: "jerry" }),
	);
	const { results: birds, error: birdsError } = await Effect.runPromise(
		getCharactersEffect({ name: "birdperson" }),
	);

	const characterSummary = ({ name, status, species, gender }: Character) =>
		[name, species, gender, status].join(" ");

	const getSummaries = (characters: Character[]) =>
		characters?.flatMap(characterSummary).join(" | ");

	const { results } = await Effect.runPromise(
		getCharacterEffect([1, 5, 11]),
	);
	const { results: episode } = await Effect.runPromise(
		getEpisodeEffect([1, 5, 12, 21]),
	);

	console.log("output", [
		[getSummaries(ricks as Character[]), ricksError],
		[getSummaries(mortys as Character[]), mortsError],
		[getSummaries(beths as Character[]), bethsError],
		[getSummaries(jerrys as Character[]), jerrysError],
		[getSummaries(birds as Character[]), birdsError],
		[JSON.stringify(results)],
		[JSON.stringify(episode)],
	]);
})();
