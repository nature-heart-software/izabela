import axios from 'axios'
import { io } from 'socket.io-client'

export const socket = io(`ws://localhost:${process.env.VUE_APP_SERVER_WS_PORT}`, {})

export const api = axios.create({
  baseURL: `http://localhost:${process.env.VUE_APP_SERVER_PORT}/api`,
})
