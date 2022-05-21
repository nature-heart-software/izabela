import { app, Notification, NotificationConstructorOptions } from 'electron'
import path from 'path'

export const createNotification = (options: NotificationConstructorOptions) =>
  new Notification({
    title: app.name,
    icon: path.join(__static, 'icons/256x256.png'),
    ...options,
  })
