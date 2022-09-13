import { generateExports } from '@packages/generate-exports'

export class GenerateExportsPlugin {
    instance: ReturnType<typeof generateExports>

    constructor(...args: Parameters<typeof generateExports>) {
        this.instance = generateExports(...args)
    }

    apply() {
        this.instance.start()
    }
}
