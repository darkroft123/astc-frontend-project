import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAvatarUrl } from "@/lib/avatar-url";
import { CheckCircle2, FileText, Clock } from "lucide-react";
interface ActivityItemProps {
  initials: string;
  name: string;
  action: string;
  time: string;
  color: "blue" | "emerald" | "amber";
  avatarUrl?: string | null;
}

export function ActivityItem({
  initials,
  name,
  action,
  time,
  color,
  avatarUrl,
}: ActivityItemProps) {
  const avatarSrc = formatAvatarUrl(avatarUrl);

  const getActionBadge = () => {
    switch (color) {
      case "emerald":
        return {
          badgeBg: "bg-green/10 text-green-ink border-green/20",
          icon: <CheckCircle2 className="w-3 h-3 text-green-ink" />,
          iconBadgeBg: "bg-green-ink",
        };
      case "amber":
        return {
          badgeBg: "bg-amber/10 text-amber-ink border-amber/20",
          icon: <FileText className="w-3 h-3 text-amber-ink" />,
          iconBadgeBg: "bg-amber-ink",
        };
      case "blue":
      default:
        return {
          badgeBg: "bg-primary/10 text-primary border-primary/20",
          icon: <Clock className="w-3 h-3 text-primary" />,
          iconBadgeBg: "bg-primary",
        };
    }
  };

  const badge = getActionBadge();

  return (
    <div className="group flex items-center justify-between p-2 sm:p-2.5 rounded-2xl hover:bg-accent/90 transition-all duration-200 border border-transparent hover:border-border">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 rounded-full ring-2 ring-border shadow-sm">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} alt={name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-brand-gradient text-white font-bold text-xs">
              {initials.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${badge.iconBadgeBg} flex items-center justify-center ring-2 ring-background text-white shadow-xs`}>
            {color === "emerald" ? (
              <CheckCircle2 className="w-2.5 h-2.5" />
            ) : color === "amber" ? (
              <FileText className="w-2.5 h-2.5" />
            ) : (
              <Clock className="w-2.5 h-2.5" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${badge.badgeBg}`}>
              {badge.icon}
              {action}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium shrink-0 ml-2 bg-muted/50 group-hover:bg-muted px-2 py-1 rounded-lg border border-border transition-colors">
        <Clock className="w-3 h-3" />
        <span>{time}</span>
      </div>
    </div>
  );
}