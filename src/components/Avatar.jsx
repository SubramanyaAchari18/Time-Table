import { User } from "lucide-react";

/**
 * Avatar component displaying user's uploaded image or email's first letter fallback.
 */
const Avatar = ({ src, email, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-20 w-20 text-2xl",
    xl: "h-32 w-32 text-4xl",
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  if (src) {
    return (
      <img
        src={src}
        alt="User Avatar"
        className={`rounded-full object-cover border border-border ${currentSizeClass} ${className}`}
      />
    );
  }

  const fallbackLetter = email ? email.charAt(0).toUpperCase() : <User className="h-1/2 w-1/2" />;

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary/20 text-primary font-bold border border-primary/30 ${currentSizeClass} ${className}`}
    >
      {fallbackLetter}
    </div>
  );
};

export default Avatar;
