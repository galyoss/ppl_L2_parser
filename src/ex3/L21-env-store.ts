import { add, map, zipWith } from "ramda";
import { Value } from './L21-value-store';
import { Result, makeFailure, makeOk, bind, either } from "../shared/result";

// ========================================================
// Box datatype
// Encapsulate mutation in a single type.
type Box<T> = T[];
const makeBox = <T>(x: T): Box<T> => ([x]);
const unbox = <T>(b: Box<T>): T => b[0];
const setBox = <T>(b: Box<T>, v: T): void => { b[0] = v; return; }

// ========================================================
// Store datatype
export interface Store {
    tag: "Store";
    vals: Box<Box<Value>[]>;
}

export const isStore = (x: any) => x.tag === "Store";
export const makeEmptyStore = (): Store => ({tag: "Store", vals: makeBox([])}); //Verify that [] :any [] is OK
export const theStore: Store = makeEmptyStore();

//adds val to store, and returns the address of val
export const extendStoreWithGetAdress = (s :Store, val: Value) : number =>{
    const newStore = extendStore(s , val)
    return (unbox(newStore.vals).length-1)
}
export const extendStore = (s: Store, val: Value): Store => {
    var insideArr = unbox(s.vals)
    setBox(s.vals, insideArr.concat([makeBox(val)]))
    return s
}
    
export const applyStore = (store: Store, address: number): Result<Value> =>
    unbox(store.vals).length < address || address < 0? makeFailure("no such address") :
        makeOk(unbox(unbox(store.vals)[address]));

//    
export const setStore = (store: Store, address: number, val: Value): void => {
    var insideArr = unbox(store.vals)
    if (address < 0 || address > insideArr.length)
        return;
    setBox(insideArr[address], val);
}


// ========================================================
// Environment data type
// export type Env = EmptyEnv | ExtEnv;
export type Env = GlobalEnv | ExtEnv;

interface GlobalEnv {
    tag: "GlobalEnv";
    vars: Box<string[]>;
    addresses: Box<number[]>
}

export interface ExtEnv {
    tag: "ExtEnv";
    vars: string[];
    addresses: number[];
    nextEnv: Env;
}

export const makeGlobalEnv = (): GlobalEnv =>
    ({tag: "GlobalEnv", vars: makeBox([]), addresses:makeBox([])});

export const isGlobalEnv = (x: any): x is GlobalEnv => x.tag === "GlobalEnv";

// There is a single mutable value in the type Global-env
export const theGlobalEnv = makeGlobalEnv();

export const makeExtEnv = (vs: string[], addresses: number[], env: Env): ExtEnv =>
    ({tag: "ExtEnv", vars: vs, addresses: addresses, nextEnv: env});

const isExtEnv = (x: any): x is ExtEnv => x.tag === "ExtEnv";

export const isEnv = (x: any): x is Env => isGlobalEnv(x) || isExtEnv(x);

// Apply-env
export const applyEnv = (env: Env, v: string): Result<number> =>
    isGlobalEnv(env) ? applyGlobalEnv(env, v) :
    applyExtEnv(env, v);

//returns address of variable named v in the store, if v exists
const applyGlobalEnv = (env: GlobalEnv, v: string):
    Result<number> => {
    const ind:number  = unbox(env.vars).indexOf(v);
    return ind === -1 ? makeFailure(`no such variable: ${v}`) :
        makeOk(unbox(env.addresses)[ind]);
}

export const globalEnvAddBinding = (v: string, addr: number): void => {
    const newAddresses : number[] = unbox(theGlobalEnv.addresses).concat([addr])
    const newVars : string[] = unbox(theGlobalEnv.vars).concat([v])
    setBox(theGlobalEnv.vars, newVars)
    setBox(theGlobalEnv.addresses, newAddresses)
}


export const applyExtEnv = (env: ExtEnv, v: string): Result<number> =>{
    return env.vars.includes(v) ? makeOk(env.addresses[env.vars.indexOf(v)]) :
    applyEnv(env.nextEnv, v);
}
