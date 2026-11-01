const quantumSize = 128

class Processor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.quantaPerFrame = 12
    this.quantaCount = 0
    this.frame = new Int16Array(quantumSize * this.quantaPerFrame)
  }

  process(inputs, outputs, parameters) {
    const offset = quantumSize * this.quantaCount
    inputs[0][0].forEach((sample, idx) => (this.frame[offset + idx] = Math.floor(sample * 0x7fff)))
    this.quantaCount += 1
    if (this.quantaCount === this.quantaPerFrame) {
      this.port.postMessage(this.frame)
      this.quantaCount = 0
    }
    return true
  }
}

registerProcessor('pcm-worker', Processor)
