import { useConfirmStore } from '@/store/use-confirm-store.ts'

export const useConfirmAdmin = () => {
    const { confirm } = useConfirmStore()
    return () => confirm({
        title: 'Action required',
        description: `This feature requires Admin privileges to function properly. Enabling this feature will also enable "Run as Administrator" and a restart will be required. Do you want to continue?`,
        actions: [
            {
                type: 'cancel',
                label: 'Cancel',
            },
            {
                buttonProps: {
                    type: 'plain',
                },
                type: 'confirm',
                label: 'Confirm',
            },
        ],
    })
}