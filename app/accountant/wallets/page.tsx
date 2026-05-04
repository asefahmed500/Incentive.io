"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye } from "lucide-react";
import { getAllWallets, getWalletTransactions } from "@/lib/actions/wallet.actions";

interface WalletData {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalPaid: number;
  transactionCount: number;
}

interface TransactionData {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export default function AccountantWallets() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const data = await getAllWallets();
      if (Array.isArray(data)) {
        setWallets(data);
      } else {
        setWallets([]);
        console.error((data as any)?.error || "Failed to fetch wallets");
      }
    } catch (error) {
      console.error("Failed to fetch wallets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchTransactions = async (employeeId: string) => {
    setLoadingTransactions(true);
    try {
      const data = await getWalletTransactions(employeeId, 50);
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        setTransactions([]);
        console.error((data as any)?.error || "Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const openWalletDetails = async (wallet: WalletData) => {
    setSelectedWallet(wallet);
    await fetchTransactions(wallet.employeeId);
  };

  const filtered = wallets.filter(
    (w) =>
      w.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      w.employeeEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = filtered.reduce((sum, w) => sum + w.balance, 0);
  const totalEarned = filtered.reduce((sum, w) => sum + w.totalEarned, 0);
  const totalPaid = filtered.reduce((sum, w) => sum + w.totalPaid, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallets</h1>
        <p className="text-muted-foreground">View all user wallets and balances</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalBalance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ৳{totalEarned.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ৳{totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search wallets..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Earned</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No wallets found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.employeeName}</TableCell>
                    <TableCell>{w.employeeEmail}</TableCell>
                    <TableCell>৳{w.totalEarned.toLocaleString()}</TableCell>
                    <TableCell>৳{w.totalPaid.toLocaleString()}</TableCell>
                    <TableCell
                      className={w.balance >= 0 ? "text-green-600" : "text-red-600"}
                    >
                      ৳{w.balance.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-sky-600 hover:text-sky-800 flex items-center gap-1 text-sm"
                        onClick={() => openWalletDetails(w)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedWallet} onOpenChange={() => setSelectedWallet(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wallet Details - {selectedWallet?.employeeName}</DialogTitle>
          </DialogHeader>
          {selectedWallet && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedWallet.employeeEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="font-medium text-green-600">
                    ৳{selectedWallet.totalEarned.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="font-medium text-blue-600">
                    ৳{selectedWallet.totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="font-medium text-yellow-600">
                    ৳{selectedWallet.pendingBalance.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold">
                    ৳{selectedWallet.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Recent Transactions</p>
                {loadingTransactions ? (
                  <p className="text-sm text-muted-foreground">
                    Loading transactions...
                  </p>
                ) : transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto border rounded-md">
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
                              {t.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs">{t.description}</TableCell>
                            <TableCell className="text-xs">
                              ৳{t.balanceAfter.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}