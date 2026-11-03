import styled from 'vue3-styled-components'

export const NvBarWrapper = styled('div', {})`
  background-color: ${({ theme }) => theme.divider.horizontal.border};
`
export const NvBar = styled('div', {})`
  background-color: ${({ theme }) => theme.button.plain.background};
`
