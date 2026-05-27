const Button = ({
  children,
  onClick,
  className = "",
  size = "md",
  variant = "primary",
  type = "button",
  disabled = false,
}) => {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size] || sizes.md} ${
        variants[variant] || variants.primary
      } ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
