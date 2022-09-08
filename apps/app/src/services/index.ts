import axios from 'axios'

export const api = axios.create({
  baseURL: `http://localhost:${ process.env.VUE_APP_SERVER_PORT }/api`,
})
