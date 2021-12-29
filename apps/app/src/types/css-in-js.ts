import * as CSS from 'csstype'

type CSSProperties = CSS.Properties<string | number>

type CSSPseudos = { [K in CSS.Pseudos]?: CSSObject }

export interface CSSObject extends CSSProperties, CSSPseudos {
  [key: string]: CSSObject | string | number | undefined
}