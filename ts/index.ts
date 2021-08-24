import { read } from "jimp";
import { join } from "path";
import * as takeScreenshot from "screenshot-desktop";
import { Item, PossibleCraft, Slot } from "./interfaces/Isaac";

const PIXEL_TO_ITEM = require(join(__dirname, "..", "components.json"));
let items_wanted: Item[] = [];
try {
    items_wanted = require(join(__dirname, "..", "items.json"));
} catch (_1) {}

const PIXEL_SIZE = 4;

let offset: number;
let slots: Slot[] = [];
let arrow: {
    x: number;
    y: number;
};

async function getScreenshot() {
    let screenshot = await takeScreenshot({ format: "png" });

    return await read(screenshot);
}

async function getComponents() {
    let screenshot = await getScreenshot();
    let arrow_pixel = screenshot.getPixelColor(
        slots[slots.length - 1].x + 8 * PIXEL_SIZE,
        slots[slots.length - 1].y - 6 * PIXEL_SIZE
    );

    if ([4294967295, 2694881535].includes(arrow_pixel) || findArrow(screenshot, arrow.x, arrow.y)) {
        slots = slots.map(slot => {
            let p1 = String(screenshot.getPixelColor(slot.x, slot.y));
            let p2 = String(screenshot.getPixelColor(slot.x - 1, slot.y - 1));
            let p3 = String(screenshot.getPixelColor(slot.x + PIXEL_SIZE * 2, slot.y - 9));
            let p4 = String(screenshot.getPixelColor(slot.x + PIXEL_SIZE * 2, slot.y));

            if (p1 + p2 + p3 + p4 in PIXEL_TO_ITEM) {
                slot.item = PIXEL_TO_ITEM[p1 + p2 + p3 + p4];
            } else if (p1 + p2 + p3 in PIXEL_TO_ITEM) {
                slot.item = PIXEL_TO_ITEM[p1 + p2 + p3];
            } else if (p1 + p2 in PIXEL_TO_ITEM) {
                slot.item = PIXEL_TO_ITEM[p1 + p2];
            } else if (p1 in PIXEL_TO_ITEM) {
                slot.item = PIXEL_TO_ITEM[p1];
            } else if (items_wanted.length) {
                slot.item = null;
            } else {
                slot.item = `${p1} ${p2} ${p3} ${p4}`;
            }

            return slot;
        });
    }

    return slots.filter(slot => slot.item).map(slot => slot.item);
}

function pixelDiff(image: any, x1: number, y1: number, x2: number, y2: number) {
    let pixel1 = image.getPixelColor(x1, y1);
    let pixel2 = image.getPixelColor(x1 + x2, y1 + y2);

    return Math.abs(pixel1 - pixel2) > 2141771264;
}

function findArrow(screenshot: any, x: number, y: number) {
    return (
        [
            // left top left
            [x + PIXEL_SIZE * 4, y + PIXEL_SIZE, -1, 0],
            [x + PIXEL_SIZE * 4, y + PIXEL_SIZE, 0, -1],
            // left top right
            [x + PIXEL_SIZE * 5 - 1, y + PIXEL_SIZE, 1, 0],
            [x + PIXEL_SIZE * 5 - 1, y + PIXEL_SIZE, 0, -1],
            // middle top left
            [x + PIXEL_SIZE * 5, y + PIXEL_SIZE * 2 - 1, -1, 0],
            [x + PIXEL_SIZE * 5, y + PIXEL_SIZE * 2 - 1, 0, 1],
            // middle top right
            [x + PIXEL_SIZE * 6 - 1, y + PIXEL_SIZE * 2, 1, 0],
            [x + PIXEL_SIZE * 6 - 1, y + PIXEL_SIZE * 2, 0, -1],
            // right top left
            [x + PIXEL_SIZE * 6, y + PIXEL_SIZE * 3 - 1, -1, 0],
            [x + PIXEL_SIZE * 6, y + PIXEL_SIZE * 3 - 1, 0, 1],
            // right top right
            [x + PIXEL_SIZE * 7 - 1, y + PIXEL_SIZE * 3, 1, 0],
            [x + PIXEL_SIZE * 7 - 1, y + PIXEL_SIZE * 3, 1, -1],
            // right bottom right
            [x + PIXEL_SIZE * 7 - 1, y + PIXEL_SIZE * 5 - 1, 1, 0],
            [x + PIXEL_SIZE * 7 - 1, y + PIXEL_SIZE * 5 - 1, 0, 1],
            // right bottom left
            [x + PIXEL_SIZE * 6, y + PIXEL_SIZE * 5, -1, 0],
            [x + PIXEL_SIZE * 6, y + PIXEL_SIZE * 5, 0, -1],
            // middle bottom right
            [x + PIXEL_SIZE * 6 - 1, y + PIXEL_SIZE * 6 - 1, 1, 0],
            [x + PIXEL_SIZE * 6 - 1, y + PIXEL_SIZE * 6 - 1, 0, 1],
            // middle bottom left
            [x + PIXEL_SIZE * 5, y + PIXEL_SIZE * 6, -1, 0],
            [x + PIXEL_SIZE * 5, y + PIXEL_SIZE * 6, 0, -1],
            // left bottom right
            [x + PIXEL_SIZE * 5 - 1, y + PIXEL_SIZE * 7 - 1, 1, 0],
            [x + PIXEL_SIZE * 5 - 1, y + PIXEL_SIZE * 7 - 1, 0, 1],
            // left bottom left
            [x + PIXEL_SIZE * 4, y + PIXEL_SIZE * 7 - 1, -1, 0],
            [x + PIXEL_SIZE * 4, y + PIXEL_SIZE * 7 - 1, 0, 1]
        ] as [number, number, number, number][]
    ).every(set => pixelDiff(screenshot, ...set));
}

async function findIsaac() {
    console.log("Finding of Isaac");

    let screenshot = await getScreenshot();
    let is_started = false;

    /**
     * find the arrow
     */
    for (let y = 0; y < screenshot.getHeight(); y += 1) {
        for (let x = 0; x < screenshot.getWidth(); x += 1) {
            if (findArrow(screenshot, x, y)) {
                is_started = true;
                arrow = { x, y };
                offset = 48;

                for (let y = 0; y < 2; y += 1) {
                    for (let x = 0; x < 4; x += 1) {
                        slots.push({
                            x: arrow.x - PIXEL_SIZE * 43 + x * offset,
                            y: arrow.y - PIXEL_SIZE * 3 + y * offset,
                            item: null
                        });
                    }
                }

                setInterval(async () => {
                    let components = await getComponents();

                    console.clear();

                    if (items_wanted.length) {
                        items_wanted.forEach((item, item_i) => {
                            if (item.quantity) {
                                let fewest_discards: PossibleCraft = {};
                                let fewest_items: PossibleCraft = {};
                                let already_output = false;

                                console.log(item.name + "\n");

                                item.components.forEach((items, item_i) => {
                                    let discards = JSON.parse(JSON.stringify(components));
                                    items = JSON.parse(JSON.stringify(items));

                                    discards = discards.filter((component: string) => {
                                        if (component in items) {
                                            items[component] -= 1;
                                            if (items[component] === 0) {
                                                delete items[component];
                                            }

                                            return false;
                                        }

                                        return true;
                                    });
                                    if (!fewest_discards.discards || discards.length < fewest_discards.discards) {
                                        fewest_discards = { discards, items, id: item_i };
                                    }
                                    if (
                                        !fewest_items.items ||
                                        Object.keys(items).length < Object.keys(fewest_items).length
                                    ) {
                                        fewest_items = { discards, items, id: item_i };
                                    }
                                });

                                if (fewest_items.items) {
                                    if (Object.keys(fewest_items.items).length === 0) {
                                        items_wanted[item_i].quantity -= 1;
                                    }

                                    console.log(fewest_items.discards);
                                    console.table(fewest_items.items);

                                    if (fewest_discards.id === fewest_items.id) {
                                        already_output = true;
                                    }
                                }

                                if (!already_output && fewest_discards.discards) {
                                    console.log(fewest_discards.discards);
                                    console.table(fewest_discards.items);
                                }

                                console.log("\n", "--- --- ---", "\n");
                            }
                        });
                    } else {
                        components.forEach((component, component_i) => {
                            console.log(`${component_i + 1}. ${component || "Empty"}`);
                        });
                    }
                }, 1000);
                break;
            }
        }
    }

    if (!is_started) console.log("Missing of Isaac");
}

setTimeout(findIsaac, 3000);

console.clear();
console.log("Opening of Isaac");
