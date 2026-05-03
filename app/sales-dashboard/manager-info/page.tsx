"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Building, Send } from "lucide-react";
import { getManagerForUser } from "@/lib/actions/user.actions";
import { useSession } from "next-auth/react";

export default function ManagerInfo() {
  const { data: session } = useSession();
  const [manager, setManager] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManager = async () => {
      if (!session?.user?.id) return;

      const mgr = await getManagerForUser(session.user.id);
      setManager(mgr);
      setLoading(false);
    };

    fetchManager();
  }, [session?.user?.id]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manager Info</h1>
        <p className="text-muted-foreground">Your assigned sales manager</p>
      </div>

      {manager ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Manager Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-medium">{manager.name}</p>
                  <p className="text-sm text-muted-foreground">Sales Manager</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{manager.email}</span>
                </div>
                {manager.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{manager.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                For any questions about your sales, targets, or approvals, contact your manager.
              </p>
              <Button className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No manager assigned</p>
            <p className="text-sm">Contact your administrator for manager assignment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}