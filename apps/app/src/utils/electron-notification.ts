import { Notification, NotificationConstructorOptions } from 'electron'
import path from 'path'

export const createNotification = (options: NotificationConstructorOptions) =>
  new Notification({
    icon: path.join(__static, 'icons/256x256.png'),
    ...options,
  })
