import { Toaster as Sonner } from "sonner";

const Toaster = (props) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      style={{
        "--normal-bg": "var(--popover, #fff)",
        "--normal-text": "var(--popover-foreground, #2D3748)",
        "--normal-border": "var(--border, #e2e8f0)",
        "--border-radius": "var(--radius, 0.625rem)",
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
