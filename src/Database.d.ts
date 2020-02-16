export interface FairyGroup
{
    readonly lrid: number;
    readonly fairies: number[];
}

export interface RankedSpellCost
{
    readonly attack: number;
    readonly support: number;
}

export interface Fairy
{
    readonly name: string;
    readonly type: number;
}

export interface Spell
{
    readonly name: string;
    readonly isSupport: boolean;
    readonly reqs: number[];
}

export interface Database
{
    readonly fairyGroups: FairyGroup[];
    readonly rankedSpellCosts: RankedSpellCost[];
    readonly fairies: Fairy[];
    readonly spells: Spell[];
}
