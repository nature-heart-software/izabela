import { NvX, Nv0Plus, NvEnglishToChinese } from '..'
import type { Component } from 'vue'

const icons: Component[] = [NvX, Nv0Plus, NvEnglishToChinese]
const instance = null as unknown as InstanceType<typeof NvX>
const name: string | undefined = instance.$options.name
void icons
void name
// @ts-expect-error Icons are Vue components, not callable factories.
NvX()
// @ts-expect-error No fabricated catalog export.
import { NvNotAnActualIcon } from '..'
// @ts-expect-error Component exports must not degrade to any.
const invalid: number = NvX
void invalid
