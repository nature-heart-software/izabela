import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDictionaryStore = defineStore(
  'dictionary',
  () => {
    const enableDictionary = ref(false)
    const definitions = ref<[string, string][]>([
      ['wyd', 'what are you doing'],
      ['hbu', 'how about you'],
      ['afaik', 'as far as I know'],
      ['b4', 'before'],
      ['bc', 'because'],
      ['bf', 'boyfriend'],
      ['bff', 'best friends forever'],
      ['brb', 'be right back'],
      ['btw', 'by the way'],
      ['dm', 'direct message'],
      ['fb', 'facebook'],
      ['ftw', 'for the win'],
      ['g2g', 'got to go'],
      ['gf', 'girlfriend'],
      ['gg', 'good game'],
      ['gtg', 'got to go'],
      ['gtr', 'got to run'],
      ['hmu', 'hit me up'],
      ['idc', "I don't care"],
      ['idk', "I don't know"],
      ['ig', 'instagram'],
      ['ikr', 'I know right'],
      ['ily', 'I love you'],
      ['imho', 'in my humble opinion'],
      ['imo', 'in my opinion'],
      ['irl', 'in real life'],
      ['isp', 'internet service provider'],
      ['jk', 'just kidding'],
      ['l8', 'late'],
      ['lmk', 'let me know'],
      ['mfw', 'my face when'],
      ['nsfw', 'not safe for work'],
      ['nvm', 'nevermind'],
      ['oan', 'on another note'],
      ['omg', 'oh my god'],
      ['omw', 'on my way'],
      ['sfw', 'safe for work'],
      ['smh', 'shake my head'],
      ['tbh', 'to be honest'],
      ['thx', 'thanks'],
      ['til', 'today I learned'],
      ['tl;dr', "too long; didn't read"],
      ['ttyl', 'talk to you later'],
      ['ttyn', 'talk to you never'],
      ['ttys', 'talk to you soon'],
      ['txt', 'text'],
      ['w/e', 'whatever'],
      ['w/u', 'with you'],
      ['wbu', 'what about you'],
      ['wdym', 'what do you mean'],
      ['yolo', 'you only live once'],
      ['ysk', 'you should know'],
      ['yt', 'YouTube'],
    ])

    const translateText = (text: string) => {
      let newText = text
      definitions.value.forEach(([word, definition]) => {
        newText = newText.replace(new RegExp(`(\\b${word}\\b)`, 'gi'), definition)
      })
      return newText
    }

    return {
      enableDictionary,
      definitions,
      translateText,
      updateDefinition: (index: number, definition: [string, string]) => {
        definitions.value.splice(index, 1, definition)
      },
      addDefinition: (definition: typeof definitions['value'][number] = ['', '']) => {
        definitions.value.unshift(definition)
      },
      removeDefinition: (index: number) => {
        definitions.value.splice(index, 1)
      },
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
