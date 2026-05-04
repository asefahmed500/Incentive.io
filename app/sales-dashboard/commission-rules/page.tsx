"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCommissionRules } from "@/lib/actions/commission.actions";

export default function SalesExecutiveCommissionRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      const data = await getCommissionRules();
      if (Array.isArray(data)) {
        setRules(data);
      } else {
        setRules([]);
        console.error((data as any)?.error || "Failed to fetch commission rules");
      }
      setLoading(false);
    };
    fetchRules();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commission Rules</h1>
        <p className="text-muted-foreground">View commission structure (read-only)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Achievement From</TableHead>
                <TableHead>Achievement To</TableHead>
                <TableHead>Commission Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No rules configured</TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.targetPercentageFrom}%</TableCell>
                    <TableCell>{rule.targetPercentageTo}%</TableCell>
                    <TableCell className="font-semibold">{rule.commissionRate}%</TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
