import animalese from './animalese'

export default animalese as {
    letter_library: Uint8Array
    getAudio: (text: string, shorten: boolean, pitch: number) => any
}
