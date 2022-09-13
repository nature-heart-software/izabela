export { default as structuredClone, serialize, deserialize } from '@ungap/structured-clone'
import { parse, stringify } from '@ungap/structured-clone/json'

export { stringify, parse } from '@ungap/structured-clone/json'

export const purify = (o?: any) => {
    if (typeof o === 'object') {
        return parse(stringify(o))
    }
    return o
}
