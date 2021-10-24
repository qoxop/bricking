import { createHash } from "crypto";
import { makeLegalIdentifier } from "@rollup/pluginutils";

export const getHash = (data: any, ...other:any[]) => createHash("sha256").update([data, 'yt7RWop1a',...other].join(":")).digest("hex").slice(0, 8);

export const getSafeId = (data: any, id: string) => makeLegalIdentifier(`${id}_${getHash(data, id)}`);