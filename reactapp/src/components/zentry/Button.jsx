const Button = ({ id, title, leftIcon, rightIcon, containerClass, variant = "solid" }) => {
  const variants = {
    solid: "bg-white text-black border-transparent hover:bg-zinc-100",
    ghost: "bg-transparent text-zinc-900 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900",
  };

  return (
    <button
      id={id}
      className={`group inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${variants[variant]} ${containerClass}`}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span className="relative">{title}</span>
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
