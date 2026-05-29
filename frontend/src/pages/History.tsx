import { useNavigate } from "react-router-dom";
import { Archive, Trash2 } from "lucide-react";

import { Page } from "../components/Page";
import { SessionCard } from "../components/SessionCard";
import { useAppStore } from "../store/useAppStore";
import { Button } from "../components/ui/Button";

export const History = () => {
  const navigate = useNavigate();
  const sessions = useAppStore((state) => state.sessions);
  const setActiveSessionId = useAppStore((state) => state.setActiveSessionId);
  const removeSession = useAppStore((state) => state.removeSession);

  const openSession = (id: string) => {
    setActiveSessionId(id);
    navigate("/workspace");
  };

  return (
    <Page>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Archive className="h-5 w-5" />
          History
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review and reopen previous research sessions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sessions.length ? (
          sessions.map((session) => (
            <div key={session.id} className="space-y-2">
              <SessionCard session={session} onOpen={openSession} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSession(session.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from history
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No research history yet. Run a query to populate this timeline.
          </p>
        )}
      </div>
    </Page>
  );
};
