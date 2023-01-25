// credits go to https://github.com/Acedio/animalese.js
// @ts-nocheck

var FastBase64 = {
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encLookup: [],

    Init: function () {
        for (var i = 0; i < 4096; i++) {
            this.encLookup[i] = this.chars[i >> 6]+this.chars[i & 0x3F]
        }
    },

    Encode: function (src) {
        var len = src.length
        var dst = ''
        var i = 0
        while (len > 2) {
            n = (src[i] << 16) | (src[i+1] << 8) | src[i+2]
            dst += this.encLookup[n >> 12]+this.encLookup[n & 0xFFF]
            len -= 3
            i += 3
        }
        if (len > 0) {
            var n1 = (src[i] & 0xFC) >> 2
            var n2 = (src[i] & 0x03) << 4
            if (len > 1) n2 |= (src[++i] & 0xF0) >> 4
            dst += this.chars[n1]
            dst += this.chars[n2]
            if (len == 2) {
                var n3 = (src[i++] & 0x0F) << 2
                n3 |= (src[i] & 0xC0) >> 6
                dst += this.chars[n3]
            }
            if (len == 1) dst += '='
            dst += '='
        }
        return dst
    }, // end Encode

}

FastBase64.Init()

var RIFFWAVE = function (data) {

    this.data = []        // Array containing audio samples
    this.wav = []         // Array containing the generated wave file
    this.dataURI = ''     // http://en.wikipedia.org/wiki/Data_URI_scheme

    this.header = {                         // OFFS SIZE NOTES
        chunkId: [0x52, 0x49, 0x46, 0x46], // 0    4    "RIFF" = 0x52494646
        chunkSize: 0,                     // 4    4    36+SubChunk2Size = 4+(8+SubChunk1Size)+(8+SubChunk2Size)
        format: [0x57, 0x41, 0x56, 0x45], // 8    4    "WAVE" = 0x57415645
        subChunk1Id: [0x66, 0x6d, 0x74, 0x20], // 12   4    "fmt " = 0x666d7420
        subChunk1Size: 16,                    // 16   4    16 for PCM
        audioFormat: 1,                     // 20   2    PCM = 1
        numChannels: 1,                     // 22   2    Mono = 1, Stereo = 2...
        sampleRate: 8000,                  // 24   4    8000, 44100...
        byteRate: 0,                     // 28   4    SampleRate*NumChannels*BitsPerSample/8
        blockAlign: 0,                     // 32   2    NumChannels*BitsPerSample/8
        bitsPerSample: 8,                     // 34   2    8 bits = 8, 16 bits = 16
        subChunk2Id: [0x64, 0x61, 0x74, 0x61], // 36   4    "data" = 0x64617461
        subChunk2Size: 0,                      // 40   4    data size = NumSamples*NumChannels*BitsPerSample/8
    }

    function u32ToArray(i) {
        return [i & 0xFF, (i >> 8) & 0xFF, (i >> 16) & 0xFF, (i >> 24) & 0xFF]
    }

    function u16ToArray(i) {
        return [i & 0xFF, (i >> 8) & 0xFF]
    }

    function split16bitArray(data) {
        var r = []
        var j = 0
        var len = data.length
        for (var i = 0; i < len; i++) {
            r[j++] = data[i] & 0xFF
            r[j++] = (data[i] >> 8) & 0xFF
        }
        return r
    }

    this.Make = function (data) {
        if (data instanceof Array) this.data = data
        this.header.blockAlign = (this.header.numChannels * this.header.bitsPerSample) >> 3
        this.header.byteRate = this.header.blockAlign * this.sampleRate
        this.header.subChunk2Size = this.data.length * (this.header.bitsPerSample >> 3)
        this.header.chunkSize = 36+this.header.subChunk2Size

        this.wav = this.header.chunkId.concat(
            u32ToArray(this.header.chunkSize),
            this.header.format,
            this.header.subChunk1Id,
            u32ToArray(this.header.subChunk1Size),
            u16ToArray(this.header.audioFormat),
            u16ToArray(this.header.numChannels),
            u32ToArray(this.header.sampleRate),
            u32ToArray(this.header.byteRate),
            u16ToArray(this.header.blockAlign),
            u16ToArray(this.header.bitsPerSample),
            this.header.subChunk2Id,
            u32ToArray(this.header.subChunk2Size),
            (this.header.bitsPerSample == 16) ? split16bitArray(this.data) : this.data,
        )
        this.dataURI = 'data:audio/wav;base64,'+FastBase64.Encode(this.wav)
    }

    if (data instanceof Array) this.Make(data)

}

var Animalese = function (letters_file, onload) {
    this.Animalese = function (script, shorten, pitch) {
        function shortenWord(str) {
            if (str.length > 1) {
                return str[0]+str[str.length-1]
            }
            return str
        }

        var processed_script = script
        if (shorten) {
            processed_script =
                script.replace(/[^a-z]/gi, ' ').split(' ').map(shortenWord).join('')
        }

        var data = []

        var sample_freq = 44100
        var library_letter_secs = 0.15
        var library_samples_per_letter =
            Math.floor(library_letter_secs * sample_freq)
        var output_letter_secs = 0.075
        var output_samples_per_letter =
            Math.floor(output_letter_secs * sample_freq)

        for (var c_index = 0; c_index < processed_script.length; c_index++) {
            var c = processed_script.toUpperCase()[c_index]
            if (c >= 'A' && c <= 'Z') {
                var library_letter_start =
                    library_samples_per_letter * (c.charCodeAt(0)-'A'.charCodeAt(0))

                for (var i = 0; i < output_samples_per_letter; i++) {
                    data[c_index * output_samples_per_letter+i] =
                        this.letter_library[44+library_letter_start+Math.floor(i * pitch)]
                }
            } else { // non pronouncable character or space
                for (var i = 0; i < output_samples_per_letter; i++) {
                    data[c_index * output_samples_per_letter+i] = 127
                }
            }
        }

        var wave = new RIFFWAVE()
        wave.header.sampleRate = sample_freq
        wave.header.numChannels = 1
        wave.Make(data)

        return wave
    }

    var xhr = new XMLHttpRequest()
    xhr.open('GET', letters_file)
    xhr.responseType = 'arraybuffer'
    var req = this
    xhr.onload = function (e) {
        req.letter_library = new Uint8Array(this.response)
        onload()
    }
    xhr.send()
}
import audio from './animalese.js/animalese.wav'

export default new Animalese(audio)
