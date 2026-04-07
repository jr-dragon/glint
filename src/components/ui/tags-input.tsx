import * as React from "react";
import { XIcon } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";

interface TagsInputProps extends Omit<
  React.ComponentProps<"div">,
  "onChange" | "defaultValue"
> {
  value?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Render the display label for a tag. Defaults to identity. */
  renderTag?: (tag: string) => React.ReactNode;
  /** Transform user input before adding as a tag. Defaults to identity. */
  transformTag?: (input: string) => string;
}

function TagsInput({
  className,
  value = [],
  onChange,
  placeholder = "新增標籤…",
  disabled,
  renderTag,
  transformTag,
  ...props
}: TagsInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [input, setInput] = React.useState("");

  function addTags(raw: string) {
    const newTags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (transformTag ? transformTag(t) : t))
      .filter((t) => !value.includes(t));
    if (newTags.length > 0) {
      onChange?.([...value, ...newTags]);
    }
    setInput("");
  }

  function removeTag(tag: string) {
    onChange?.(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) {
        addTags(input);
      }
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  function handleBlur() {
    if (input.trim()) {
      addTags(input);
    }
  }

  return (
    <div
      data-slot="tags-input"
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1 shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        "dark:bg-input/30",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
      {...props}
    >
      {value.map((tag) => (
        <Badge key={tag} className="gap-1 pr-1">
          {renderTag ? renderTag(tag) : tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
            disabled={disabled}
            aria-label={`移除 ${tag}`}
          >
            <XIcon className="size-2.5" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : undefined}
        disabled={disabled}
        className="min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

export { TagsInput, type TagsInputProps };
