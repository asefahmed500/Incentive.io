"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, DollarSign, CreditCard, Clock } from "lucide-react";
import { getOrCreateWallet, getWalletTransactions } from "@/lib/actions/wallet.actions";
import { useSession } from "next-auth/react";

interface WalletData {
  id: string;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalPaid: number;
}

interface TransactionData {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export default function SalesWallet() {
  const { data: session } = useSession();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
      try {
        const walletData = await getOrCreateWallet(session.user.id);
        if (walletData) {
          setWallet({
            id: walletData._id?.toString() || "",
            balance: walletData.balance ?? 0,
            pendingBalance: walletData.pendingBalance ?? 0,
            totalEarned: walletData.totalEarned ?? 0,
            totalPaid: walletData.totalPaid ?? 0,
          });
          const txs = await getWalletTransactions(session.user.id, 50);
          setTransactions(txs);
        }
      } catch (error) {
        console.error("Failed to fetch wallet:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session?.user?.id]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Your commission wallet</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{wallet?.balance?.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ৳{wallet?.totalEarned?.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ৳{wallet?.totalPaid?.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ৳{wallet?.pendingBalance?.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          t.type === "credit"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t.type === "credit" ? "Credit" : "Debit"}
                      </span>
                    </TableCell>
                    <TableCell
                      className={
                        t.type === "credit" ? "text-green-600" : "text-red-600"
                      }
                    >
                      {t.type === "credit" ? "+" : "-"}৳
                      {t.amount?.toLocaleString() ?? 0}
                    </TableCell>
                    <TableCell className="text-xs">{t.description}</TableCell>
                    <TableCell className="text-xs">
                      ৳{t.balanceAfter?.toLocaleString() ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}