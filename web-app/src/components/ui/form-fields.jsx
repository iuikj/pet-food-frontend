import { Field, FieldLabel } from './field';
import { Input } from './input';
import { Textarea } from './textarea';

export function FormTextField({
    label,
    icon,
    fieldClassName = '',
    inputClassName = '',
    leadingSlot,
    trailingSlot,
    trailingText,
    invalid = false,
    ...inputProps
}) {
    return (
        <Field className={`items-stretch gap-2 ${fieldClassName}`}>
            {label ? (
                <FieldLabel className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                    {label}
                </FieldLabel>
            ) : null}
            <div className="relative w-full">
                {leadingSlot}
                {!leadingSlot && icon && (
                    <span className="material-icons-round absolute left-4 top-1/2 z-10 -translate-y-1/2 text-xl text-text-muted-light dark:text-text-muted-dark">
                        {icon}
                    </span>
                )}
                <Input
                    aria-invalid={invalid || inputProps['aria-invalid'] || undefined}
                    nativeInput
                    unstyled
                    className={`w-full bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow ${invalid ? 'ring-2 ring-red-500/20' : ''} [&_[data-slot=input]]:h-auto [&_[data-slot=input]]:py-4 [&_[data-slot=input]]:text-text-main-light dark:[&_[data-slot=input]]:text-text-main-dark [&_[data-slot=input]]:focus:ring-0 ${icon || leadingSlot ? '[&_[data-slot=input]]:pl-12' : '[&_[data-slot=input]]:pl-5'} ${trailingSlot || trailingText ? '[&_[data-slot=input]]:pr-14' : '[&_[data-slot=input]]:pr-4'} ${inputClassName}`}
                    {...inputProps}
                />
                {trailingSlot || (trailingText ? (
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted-light dark:text-text-muted-dark">
                        {trailingText}
                    </span>
                ) : null)}
            </div>
        </Field>
    );
}

export function FormTextareaField({ label, ...textareaProps }) {
    return (
        <Field className="items-stretch gap-2">
            {label ? (
                <FieldLabel className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                    {label}
                </FieldLabel>
            ) : null}
            <Textarea
                unstyled
                className="w-full bg-white dark:bg-surface-dark rounded-2xl shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-glow [&_[data-slot=textarea]]:min-h-0 [&_[data-slot=textarea]]:resize-none [&_[data-slot=textarea]]:px-4 [&_[data-slot=textarea]]:py-4 [&_[data-slot=textarea]]:text-text-main-light dark:[&_[data-slot=textarea]]:text-text-main-dark [&_[data-slot=textarea]]:focus:ring-0"
                {...textareaProps}
            />
        </Field>
    );
}

export function InlineTagInput({ className = '', ...inputProps }) {
    return (
        <Input
            nativeInput
            unstyled
            className={`min-w-[120px] flex-1 [&_[data-slot=input]]:h-auto [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:p-0 [&_[data-slot=input]]:text-sm [&_[data-slot=input]]:text-text-main-light dark:[&_[data-slot=input]]:text-text-main-dark ${className}`}
            type="text"
            {...inputProps}
        />
    );
}
