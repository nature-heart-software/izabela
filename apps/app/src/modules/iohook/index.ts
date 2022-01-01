import iohook from 'iohook'

if (typeof window === 'undefined') {
  iohook.start()
}

export default iohook
