import { Button } from '../button'
import { cn } from '../../lib/utils'

import { defaultShareChannels } from './channels'
import type { ShareChannel, SharePayload } from './types'

export type ShareActionsProps = {
  url: string
  text?: string
  /** Defaults to copy + WhatsApp. Pass a custom list to add or replace channels. */
  channels?: ShareChannel[]
  className?: string
}

export function ShareActions({
  url,
  text,
  channels = defaultShareChannels,
  className,
}: ShareActionsProps) {
  const payload: SharePayload = { url, text }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {channels.map((channel) => {
        const Icon = channel.icon

        if (channel.onShare) {
          return (
            <Button
              key={channel.id}
              type="button"
              variant="outline"
              size="sm"
              icon={Icon}
              label={channel.label}
              onClick={() => {
                void channel.onShare?.(payload)
              }}
            />
          )
        }

        if (channel.getHref) {
          return (
            <Button key={channel.id} variant="outline" size="sm" asChild>
              <a
                href={channel.getHref(payload)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon className="size-4" aria-hidden />
                {channel.label}
              </a>
            </Button>
          )
        }

        return null
      })}
    </div>
  )
}
