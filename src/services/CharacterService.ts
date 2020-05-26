import { JokiServiceApi, JokiEvent, JokiService } from "jokits-react";
import { Character, NonPlayerCharacterTemplate } from "../interfaces/Npc";
import { eventIs } from "../utils/jokiTools";
import { getAllCharacters } from "../firebase/apiCharacters";
import { isProcessEvent, ProcessCycleActions } from "../utils/tools/initializationProcess";
import { overlayTemplateToNpc, randomNpcGenerator } from "../generators/npcGenerators";

function CharacterService(serviceId: string, api: JokiServiceApi): JokiService<Character> {
    const items: Map<string, Character> = new Map<string, Character>();

    function eventHandler(event: JokiEvent) {
        if (event.to === serviceId) {
            switch (event.action) {
                case "set":
                    if (event.data) {
                        setItem(event.data);
                    }
                    break;
                case "create":
                    break;
                case "get":
                    if (event.data) {
                        return getItem(event.data);
                    }

                    break;
                case "del":
                    if (event.data) {
                        delItem(event.data);
                    }
                    break;
                case "load":
                    load(event.data);
                    break;
                case "createRandom":
                    createRandomCharacter(event.data ? (event.data as NonPlayerCharacterTemplate) : undefined);
                    break;
                default:
                    break;
            }
        }

        const actions = isProcessEvent(event);
        if (actions) {
            switch (actions[0]) {
                case "ServiceInitializationProcess":
                    init(actions[1]);
                    break;
                default:
                    break;
            }
        }
        // if (eventIs(event, { from: "JOKI.STATEENGINE", action: "StateChanged", data: "init" })) {
        //     console.log("Initialize Character Service");
        //     init();
        // }
    }

    async function init(processActions: ProcessCycleActions) {
        processActions.begin(serviceId);
        await load();
        processActions.done(serviceId);
    }

    function getItem(key: string | string[]): Character | Character[] | undefined {
        if (!Array.isArray(key)) {
            return items.get(key);
        }

        return Array.from(items.values()).filter((i: Character) => {
            return key.includes(i.id);
        });
    }

    function createRandomCharacter(template?: NonPlayerCharacterTemplate) {
        if (template) {
            const char = overlayTemplateToNpc(randomNpcGenerator(), template);
            items.set(char.id, char);
        } else {
            const char: Character = randomNpcGenerator();
            items.set(char.id, char);
        }

        api.updated(parsedItems());
    }

    function setItem(item: Character): void {
        items.set(item.id, item);
        api.updated(parsedItems());
    }

    function delItem(itemId: string): void {
        if (items.has(itemId)) {
            items.delete(itemId);
            api.updated(parsedItems());
        }
    }

    function parsedItems() {
        return Array.from(items.values());
    }

    async function load(itemId?: string) {
        const characters = await getAllCharacters();

        characters.forEach((s: Character) => {
            items.set(s.id, s);
        });
        api.updated(items);
        return;
    }

    function getState(): Character[] {
        return parsedItems();
    }

    return {
        eventHandler,
        getState,
    };
}

export default CharacterService;