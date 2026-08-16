import { Card, CardContent } from "@/shared/components/Card";

export default function DiagnosticsSummaryCards({ cards = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
                     border border-white/40 dark:border-slate-700/40
                     shadow-xl rounded-3xl"
        >
          <CardContent>
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>

                <h2 className="mt-1 text-3xl font-bold text-slate-800 dark:text-white">
                  {card.value}
                </h2>

                {card.subtitle && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {card.subtitle}
                  </p>
                )}
              </div>

              {card.icon && (
                <div
                  className={`p-3 rounded-2xl ${
                    card.iconBackground ||
                    "bg-indigo-500/20 border border-indigo-400/30"
                  }`}
                >
                  <card.icon
                    size={24}
                    className={
                      card.iconColor ||
                      "text-indigo-600 dark:text-indigo-400"
                    }
                  />
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}