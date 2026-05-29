import { Card } from "./ui/Card";

export const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <Card className="border-dashed border-line/60 bg-background/40 p-8 text-center">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
};
