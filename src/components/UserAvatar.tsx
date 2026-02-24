import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  nome: string;
  className?: string;
}

function getInitials(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function UserAvatar({ avatarUrl, nome, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("h-7 w-7", className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={nome} />}
      <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
        {getInitials(nome)}
      </AvatarFallback>
    </Avatar>
  );
}
