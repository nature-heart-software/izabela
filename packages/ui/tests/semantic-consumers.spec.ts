import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Evaluate the actual static recipe inputs independently of generated helpers.
// State/property coordinates are retained so equal-valued roles cannot substitute.
function recipes(relative: string) {
  const url = new URL(`../src/${relative}`, import.meta.url)
  if (!existsSync(url)) return {}
  const source = readFileSync(url, 'utf8')
  const ast = ts.createSourceFile(
    relative,
    source,
    ts.ScriptTarget.Latest,
    true,
  )
  const result: Record<string, any> = {}
  function visit(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ['cva', 'sva'].includes(node.initializer.expression.getText(ast))
    ) {
      result[node.name.getText(ast)] = runInNewContext(
        `(${node.initializer.arguments[0].getText(ast)})`,
      )
    }
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText(ast) === 'pandaComponent'
    ) {
      const recipe = node.initializer.arguments[2]
      if (
        recipe &&
        ts.isCallExpression(recipe) &&
        ['cva', 'sva'].includes(recipe.expression.getText(ast))
      )
        result[node.name.getText(ast)] = runInNewContext(
          `(${recipe.arguments[0].getText(ast)})`,
        )
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return result
}
function at(value: any, path: string[]) {
  return path.reduce((current, key) => current?.[key], value)
}
const contracts: Record<
  string,
  { file: string; values: [string[], string][] }
> = {
  FormItem: {
    file: 'components/forms/Form/form-item.panda.ts',
    values: [
      [['formItem', 'base', '& label', 'color'], 'form-item.default.text'],
    ],
  },

  GlobalStyles: {
    file: 'main.ts',
    values: [
      [['globalRecipe', 'base', 'color'], 'text.body.foreground'],
      [
        [
          'globalRecipe',
          'base',
          '& *::-webkit-scrollbar-thumb',
          'backgroundColor',
        ],
        'button.plain.background',
      ],
      [
        [
          'globalRecipe',
          'base',
          '& *::-webkit-scrollbar-thumb:hover',
          'backgroundColor',
        ],
        'button.plain.hover.background',
      ],
      [
        [
          'globalRecipe',
          'base',
          '& *::-webkit-scrollbar-thumb:active',
          'backgroundColor',
        ],
        'button.plain.pressed.background',
      ],
      [
        ['globalRecipe', 'base', '& #vjt-tooltip', 'backgroundColor'],
        'tooltip.default.background',
      ],
      [
        ['globalRecipe', 'base', '& #vjt-tooltip', 'color'],
        'tooltip.default.text',
      ],
      [
        ['globalRecipe', 'base', '& #vjt-tooltip', 'boxShadow'],
        'tooltip.default.shadow',
      ],
      [
        ['globalRecipe', 'base', '& #vjt-arrow::before', 'backgroundColor'],
        'tooltip.default.background',
      ],
      [
        ['globalRecipe', 'base', '& #vjt-arrow::before', 'boxShadow'],
        'tooltip.default.shadow',
      ],
    ],
  },

  Table: {
    file: 'components/display/Table/table.panda.ts',
    values: [
      [['table', 'base', 'color'], 'table.default.foreground'],
      [['table', 'base', 'backgroundColor'], 'table.default.background'],
      [
        ['table', 'base', '& tbody tr', 'backgroundColor'],
        'table.default.rowBackground',
      ],
      [
        ['table', 'base', '& th', 'backgroundColor'],
        'table.default.headerBackground',
      ],
      [['table', 'base', '& th', 'color'], 'table.default.headerForeground'],
      [['table', 'base', '& th, & td', 'borderBottomWidth'], 'default'],
      [['table', 'base', '& th, & td', 'borderBottomStyle'], 'solid'],
      [
        ['table', 'base', '& :where(th, td)', 'borderColor'],
        'table.default.border',
      ],
      [
        ['tableCell', 'base', 'backgroundColor'],
        'tableColumn.default.background',
      ],
      [['tableCell', 'base', 'color'], 'tableColumn.default.foreground'],
      [
        ['tableCell', 'base', '&:is(th, td)', 'borderColor'],
        'tableColumn.default.border',
      ],
      [
        ['tableCell', 'base', '&:is(th)', 'backgroundColor'],
        'tableColumn.default.headerBackground',
      ],
      [
        ['tableCell', 'base', '&:is(th)', 'color'],
        'tableColumn.default.headerForeground',
      ],
      [
        ['tableCell', 'variants', 'fixed', 'left', 'backgroundColor'],
        'table.frozen.background',
      ],
      [
        ['tableCell', 'variants', 'fixed', 'left', 'color'],
        'table.frozen.foreground',
      ],
      [
        [
          'tableCell',
          'variants',
          'fixed',
          'left',
          '&:is(th, td)',
          'borderColor',
        ],
        'table.frozen.border',
      ],
      [
        ['tableCell', 'variants', 'fixed', 'left', 'boxShadow'],
        'table.frozen.shadow',
      ],
      [
        ['tableCell', 'variants', 'fixed', 'right', 'backgroundColor'],
        'table.frozen.background',
      ],
      [
        ['tableCell', 'variants', 'fixed', 'right', 'color'],
        'table.frozen.foreground',
      ],
      [
        [
          'tableCell',
          'variants',
          'fixed',
          'right',
          '&:is(th, td)',
          'borderColor',
        ],
        'table.frozen.border',
      ],
      [
        ['tableCell', 'variants', 'fixed', 'right', 'boxShadow'],
        'table.frozen.shadow',
      ],
      [
        ['table', 'base', '& [data-empty]', 'backgroundColor'],
        'table.empty.background',
      ],
      [['table', 'base', '& [data-empty]', 'color'], 'table.empty.foreground'],
      [
        ['table', 'base', '& [data-empty]', 'borderColor'],
        'table.empty.border',
      ],
    ],
  },

  Popover: {
    file: 'components/overlay/Popover/popover.panda.ts',
    values: [
      [
        [
          'StPopoverContent',
          'variants',
          'size',
          'sm',
          '& > [data-nv-popover-surface]',
          'backgroundColor',
        ],
        'popover.sm.background',
      ],
      [
        [
          'StPopoverContent',
          'variants',
          'size',
          'sm',
          '& > [data-nv-popover-surface]',
          'boxShadow',
        ],
        'popover.sm.shadow',
      ],
      [
        [
          'StPopoverContent',
          'variants',
          'size',
          'md',
          '& > [data-nv-popover-surface]',
          'backgroundColor',
        ],
        'popover.md.background',
      ],
      [
        [
          'StPopoverContent',
          'variants',
          'size',
          'md',
          '& > [data-nv-popover-surface]',
          'boxShadow',
        ],
        'popover.md.shadow',
      ],
      [
        [
          'StPopoverContent',
          'variants',
          'size',
          'lg',
          '& > [data-nv-popover-surface]',
          'backgroundColor',
        ],
        'popover.lg.background',
      ],
      [
        [
          'StPopoverContent',
          'variants',
          'size',
          'lg',
          '& > [data-nv-popover-surface]',
          'boxShadow',
        ],
        'popover.lg.shadow',
      ],
    ],
  },

  Dialog: {
    file: 'components/overlay/Dialog/dialog.panda.ts',
    values: [
      [
        ['StDialogBackdrop', 'base', 'backgroundColor'],
        'dialog.default.backdrop',
      ],
      [
        ['StDialogContent', 'base', '& > *', 'backgroundColor'],
        'dialog.default.background',
      ],
      [
        ['StDialogContent', 'base', '& > *', 'boxShadow'],
        'dialog.default.shadow',
      ],
      [
        ['StDialogContent', 'base', '& [data-part="title"]', 'color'],
        'dialog.default.title',
      ],
      [
        ['StDialogContent', 'base', '& [data-part="description"] > *', 'color'],
        'dialog.default.description',
      ],
      [
        ['StDialogContent', 'base', '& [data-part="close-trigger"]', 'color'],
        'dialog.close.icon',
      ],
      [
        [
          'StDialogContent',
          'base',
          '& [data-part="close-trigger"]',
          'backgroundColor',
        ],
        'dialog.close.background',
      ],
      [
        [
          'StDialogContent',
          'base',
          '& [data-part="close-trigger"]',
          'borderColor',
        ],
        'dialog.close.border',
      ],
      [
        [
          'StDialogContent',
          'base',
          '& [data-part="close-trigger"]',
          '&:hover',
          'color',
        ],
        'dialog.close.hover.icon',
      ],
      [
        [
          'StDialogContent',
          'base',
          '& [data-part="close-trigger"]',
          '&:hover',
          'backgroundColor',
        ],
        'dialog.close.hover.background',
      ],
      [
        [
          'StDialogContent',
          'base',
          '& [data-part="close-trigger"]',
          '&:hover',
          'borderColor',
        ],
        'dialog.close.hover.border',
      ],
      [
        [
          'StDialogContent',
          'base',
          '& [data-part="close-trigger"]',
          '&:active',
          'color',
        ],
        'dialog.close.active.icon',
      ],
      [
        [
          'StDialogContent',
          'base',
          '& [data-part="close-trigger"]',
          '&:active',
          'backgroundColor',
        ],
        'dialog.close.active.background',
      ],
      [
        [
          'StDialogContent',
          'base',
          '& [data-part="close-trigger"]',
          '&:active',
          'borderColor',
        ],
        'dialog.close.active.border',
      ],
      [
        [
          'StDialogContent',
          'base',
          '& [data-part="close-trigger"]',
          '&:focus',
          'boxShadow',
        ],
        '0 0 0 0.25rem {colors.dialog.close.focus.ring}',
      ],
    ],
  },

  ContextMenu: {
    file: 'components/overlay/ContextMenu/context-menu.panda.ts',
    values: [
      [
        ['StContextMenuContent', 'base', 'backgroundColor'],
        'contextMenu.default.background',
      ],
      [
        ['StContextMenuContent', 'base', 'borderColor'],
        'contextMenu.default.border',
      ],
      [
        ['StContextMenuContent', 'base', 'boxShadow'],
        'contextMenu.default.shadow',
      ],
      [
        ['StContextMenuContent', 'base', '& [data-part="item"]', 'color'],
        'contextMenu.item.text',
      ],
      [
        [
          'StContextMenuContent',
          'base',
          '& [data-part="item"]',
          '& svg',
          'color',
        ],
        'contextMenu.item.icon',
      ],
      [
        ['StContextMenuContent', 'base', '& [data-highlighted]', 'color'],
        'contextMenu.item.hover.text',
      ],
      [
        [
          'StContextMenuContent',
          'base',
          '& [data-highlighted]',
          '& svg',
          'color',
        ],
        'contextMenu.item.hover.icon',
      ],
      [
        [
          'StContextMenuContent',
          'base',
          '& [data-part="item"][data-disabled]',
          'color',
        ],
        'contextMenu.item.disabled.text',
      ],
      [
        [
          'StContextMenuContent',
          'base',
          '& [data-part="item"][data-disabled]',
          '& svg',
          'color',
        ],
        'contextMenu.item.disabled.icon',
      ],
      [
        [
          'StContextMenuContent',
          'base',
          '& [data-highlighted]',
          'backgroundColor',
        ],
        'contextMenu.item.hover.background',
      ],
      [
        [
          'StContextMenuContent',
          'base',
          '& [data-part="separator"]',
          'borderColor',
        ],
        'contextMenu.divider.border',
      ],
    ],
  },

  Tag: {
    file: 'components/forms/Tag/tag.panda.ts',
    values: [
      [
        ['tagRecipe', 'base', 'root', 'backgroundColor'],
        'tag.default.background',
      ],
      [['tagRecipe', 'base', 'root', 'borderColor'], 'tag.default.border'],
      [['tagRecipe', 'base', 'icon', '& button', 'color'], 'tag.close.icon'],
      [
        ['tagRecipe', 'base', 'icon', '& button', 'backgroundColor'],
        'tag.close.background',
      ],
      [
        ['tagRecipe', 'base', 'icon', '& button', 'borderColor'],
        'tag.close.border',
      ],
      [
        ['tagRecipe', 'base', 'icon', '& button', '&:hover', 'color'],
        'tag.close.hover.icon',
      ],
      [
        ['tagRecipe', 'base', 'icon', '& button', '&:hover', 'backgroundColor'],
        'tag.close.hover.background',
      ],
      [
        ['tagRecipe', 'base', 'icon', '& button', '&:hover', 'borderColor'],
        'tag.close.hover.border',
      ],
      [
        ['tagRecipe', 'base', 'icon', '& button', '&:active', 'color'],
        'tag.close.pressed.icon',
      ],
      [
        [
          'tagRecipe',
          'base',
          'icon',
          '& button',
          '&:active',
          'backgroundColor',
        ],
        'tag.close.pressed.background',
      ],
      [
        ['tagRecipe', 'base', 'icon', '& button', '&:active', 'borderColor'],
        'tag.close.pressed.border',
      ],
      [
        ['tagRecipe', 'base', 'icon', '& button', '&:focus', 'color'],
        'tag.close.focus.icon',
      ],
      [
        ['tagRecipe', 'base', 'icon', '& button', '&:focus', 'backgroundColor'],
        'tag.close.focus.background',
      ],
      [
        ['tagRecipe', 'base', 'icon', '& button', '&:focus', 'borderColor'],
        'tag.close.focus.border',
      ],
      [
        ['tagRecipe', 'base', 'icon', '& button', '&:focus', 'boxShadow'],
        '0 0 0 0.25rem {colors.tag.close.focus.focus-ring}',
      ],
    ],
  },

  Loading: {
    file: 'loading.ts',
    values: [
      [
        ['maskRecipe', 'base', 'backgroundColor'],
        'loading.default.pending.background',
      ],
      [['maskRecipe', 'base', 'color'], 'loading.default.pending.foreground'],
    ],
  },

  LoadingSpinner: {
    file: 'utils/loading-spinner.ts',
    values: [
      [['loadingSpinner', 'base', 'color'], 'loading.default.pending.spinner'],
    ],
  },

  SelectGroupLabel: {
    file: 'components/forms/Select/select.panda.ts',
    values: [
      [['groupLabel', 'base', 'color'], 'option.default.readonly.text'],
      [
        ['groupLabel', 'base', '_before', 'backgroundColor'],
        'option.default.readonly.separator',
      ],
      [
        ['groupLabel', 'base', '& > span', 'backgroundColor'],
        'option.default.readonly.label-mask-background',
      ],
    ],
  },

  Tooltip: {
    file: 'components/overlay/Tooltip/tooltip.panda.ts',
    values: [
      [['StTooltipContent', 'base', 'borderColor'], 'tooltip.default.border'],
      [
        ['StTooltipContent', 'base', 'backgroundColor'],
        'tooltip.default.background',
      ],
      [['StTooltipContent', 'base', 'boxShadow'], 'tooltip.default.shadow'],
      [['StTooltipContent', 'base', 'color'], 'tooltip.default.text'],
      [['StTooltipContent', 'base', '& svg', 'color'], 'tooltip.default.icon'],
    ],
  },

  Autocomplete: {
    file: 'components/forms/Autocomplete/autocomplete.panda.ts',
    values: [
      [['autocomplete', 'base', 'borderColor'], 'autocomplete.default.border'],
      [
        ['autocomplete', 'base', 'backgroundColor'],
        'autocomplete.default.background',
      ],
      [
        ['autocomplete', 'base', 'boxShadow'],
        'autocomplete.default.shadow-color',
      ],
    ],
  },

  AccessBlocker: {
    file: 'components/feedback/AccessBlocker/access-blocker.panda.ts',
    values: [
      [
        ['accessBlockerReason', 'base', 'backgroundColor'],
        'accessBlocker.default.denied.background',
      ],
    ],
  },

  Alert: {
    file: 'components/feedback/Alert/alert.panda.ts',
    values: [
      [
        ['alert', 'variants', 'type', 'info', 'backgroundColor'],
        'alert.info.background',
      ],
      [['alert', 'variants', 'type', 'info', 'color'], 'alert.info.foreground'],
      [
        ['alert', 'variants', 'type', 'info', '& a::before', 'backgroundColor'],
        'alert.info.linkUnderline',
      ],
      [
        ['alert', 'variants', 'type', 'success', 'backgroundColor'],
        'alert.success.background',
      ],
      [
        ['alert', 'variants', 'type', 'success', 'color'],
        'alert.success.foreground',
      ],
      [
        [
          'alert',
          'variants',
          'type',
          'success',
          '& a::before',
          'backgroundColor',
        ],
        'alert.success.linkUnderline',
      ],
      [
        ['alert', 'variants', 'type', 'warning', 'backgroundColor'],
        'alert.warning.background',
      ],
      [
        ['alert', 'variants', 'type', 'warning', 'color'],
        'alert.warning.foreground',
      ],
      [
        [
          'alert',
          'variants',
          'type',
          'warning',
          '& a::before',
          'backgroundColor',
        ],
        'alert.warning.linkUnderline',
      ],
      [
        ['alert', 'variants', 'type', 'error', 'backgroundColor'],
        'alert.error.background',
      ],
      [
        ['alert', 'variants', 'type', 'error', 'color'],
        'alert.error.foreground',
      ],
      [
        [
          'alert',
          'variants',
          'type',
          'error',
          '& a::before',
          'backgroundColor',
        ],
        'alert.error.linkUnderline',
      ],
    ],
  },

  Divider: {
    file: 'components/miscellaneous/Divider/divider.panda.ts',
    values: [
      [
        ['divider', 'variants', 'direction', 'vertical', 'borderColor'],
        'divider.vertical.border',
      ],
      [
        ['divider', 'variants', 'direction', 'horizontal', 'borderColor'],
        'divider.horizontal.border',
      ],
    ],
  },

  Text: {
    file: 'components/typography/Text/text.panda.ts',
    values: [
      [
        ['text', 'variants', 'type', 'caption', 'color'],
        'text.caption.foreground',
      ],
      [
        [
          'text',
          'variants',
          'type',
          'caption',
          '& :where(a)::before',
          'backgroundColor',
        ],
        'text.caption.linkUnderline',
      ],
      [['text', 'variants', 'type', 'label', 'color'], 'text.label.foreground'],
      [
        [
          'text',
          'variants',
          'type',
          'label',
          '& :where(a)::before',
          'backgroundColor',
        ],
        'text.label.linkUnderline',
      ],
      [
        ['text', 'variants', 'type', 'body-small', 'color'],
        'text.body-small.foreground',
      ],
      [
        [
          'text',
          'variants',
          'type',
          'body-small',
          '& :where(a)::before',
          'backgroundColor',
        ],
        'text.body-small.linkUnderline',
      ],
      [['text', 'variants', 'type', 'body', 'color'], 'text.body.foreground'],
      [
        [
          'text',
          'variants',
          'type',
          'body',
          '& :where(a)::before',
          'backgroundColor',
        ],
        'text.body.linkUnderline',
      ],
      [
        ['text', 'variants', 'type', 'subtitle', 'color'],
        'text.subtitle.foreground',
      ],
      [
        [
          'text',
          'variants',
          'type',
          'subtitle',
          '& :where(a)::before',
          'backgroundColor',
        ],
        'text.subtitle.linkUnderline',
      ],
      [['text', 'variants', 'type', 'title', 'color'], 'text.title.foreground'],
      [
        [
          'text',
          'variants',
          'type',
          'title',
          '& :where(a)::before',
          'backgroundColor',
        ],
        'text.title.linkUnderline',
      ],
      [['text', 'base', 'color'], 'text.body.foreground'],
      [
        ['text', 'base', '& :where(a)::before', 'backgroundColor'],
        'text.body.linkUnderline',
      ],
    ],
  },

  Card: {
    file: 'components/display/Card/card.panda.ts',
    values: [
      [['card', 'base', 'backgroundColor'], 'card.default.background'],
      [['card', 'base', 'boxShadow'], 'card.default.shadow'],
      [
        ['card', 'variants', 'variant', 'transparent', 'backgroundColor'],
        'card.transparent.background',
      ],
      [
        ['card', 'variants', 'variant', 'transparent', 'boxShadow'],
        'card.transparent.shadow',
      ],
    ],
  },

  RangeInput: {
    file: 'components/forms/RangeInput/range-input.panda.ts',
    values: [
      [
        [
          'rangeInputRecipe',
          'base',
          '&::-webkit-slider-runnable-track',
          'backgroundColor',
        ],
        'range-input.default.track-background',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&::-webkit-slider-thumb',
          'backgroundColor',
        ],
        'range-input.default.thumb-background',
      ],
      [
        ['rangeInputRecipe', 'base', '&::-webkit-slider-thumb', 'borderColor'],
        'range-input.default.thumb-border',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:hover::-webkit-slider-runnable-track',
          'backgroundColor',
        ],
        'range-input.default.hover.track-background',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:hover::-webkit-slider-thumb',
          'backgroundColor',
        ],
        'range-input.default.hover.thumb-background',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:hover::-webkit-slider-thumb',
          'borderColor',
        ],
        'range-input.default.hover.thumb-border',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:active::-webkit-slider-runnable-track',
          'backgroundColor',
        ],
        'range-input.default.pressed.track-background',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:active::-webkit-slider-thumb',
          'backgroundColor',
        ],
        'range-input.default.pressed.thumb-background',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:active::-webkit-slider-thumb',
          'borderColor',
        ],
        'range-input.default.pressed.thumb-border',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:focus::-webkit-slider-runnable-track',
          'backgroundColor',
        ],
        'range-input.default.focus.track-background',
      ],
      [
        ['rangeInputRecipe', 'base', '&:focus::-webkit-slider-thumb', 'border'],
        '1px solid {colors.range-input.default.focus.thumb-border}',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:focus::-webkit-slider-thumb',
          'boxShadow',
        ],
        '0 0 0 0.25rem {colors.range-input.default.thumb-focus.focus-ring}',
      ],
      [
        ['rangeInputRecipe', 'base', '&::-moz-range-track', 'backgroundColor'],
        'range-input.default.track-background',
      ],
      [
        ['rangeInputRecipe', 'base', '&::-moz-range-thumb', 'backgroundColor'],
        'range-input.default.thumb-background',
      ],
      [
        ['rangeInputRecipe', 'base', '&::-moz-range-thumb', 'borderColor'],
        'range-input.default.thumb-border',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:hover::-moz-range-track',
          'backgroundColor',
        ],
        'range-input.default.hover.track-background',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:hover::-moz-range-thumb',
          'backgroundColor',
        ],
        'range-input.default.hover.thumb-background',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:hover::-moz-range-thumb',
          'borderColor',
        ],
        'range-input.default.hover.thumb-border',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:active::-moz-range-track',
          'backgroundColor',
        ],
        'range-input.default.pressed.track-background',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:active::-moz-range-thumb',
          'backgroundColor',
        ],
        'range-input.default.pressed.thumb-background',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:active::-moz-range-thumb',
          'borderColor',
        ],
        'range-input.default.pressed.thumb-border',
      ],
      [
        [
          'rangeInputRecipe',
          'base',
          '&:focus::-moz-range-track',
          'backgroundColor',
        ],
        'range-input.default.focus.track-background',
      ],
      [
        ['rangeInputRecipe', 'base', '&:focus::-moz-range-thumb', 'border'],
        '1px solid {colors.range-input.default.focus.thumb-border}',
      ],
      [
        ['rangeInputRecipe', 'base', '&:focus::-moz-range-thumb', 'boxShadow'],
        '0 0 0 0.25rem {colors.range-input.default.thumb-focus.focus-ring}',
      ],
    ],
  },

  Switch: {
    file: 'components/forms/Switch/switch.panda.ts',
    values: [
      [
        ['switchRecipe', 'base', 'control', 'backgroundColor'],
        'switch.off.background',
      ],
      [
        ['switchRecipe', 'base', 'control', '&::after', 'border'],
        '1px solid {colors.switch.off.border}',
      ],
      [
        ['switchRecipe', 'base', 'thumb', 'backgroundColor'],
        'switch.off.thumb-background',
      ],
      [
        ['switchRecipe', 'base', 'control', '&[data-hover]', 'backgroundColor'],
        'switch.off.hover.background',
      ],
      [
        [
          'switchRecipe',
          'base',
          'control',
          '&[data-hover]::after',
          'borderColor',
        ],
        'switch.off.hover.border',
      ],
      [
        ['switchRecipe', 'base', 'thumb', '&[data-hover]', 'backgroundColor'],
        'switch.off.hover.thumb-background',
      ],
      [
        ['switchRecipe', 'base', 'control', '&[data-focus]', 'backgroundColor'],
        'switch.off.focus.background',
      ],
      [
        [
          'switchRecipe',
          'base',
          'control',
          '&[data-focus]::after',
          'borderColor',
        ],
        'switch.off.focus.border',
      ],
      [
        ['switchRecipe', 'base', 'thumb', '&[data-focus]', 'backgroundColor'],
        'switch.off.focus.thumb-background',
      ],
      [
        ['switchRecipe', 'base', 'control', '&[data-focus]', 'boxShadow'],
        '0 0 0 0.25rem {colors.switch.off.focus.focus-ring}',
      ],
      [
        [
          'switchRecipe',
          'base',
          'control',
          '&[data-state="checked"]',
          'backgroundColor',
        ],
        'switch.on.background',
      ],
      [
        [
          'switchRecipe',
          'base',
          'control',
          '&[data-state="checked"]',
          '&::after',
          'border',
        ],
        '1px solid {colors.switch.on.border}',
      ],
      [
        [
          'switchRecipe',
          'base',
          'thumb',
          '&[data-state="checked"]',
          'backgroundColor',
        ],
        'switch.on.thumb-background',
      ],
      [
        [
          'switchRecipe',
          'base',
          'control',
          '&[data-state="checked"]',
          '&[data-hover]',
          'backgroundColor',
        ],
        'switch.on.hover.background',
      ],
      [
        [
          'switchRecipe',
          'base',
          'control',
          '&[data-state="checked"]',
          '&[data-hover]::after',
          'borderColor',
        ],
        'switch.on.hover.border',
      ],
      [
        [
          'switchRecipe',
          'base',
          'thumb',
          '&[data-state="checked"]',
          '&[data-hover]',
          'backgroundColor',
        ],
        'switch.on.hover.thumb-background',
      ],
      [
        [
          'switchRecipe',
          'base',
          'control',
          '&[data-state="checked"]',
          '&[data-focus]',
          'backgroundColor',
        ],
        'switch.on.focus.background',
      ],
      [
        [
          'switchRecipe',
          'base',
          'control',
          '&[data-state="checked"]',
          '&[data-focus]::after',
          'borderColor',
        ],
        'switch.on.focus.border',
      ],
      [
        [
          'switchRecipe',
          'base',
          'thumb',
          '&[data-state="checked"]',
          '&[data-focus]',
          'backgroundColor',
        ],
        'switch.on.focus.thumb-background',
      ],
      [
        [
          'switchRecipe',
          'base',
          'control',
          '&[data-state="checked"]',
          '&[data-focus]',
          'boxShadow',
        ],
        '0 0 0 0.25rem {colors.switch.on.focus.focus-ring}',
      ],
    ],
  },

  Select: {
    file: 'components/forms/Select/select.panda.ts',
    values: [
      [['select', 'base', 'color'], 'select.default.text'],
      [['select', 'base', 'backgroundColor'], 'select.default.background'],
      [['select', 'base', 'borderColor'], 'select.default.border'],
      [['select', 'base', '_hover', 'color'], 'select.default.hover.text'],
      [
        ['select', 'base', '_hover', 'backgroundColor'],
        'select.default.hover.background',
      ],
      [
        ['select', 'base', '_hover', 'borderColor'],
        'select.default.hover.border',
      ],
      [
        ['select', 'variants', 'isFocused', 'true', 'color'],
        'select.default.focus.text',
      ],
      [
        ['select', 'variants', 'isFocused', 'true', 'backgroundColor'],
        'select.default.focus.background',
      ],
      [
        ['select', 'variants', 'isFocused', 'true', 'borderColor'],
        'select.default.focus.border',
      ],
      [
        ['select', 'variants', 'isFocused', 'true', 'boxShadow'],
        '0 0 0 0.25rem {colors.select.default.focus.focus-ring}',
      ],
      [
        ['input', 'base', '_placeholder', 'color'],
        'select.default.placeholder',
      ],
      [['icon', 'base', 'color'], 'select.default.icon'],
      [['option', 'base', 'color'], 'option.default.text'],
      [['option', 'base', '_hover', 'color'], 'option.default.hover.text'],
      [
        ['option', 'base', '_hover', 'backgroundColor'],
        'option.default.hover.background',
      ],
      [
        ['option', 'variants', 'selected', 'true', 'color'],
        'option.default.selected.text',
      ],
      [
        ['option', 'variants', 'selected', 'true', 'backgroundColor'],
        'option.default.selected.background',
      ],
      [
        ['option', 'variants', 'active', 'true', 'color'],
        'option.default.active.text',
      ],
      [
        ['option', 'variants', 'active', 'true', 'backgroundColor'],
        'option.default.active.background',
      ],
      [
        ['option', 'variants', 'disabled', 'true', 'color'],
        'option.default.disabled.text',
      ],
      [
        ['option', 'variants', 'readonly', 'true', 'color'],
        'option.default.readonly.text',
      ],
      [
        [
          'option',
          'variants',
          'readonly',
          'true',
          '_before',
          'backgroundColor',
        ],
        'option.default.readonly.separator',
      ],
      [
        [
          'option',
          'variants',
          'readonly',
          'true',
          '& .option__content',
          'backgroundColor',
        ],
        'option.default.readonly.label-mask-background',
      ],
    ],
  },

  NumberInput: {
    file: 'components/forms/NumberInput/number-input.panda.ts',
    values: [
      [
        ['numberInputRecipe', 'base', '& input', 'color'],
        'number-input.default.text',
      ],
      [
        ['numberInputRecipe', 'base', '& input', 'backgroundColor'],
        'number-input.default.background',
      ],
      [
        ['numberInputRecipe', 'base', '& input', 'borderColor'],
        'number-input.default.border',
      ],
      [
        ['numberInputRecipe', 'base', '& input', '&:hover', 'color'],
        'number-input.default.hover.text',
      ],
      [
        ['numberInputRecipe', 'base', '& input', '&:hover', 'backgroundColor'],
        'number-input.default.hover.background',
      ],
      [
        ['numberInputRecipe', 'base', '& input', '&:hover', 'borderColor'],
        'number-input.default.hover.border',
      ],
      [
        ['numberInputRecipe', 'base', '& input', '&:focus', 'color'],
        'number-input.default.focus.text',
      ],
      [
        ['numberInputRecipe', 'base', '& input', '&:focus', 'backgroundColor'],
        'number-input.default.focus.background',
      ],
      [
        ['numberInputRecipe', 'base', '& input', '&:focus', 'borderColor'],
        'number-input.default.focus.border',
      ],
      [
        ['numberInputRecipe', 'base', '& input', '&:focus', 'boxShadow'],
        '0 0 0 0.25rem {colors.number-input.default.focus.focus-ring}',
      ],
      [
        ['numberInputRecipe', 'base', '& input', '&::placeholder', 'color'],
        'number-input.default.placeholder',
      ],
    ],
  },

  Textarea: {
    file: 'components/forms/Textarea/textarea.panda.ts',
    values: [
      [['textareaRecipe', 'base', 'color'], 'textarea.default.text'],
      [
        ['textareaRecipe', 'base', 'backgroundColor'],
        'textarea.default.background',
      ],
      [['textareaRecipe', 'base', 'borderColor'], 'textarea.default.border'],
      [
        ['textareaRecipe', 'base', '&:hover', 'color'],
        'textarea.default.hover.text',
      ],
      [
        ['textareaRecipe', 'base', '&:hover', 'backgroundColor'],
        'textarea.default.hover.background',
      ],
      [
        ['textareaRecipe', 'base', '&:hover', 'borderColor'],
        'textarea.default.hover.border',
      ],
      [
        ['textareaRecipe', 'base', '&:focus', 'color'],
        'textarea.default.focus.text',
      ],
      [
        ['textareaRecipe', 'base', '&:focus', 'backgroundColor'],
        'textarea.default.focus.background',
      ],
      [
        ['textareaRecipe', 'base', '&:focus', 'borderColor'],
        'textarea.default.focus.border',
      ],
      [
        ['textareaRecipe', 'base', '&:focus', 'boxShadow'],
        '0 0 0 0.25rem {colors.textarea.default.focus.focus-ring}',
      ],
      [
        ['textareaRecipe', 'base', '&::placeholder', 'color'],
        'textarea.default.placeholder',
      ],
    ],
  },

  Input: {
    file: 'components/forms/Input/input.panda.ts',
    values: [
      [['inputRecipe', 'base', 'input', 'color'], 'input.default.text'],
      [
        ['inputRecipe', 'base', 'input', 'backgroundColor'],
        'input.default.background',
      ],
      [['inputRecipe', 'base', 'input', 'borderColor'], 'input.default.border'],
      [
        ['inputRecipe', 'base', 'input', '&:hover', 'color'],
        'input.default.hover.text',
      ],
      [
        ['inputRecipe', 'base', 'input', '&:hover', 'backgroundColor'],
        'input.default.hover.background',
      ],
      [
        ['inputRecipe', 'base', 'input', '&:hover', 'borderColor'],
        'input.default.hover.border',
      ],
      [
        ['inputRecipe', 'base', 'input', '&:focus', 'color'],
        'input.default.focus.text',
      ],
      [
        ['inputRecipe', 'base', 'input', '&:focus', 'backgroundColor'],
        'input.default.focus.background',
      ],
      [
        ['inputRecipe', 'base', 'input', '&:focus', 'borderColor'],
        'input.default.focus.border',
      ],
      [
        ['inputRecipe', 'base', 'input', '&:focus', 'boxShadow'],
        '0 0 0 0.25rem {colors.input.default.focus.focus-ring}',
      ],
      [
        ['inputRecipe', 'base', 'input', '&::placeholder', 'color'],
        'input.default.placeholder',
      ],
    ],
  },

  Button: {
    file: 'components/forms/Button/button.panda.ts',
    values: ['default', 'plain', 'ghost', 'ghost-alt', 'active'].flatMap(
      (variant) => [
        [
          ['buttonRecipe', 'variants', 'type', variant, 'color'],
          `button.${variant}.text`,
        ],
        [
          ['buttonRecipe', 'variants', 'type', variant, 'backgroundColor'],
          `button.${variant}.background`,
        ],
        [
          ['buttonRecipe', 'variants', 'type', variant, 'borderColor'],
          `button.${variant}.border`,
        ],
        ...[
          ['&:hover', 'hover'],
          ['&:active', 'pressed'],
          ['&[data-selected]', 'selected'],
        ].flatMap(([selector, state]) =>
          ['background', 'border'].map((role) => [
            [
              'buttonRecipe',
              'variants',
              'type',
              variant,
              selector,
              role === 'border' ? 'borderColor' : 'backgroundColor',
            ],
            `button.${variant}.${state}.${role}`,
          ]),
        ),
        [
          ['buttonRecipe', 'variants', 'type', variant, '&:focus', 'boxShadow'],
          `0 0 0 0.25rem {colors.button.${variant}.focus.ring}`,
        ],
      ],
    ) as [string[], string][],
  },
}

describe('canonical semantic consumers', () => {
  for (const [component, { file, values }] of Object.entries(contracts)) {
    it(`${component} consumes its own role at every supported state`, () => {
      const actual = recipes(file)
      for (const [path, expected] of values)
        expect(at(actual, path), `${component}: ${path.join(' / ')}`).toBe(
          expected,
        )
    })
  }
})
