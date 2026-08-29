import { Check, Loader2, X, type LucideIcon } from 'lucide-react'

import { Button } from './button'
import { cn } from '../lib/utils'

export type StatusStepperStep = {
  id: string
  label: string
}

export type StatusStepperOutcome = 'canceled'

export type StatusStepperAlternateStep = {
  label: string
  icon: LucideIcon
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  isLoading?: boolean
  selectLabel?: string
}

export type StatusStepperProps = {
  steps: StatusStepperStep[]
  currentId: string
  onSelectNext?: (id: string) => void
  isPending?: boolean
  disabled?: boolean
  outcome?: StatusStepperOutcome
  alternateStep?: StatusStepperAlternateStep
  /** Accessible name for the track (e.g. "Progreso de cumplimiento"). */
  ariaLabel?: string
}

type StepVisualState = 'completed' | 'current' | 'next' | 'upcoming' | 'canceled' | 'skipped'

function resolveStepState(
  index: number,
  currentIndex: number,
  outcome: StatusStepperOutcome | undefined,
): StepVisualState {
  if (outcome === 'canceled') {
    if (index < currentIndex) return 'completed'
    if (index === currentIndex) return 'canceled'
    return 'skipped'
  }

  if (index < currentIndex) return 'completed'
  if (index === currentIndex) return 'current'
  if (index === currentIndex + 1) return 'next'
  return 'upcoming'
}

function isConnectorFilled(state: StepVisualState): boolean {
  return state === 'completed' || state === 'current' || state === 'next'
}

function StepNode({
  label,
  state,
  isInteractive,
  isLoading,
  disabled,
  onActivate,
  selectLabel,
}: {
  label: string
  state: StepVisualState
  isInteractive: boolean
  isLoading: boolean
  disabled: boolean
  onActivate?: () => void
  selectLabel?: string
}) {
  const nodeContent = (
    <>
      {state === 'completed' ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : state === 'canceled' ? (
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      ) : isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            state === 'current' && 'bg-ds-primary',
            state === 'next' && 'bg-transparent',
            state === 'upcoming' && 'bg-muted-foreground/30',
            state === 'skipped' && 'bg-muted-foreground/20',
          )}
          aria-hidden="true"
        />
      )}
    </>
  )

  const nodeClassName = cn(
    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
    state === 'completed' && 'border-ds-primary bg-ds-primary text-on-primary',
    state === 'current' && 'border-ds-primary bg-background text-ds-primary ring-2 ring-ds-primary/20',
    state === 'next' &&
      'border-ds-primary/60 bg-background text-ds-primary hover:border-ds-primary hover:bg-ds-primary/5',
    state === 'upcoming' && 'border-border bg-background text-muted-foreground',
    state === 'canceled' && 'border-destructive bg-destructive text-destructive-foreground',
    state === 'skipped' && 'border-border/60 bg-muted/30 text-muted-foreground',
    isInteractive && !disabled && !isLoading && 'cursor-pointer',
    (disabled || isLoading) && isInteractive && 'cursor-not-allowed opacity-60',
  )

  const labelClassName = cn(
    'mt-2 max-w-[4.5rem] text-center text-xs leading-tight sm:max-w-none',
    state === 'completed' && 'font-medium text-on-surface',
    state === 'current' && 'font-semibold text-on-surface',
    state === 'next' && 'font-medium text-ds-primary',
    state === 'upcoming' && 'text-muted-foreground',
    state === 'canceled' && 'font-semibold text-destructive',
    state === 'skipped' && 'text-muted-foreground/60 line-through decoration-muted-foreground/40',
  )

  if (isInteractive) {
    return (
      <div className="flex flex-col items-center">
        <button
          type="button"
          className={nodeClassName}
          disabled={disabled || isLoading}
          aria-label={selectLabel ?? `Marcar como ${label.toLowerCase()}`}
          onClick={onActivate}
        >
          {nodeContent}
        </button>
        <span className={labelClassName}>{label}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className={nodeClassName} aria-hidden={state === 'skipped' ? true : undefined}>
        {nodeContent}
      </div>
      <span className={labelClassName}>{label}</span>
    </div>
  )
}

function AlternateActionButton({
  label,
  icon,
  active = false,
  isInteractive,
  isLoading,
  disabled,
  onActivate,
  selectLabel,
  className,
}: {
  label: string
  icon: LucideIcon
  active?: boolean
  isInteractive: boolean
  isLoading: boolean
  disabled: boolean
  onActivate?: () => void
  selectLabel?: string
  className?: string
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      icon={icon}
      isLoading={isLoading}
      disabled={disabled || active || !isInteractive}
      aria-label={selectLabel ?? label}
      className={className}
      onClick={isInteractive ? onActivate : undefined}
    >
      {label}
    </Button>
  )
}

export function StatusStepper({
  steps,
  currentId,
  onSelectNext,
  isPending = false,
  disabled = false,
  outcome,
  alternateStep,
  ariaLabel = 'Progreso',
}: StatusStepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentId)
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0
  const stepStates = steps.map((_, index) =>
    resolveStepState(index, safeCurrentIndex, outcome),
  )

  return (
    <nav aria-label={ariaLabel} className="w-full">
      <div
        className={cn(
          'flex w-full',
          alternateStep
            ? 'flex-col gap-3 sm:flex-row sm:items-start sm:gap-4'
            : 'flex-row',
        )}
      >
        <div
          className={cn(
            'min-w-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            alternateStep ? 'w-full sm:flex-1' : 'w-full',
          )}
        >
          <ol className="m-0 flex w-full list-none items-start gap-0 p-0">
          {steps.map((step, index) => {
            const state = stepStates[index]
            const isNext = state === 'next'
            const isCurrent = state === 'current' || state === 'canceled'
            const leftConnectorFilled =
              index > 0 && isConnectorFilled(stepStates[index - 1])
            const rightConnectorFilled =
              index < steps.length - 1 && isConnectorFilled(state)

            return (
              <li
                key={step.id}
                className="flex min-w-[5rem] flex-1 items-start sm:min-w-0"
                aria-current={isCurrent ? 'step' : undefined}
              >
                {index > 0 ? (
                  <div
                    className={cn(
                      'mt-4 h-0.5 flex-1',
                      leftConnectorFilled ? 'bg-ds-primary' : 'bg-border',
                    )}
                    aria-hidden="true"
                  />
                ) : (
                  <div className="w-0 shrink-0" aria-hidden="true" />
                )}

                <StepNode
                  label={step.label}
                  state={state}
                  isInteractive={isNext && Boolean(onSelectNext)}
                  isLoading={isPending && isNext}
                  disabled={disabled}
                  selectLabel={`Marcar como ${step.label.toLowerCase()}`}
                  onActivate={
                    isNext && onSelectNext ? () => onSelectNext(step.id) : undefined
                  }
                />

                {index < steps.length - 1 ? (
                  <div
                    className={cn(
                      'mt-4 h-0.5 flex-1',
                      rightConnectorFilled
                        ? 'bg-ds-primary'
                        : state === 'completed' && stepStates[index + 1] === 'upcoming'
                          ? 'bg-ds-primary/40'
                          : 'bg-border',
                    )}
                    aria-hidden="true"
                  />
                ) : (
                  <div className="w-0 shrink-0" aria-hidden="true" />
                )}
              </li>
            )
          })}
          </ol>
        </div>

        {alternateStep ? (
          <div className="w-full shrink-0 sm:w-auto">
            <AlternateActionButton
              label={alternateStep.label}
              icon={alternateStep.icon}
              active={alternateStep.active}
              isInteractive={Boolean(alternateStep.onClick) && !alternateStep.active}
              isLoading={alternateStep.isLoading ?? false}
              disabled={alternateStep.disabled ?? false}
              selectLabel={alternateStep.selectLabel}
              onActivate={alternateStep.onClick}
              className="w-full sm:w-auto"
            />
          </div>
        ) : null}
      </div>
    </nav>
  )
}
