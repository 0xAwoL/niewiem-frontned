/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { JSX } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        disabled?: boolean
        balance?: 'show' | 'hide'
        size?: 'sm' | 'md'
        label?: string
        loadingLabel?: string
      }
      'appkit-network-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        disabled?: boolean
      }
    }
  }
}
