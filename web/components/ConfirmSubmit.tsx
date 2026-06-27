"use client";

// Кнопка отправки формы с подтверждением — защита от случайного удаления.
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string };

export default function ConfirmSubmit({ message, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
