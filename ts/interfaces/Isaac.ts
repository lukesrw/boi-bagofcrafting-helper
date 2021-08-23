export interface ItemComponents {
    [component: string]: number;
}

export interface PossibleCraft {
    id?: number;
    discards?: string[];
    items?: ItemComponents;
}

export interface Item {
    name: string;
    quantity: number;
    components: ItemComponents[];
}

export interface Slot {
    x: number;
    y: number;
    item: string | null;
}
