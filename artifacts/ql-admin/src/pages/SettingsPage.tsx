import { Layout } from "@/components/Layout";
import { Settings, Shield, Bell, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform configuration and preferences</p>
        </div>

        <div className="space-y-4 max-w-2xl">
          {[
            { icon: Shield, title: "Security", description: "Admin authentication and access control settings" },
            { icon: Bell, title: "Notifications", description: "Telegram bot notification preferences" },
            { icon: Database, title: "Database", description: "Backup and maintenance settings" },
            { icon: Settings, title: "General", description: "Platform-wide configuration" },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-card border border-card-border rounded-xl p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-muted shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Coming soon</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted/30 border border-border rounded-xl max-w-2xl">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">QL Trading AI Admin Panel</span> — v3.0.0 PRO
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Built on top of the QL Trading AI platform. For support, contact the system administrator.
          </p>
        </div>
      </div>
    </Layout>
  );
}
