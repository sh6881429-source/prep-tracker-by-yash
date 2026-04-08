import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface PlaceholderCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: "blue" | "teal" | "purple" | "orange";
  index?: number;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    iconBg: "bg-blue-100",
    badge: "bg-blue-50 text-blue-600 border-blue-200",
  },
  teal: {
    bg: "bg-teal-50",
    icon: "text-teal-600",
    iconBg: "bg-teal-100",
    badge: "bg-teal-50 text-teal-600 border-teal-200",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    iconBg: "bg-purple-100",
    badge: "bg-purple-50 text-purple-600 border-purple-200",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-600",
    iconBg: "bg-orange-100",
    badge: "bg-orange-50 text-orange-600 border-orange-200",
  },
};

export default function PlaceholderCard({
  icon: Icon,
  title,
  subtitle,
  color,
  index = 0,
}: PlaceholderCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.35, ease: "easeOut" }}
    >
      <Card className="shadow-card border-border overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div
              className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}
            >
              <Icon className={`w-5 h-5 ${colors.icon}`} />
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold ${colors.badge}`}
            >
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <h3 className="font-semibold text-foreground mb-0.5">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>

          {/* Placeholder skeleton lines */}
          <div className="mt-3 space-y-1.5">
            <div className="h-2 bg-muted rounded-full w-full" />
            <div className="h-2 bg-muted rounded-full w-4/5" />
            <div className="h-2 bg-muted rounded-full w-3/5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
