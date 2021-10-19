import { createHash } from "crypto";
import { makeLegalIdentifier } from "@rollup/pluginutils";

export const getSafeId = (data, id) => {
    const hash = createHash("sha256").update([data, 'yt7RWop1a', id,].join(":")).digest("hex").slice(0, 8);
    return makeLegalIdentifier(`${id}_${hash}`);
}
