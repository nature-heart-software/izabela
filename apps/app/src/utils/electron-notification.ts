import { app, Notification, NotificationConstructorOptions } from 'electron'
import path from 'path'
import { PUBLIC_DIR } from '@/electron/utils.ts'

export const createNotification = (options: NotificationConstructorOptions) =>
  new Notification({
    title: app.name,
    icon: path.join(PUBLIC_DIR, 'icons/256x256.png'),
    ...options,
  })
