import { useNavigate } from "react-router-dom";
import { Sparkles, BookOpen, ArrowUpRight, Library } from "lucide-react";

import { Page } from "../components/Page";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { UploadButton } from "../components/UploadButton";
import { SessionCard } from "../components/SessionCard";
import { useAppStore } from "../store/useAppStore";
import { formatBytes, formatDate } from "../utils/format";

const greetingForTime = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const Home = () => {
  const navigate = useNavigate();
  const sessions = useAppStore((state) => state.sessions);
  const documents = useAppStore((state) => state.documents);
  const setActiveSessionId = useAppStore((state) => state.setActiveSessionId);

  const recentSessions = sessions.slice(0, 2);

  const openSession = (id: string) => {
    setActiveSessionId(id);
    navigate("/workspace");
  };

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{greetingForTime()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingest. Retrieve. Research.
          </p>
        </div>
        <Button onClick={() => navigate("/workspace")}>
          <Sparkles className="mr-2 h-4 w-4" />
          New Research
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/50" />
          <div className="relative z-10">
            <p className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              Ingest New Knowledge
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload PDFs to your local index. Ouro will process, chunk, and
              embed them securely on your machine.
            </p>
            <div className="mt-6">
              <UploadButton label="Upload PDF" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Recent Sessions
            </p>
            <button
              type="button"
              className="flex items-center gap-2 text-xs text-muted-foreground"
              onClick={() => navigate("/history")}
            >
              View all history
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {recentSessions.length ? (
              recentSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onOpen={openSession}
                  compact
                />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No sessions yet. Your first research query will appear here.
              </p>
            )}
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Library className="h-4 w-4" />
          <p className="text-sm font-medium">Local Library</p>
        </div>
        <Card className="mt-4 p-4">
          {documents.length ? (
            <div className="divide-y divide-border/50">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(doc.sizeBytes)} • Indexed {formatDate(doc.ingestedAt)}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {doc.pagesIndexed} pages • {doc.chunksIndexed} chunks
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No PDFs uploaded yet. Upload a document to start building your library.
            </p>
          )}
        </Card>
      </div>
    </Page>
  );
};
